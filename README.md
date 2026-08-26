# Saving App

Ứng dụng quản lý thu chi cho 2 vợ chồng bằng React + Vite + Supabase.

## Nghiệp vụ chính

- Không có đăng nhập; chuyển nhanh giữa giao diện Hồng cho vợ và Xanh dương cho chồng.
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
    accountSettings.ts     — upsert opening balance
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

Thư mục `supabase/` gồm 3 file:

| File | Dùng khi nào |
|---|---|
| `migrations/20260825000000_baseline.sql` | Database **mới** (fresh). Tạo toàn bộ schema + RLS + seed. |
| `migrations/20260825000001_hardening.sql` | Database **đang chạy**, chỉ cần vá nhẹ: bật RLS, thêm index, bỏ FK cứng, seed thêm nếu thiếu. Không mất dữ liệu. |
| `rebuild_database.sql` | Database **đang chạy**, muốn dọn sạch hoàn toàn về chuẩn baseline mà **không mất dữ liệu**. Chạy trong 1 transaction: snapshot → drop → tạo lại schema chuẩn → restore data → kiểm đếm row count. Lệch số dòng là tự rollback, data an toàn. |

### Cách chạy rebuild_database.sql

1. Supabase Dashboard → Database → Backups → tạo backup (khuyến nghị).
2. SQL Editor → paste toàn bộ `supabase/rebuild_database.sql` → Run.
3. Xem kết quả: bảng báo cáo số dòng 7 bảng. Nếu thấy `Rebuild OK` là thành công; nếu lỗi thì transaction đã rollback, DB nguyên trạng cũ.
