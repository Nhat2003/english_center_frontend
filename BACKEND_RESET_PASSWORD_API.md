# Backend API Requirements for Reset Password Feature

Frontend đã được cập nhật để hỗ trợ đầy đủ luồng Forgot Password / Reset Password theo đúng best practices.

## 📋 Các API Endpoints Cần Có

### 1. **POST /auth/forgot-password**
Gửi email chứa link reset password đến người dùng.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response Success (200):**
```json
{
  "message": "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
}
```

**Response Error (400):**
```json
{
  "message": "Email không tồn tại trong hệ thống"
}
```

**⚠️ Security Note:** 
Để tránh lộ danh sách user, có thể trả về 200 cho cả trường hợp email không tồn tại (không gửi email thật), hoặc trả về message chung chung như "Nếu email tồn tại, link reset sẽ được gửi đến".

**Email Template:**
- Link format: `http://localhost:4200/reset-password?token=GENERATED_TOKEN`
- Token nên:
  - Random, không đoán được (UUID recommended)
  - Có thời gian hết hạn (15-30 phút)
  - Lưu trong DB với userId, expiry time
  - One-time use (xóa sau khi dùng)

---

### 2. **GET /auth/reset/validate**
Kiểm tra token có hợp lệ hay không trước khi hiển thị form reset password.

**Query Parameters:**
- `token` (required): Token từ email

**Request Example:**
```
GET /auth/reset/validate?token=abc123xyz
```

**Response Success (200):**
```json
{
  "valid": true,
  "message": "Token hợp lệ"
}
```

**Response Error (400 - Expired):**
```json
{
  "valid": false,
  "message": "Token đã hết hạn"
}
```

**Response Error (404 - Not Found/Invalid):**
```json
{
  "valid": false,
  "message": "Token không hợp lệ hoặc đã được sử dụng"
}
```

**Logic Backend:**
1. Tìm token trong DB
2. Kiểm tra expiry time
3. Kiểm tra token chưa được sử dụng
4. Return valid/invalid

---

### 3. **POST /auth/reset-password**
Đặt lại mật khẩu với token hợp lệ.

**Request:**
```json
{
  "token": "abc123xyz",
  "newPassword": "NewSecureP@ssw0rd"
}
```

**Response Success (200):**
```json
{
  "message": "Mật khẩu đã được thay đổi thành công"
}
```

**Response Error (400 - Token Expired):**
```json
{
  "message": "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới."
}
```

**Response Error (400 - Token Invalid/Used):**
```json
{
  "message": "Token không hợp lệ hoặc đã được sử dụng"
}
```

**Response Error (404):**
```json
{
  "message": "Không tìm thấy người dùng"
}
```

**Logic Backend:**
1. Validate token (giống validate endpoint)
2. Hash mật khẩu mới bằng BCrypt
3. Cập nhật password trong DB
4. **Xóa/vô hiệu hóa token** (one-time use)
5. (Optional) Gửi email thông báo mật khẩu đã đổi
6. Return success

---

## 🗄️ Database Schema Suggestion

**Table: password_reset_tokens**
```sql
CREATE TABLE password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Index:**
```sql
CREATE INDEX idx_token ON password_reset_tokens(token);
CREATE INDEX idx_expiry ON password_reset_tokens(expires_at);
```

---

## 🔐 Security Best Practices

1. **Token Generation:**
   - Sử dụng `UUID.randomUUID()` hoặc secure random generator
   - Không dùng thông tin có thể đoán được (userId, email, timestamp...)

2. **Token Expiry:**
   - Recommended: 15-30 phút
   - Xóa tokens cũ hết hạn bằng scheduled job

3. **Rate Limiting:**
   - Giới hạn số lần request forgot-password per email (3-5 lần/giờ)
   - Tránh spam email

4. **Password Validation:**
   - Min 6 characters (hoặc tốt hơn: 8+ chars, có chữ + số + ký tự đặc biệt)
   - Hash bằng BCrypt với strength >= 10

5. **One-Time Use:**
   - Token chỉ dùng 1 lần
   - Sau khi reset thành công, set `used=true` hoặc xóa token

6. **Email Security:**
   - Không show thông tin nhạy cảm trong email
   - Link chỉ chứa token, không chứa userId hay email

---

## 📧 Email Configuration (application.properties)

```properties
# Email settings
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_APP_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=3000
spring.mail.properties.mail.smtp.writetimeout=5000

# Debug mail (set to true for troubleshooting)
spring.mail.properties.mail.debug=true
logging.level.org.springframework.mail=DEBUG

# Frontend URL
app.frontend.reset-url=http://localhost:4200/reset-password

# Token expiry (minutes)
app.reset-token.expiry=30
```

### 🔧 Gmail SMTP Setup (Chi tiết)

**⚠️ CRITICAL:** Gmail không chấp nhận mật khẩu thường từ 2022. Phải dùng **App Password**!

#### Bước 1: Tạo Gmail App Password

1. Đăng nhập Gmail: https://myaccount.google.com/
2. Vào **Security** → **2-Step Verification** (bật nếu chưa bật)
3. Sau khi bật 2FA, quay lại **Security** → **App passwords**
4. Chọn:
   - **App:** Mail
   - **Device:** Other (nhập "English Center Backend")
5. Click **Generate** → Copy mật khẩu 16 ký tự (ví dụ: `abcd efghijkl mnop`)

#### Bước 2: Cấu hình Backend

**Option 1: Environment Variables (Khuyến nghị - Production)**
```properties
# application.properties
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

**Chạy với environment variables:**
```powershell
# PowerShell
$Env:MAIL_USERNAME="nhat.longtran003@gmail.com"
$Env:MAIL_PASSWORD="abcdefghijklmnop"
mvn spring-boot:run
```

```bash
# Linux/Mac
export MAIL_USERNAME="nhat.longtran003@gmail.com"
export MAIL_PASSWORD="abcdefghijklmnop"
mvn spring-boot:run
```

**Option 2: Local Profile (Development)**
```properties
# application-local.properties (thêm vào .gitignore)
spring.mail.username=nhat.longtran003@gmail.com
spring.mail.password=abcdefghijklmnop
```

**Chạy với local profile:**
```bash
mvn spring-boot:run -Dspring.profiles.active=local
```

#### Bước 3: Security Configuration

**WebSecurityConfig.java** - Cho phép public access:
```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
        .authorizeRequests()
            .antMatchers("/auth/**").permitAll()  // ✅ Quan trọng!
            .antMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        .and()
            .csrf().disable();
}
```

**Hoặc với Spring Security 6+:**
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**").permitAll()  // ✅ Public endpoints
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .csrf(csrf -> csrf.disable());
    return http.build();
}
```

### 🔍 Troubleshooting Gmail Errors

#### Error: `535-5.7.8 Username and Password not accepted`
**Nguyên nhân:** Đang dùng mật khẩu Gmail thường thay vì App Password

**Giải pháp:**
1. Tạo App Password (xem Bước 1 ở trên)
2. Thay `spring.mail.password` bằng App Password (16 ký tự, không có khoảng trắng)
3. Restart backend

#### Error: `403 Forbidden` khi POST /auth/forgot-password
**Nguyên nhân:** Endpoint `/auth/**` không được config public trong WebSecurityConfig

**Giải pháp:** Thêm `.antMatchers("/auth/**").permitAll()` trong security config

#### Error: Email không gửi nhưng không có lỗi
**Debug:**
1. Bật debug logging:
   ```properties
   spring.mail.properties.mail.debug=true
   logging.level.org.springframework.mail=DEBUG
   ```
2. Check console logs cho chi tiết SMTP connection
3. Verify Gmail account settings: https://myaccount.google.com/lesssecureapps (nên tắt, dùng App Password)

### 📝 Testing Checklist

```bash
# Test 1: Forgot Password
curl -X POST http://localhost:8080/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "student@test.com"}'

# Expected: 200 OK + "Reset email sent"
# Check logs: "Sent mail to student@test.com subject=Reset mật khẩu..."
```

**Nếu email không được gửi:**
- Copy token từ logs: `Password reset token created: token=abc-123-def for userId=1`
- Test trực tiếp endpoint reset:
  ```bash
  curl -X POST http://localhost:8080/auth/reset-password \
    -H "Content-Type: application/json" \
    -d '{"token": "abc-123-def", "newPassword": "NewPassword123!"}'
  ```

### 🛡️ Security Best Practices

**⚠️ KHÔNG BAO GIỜ:**
- ❌ Commit `spring.mail.password` vào Git
- ❌ Share App Password trong chat/email
- ❌ Dùng mật khẩu Gmail thường
- ❌ Hardcode credentials trong code

**✅ NÊN:**
- ✅ Dùng environment variables
- ✅ Thêm `application-local.properties` vào `.gitignore`
- ✅ Dùng App Password cho Gmail
- ✅ Revoke App Password khi không dùng
- ✅ Rotate App Password định kỳ

**`.gitignore`** - Thêm:
```gitignore
# Local config (chứa credentials)
application-local.properties
application-dev.properties
.env
*.env.local
```

---

## 🧪 Testing Steps

### Test 1: Forgot Password Flow
```bash
# 1. Request reset
POST http://localhost:8080/auth/forgot-password
Content-Type: application/json

{
  "email": "existing@example.com"
}

# Expected: 200 OK + email sent
# Check backend logs for token if mail not configured
```

### Test 2: Validate Token
```bash
# 2. Validate token
GET http://localhost:8080/auth/reset/validate?token=GENERATED_TOKEN

# Expected: 200 OK { "valid": true }
```

### Test 3: Reset Password
```bash
# 3. Reset password
POST http://localhost:8080/auth/reset-password
Content-Type: application/json

{
  "token": "GENERATED_TOKEN",
  "newPassword": "NewPassword123"
}

# Expected: 200 OK
```

### Test 4: Token Reuse (Should Fail)
```bash
# 4. Try to use same token again
POST http://localhost:8080/auth/reset-password
Content-Type: application/json

{
  "token": "USED_TOKEN",
  "newPassword": "AnotherPassword123"
}

# Expected: 400 Bad Request (token đã được sử dụng)
```

### Test 5: Expired Token
```bash
# 5. Wait for expiry time + 1 minute, then validate
GET http://localhost:8080/auth/reset/validate?token=EXPIRED_TOKEN

# Expected: 400 Bad Request (token đã hết hạn)
```

---

## ✅ Frontend Implementation Status

**Đã hoàn thành:**
- ✅ Forgot password modal trong login page
- ✅ Reset password page với token validation
- ✅ Validate token trước khi hiển thị form
- ✅ Loading states (validating, resetting)
- ✅ Error handling chi tiết (expired, invalid, used)
- ✅ Success message + redirect to login
- ✅ UX tốt với nz-result cho errors

**Frontend Endpoints được gọi:**
1. `POST /auth/forgot-password` - từ login modal
2. `GET /auth/reset/validate` - khi mở link reset
3. `POST /auth/reset-password` - khi submit form

---

## 🎯 Quick Implementation Checklist (Backend)

### PasswordResetController.java
```java
@RestController
@RequestMapping("/auth")
public class PasswordResetController {
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        // TODO: Implement
    }
    
    @GetMapping("/reset/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        // TODO: Implement
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        // TODO: Implement
    }
}
```

### PasswordResetService.java
```java
@Service
public class PasswordResetService {
    
    public void sendResetEmail(String email) {
        // Generate token
        // Save to DB
        // Send email
    }
    
    public boolean validateToken(String token) {
        // Check exists, not expired, not used
    }
    
    public void resetPassword(String token, String newPassword) {
        // Validate token
        // Hash password
        // Update user
        // Invalidate token
    }
}
```

---

## 📞 Support

Nếu cần hỗ trợ implement backend:
1. Tạo entity PasswordResetToken
2. Tạo repository
3. Implement service với email sender
4. Tạo controller với 3 endpoints
5. Test với Postman

Frontend đã sẵn sàng và đang chờ backend APIs! 🚀
