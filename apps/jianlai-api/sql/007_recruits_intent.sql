-- 英雄帖二期：面向中南在校生收意向。年级决定能不能接活（大一大二观摩，大三起可接活）。
-- 只加列、放宽非空，老帖子不动。

ALTER TABLE recruits ALTER COLUMN age DROP NOT NULL;
ALTER TABLE recruits ALTER COLUMN ai_story DROP NOT NULL;
ALTER TABLE recruits ALTER COLUMN strengths DROP NOT NULL;

ALTER TABLE recruits ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE recruits ADD COLUMN IF NOT EXISTS track text;
ALTER TABLE recruits ADD COLUMN IF NOT EXISTS weekly_hours text;
ALTER TABLE recruits ADD COLUMN IF NOT EXISTS cs_base text;
ALTER TABLE recruits ADD COLUMN IF NOT EXISTS talents text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruits_track_chk') THEN
        ALTER TABLE recruits ADD CONSTRAINT recruits_track_chk CHECK (track IS NULL OR track IN ('watch', 'work'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS recruits_track_created_idx ON recruits (track, created_at DESC);
