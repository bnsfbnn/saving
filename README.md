# Saving App

Ứng dụng quản lý thu chi cho 2 vợ chồng bằng React + Vite + Supabase.

## Nghiệp vụ chính

- Không có đăng nhập; chuyển nhanh giữa giao diện Hồng cho vợ và Xanh dương cho chồng.
- Tài khoản chính có số dư khởi tạo; mọi giao dịch thu/chi sẽ cộng/trừ vào số dư hiện tại.
- Category tách theo 3 nhóm: thu, chi thường, chi cố định. App có sẵn danh sách mặc định và có thể thêm/sửa/xóa.
- Chi thường được quản lý theo calendar tháng, mỗi ngày hiển thị category, số tiền và ghi chú.
- Chi cố định được quản lý riêng theo hàng tuần hoặc hàng tháng, có category riêng.
- Dashboard hiển thị tổng quan theo tháng và tỷ trọng chi theo category.
- Màn hình số tiền còn lại từng tháng tách biệt với tài khoản chính.

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

4. Chạy migration mới trong Supabase SQL editor:

```text
supabase/migrations/20260710_refactor_family_finance.sql
```

Migration này drop schema cũ vì bản refactor không giữ dữ liệu cũ.

5. Chạy app:

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Supabase tables

- `categories`
- `account_settings`
- `transactions`
- `fixed_expenses`
- `monthly_budgets`
