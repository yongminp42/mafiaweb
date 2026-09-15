package kr.or.oti.mafiagame.dto;

import java.time.Instant;

public record ChatMessage(
        long roomId,
        String type,
        String sender,
        String content,
        Instant sentAt) {
}
