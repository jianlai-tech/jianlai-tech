-- 留资分两种：公司项目 / 转介绍。只要简要介绍、称呼、手机，公司名不再必填。

ALTER TABLE leads ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'project';
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_kind_check;
ALTER TABLE leads ADD CONSTRAINT leads_kind_check CHECK (kind IN ('project', 'referral'));
ALTER TABLE leads ALTER COLUMN company_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS leads_kind_created_idx ON leads (kind, created_at DESC);
