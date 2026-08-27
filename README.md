# Saving App

Ứng dụng quản lý thu chi bằng React + Vite + Supabase.

## Nghiệp vụ chính

- Tài khoản chính có số dư khởi tạo; mọi giao dịch thu/chi sẽ cộng/trừ vào số dư hiện tại.
- Category tách theo 3 nhóm: thu, chi thường, chi cố định. App có sẵn danh sách mặc định và có thể thêm/sửa/xóa.
- Chi thường được quản lý theo calendar tháng, mỗi ngày hiển thị category, số tiền và ghi chú.
- Chi cố định được quản lý riêng theo hàng tuần hoặc hàng tháng, có category riêng.
- Dashboard hiển thị tổng quan theo tháng và tỷ trọng chi theo category.

## Cấu trúc source

```
src/
  App.tsx                  — shell: auth gate + layout + screen router
  config.ts                — auth constants
  types.ts                 — domain types + draft types
  lib/supabase.ts          — Supabase client
  data/
    defaults.ts            — labels, colors, icons, default categories
    screens.ts             — screen definitions
  utils/
    dates.ts               — date helpers
    money.ts               — currency, sum, parseAmount
    finance.ts             — occurrences, monthly summary, category breakdown
  repositories/
    appData.ts             — load all data (read + auto-seed)
    transactions.ts        — CRUD transactions
    categories.ts          — CRUD categories + seed defaults
    fixedExpenses.ts       — CRUD fixed expenses
    profiles.ts            — update opening balance
  hooks/
    useAuth.ts             — auth gate state
    useFinanceData.ts      — central data hook (state + derived + actions)
  components/
    auth/LoginScreen.tsx
    layout/                — Sidebar, MobileTopbar, BottomNav, MonthPicker
    common/Notice.tsx
    dashboard/             — DashboardScreen + sub-components
    calendar/CalendarScreen.tsx
    transactions/          — TransactionForm, TransactionList
    fixed/                 — FixedScreen, FixedExpenseForm, FixedExpenseList
    categories/            — CategoriesScreen, CategoryForm, CategoryTable
```

## Chạy local

1. Cài Node.js 18+.
2. Cài dependencies:

```bash
npm install
```

3. Tạo `.env.local` từ `.env.example` và điền Supabase:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Chạy app:

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Supabase migrations

Thư mục `supabase/` gồm 4 file:

| File | Dùng khi nào |
|---|---|
| `migrations/20260825000000_baseline.sql` | Database **mới** (fresh). Tạo toàn bộ schema + RLS + seed. |
| `migrations/20260827000000_merge_account_settings_into_profiles.sql` | Database **đang chạy**. Gộp `account_settings` vào `profiles`, xóa bảng thừa, bật RLS. |
| `migrations/20260828000000_drop_monthly_budgets.sql` | Database **đang chạy**. Xóa bảng `monthly_budgets` (archive trước khi drop). |
| `rebuild_database.sql` | Database **đang chạy**, muốn dọn sạch hoàn toàn về chuẩn baseline mà **không mất dữ liệu**. Tự xử lý mọi trạng thái DB. |

### Cách chạy rebuild_database.sql

1. Supabase Dashboard → Database → Backups → tạo backup (khuyến nghị).
2. SQL Editor → paste toàn bộ `supabase/rebuild_database.sql` → Run.
3. Xem kết quả: bảng báo cáo số dòng 4 bảng. Nếu thấy `Rebuild OK` là thành công; nếu lỗi thì transaction đã rollback, DB nguyên trạng cũ.

### Bảng

- `profiles` — hồ sơ người dùng + số dư khởi tạo (`opening_balance`)
- `categories` — danh mục thu/chi (3 nhóm)
- `transactions` — giao dịch thu/chi
- `fixed_expenses` — khoản chi cố định (tuần/tháng)
