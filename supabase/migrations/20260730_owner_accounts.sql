-- Tách account_settings cho từng người dùng (vợ/chồng)
-- Mỗi người có tài khoản riêng và số dư riêng

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow all" ON account_settings;

-- Thêm cột owner_id vào account_settings
ALTER TABLE account_settings ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL DEFAULT 'wife';

-- Xóa constraint cũ nếu có
ALTER TABLE account_settings DROP CONSTRAINT IF EXISTS account_settings_pkey;

-- Tạo primary key mới: owner_id
ALTER TABLE account_settings ADD PRIMARY KEY (owner_id);

-- Thêm unique constraint
ALTER TABLE account_settings ADD CONSTRAINT account_settings_owner_id_key UNIQUE (owner_id);

-- Insert dữ liệu mặc định cho cả vợ và chồng
INSERT INTO account_settings (owner_id, opening_balance)
VALUES ('wife', 0), ('husband', 0)
ON CONFLICT (owner_id) DO NOTHING;

-- Tạo policy mới cho phép truy cập
CREATE POLICY "Allow all" ON account_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
