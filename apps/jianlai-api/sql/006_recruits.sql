-- 英雄帖：官网招剑修（大学生、专业不限、热爱 AI）。对外表单写入；道长在内务后台「英雄帖」里看和跟进。

CREATE TABLE IF NOT EXISTS recruits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    age smallint NOT NULL,
    school text,
    major text NOT NULL,
    ai_story text NOT NULL,
    strengths text NOT NULL,
    phone text NOT NULL,
    wechat text,
    source text NOT NULL DEFAULT '官网',
    status text NOT NULL DEFAULT 'new',
    admin_note text,
    handled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT recruits_age_chk CHECK (age BETWEEN 14 AND 60),
    CONSTRAINT recruits_status_chk CHECK (status IN ('new', 'contacted', 'trial', 'joined', 'declined'))
);

CREATE INDEX IF NOT EXISTS recruits_created_idx ON recruits (created_at DESC);
CREATE INDEX IF NOT EXISTS recruits_status_created_idx ON recruits (status, created_at DESC);
CREATE INDEX IF NOT EXISTS recruits_phone_idx ON recruits (phone);
