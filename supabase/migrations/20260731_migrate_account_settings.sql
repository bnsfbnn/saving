-- Chuyển dữ liệu account_settings cũ (id='main') sang owner_id='wife'
-- Sau đó tạo thêm dòng cho husband nếu chưa có

-- Bước 1: Cập nhật dòng cũ có id='main' thành owner_id='wife'
UPDATE account_settings
SET owner_id = 'wife'
WHERE id = 'main' AND owner_id = 'wife';

-- Bước 2: Xóa cột id cũ không cần thiết (đã chuyển sang owner_id làm primary key)
ALTER TABLE account_settings DROP COLUMN IF EXISTS id;

-- Bước 3: Đảm bảo husband có dòng riêng, copy opening_balance từ wife nếu chưa có
INSERT INTO account_settings (owner_id, opening_balance)
SELECT 'husband', opening_balance FROM account_settings WHERE owner_id = 'wife'
ON CONFLICT (owner_id) DO NOTHING;
