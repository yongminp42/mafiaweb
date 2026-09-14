CREATE TABLE `user` (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_level INT NOT NULL DEFAULT 1,
    bio VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_stats (
    user_id BIGINT NOT NULL,
    total_games INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    rating INT NOT NULL DEFAULT 1000,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES `user` (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE game_room (
    room_id BIGINT NOT NULL AUTO_INCREMENT,
    host_user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    room_password VARCHAR(255),
    max_players TINYINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id),
    FOREIGN KEY (host_user_id) REFERENCES `user` (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE room_members (
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(20),
    is_alive BOOLEAN NOT NULL DEFAULT TRUE,
    joined_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES game_room (room_id),
    FOREIGN KEY (user_id) REFERENCES `user` (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

