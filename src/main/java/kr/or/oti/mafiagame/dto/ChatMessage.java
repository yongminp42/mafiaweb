package kr.or.oti.mafiagame.dto;

import java.time.Instant;

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

    public static ChatMessage system(long roomId, String content) {
        return new ChatMessage(
                roomId,
                "SYSTEM",
                "게임 안내",
                content,
                ChatChannel.PUBLIC,
                Instant.now());
    }
}
