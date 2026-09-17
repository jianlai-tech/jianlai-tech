CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    contact_name text NOT NULL,
    phone text NOT NULL,
    wechat text,
    scene text NOT NULL DEFAULT '未选',
    note text,
    source text NOT NULL DEFAULT '官网',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads (phone);
