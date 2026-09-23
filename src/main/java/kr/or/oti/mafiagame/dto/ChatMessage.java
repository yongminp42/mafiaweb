package kr.or.oti.mafiagame.dto;

import java.time.Instant;

import org.springframework.lang.NonNull;

public record ChatMessage(
        long roomId,
        String type,
        String sender,
        String content,
        ChatChannel channel,
        Instant sentAt) {

    public ChatMessage(long roomId, String type, String sender, String content, Instant sentAt) {
        this(roomId, type, sender, content, ChatChannel.PUBLIC, sentAt);
    }

    public static @NonNull ChatMessage system(long roomId, String content) {
        return system(roomId, content, ChatChannel.PUBLIC);
    }

    public static @NonNull ChatMessage system(
            long roomId,
            String content,
            ChatChannel channel) {
        return new ChatMessage(
                roomId,
                "SYSTEM",
                "게임 안내",
                content,
                channel == null ? ChatChannel.PUBLIC : channel,
                Instant.now());
    }
}
