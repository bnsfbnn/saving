-- Tạo bảng profiles để quản lý tài khoản người dùng động
-- Thay thế cho hardcoded 'wife' | 'husband'

-- Bước 1: Tạo bảng profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  accent TEXT NOT NULL DEFAULT '#64748b',
  soft_accent TEXT NOT NULL DEFAULT '#f1f5f9',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bước 2: Tạo 2 profile mặc định
INSERT INTO profiles (id, name, color, accent, soft_accent) VALUES
  ('wife', 'Vợ', '#db2777', '#db2777', '#fce7f3'),
  ('husband', 'Chồng', '#2563eb', '#2563eb', '#dbeafe')
ON CONFLICT (id) DO NOTHING;

-- Bước 3: Thêm profile_id vào account_settings
ALTER TABLE account_settings ADD COLUMN IF NOT EXISTS profile_id TEXT;
UPDATE account_settings SET profile_id = owner_id WHERE profile_id IS NULL;
ALTER TABLE account_settings DROP CONSTRAINT IF EXISTS account_settings_pkey;
ALTER TABLE account_settings ADD PRIMARY KEY (profile_id);
ALTER TABLE account_settings DROP COLUMN IF EXISTS owner_id;

-- Bước 4: Thêm profile_id vào transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS profile_id TEXT;
UPDATE transactions SET profile_id = owner_id WHERE profile_id IS NULL;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_owner_id_check;
ALTER TABLE transactions DROP COLUMN IF EXISTS owner_id;

-- Bước 5: Thêm profile_id vào fixed_expenses
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS profile_id TEXT;
UPDATE fixed_expenses SET profile_id = owner_id WHERE profile_id IS NULL;
ALTER TABLE fixed_expenses DROP CONSTRAINT IF EXISTS fixed_expenses_owner_id_check;
ALTER TABLE fixed_expenses DROP COLUMN IF EXISTS owner_id;

-- Bước 6: Thêm profile_id vào monthly_budgets
ALTER TABLE monthly_budgets ADD COLUMN IF NOT EXISTS profile_id TEXT;
UPDATE monthly_budgets SET profile_id = owner_id WHERE profile_id IS NULL;
ALTER TABLE monthly_budgets DROP CONSTRAINT IF EXISTS monthly_budgets_owner_id_check;
ALTER TABLE monthly_budgets DROP CONSTRAINT IF EXISTS monthly_budgets_owner_id_month_start_key;
ALTER TABLE monthly_budgets ADD CONSTRAINT monthly_budgets_profile_month_key UNIQUE (profile_id, month_start);
ALTER TABLE monthly_budgets DROP COLUMN IF EXISTS owner_id;

-- Bước 7: Tạo policy cho profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON profiles FOR ALL USING (true) WITH CHECK (true);
