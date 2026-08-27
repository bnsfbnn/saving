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

## Supabase — deploy ứng dụng MỚI

Chỉ cần 1 file duy nhất: `supabase/migrations/20260825000000_baseline.sql`

### Cách chạy

1. Tạo Supabase project mới.
2. SQL Editor → paste toàn bộ `baseline.sql` → Run.
   (Hoặc để Supabase tự chạy qua migrations nếu dùng CLI.)
3. Xong. Mở app → hiện màn hình "Bắt đầu tiết kiệm" để nhập số dư ban đầu.

### Vì sao opening account "sạch sẽ"

- Profile `default` được seed với `opening_balance = NULL`.
- `NULL` = tài khoản chưa khởi tạo → app hiện form nhập số dư lần đầu.
- Sau khi nhập, `opening_balance` được lưu và dashboard hiện hero card.

### Bảng (4 bảng)

- `profiles` — hồ sơ người dùng + số dư khởi tạo (`opening_balance`)
- `categories` — danh mục thu/chi (3 nhóm)
- `transactions` — giao dịch thu/chi
- `fixed_expenses` — khoản chi cố định (tuần/tháng)

## Công cụ cho DB ĐANG CHẠY (không dùng khi deploy mới)

`supabase/rebuild_database.sql` — dọn DB cũ về chuẩn baseline mà không mất dữ liệu. Chỉ dùng khi bạn có DB cũ muốn làm sạch.
