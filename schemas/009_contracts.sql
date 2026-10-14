-- 项目管理：项目补客户名 / 合作方式；合同（派遣制按人月，项目制待定）与签约留档。
-- 合同文本里不写「劳务派遣」：剑来没有劳务派遣许可，派遣制对外是「驻场技术服务（按人月）」。

ALTER TABLE projects ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mode text;

CREATE UNIQUE INDEX IF NOT EXISTS projects_code_uidx ON projects (code) WHERE code IS NOT NULL;

DO $$
BEGIN
    ALTER TABLE projects ADD CONSTRAINT projects_mode_chk
        CHECK (mode IS NULL OR mode IN ('dispatch', 'project'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 现有四个项目（code 固定，改名不会重复插入）。阶段用 010 之后的口径，每次启动都会重跑
INSERT INTO projects (code, name, client_name, industry, stage, mode)
VALUES
    ('quxue', '趣学洋葱', '趣学洋葱', 'K12 一对一家教', '后期', NULL),
    ('youlian', '友联医疗', '友联医疗', '医疗器械批发分销', '中期', NULL),
    ('hualing', '华菱钢管', '华菱钢管', '钢管', '需求', NULL),
    ('maiya', '麦芽AI', '麦芽AI', 'AI', '需求', 'dispatch')
ON CONFLICT (code) WHERE code IS NOT NULL DO NOTHING;

CREATE TABLE IF NOT EXISTS contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    -- dispatch 派遣制（按人月）/ project 项目制
    mode text NOT NULL,
    -- draft 拟定中 / signed 已签留档 / void 作废
    status text NOT NULL DEFAULT 'draft',
    party_a text NOT NULL,
    party_a_rep text,
    party_a_contact text,
    party_a_address text,
    start_on date NOT NULL,
    months int NOT NULL DEFAULT 1,
    end_on date NOT NULL,
    -- 每位剑修每月服务费
    staff_fee numeric(12, 2) NOT NULL DEFAULT 0,
    -- 道长全程跟进的顾问费，每月
    consult_fee numeric(12, 2) NOT NULL DEFAULT 0,
    work_place text,
    pay_terms text,
    extra_terms text,
    signed_on date,
    file_name text,
    file_mime text,
    file_size int,
    file_data bytea,
    uploaded_at timestamptz,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT contracts_mode_chk CHECK (mode IN ('dispatch', 'project')),
    CONSTRAINT contracts_status_chk CHECK (status IN ('draft', 'signed', 'void')),
    CONSTRAINT contracts_months_chk CHECK (months BETWEEN 1 AND 36),
    CONSTRAINT contracts_fee_chk CHECK (staff_fee >= 0 AND consult_fee >= 0)
);

CREATE INDEX IF NOT EXISTS contracts_project_idx ON contracts (project_id, created_at DESC);

-- 合同里派哪几位剑修。按名册 slug 挂，没开后台账号的剑修也能写进合同
CREATE TABLE IF NOT EXISTS contract_staff (
    contract_id uuid NOT NULL REFERENCES contracts (id) ON DELETE CASCADE,
    staff_slug text NOT NULL REFERENCES staff (slug),
    legal_name text NOT NULL,
    alias text,
    role text NOT NULL DEFAULT '驻场',
    PRIMARY KEY (contract_id, staff_slug)
);

CREATE INDEX IF NOT EXISTS contract_staff_slug_idx ON contract_staff (staff_slug);
