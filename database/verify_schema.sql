-- Read-only checks for the Rolodexi MVP schema.
-- Run after 001_initial_schema.sql in MySQL Workbench.

SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('contacts', 'meeting_sources', 'contact_memories', 'contact_tags', 'consent_records')
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('contacts', 'meeting_sources', 'contact_memories', 'contact_tags', 'consent_records')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('contacts', 'meeting_sources', 'contact_memories', 'contact_tags', 'consent_records')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
