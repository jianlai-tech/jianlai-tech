-- 后台账号：内部（剑来同门）+ 外部（合作企业）。手机号 + 密码登录。
-- 初始密码是身份证后 6 位，库里只存哈希，不存身份证号。首次登录必须改密码。

CREATE TABLE IF NOT EXISTS accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind text NOT NULL,
    phone text NOT NULL UNIQUE,
    name text NOT NULL,
    password_hash text NOT NULL,
    must_change_password boolean NOT NULL DEFAULT true,
    is_admin boolean NOT NULL DEFAULT false,
    -- 内部账号对应名册 slug（官网 / 后台头像）
    staff_slug text UNIQUE,
    -- 外部账号的公司名
    company text,
    -- 外部账号付款后由管理员开通：pending -> active
    status text NOT NULL DEFAULT 'active',
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz,
    CONSTRAINT accounts_kind_chk CHECK (kind IN ('staff', 'client')),
    CONSTRAINT accounts_status_chk CHECK (status IN ('pending', 'active', 'disabled'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash text PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions (account_id);

-- 个性化：驻场自己改，用来对外展示
CREATE TABLE IF NOT EXISTS staff_profiles (
    account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    alias text,
    tagline text,
    skills text,
    prefers text,
    character text,
    availability text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 剑来认证：只有管理员能改。能力水平 = 门派 + 境界 + 剑的四维
CREATE TABLE IF NOT EXISTS staff_certs (
    account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    gate text,
    -- 0 = 剑胚（试用未入境），1–9 = 识剑境 … 剑仙境
    realm_no int NOT NULL DEFAULT 0,
    -- {"edge":1-3,"sheath":1-3,"heart":1-3,"qi":1-3}，1 下三境 2 中三境 3 上三境
    dims jsonb NOT NULL DEFAULT '{}'::jsonb,
    note text,
    certified_by uuid REFERENCES accounts (id) ON DELETE SET NULL,
    certified_at timestamptz,
    CONSTRAINT staff_certs_gate_chk CHECK (gate IS NULL OR gate IN ('问剑门', '破阵门', '映剑门')),
    CONSTRAINT staff_certs_realm_chk CHECK (realm_no BETWEEN 0 AND 9)
);

-- 项目：管理员维护；外部账号只能看到挂在自己名下的项目
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    industry text,
    client_account_id uuid REFERENCES accounts (id) ON DELETE SET NULL,
    stage text NOT NULL DEFAULT '先看',
    progress int NOT NULL DEFAULT 0,
    progress_note text,
    started_on date,
    ended_on date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT projects_stage_chk CHECK (stage IN ('先看', '先斩一处', '上线护航', '教会交接', '已完结')),
    CONSTRAINT projects_progress_chk CHECK (progress BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS projects_client_idx ON projects (client_account_id);

-- 谁在哪个项目、扮演什么角色（剑来认证的一部分，管理员改）
CREATE TABLE IF NOT EXISTS project_members (
    project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    role text NOT NULL,
    joined_on date,
    PRIMARY KEY (project_id, account_id)
);

CREATE INDEX IF NOT EXISTS project_members_account_idx ON project_members (account_id);
