-- 财务流水（真账）。手记和银行明细都落这里；bank_ref 给日后招行明细导入 / 银企直联去重。
-- 删错不物理删，置 voided_at。

CREATE TABLE IF NOT EXISTS ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_on date NOT NULL,
    occurred_at timestamptz,
    kind text NOT NULL,
    category text NOT NULL,
    memo text NOT NULL,
    counterparty text,
    amount numeric(14, 2) NOT NULL,
    account text,
    balance_after numeric(14, 2),
    source text NOT NULL DEFAULT '手记',
    bank_ref text,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    voided_at timestamptz,
    CONSTRAINT ledger_kind_chk CHECK (kind IN ('in', 'out')),
    CONSTRAINT ledger_amount_chk CHECK (amount > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ledger_bank_ref_uidx ON ledger (bank_ref) WHERE bank_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS ledger_occurred_idx ON ledger (occurred_on DESC, occurred_at DESC) WHERE voided_at IS NULL;
