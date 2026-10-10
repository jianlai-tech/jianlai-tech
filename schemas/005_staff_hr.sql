-- 人事档案：身份证、银行卡、手机。不进公开接口。
-- 真值从 staff_hr.local.csv 灌入（已 gitignore），见 app/seed_staff_hr.py。

CREATE TABLE IF NOT EXISTS staff_hr (
    staff_id uuid PRIMARY KEY REFERENCES staff (id) ON DELETE CASCADE,
    legal_name text NOT NULL,
    gender text,
    ethnicity text,
    birth_on date,
    id_number text NOT NULL UNIQUE,
    id_address text,
    id_issued_by text,
    id_valid_from date,
    id_valid_to date,
    phone text,
    bank_card text,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT staff_hr_gender_chk CHECK (gender IS NULL OR gender IN ('男', '女')),
    CONSTRAINT staff_hr_id_number_chk CHECK (id_number ~ '^[0-9]{17}[0-9Xx]$')
);

CREATE INDEX IF NOT EXISTS staff_hr_phone_idx ON staff_hr (phone)
    WHERE phone IS NOT NULL;
