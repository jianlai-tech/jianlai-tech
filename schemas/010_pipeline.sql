-- 项目管理全流程：需求 → 报价 → 签约 → 前期 / 中期 / 后期 → 维护 → 已完结。
-- 维护期可以给同一家公司新开「模块」（子项目），挂 parent_id，客户主体沿用父项目。
-- API 每次启动都会重跑本文件，只写幂等语句。

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_stage_chk;
UPDATE projects SET stage = CASE stage
    WHEN '先看' THEN '需求'
    WHEN '先斩一处' THEN '中期'
    WHEN '上线护航' THEN '后期'
    WHEN '教会交接' THEN '维护'
    ELSE stage END
WHERE stage IN ('先看', '先斩一处', '上线护航', '教会交接');
ALTER TABLE projects ALTER COLUMN stage SET DEFAULT '需求';
ALTER TABLE projects ADD CONSTRAINT projects_stage_chk
    CHECK (stage IN ('需求', '报价', '签约', '前期', '中期', '后期', '维护', '已完结'));

ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES projects (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS projects_parent_idx ON projects (parent_id);

-- 需求文档 / 其他资料（客户发来的需求、会议纪要、原型截图）
CREATE TABLE IF NOT EXISTS project_docs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    kind text NOT NULL DEFAULT 'requirement',
    file_name text NOT NULL,
    file_mime text NOT NULL,
    file_size int NOT NULL,
    file_data bytea NOT NULL,
    note text,
    uploaded_by uuid,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT project_docs_kind_chk CHECK (kind IN ('requirement', 'other'))
);
CREATE INDEX IF NOT EXISTS project_docs_project_idx ON project_docs (project_id, uploaded_at DESC);

-- 报价（项目制）：按模块列人天和价格，加 AI 开发费包干、付款节点、工期计划
CREATE TABLE IF NOT EXISTS quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    -- draft 拟定 / sent 已发 / accepted 客户认了 / rejected 没谈成
    status text NOT NULL DEFAULT 'draft',
    title text NOT NULL,
    party_a text NOT NULL,
    weeks int NOT NULL DEFAULT 4,
    -- [{name, content, days, amount}]
    items jsonb NOT NULL DEFAULT '[]',
    ai_fee numeric(12, 2) NOT NULL DEFAULT 0,
    -- [{name, pct, condition}]
    pay_plan jsonb NOT NULL DEFAULT '[]',
    -- [{when, what, client}]
    schedule jsonb NOT NULL DEFAULT '[]',
    onsite_per_week int NOT NULL DEFAULT 2,
    maintain_low numeric(12, 2) NOT NULL DEFAULT 1500,
    maintain_high numeric(12, 2) NOT NULL DEFAULT 3000,
    out_of_scope text,
    assumptions text,
    valid_days int NOT NULL DEFAULT 30,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT quotes_status_chk CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    CONSTRAINT quotes_weeks_chk CHECK (weeks BETWEEN 1 AND 104)
);
CREATE INDEX IF NOT EXISTS quotes_project_idx ON quotes (project_id, created_at DESC);

-- 项目分期：前期 / 中期 / 后期 / 维护，每期有计划日期、目标、对应收款
CREATE TABLE IF NOT EXISTS project_phases (
    project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    phase text NOT NULL,
    start_on date,
    end_on date,
    goal text,
    -- todo 未开始 / doing 进行中 / done 完成
    status text NOT NULL DEFAULT 'todo',
    pay_amount numeric(12, 2),
    paid_on date,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, phase),
    CONSTRAINT project_phases_phase_chk CHECK (phase IN ('前期', '中期', '后期', '维护')),
    CONSTRAINT project_phases_status_chk CHECK (status IN ('todo', 'doing', 'done'))
);

-- 项目制合同从报价生成，合同总价存 amount（派遣制仍按人月算）
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES quotes (id) ON DELETE SET NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS amount numeric(12, 2);
