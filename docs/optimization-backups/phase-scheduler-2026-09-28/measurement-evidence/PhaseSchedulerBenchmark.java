package kr.or.oti.mafiagame.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Isolated load experiment for the production GamePhaseScheduler.
 * The callback body intentionally sleeps for a fixed time so queueing is the variable under test.
 */
public final class PhaseSchedulerBenchmark {
    private static final int[] WORKER_COUNTS = {1, 4};
    private static final int[] ROOM_COUNTS = {1, 2, 4, 8, 16};
    private static final int TRIALS = 7;
    private static final long PHASE_DELAY_MILLIS = 250L;
    private static final long CALLBACK_WORK_MILLIS = 50L;
    private static final AtomicLong NEXT_ROOM_ID = new AtomicLong(100_000L);

    private PhaseSchedulerBenchmark() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("Pass the output directory as the only argument");
        }
        Path output = Path.of(args[0]);
        Files.createDirectories(output);

        Map<Integer, GamePhaseScheduler> schedulers = new LinkedHashMap<>();
        try {
            for (int workerCount : WORKER_COUNTS) {
                GamePhaseScheduler scheduler = new GamePhaseScheduler(workerCount);
                schedulers.put(workerCount, scheduler);
                warmUp(scheduler, workerCount);
            }

            List<Sample> samples = new ArrayList<>();
            for (int roomCount : ROOM_COUNTS) {
                for (int trial = 1; trial <= TRIALS; trial++) {
                    int first = (roomCount + trial) % 2 == 0 ? 1 : 4;
                    int second = first == 1 ? 4 : 1;
                    samples.addAll(runTrial(schedulers.get(first), first, roomCount, trial));
                    samples.addAll(runTrial(schedulers.get(second), second, roomCount, trial));
                }
            }

            List<Summary> summaries = summarize(samples);
            writeSamples(output.resolve("callback-samples.csv"), samples);
            writeSummary(output.resolve("summary.csv"), summaries);
            writeSummaryJson(output.resolve("summary.json"), summaries);
            writeMetadata(output.resolve("environment.txt"));
            System.out.printf(
                    Locale.ROOT,
                    "Measured %d callback samples across %d room-count scenarios; artifacts: %s%n",
                    samples.size(), ROOM_COUNTS.length, output.toAbsolutePath());
            summaries.forEach(summary -> System.out.printf(
                    Locale.ROOT,
                    "workers=%d rooms=%d samples=%d queue p50/p95/max=%.3f/%.3f/%.3f ms; "
                            + "processing p50/p95/max=%.3f/%.3f/%.3f ms%n",
                    summary.workers,
                    summary.rooms,
                    summary.samples,
                    summary.queueP50,
                    summary.queueP95,
                    summary.queueMax,
                    summary.processingP50,
                    summary.processingP95,
                    summary.processingMax));
        } finally {
            schedulers.values().forEach(GamePhaseScheduler::close);
        }
    }

    private static void warmUp(GamePhaseScheduler scheduler, int workers) throws InterruptedException {
        for (int round = 0; round < 2; round++) {
            CountDownLatch entered = new CountDownLatch(workers);
            CountDownLatch release = new CountDownLatch(1);
            CountDownLatch completed = new CountDownLatch(workers);
            for (int i = 0; i < workers; i++) {
                long roomId = NEXT_ROOM_ID.incrementAndGet();
                scheduler.schedule(roomId, 1L, taskId -> {
                    scheduler.complete(roomId, taskId);
                    entered.countDown();
                    try {
                        if (!release.await(5, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("Warm-up release timed out");
                        }
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                    } finally {
                        completed.countDown();
                    }
                });
            }
            if (!entered.await(5, TimeUnit.SECONDS)) {
                release.countDown();
                throw new IllegalStateException("Could not warm all scheduler workers");
            }
            release.countDown();
            if (!completed.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Warm-up callbacks did not finish");
            }
        }
    }

    private static List<Sample> runTrial(
            GamePhaseScheduler scheduler,
            int workers,
            int roomCount,
            int trial) throws InterruptedException {
        CountDownLatch completed = new CountDownLatch(roomCount);
        List<Sample> trialSamples = new ArrayList<>(roomCount);
        for (int index = 0; index < roomCount; index++) {
            long roomId = NEXT_ROOM_ID.incrementAndGet();
            long deadlineNanos = System.nanoTime()
                    + TimeUnit.MILLISECONDS.toNanos(PHASE_DELAY_MILLIS);
            scheduler.schedule(roomId, PHASE_DELAY_MILLIS, taskId -> {
                long startedNanos = System.nanoTime();
                scheduler.complete(roomId, taskId);
                try {
                    TimeUnit.MILLISECONDS.sleep(CALLBACK_WORK_MILLIS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                } finally {
                    long finishedNanos = System.nanoTime();
                    synchronized (trialSamples) {
                        trialSamples.add(new Sample(
                                workers,
                                roomCount,
                                trial,
                                roomId,
                                startedNanos,
                                Math.max(0d, millis(startedNanos - deadlineNanos)),
                                millis(finishedNanos - startedNanos)));
                    }
                    completed.countDown();
                }
            });
        }

        if (!completed.await(30, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Timed out waiting for measured callbacks");
        }
        synchronized (trialSamples) {
            trialSamples.sort(Comparator.comparingLong(Sample::startedNanos));
            List<Sample> ordered = new ArrayList<>(roomCount);
            for (int index = 0; index < trialSamples.size(); index++) {
                Sample sample = trialSamples.get(index);
                ordered.add(sample.withStartOrder(index + 1));
            }
            return ordered;
        }
    }

    private static List<Summary> summarize(List<Sample> samples) {
        List<Summary> summaries = new ArrayList<>();
        for (int workers : WORKER_COUNTS) {
            for (int rooms : ROOM_COUNTS) {
                List<Sample> group = samples.stream()
                        .filter(sample -> sample.workers == workers && sample.rooms == rooms)
                        .toList();
                summaries.add(new Summary(
                        workers,
                        rooms,
                        group.size(),
                        percentile(group.stream().map(Sample::queueDelayMs).toList(), 0.50),
                        percentile(group.stream().map(Sample::queueDelayMs).toList(), 0.95),
                        group.stream().mapToDouble(Sample::queueDelayMs).max().orElse(0d),
                        percentile(group.stream().map(Sample::processingMs).toList(), 0.50),
                        percentile(group.stream().map(Sample::processingMs).toList(), 0.95),
                        group.stream().mapToDouble(Sample::processingMs).max().orElse(0d)));
            }
        }
        return summaries;
    }

    private static double percentile(List<Double> values, double percentile) {
        List<Double> sorted = values.stream().sorted().toList();
        int rank = Math.max(1, (int) Math.ceil(percentile * sorted.size()));
        return sorted.get(rank - 1);
    }

    private static void writeSamples(Path path, List<Sample> samples) throws IOException {
        StringBuilder csv = new StringBuilder(
                "workers,simultaneous_rooms,trial,callback_start_order,room_id,"
                        + "queue_delay_ms,processing_ms\n");
        samples.stream()
                .sorted(Comparator.comparingInt(Sample::workers)
                        .thenComparingInt(Sample::rooms)
                        .thenComparingInt(Sample::trial)
                        .thenComparingInt(Sample::startOrder))
                .forEach(sample -> csv.append(sample.workers).append(',')
                        .append(sample.rooms).append(',')
                        .append(sample.trial).append(',')
                        .append(sample.startOrder).append(',')
                        .append(sample.roomId).append(',')
                        .append(format(sample.queueDelayMs)).append(',')
                        .append(format(sample.processingMs)).append('\n'));
        Files.writeString(path, csv, StandardCharsets.UTF_8);
    }

    private static void writeSummary(Path path, List<Summary> summaries) throws IOException {
        StringBuilder csv = new StringBuilder(
                "workers,simultaneous_rooms,samples,queue_p50_ms,queue_p95_ms,queue_max_ms,"
                        + "processing_p50_ms,processing_p95_ms,processing_max_ms\n");
        summaries.forEach(summary -> csv.append(summary.workers).append(',')
                .append(summary.rooms).append(',')
                .append(summary.samples).append(',')
                .append(format(summary.queueP50)).append(',')
                .append(format(summary.queueP95)).append(',')
                .append(format(summary.queueMax)).append(',')
                .append(format(summary.processingP50)).append(',')
                .append(format(summary.processingP95)).append(',')
                .append(format(summary.processingMax)).append('\n'));
        Files.writeString(path, csv, StandardCharsets.UTF_8);
    }

    private static void writeSummaryJson(Path path, List<Summary> summaries) throws IOException {
        StringBuilder json = new StringBuilder("{\n  \"summaries\": [\n");
        for (int index = 0; index < summaries.size(); index++) {
            Summary summary = summaries.get(index);
            json.append("    {\"workers\":").append(summary.workers)
                    .append(",\"rooms\":").append(summary.rooms)
                    .append(",\"samples\":").append(summary.samples)
                    .append(",\"queueP50\":").append(format(summary.queueP50))
                    .append(",\"queueP95\":").append(format(summary.queueP95))
                    .append(",\"queueMax\":").append(format(summary.queueMax))
                    .append(",\"processingP50\":").append(format(summary.processingP50))
                    .append(",\"processingP95\":").append(format(summary.processingP95))
                    .append(",\"processingMax\":").append(format(summary.processingMax))
                    .append('}');
            if (index < summaries.size() - 1) {
                json.append(',');
            }
            json.append('\n');
        }
        json.append("  ]\n}\n");
        Files.writeString(path, json, StandardCharsets.UTF_8);
    }

    private static void writeMetadata(Path path) throws IOException {
        String metadata = "measured_at=" + Instant.now() + System.lineSeparator()
                + "java_version=" + System.getProperty("java.version") + System.lineSeparator()
                + "os_name=" + System.getProperty("os.name") + System.lineSeparator()
                + "available_processors=" + Runtime.getRuntime().availableProcessors()
                + System.lineSeparator()
                + "workers_before=1" + System.lineSeparator()
                + "workers_after=4" + System.lineSeparator()
                + "simultaneous_rooms=1,2,4,8,16" + System.lineSeparator()
                + "trials_per_case=" + TRIALS + System.lineSeparator()
                + "phase_delay_ms=" + PHASE_DELAY_MILLIS + System.lineSeparator()
                + "fixed_callback_work_ms=" + CALLBACK_WORK_MILLIS + System.lineSeparator()
                + "percentile_method=nearest-rank" + System.lineSeparator();
        Files.writeString(path, metadata, StandardCharsets.UTF_8);
    }

    private static double millis(long nanos) {
        return nanos / 1_000_000d;
    }

    private static String format(double value) {
        return String.format(Locale.ROOT, "%.3f", value);
    }

    private record Sample(
            int workers,
            int rooms,
            int trial,
            long roomId,
            long startedNanos,
            double queueDelayMs,
            double processingMs,
            int startOrder) {
        Sample(
                int workers,
                int rooms,
                int trial,
                long roomId,
                long startedNanos,
                double queueDelayMs,
                double processingMs) {
            this(workers, rooms, trial, roomId, startedNanos, queueDelayMs, processingMs, 0);
        }

        Sample withStartOrder(int order) {
            return new Sample(
                    workers, rooms, trial, roomId, startedNanos, queueDelayMs, processingMs, order);
        }
    }

    private record Summary(
            int workers,
            int rooms,
            int samples,
            double queueP50,
            double queueP95,
            double queueMax,
            double processingP50,
            double processingP95,
            double processingMax) {
    }
}
