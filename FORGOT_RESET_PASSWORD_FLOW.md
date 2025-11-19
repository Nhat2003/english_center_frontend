# 🔐 Forgot Password & Reset Password Flow - Complete Guide

## 📖 Tổng Quan

Hệ thống Forgot/Reset Password đã được implement đầy đủ với 3 trang riêng biệt:
1. **Login Page** (`/login`) - Có link đến trang Forgot Password
2. **Forgot Password Page** (`/forgot-password`) - Form nhập email
3. **Reset Password Page** (`/reset-password`) - Form đặt mật khẩu mới

---

## 🔗 LUỒNG HOÀN CHỈNH (Step by Step)

### ✅ Step 1: User Vào Trang Login

**URL:** `http://localhost:4200/login`

**Actions:**
- User thấy form đăng nhập (username + password)
- Dưới form có link: **"Quên mật khẩu?"**
- User click link

**Frontend Code:**
```html
<!-- login.component.html -->
<a routerLink="/forgot-password" class="forgot-password">Quên mật khẩu?</a>
```

---

### ✅ Step 2: User Được Redirect Đến Forgot Password Page

**URL:** `http://localhost:4200/forgot-password`

**UI:**
- Brand logo (TOEIC DOWNTOWN)
- Tiêu đề: "Quên mật khẩu?"
- Subtitle: "Nhập email của bạn để nhận liên kết đặt lại mật khẩu"
- Form input: Email hoặc Tên đăng nhập
- Button: "Gửi yêu cầu đặt lại mật khẩu"
- Link: "Quay lại đăng nhập"

**User Action:**
```
User nhập: "student@test.com"
User click: "Gửi yêu cầu đặt lại mật khẩu"
```

**Frontend Code:**
```typescript
// forgot-password.component.ts
onSubmit(): void {
  if (this.forgotPasswordForm.valid) {
    this.isSending = true;
    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isSending = false;
        this.emailSent = true;  // Show success message
        this.message.success('Email đã được gửi! Vui lòng kiểm tra hộp thư của bạn.');
      },
      error: (error) => {
        this.isSending = false;
        if (error.status === 404) {
          this.message.error('Email không tồn tại trong hệ thống!');
        } else if (error.status === 400) {
          this.message.error('Email không hợp lệ!');
        } else {
          this.message.error('Có lỗi xảy ra. Vui lòng thử lại sau!');
        }
      }
    });
  }
}
```

**API Call:**
```http
POST http://localhost:8080/auth/forgot-password
Content-Type: application/json

{
  "email": "student@test.com"
}
```

**Backend Response (Success):**
```json
{
  "message": "Reset email sent"
}
```

**Backend Actions:**
1. Tìm user với email "student@test.com"
2. Tạo token ngẫu nhiên (UUID): `abc-123-def-456`
3. Lưu token vào DB với expiry time (30 phút)
4. Gửi email đến `student@test.com` với nội dung:

**Email Template:**
```
Subject: Reset mật khẩu - English Center

Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới để tiếp tục:

http://localhost:4200/reset-password?token=abc-123-def-456

Link này sẽ hết hạn sau 30 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
English Center Team
```

---

### ✅ Step 3: Frontend Hiển Thị Success Message

**UI Changes:**
- Form ẩn đi
- Hiển thị `nz-result` với status="success"
- Title: "Email đã được gửi!"
- Subtitle: "Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu."
- Alert: "Lưu ý: Liên kết đặt lại mật khẩu sẽ hết hạn sau 30 phút..."
- Button: "Quay lại đăng nhập"

**Screenshot:**
```
┌─────────────────────────────────────┐
│   ✓ Email đã được gửi!              │
│                                     │
│   Vui lòng kiểm tra hộp thư...      │
│                                     │
│   [ ← Quay lại đăng nhập ]          │
│                                     │
│   ℹ️ Lưu ý: Liên kết sẽ hết hạn...  │
└─────────────────────────────────────┘
```

---

### ✅ Step 4: User Check Email

**User Actions:**
1. Mở email inbox
2. Tìm email từ "English Center"
3. Đọc nội dung email
4. Click link: `http://localhost:4200/reset-password?token=abc-123-def-456`

---

### ✅ Step 5: User Mở Trang Reset Password

**URL:** `http://localhost:4200/reset-password?token=abc-123-def-456`

**Frontend Flow:**

#### 5.1. Đọc Token từ URL
```typescript
// reset-password.component.ts - ngOnInit()
this.route.queryParams.subscribe(params => {
  this.token = params['token'] || '';
  if (!this.token) {
    this.validatingToken = false;
    this.errorMessage = 'Liên kết không hợp lệ...';
    return;
  }
  // Validate token trước
  this.validateToken();
});
```

#### 5.2. Validate Token (API Call)
```http
GET http://localhost:8080/auth/reset/validate?token=abc-123-def-456
```

**Backend Response (Token Valid):**
```json
{
  "valid": true,
  "message": "Token hợp lệ"
}
```

**Backend Response (Token Expired):**
```json
{
  "valid": false,
  "message": "Token đã hết hạn"
}
```

**Backend Response (Token Invalid/Used):**
```json
{
  "valid": false,
  "message": "Token không hợp lệ hoặc đã được sử dụng"
}
```

#### 5.3. Frontend Xử Lý Validate Result

**Case 1: Token Valid ✅**
```typescript
validateToken(): void {
  this.validatingToken = true;
  this.authService.validateResetToken(this.token).subscribe({
    next: () => {
      this.validatingToken = false;
      this.tokenValid = true;  // Show form
    }
  });
}
```

**UI Hiển Thị:**
```
┌─────────────────────────────────────┐
│   🔒 Đặt lại mật khẩu               │
│                                     │
│   Mật khẩu mới: [_______________]   │
│   Xác nhận MK:  [_______________]   │
│                                     │
│   ℹ️ Mật khẩu phải có ít nhất 6 ký tự│
│                                     │
│   [ Đặt lại mật khẩu ]              │
│                                     │
│   ← Quay lại đăng nhập              │
└─────────────────────────────────────┘
```

**Case 2: Token Invalid/Expired ❌**
```typescript
error: (error) => {
  this.validatingToken = false;
  this.tokenValid = false;
  
  if (error.status === 400) {
    this.errorMessage = 'Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.';
  } else if (error.status === 404) {
    this.errorMessage = 'Liên kết không hợp lệ hoặc đã được sử dụng.';
  }
}
```

**UI Hiển Thị:**
```
┌─────────────────────────────────────┐
│   ❌ Liên kết không hợp lệ           │
│                                     │
│   Liên kết đã hết hạn. Vui lòng...  │
│                                     │
│   [ Quay lại đăng nhập ]            │
└─────────────────────────────────────┘
```

---

### ✅ Step 6: User Nhập Mật Khẩu Mới

**User Actions:**
```
Mật khẩu mới:  "NewPassword123!"
Xác nhận MK:   "NewPassword123!"
Click: "Đặt lại mật khẩu"
```

**Frontend Validation:**
```typescript
// Form validator
this.resetForm = this.fb.group({
  newPassword: ['', [Validators.required, Validators.minLength(6)]],
  confirmPassword: ['', [Validators.required]]
}, { validators: this.passwordMatchValidator });

passwordMatchValidator(g: FormGroup) {
  return g.get('newPassword')?.value === g.get('confirmPassword')?.value
    ? null : { 'mismatch': true };
}
```

**Validation Rules:**
- ✅ Mật khẩu mới: Required, Min 6 ký tự
- ✅ Xác nhận: Required
- ✅ Hai mật khẩu phải khớp nhau

---

### ✅ Step 7: Submit Form Reset Password

**Frontend Code:**
```typescript
onSubmit() {
  if (this.resetForm.valid && this.token) {
    this.isResetting = true;
    const { newPassword } = this.resetForm.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.isResetting = false;
        this.message.success('Mật khẩu đã được thay đổi thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isResetting = false;
        
        if (error.status === 400) {
          const errorMsg = error.error?.message || '';
          if (errorMsg.includes('expired') || errorMsg.includes('hết hạn')) {
            this.message.error('Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
            this.tokenValid = false;
          } else {
            this.message.error('Liên kết không hợp lệ hoặc đã được sử dụng.');
            this.tokenValid = false;
          }
        } else if (error.status === 404) {
          this.message.error('Không tìm thấy người dùng.');
          this.tokenValid = false;
        } else {
          this.message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
        }
      }
    });
  }
}
```

**API Call:**
```http
POST http://localhost:8080/auth/reset-password
Content-Type: application/json

{
  "token": "abc-123-def-456",
  "newPassword": "NewPassword123!"
}
```

**Backend Response (Success):**
```json
{
  "message": "Password updated"
}
```

**Backend Actions:**
1. Validate token (exists, not expired, not used)
2. Find user by token
3. Hash new password với BCrypt
4. Update user password trong DB
5. **Xóa/invalidate token** (set used=true hoặc delete)
6. (Optional) Gửi email thông báo password đã đổi
7. Return success

---

### ✅ Step 8: Frontend Redirect về Login

**Success Flow:**
```typescript
setTimeout(() => {
  this.router.navigate(['/login']);
}, 2000);
```

**UI:**
- Show success message: "Mật khẩu đã được thay đổi thành công!"
- Wait 2 seconds
- Auto redirect về `/login`

---

### ✅ Step 9: User Login Với Mật Khẩu Mới

**URL:** `http://localhost:4200/login`

**User Actions:**
```
Username: "student"
Password: "NewPassword123!"  (mật khẩu mới)
Click: "Đăng nhập"
```

**API Call:**
```http
POST http://localhost:8080/users/login
Content-Type: application/json

{
  "username": "student",
  "password": "NewPassword123!"
}
```

**Backend Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "student",
    "role": "STUDENT",
    "student": {
      "id": 1,
      "fullName": "Nguyễn Văn A",
      "email": "student@test.com"
    }
  }
}
```

**Result:** ✅ Đăng nhập thành công! Redirect `/student`

---

## 📊 Flow Diagram

```
┌─────────────┐
│   /login    │ User click "Quên mật khẩu?"
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ /forgot-password │ User nhập email → Submit
└──────┬───────────┘
       │
       ↓ POST /auth/forgot-password
┌──────────────────┐
│     Backend      │ Generate token → Send email
└──────┬───────────┘
       │
       ↓ Email sent
┌──────────────────┐
│   User Email     │ User click link trong email
└──────┬───────────┘
       │
       ↓ Link: /reset-password?token=XXX
┌──────────────────┐
│ /reset-password  │ Validate token → Show form
└──────┬───────────┘
       │
       ↓ User nhập mật khẩu mới → Submit
┌──────────────────┐
│     Backend      │ Validate token → Update password → Delete token
└──────┬───────────┘
       │
       ↓ Success
┌──────────────────┐
│   /login         │ User login với mật khẩu mới → Success! ✅
└──────────────────┘
```

---

## 🗂️ File Structure

```
src/app/features/auth/
├── login/
│   ├── login.component.ts          # Đã xóa modal code
│   ├── login.component.html        # Link routerLink="/forgot-password"
│   └── login.component.css
│
├── forgot-password/                # ✅ NEW
│   ├── forgot-password.component.ts
│   ├── forgot-password.component.html
│   └── forgot-password.component.css
│
├── reset-password/                 # ✅ UPDATED
│   ├── reset-password.component.ts # Có validate token logic
│   ├── reset-password.component.html
│   └── reset-password.component.css
│
├── auth.module.ts                  # Đã đăng ký ForgotPasswordComponent
└── auth.routes.ts                  # Đã thêm route /forgot-password
```

---

## 🧪 Testing Checklist

### Frontend Testing:

**Test 1: Navigation**
- [ ] Vào `/login` → Click "Quên mật khẩu?" → Redirect `/forgot-password` ✅

**Test 2: Forgot Password Page**
- [ ] Form hiển thị đúng với email input
- [ ] Nhập email không hợp lệ → Show error "Email không hợp lệ!"
- [ ] Submit form → Loading state xuất hiện
- [ ] Submit thành công → Show success message với nz-result

**Test 3: Email Link**
- [ ] Click link trong email → Mở `/reset-password?token=XXX`
- [ ] Page hiển thị loading spinner "Đang xác thực liên kết..."

**Test 4: Reset Password - Valid Token**
- [ ] Validate thành công → Hiển thị form nhập mật khẩu
- [ ] Nhập mật khẩu < 6 ký tự → Show error
- [ ] Nhập 2 mật khẩu không khớp → Show error "Mật khẩu xác nhận không khớp"
- [ ] Submit thành công → Show success message → Auto redirect `/login` sau 2s

**Test 5: Reset Password - Invalid Token**
- [ ] Token expired → Show error page: "Liên kết đã hết hạn"
- [ ] Token không tồn tại → Show error page: "Liên kết không hợp lệ"
- [ ] Token đã được sử dụng → Show error page: "Liên kết đã được sử dụng"

**Test 6: Complete Flow**
- [ ] Login → Forgot → Email → Reset → Login mới ✅

---

## 🔐 Security Features

### Frontend:
- ✅ Validate email format
- ✅ Password min 6 characters
- ✅ Password confirmation matching
- ✅ Token validation before showing form
- ✅ Show user-friendly error messages
- ✅ Auto redirect after success
- ✅ Loading states prevent double submit

### Backend (Required):
- ✅ Token: UUID random, unpredictable
- ✅ Token expiry: 30 minutes
- ✅ One-time use: Delete/invalidate after use
- ✅ BCrypt password hashing
- ✅ Rate limiting: Max 5 requests/hour per email
- ✅ HTTPS only in production
- ✅ Email security: No sensitive info in email

---

## 📞 API Summary

### 1. Forgot Password
```http
POST /auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "message": "Reset email sent" }
```

### 2. Validate Token
```http
GET /auth/reset/validate?token=XXX
Response: { "valid": true, "message": "Token hợp lệ" }
```

### 3. Reset Password
```http
POST /auth/reset-password
Body: { "token": "XXX", "newPassword": "NewPass123" }
Response: { "message": "Password updated" }
```

---

## ✅ Kết Luận

**Frontend Implementation Status: 100% Complete ✅**

- ✅ Login page với link đến Forgot Password
- ✅ Forgot Password page (trang riêng, không còn modal)
- ✅ Reset Password page với token validation
- ✅ Error handling đầy đủ
- ✅ UX tốt với loading states, success messages
- ✅ Responsive design
- ✅ Security best practices

**Backend Status: Waiting for Implementation ⏳**

Xem chi tiết trong:
- `BACKEND_RESET_PASSWORD_API.md` - API specs
- `GMAIL_SMTP_SETUP.md` - Gmail configuration

**🎉 Frontend ready to test! Backend APIs pending implementation.**
