package kr.or.oti.mafiagame.service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

/**
 * Owns one scheduled phase transition per room and replaces an older task atomically.
 */
final class GamePhaseScheduler implements AutoCloseable {
    private final ScheduledExecutorService executor;
    private final Map<Long, ScheduledFuture<?>> tasksByRoom = new HashMap<>();

    GamePhaseScheduler() {
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "room-game-phase");
            thread.setDaemon(true);
            return thread;
        };
        this.executor = Executors.newScheduledThreadPool(1, threadFactory);
    }

    synchronized void schedule(long roomId, long delayMillis, Runnable task) {
        cancel(roomId);
        tasksByRoom.put(
                roomId,
                executor.schedule(task, Math.max(1L, delayMillis), TimeUnit.MILLISECONDS));
    }

    synchronized void cancel(long roomId) {
        ScheduledFuture<?> task = tasksByRoom.remove(roomId);
        if (task != null) {
            task.cancel(false);
        }
    }

    synchronized void complete(long roomId) {
        tasksByRoom.remove(roomId);
    }

    @Override
    public synchronized void close() {
        tasksByRoom.values().forEach(task -> task.cancel(false));
        tasksByRoom.clear();
        executor.shutdownNow();
    }
}
