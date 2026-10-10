-- 工作室名册与案例集。对外只取 public / published 行。

CREATE TABLE IF NOT EXISTS staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL,
    grade text,
    specialty text,
    bio text,
    resume_md text,
    sort_order int NOT NULL DEFAULT 0,
    public boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT staff_role_chk CHECK (role IN ('principal', 'fde'))
);

CREATE TABLE IF NOT EXISTS cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    industry text NOT NULL,
    title text NOT NULL,
    stuck_at text,
    built text,
    process_words text[] NOT NULL DEFAULT '{}',
    who_uses text,
    pitch text,
    status text NOT NULL DEFAULT 'draft',
    published boolean NOT NULL DEFAULT false,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cases_status_chk CHECK (status IN ('draft', 'outline', 'ready'))
);

CREATE TABLE IF NOT EXISTS case_staff (
    case_id uuid NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, staff_id)
);

-- id 用 uuid5(jianlai.tech, staff:<slug>)，人事档案 staff_hr 按这个主键挂。
INSERT INTO staff (id, slug, name, role, specialty, bio, sort_order, public)
VALUES
    ('b2600128-feb6-5147-a88c-cf8b53ca841c', 'shujian', '赵书剑', 'principal', '接现场、派驻场', '剑来科技主理人。', 0, true),
    ('15688b82-f327-58cc-a86f-816764767d6b', 'mumu', '吴桐', 'fde', NULL, NULL, 10, true),
    ('8c9ad04e-d4b9-5bfe-86d6-17279944e606', 'yungu', '杨成焯', 'fde', NULL, NULL, 20, true),
    ('6ba1272e-959e-5c65-9503-6315c30cd590', 'huangyixuan', '黄奕轩', 'fde', NULL, NULL, 30, true),
    ('46a6d7f2-56dc-5a57-9322-fcda5f4f5993', 'jiong', '易鑫辉', 'fde', NULL, NULL, 40, true),
    ('8e5cf881-fb87-5047-b12d-4ac69bc32a0d', 'xiaoyu', '喻翔宇', 'fde', NULL, NULL, 50, true),
    ('c731f666-f84e-5fd6-b7e1-5c9cfc076ffe', 'xiaodui', '王悦', 'fde', NULL, NULL, 60, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    specialty = COALESCE(EXCLUDED.specialty, staff.specialty),
    bio = COALESCE(EXCLUDED.bio, staff.bio),
    sort_order = EXCLUDED.sort_order,
    public = EXCLUDED.public;

INSERT INTO cases (slug, industry, title, stuck_at, built, process_words, who_uses, pitch, status, published, sort_order)
VALUES
    (
        'k12-jiajiao',
        'K12 一对一家教',
        'K12 一对一家教',
        '试课、成交、上课、消课、课酬、家长沟通散在表格和聊天里。',
        '一条能跑的经营链路：试课、成交、消课、课酬、四端。',
        ARRAY['试课', '成交', '消课', '课酬', '四端'],
        '教务、转化、老师、家长',
        '派人进一家 K12 一对一家教公司，把试课到课酬做成能跑的系统。',
        'ready',
        true,
        10
    ),
    (
        'yiliao-fenxiao',
        '医疗器械批发分销',
        '医疗器械批发分销',
        '客户、供应商、货品、订单、渠道各在一套账里，对不上。',
        '主数据、多渠道订单、仓配、对账接到同一套经营系统。',
        ARRAY['主数据', '订单', '仓配', '对账'],
        '老板、采购、仓库、门店、对账',
        '派人进一家医疗器械批发分销公司，把货、渠道、仓、账做成能对上的系统。',
        'ready',
        true,
        20
    ),
    (
        'guancai-maoyi',
        '管材贸易',
        '管材贸易',
        NULL,
        NULL,
        ARRAY[]::text[],
        NULL,
        NULL,
        'outline',
        false,
        30
    )
ON CONFLICT (slug) DO NOTHING;
