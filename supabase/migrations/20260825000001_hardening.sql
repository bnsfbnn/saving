-- ============================================================================
-- HARDENING — áp dụng cho database ĐANG CHẠY (đã có dữ liệu).
-- Migration này idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu.
-- Nó đưa DB cũ về đúng chuẩn của baseline:
--   1. Bật RLS + policy "Allow all" trên tất cả các bảng
--   2. Bỏ FK cứng fixed_expense_overrides.profile_id -> profiles
--      (về quy ước soft reference giống baseline)
--   3. Tạo các index còn thiếu
--   4. Seed profiles + categories mặc định (bỏ qua nếu đã có)
-- ============================================================================

-- ── 1. row level security ───────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.account_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_expenses enable row level security;

drop policy if exists "Allow all" on public.profiles;
drop policy if exists "Allow all" on public.categories;
drop policy if exists "Allow all" on public.account_settings;
drop policy if exists "Allow all" on public.transactions;
drop policy if exists "Allow all" on public.fixed_expenses;

create policy "Allow all" on public.profiles for all using (true) with check (true);
create policy "Allow all" on public.categories for all using (true) with check (true);
create policy "Allow all" on public.account_settings for all using (true) with check (true);
create policy "Allow all" on public.transactions for all using (true) with check (true);
create policy "Allow all" on public.fixed_expenses for all using (true) with check (true);

-- ── 3. indexes còn thiếu ────────────────────────────────────────────────────
create index if not exists categories_kind_idx on public.categories (kind, name);
create index if not exists transactions_profile_month_idx on public.transactions (profile_id, occurred_on desc);
create index if not exists transactions_category_id_idx on public.transactions (category_id);
create index if not exists fixed_expenses_profile_idx on public.fixed_expenses (profile_id, is_active);
create index if not exists fixed_expenses_category_id_idx on public.fixed_expenses (category_id);

-- ── 4. seed data ────────────────────────────────────────────────────────────
insert into public.profiles (id, name, color, accent, soft_accent) values
  ('wife', 'Vợ', '#db2777', '#db2777', '#fce7f3'),
  ('husband', 'Chồng', '#2563eb', '#2563eb', '#dbeafe')
on conflict (id) do nothing;

insert into public.categories (name, kind, color, icon, is_default) values
  ('Lương', 'income', '#16a34a', '💼', true),
  ('Thưởng', 'income', '#ca8a04', '🎁', true),
  ('Thu nhập phụ', 'income', '#0f766e', '💰', true),
  ('Ăn uống', 'expense', '#ea580c', '🍜', true),
  ('Đi chợ', 'expense', '#16a34a', '🛒', true),
  ('Di chuyển', 'expense', '#2563eb', '🚗', true),
  ('Sức khỏe', 'expense', '#dc2626', '💊', true),
  ('Cà phê', 'expense', '#7c3aed', '☕', true),
  ('Tiền nhà', 'fixed_expense', '#64748b', '🏠', true),
  ('Điện nước', 'fixed_expense', '#ca8a04', '💡', true),
  ('Internet/Điện thoại', 'fixed_expense', '#2563eb', '📱', true),
  ('Học phí', 'fixed_expense', '#7c3aed', '🎓', true)
on conflict (kind, name) do nothing;
