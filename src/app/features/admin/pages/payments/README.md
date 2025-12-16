# Chức năng Quản lý Thanh toán

## Tổng quan
Chức năng quản lý thanh toán cho phép admin của TOEIC DOWNTOWN quản lý tất cả các giao dịch thanh toán của học sinh, bao gồm:

- Xem danh sách thanh toán
- Thêm thanh toán mới
- Xem chi tiết thanh toán
- Cập nhật trạng thái thanh toán
- Xuất báo cáo thanh toán
- Thống kê doanh thu

## Cấu trúc Files

### Models
- `src/app/core/models/payment.model.ts` - Định nghĩa các interface cho Payment, PaymentRequest, PaymentSummary

### Services
- `src/app/core/services/payment.service.ts` - Service xử lý API calls cho thanh toán

### Components
- `src/app/features/admin/pages/payments/payments.component.ts` - Component wrapper
- `src/app/features/admin/pages/payments/payment-list/` - Component danh sách thanh toán
- `src/app/features/admin/pages/payments/add-payment/` - Component thêm thanh toán mới
- `src/app/features/admin/pages/payments/payment-detail/` - Component chi tiết thanh toán

## Tính năng

### 1. Danh sách thanh toán (`/admin/payments`)
- Hiển thị danh sách tất cả thanh toán với phân trang
- Tìm kiếm theo tên học sinh, lớp học
- Lọc theo trạng thái thanh toán
- Lọc theo phương thức thanh toán
- Lọc theo khoảng thời gian
- Hiển thị thống kê tổng quan (tổng doanh thu, số lượng thanh toán, etc.)
- Cập nhật trạng thái thanh toán nhanh
- Xuất báo cáo Excel/PDF
- Xóa thanh toán

### 2. Thêm thanh toán (`/admin/payments/add`)
- Form thêm thanh toán mới
- Chọn học sinh từ dropdown
- Chọn lớp học từ dropdown
- Nhập số tiền thanh toán
- Chọn phương thức thanh toán (Tiền mặt, Chuyển khoản, Thẻ)
- Nhập mã giao dịch (tùy chọn)
- Nhập ghi chú (tùy chọn)
- Validation form đầy đủ

### 3. Chi tiết thanh toán (`/admin/payments/detail/:id`)
- Hiển thị thông tin chi tiết thanh toán
- Thông tin học sinh và lớp học
- Lịch sử thay đổi trạng thái
- Các thao tác cập nhật trạng thái:
  - Đánh dấu hoàn thành
  - Đánh dấu thất bại
  - Hoàn tiền
  - Đặt lại chờ xử lý

## Trạng thái thanh toán

- **PENDING** (Chờ xử lý) - Thanh toán mới tạo, chưa được xác nhận
- **COMPLETED** (Hoàn thành) - Thanh toán đã được xử lý thành công
- **FAILED** (Thất bại) - Thanh toán bị lỗi hoặc không thành công
- **REFUNDED** (Hoàn tiền) - Thanh toán đã được hoàn lại cho học sinh

## Phương thức thanh toán

- **CASH** - Tiền mặt
- **TRANSFER** - Chuyển khoản ngân hàng
- **CARD** - Thanh toán bằng thẻ

## API Endpoints (Backend cần implement)

```
GET    /payments              - Lấy danh sách thanh toán (có phân trang, filter)
GET    /payments/:id          - Lấy chi tiết thanh toán
POST   /payments              - Tạo thanh toán mới
PUT    /payments/:id          - Cập nhật thanh toán
DELETE /payments/:id          - Xóa thanh toán
PATCH  /payments/:id/status   - Cập nhật trạng thái
GET    /payments/summary      - Lấy thống kê thanh toán
GET    /payments/student/:id  - Lấy thanh toán theo học sinh
GET    /payments/class/:id    - Lấy thanh toán theo lớp
GET    /payments/export       - Xuất báo cáo (Excel/PDF)
```

## Navigation

Chức năng được thêm vào menu admin với:
- Label: "Quản lý thanh toán"
- Icon: "credit-card"
- Route: "/admin/payments"

## Dependencies thêm mới

Các Angular Ng-Zorro modules được sử dụng:
- NzCardModule - Hiển thị cards
- NzStatisticModule - Hiển thị thống kê
- NzInputNumberModule - Input số tiền
- NzDescriptionsModule - Hiển thị thông tin chi tiết
- NzTimelineModule - Timeline lịch sử thay đổi
- NzDatePickerModule - Chọn khoảng thời gian

## Responsive Design

Tất cả components đều được thiết kế responsive, hỗ trợ:
- Desktop (>768px)
- Tablet (768px - 576px)
- Mobile (<576px)

## Sử dụng

1. Admin đăng nhập vào hệ thống
2. Truy cập menu "Quản lý thanh toán"
3. Xem danh sách thanh toán, sử dụng các filter để tìm kiếm
4. Click "Thêm thanh toán" để tạo thanh toán mới
5. Click vào ID thanh toán hoặc "Xem chi tiết" để xem thông tin chi tiết
6. Sử dụng dropdown actions để cập nhật trạng thái hoặc xóa thanh toán
7. Xuất báo cáo bằng các nút "Xuất Excel" hoặc "Xuất PDF"
