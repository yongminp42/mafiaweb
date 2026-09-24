CREATE TABLE IF NOT EXISTS game_completion (
    game_id CHAR(36) NOT NULL,
    room_id BIGINT NOT NULL,
    winner_faction VARCHAR(16) NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
