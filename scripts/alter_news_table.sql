ALTER TABLE news ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'short'));

CREATE INDEX IF NOT EXISTS idx_news_priority ON news(priority);

UPDATE news SET priority = 'medium' WHERE priority IS NULL;