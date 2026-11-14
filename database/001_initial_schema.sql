-- Rolodexi MVP schema for MySQL 8.4.
-- Run this against the rolodexi database only.
-- Application-generated IDs are UUID strings. All timestamps are UTC.

CREATE TABLE IF NOT EXISTS contacts (
    id CHAR(36) NOT NULL,
    owner_id VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NULL,
    met VARCHAR(255) NULL,
    city VARCHAR(255) NULL,
    phone VARCHAR(64) NULL,
    email VARCHAR(320) NULL,
    notes TEXT NULL,
    gender VARCHAR(128) NULL,
    pronouns VARCHAR(128) NULL,
    appearance TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_contacts_owner_id (owner_id, id),
    INDEX idx_contacts_owner_name (owner_id, normalized_name),
    INDEX idx_contacts_owner_updated (owner_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS meeting_sources (
    id CHAR(36) NOT NULL,
    owner_id VARCHAR(191) NOT NULL,
    contact_id CHAR(36) NULL,
    source_type VARCHAR(32) NOT NULL DEFAULT 'text',
    source_text LONGTEXT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NULL,
    processed_at DATETIME(6) NULL,
    processing_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    processing_error TEXT NULL,
    provider VARCHAR(64) NULL,
    model VARCHAR(128) NULL,
    provider_request_id VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sources_owner_id (owner_id, id),
    INDEX idx_sources_owner_created (owner_id, created_at),
    INDEX idx_sources_expiration (expires_at),
    CONSTRAINT fk_sources_contact_owner FOREIGN KEY (owner_id, contact_id) REFERENCES contacts (owner_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sources_type CHECK (source_type IN ('text')),
    CONSTRAINT chk_sources_status CHECK (processing_status IN ('pending', 'processed', 'failed', 'expired', 'deleted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS contact_memories (
    id CHAR(36) NOT NULL,
    owner_id VARCHAR(191) NOT NULL,
    contact_id CHAR(36) NOT NULL,
    description TEXT NOT NULL,
    source_id CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_memories_owner_contact (owner_id, contact_id),
    CONSTRAINT fk_memories_contact_owner FOREIGN KEY (owner_id, contact_id) REFERENCES contacts (owner_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_memories_source_owner FOREIGN KEY (owner_id, source_id) REFERENCES meeting_sources (owner_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS contact_tags (
    id CHAR(36) NOT NULL,
    owner_id VARCHAR(191) NOT NULL,
    contact_id CHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    normalized_tag VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_owner_contact_name (owner_id, contact_id, normalized_tag),
    INDEX idx_tags_owner_name (owner_id, normalized_tag),
    CONSTRAINT fk_tags_contact_owner FOREIGN KEY (owner_id, contact_id) REFERENCES contacts (owner_id, id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS consent_records (
    id CHAR(36) NOT NULL,
    owner_id VARCHAR(191) NOT NULL,
    consent_type VARCHAR(64) NOT NULL,
    policy_version VARCHAR(64) NOT NULL,
    granted_at DATETIME(6) NOT NULL,
    withdrawn_at DATETIME(6) NULL,
    recorded_source VARCHAR(64) NULL,
    PRIMARY KEY (id),
    INDEX idx_consent_owner_type (owner_id, consent_type, granted_at),
    CONSTRAINT chk_consent_type CHECK (consent_type IN ('external_ai_processing', 'contact_storage'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
