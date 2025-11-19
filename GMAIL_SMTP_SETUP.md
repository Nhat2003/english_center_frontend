# 📧 Hướng Dẫn Sửa Lỗi Gửi Email (Gmail SMTP)

## 🎯 Tổng Quan

Gmail không cho phép đăng nhập SMTP bằng mật khẩu thường từ 2022. **Phải dùng App Password!**

---

## ✅ ĐÃ SỬA

### 1. Cho phép public access endpoint `/auth/**` trong WebSecurityConfig

**Trước:** 
- ❌ `403 Forbidden` khi POST `/auth/forgot-password`

**Sau:**
- ✅ Endpoint được phép truy cập public

**Code:**
```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
        .authorizeRequests()
            .antMatchers("/auth/**").permitAll()  // ✅ Thêm dòng này
            .anyRequest().authenticated()
        .and()
            .csrf().disable();
}
```

### 2. Thêm debug logging cho mail

**application.properties:**
```properties
spring.mail.properties.mail.debug=true
logging.level.org.springframework.mail=DEBUG
```

---

## ❌ VẤN ĐỀ HIỆN TẠI: Gmail Yêu Cầu App Password

### Lỗi bạn đang gặp phải:

```
javax.mail.AuthenticationFailedException: 535-5.7.8 Username and Password not accepted
```

### Nguyên nhân:

Bạn đang dùng mật khẩu Gmail thường (`Taoloptruong@1`), nhưng Gmail **không cho phép** SMTP login bằng mật khẩu thường nếu:

1. ✅ Tài khoản bật 2-Factor Authentication (2FA)
2. ✅ Gmail Security Defaults (mặc định từ 2022)

---

## 🔧 CÁCH SỬA (3 Bước)

### Bước 1: Tạo Gmail App Password

1. **Đăng nhập Gmail:** https://myaccount.google.com/

2. **Bật 2-Step Verification:**
   - Vào **Security** → **2-Step Verification**
   - Click **Get Started** và làm theo hướng dẫn
   - Verify bằng phone number

3. **Tạo App Password:**
   - Quay lại **Security** → **App passwords** (xuất hiện sau khi bật 2FA)
   - Nếu không thấy, vào trực tiếp: https://myaccount.google.com/apppasswords
   
4. **Generate Password:**
   - **Select app:** Mail
   - **Select device:** Other (nhập "English Center Backend")
   - Click **Generate**
   
5. **Copy App Password:**
   - Copy mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
   - **⚠️ Lưu ý:** Không có khoảng trắng khi paste vào config

---

### Bước 2: Cập nhật `application.properties`

**TRƯỚC (❌ Sai):**
```properties
spring.mail.username=nhat.longtran003@gmail.com
spring.mail.password=Taoloptruong@1   # ❌ Mật khẩu Gmail thường
```

**SAU (✅ Đúng):**
```properties
spring.mail.username=nhat.longtran003@gmail.com
spring.mail.password=abcdefghijklmnop   # ✅ App Password (16 ký tự, không có dấu cách)
```

**⚠️ BẢO MẬT:** File này **KHÔNG ĐƯỢC** commit lên Git!

---

### Bước 3: Restart Backend và Test

#### 3.1. Stop backend hiện tại:
```bash
# Nếu đang chạy, nhấn Ctrl+C để stop
```

#### 3.2. Start lại backend:
```bash
mvn spring-boot:run
```

#### 3.3. Test bằng Postman:

**Request:**
```http
POST http://localhost:8080/auth/forgot-password
Content-Type: application/json

{
  "email": "student@test.com"
}
```

**Expected Response (✅ Success):**
```json
{
  "message": "Reset email sent"
}
```

#### 3.4. Kiểm tra:

**✅ Response:** 
- Status: `200 OK`
- Body: `{"message":"Reset email sent"}`

**✅ Log backend (console):**
```
Password reset token created: token=abc-123-def-456 for userId=1
Sent mail to student@test.com subject=Reset mật khẩu - English Center
```

**✅ Email inbox:**
- Check email `student@test.com`
- Nhận được email với subject "Reset mật khẩu - English Center"
- Click link trong email: `http://localhost:4200/reset-password?token=abc-123-def-456`

---

## 🔍 NẾU VẪN LỖI - Kiểm Tra Logs

### Lỗi 1: Authentication Failed

**Log:**
```
Failed to send email to student@test.com subject=Reset mật khẩu...
javax.mail.AuthenticationFailedException: 535-5.7.8 Username and Password not accepted
```

**Giải pháp:**
- ❌ Mật khẩu sai hoặc chưa dùng App Password
- ✅ Quay lại **Bước 1** tạo App Password
- ✅ Đảm bảo copy đúng 16 ký tự, **không có khoảng trắng**
- ✅ Restart backend sau khi đổi password

### Lỗi 2: Email Không Gửi Nhưng Token Đã Tạo

**Log:**
```
Password reset token created: token=abc-123-def for userId=1
```

**Workaround:** Copy token từ log và test trực tiếp:

```http
POST http://localhost:8080/auth/reset-password
Content-Type: application/json

{
  "token": "abc-123-def",
  "newPassword": "NewPassword123!"
}
```

**Expected:** `200 OK` → Mật khẩu đã được đổi

---

## 🛡️ BẢO MẬT - QUAN TRỌNG!

### ⚠️ Vấn Đề Hiện Tại:

File `application.properties` đang chứa App Password:
```properties
spring.mail.password=abcdefghijklmnop   # ⚠️ NGUY HIỂM NẾU COMMIT LÊN GIT!
```

### ✅ Giải Pháp Bảo Mật:

#### **Option 1: Environment Variables (Khuyến nghị cho Production)**

**1. Sửa `application.properties`:**
```properties
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

**2. Set environment variables khi chạy:**

**PowerShell (Windows):**
```powershell
$Env:MAIL_USERNAME="nhat.longtran003@gmail.com"
$Env:MAIL_PASSWORD="abcdefghijklmnop"
mvn spring-boot:run
```

**CMD (Windows):**
```cmd
set MAIL_USERNAME=nhat.longtran003@gmail.com
set MAIL_PASSWORD=abcdefghijklmnop
mvn spring-boot:run
```

**Bash (Linux/Mac):**
```bash
export MAIL_USERNAME="nhat.longtran003@gmail.com"
export MAIL_PASSWORD="abcdefghijklmnop"
mvn spring-boot:run
```

---

#### **Option 2: Local Profile (Khuyến nghị cho Development)**

**1. Tạo file `application-local.properties`:**
```properties
# application-local.properties
spring.mail.username=nhat.longtran003@gmail.com
spring.mail.password=abcdefghijklmnop
```

**2. Thêm vào `.gitignore`:**
```gitignore
# Credentials - KHÔNG commit
application-local.properties
application-dev.properties
*.env
*.env.local
```

**3. Chạy với profile `local`:**
```bash
mvn spring-boot:run -Dspring.profiles.active=local
```

---

#### **Option 3: IDE Environment Variables (IntelliJ/Eclipse)**

**IntelliJ IDEA:**
1. Run → Edit Configurations
2. Chọn Spring Boot application
3. Environment variables:
   ```
   MAIL_USERNAME=nhat.longtran003@gmail.com;MAIL_PASSWORD=abcdefghijklmnop
   ```

**Eclipse:**
1. Run → Run Configurations
2. Environment tab → New
3. Thêm từng biến:
   - `MAIL_USERNAME`: `nhat.longtran003@gmail.com`
   - `MAIL_PASSWORD`: `abcdefghijklmnop`

---

## 📋 Testing Checklist

### Pre-Test:
- [ ] Đã tạo Gmail App Password
- [ ] Đã cập nhật `spring.mail.password` trong config
- [ ] Đã thêm `.antMatchers("/auth/**").permitAll()` trong WebSecurityConfig
- [ ] Đã restart backend

### Test Flow:
- [ ] **Test 1:** POST `/auth/forgot-password` → `200 OK` (không còn `403`)
- [ ] **Test 2:** Check log: `"Sent mail to ..."`
- [ ] **Test 3:** Check email inbox: nhận được email
- [ ] **Test 4:** Click link trong email → mở `http://localhost:4200/reset-password?token=...`
- [ ] **Test 5:** Frontend hiển thị loading → validate token → hiển thị form
- [ ] **Test 6:** Nhập mật khẩu mới → submit → `200 OK`
- [ ] **Test 7:** Quay lại login → đăng nhập với mật khẩu mới → thành công

---

## 🆘 Quick Debug Commands

### Check logs:
```bash
# Xem logs realtime
tail -f logs/spring-boot-application.log

# Search for mail errors
grep -i "mail" logs/spring-boot-application.log
grep -i "authentication" logs/spring-boot-application.log
```

### Test SMTP connection:
```bash
# Telnet test
telnet smtp.gmail.com 587

# OpenSSL test
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

### Verify config:
```bash
# In ra config hiện tại (backend endpoint)
GET http://localhost:8080/actuator/configprops
# Hoặc check trong logs khi start:
grep "spring.mail" logs/spring-boot-application.log
```

---

## 📞 Support

### Tài liệu liên quan:
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Spring Boot Mail: https://docs.spring.io/spring-boot/docs/current/reference/html/messaging.html#messaging.email
- JavaMail API: https://javaee.github.io/javamail/

### Common Issues:
1. **535-5.7.8 Username and Password not accepted** → Dùng App Password
2. **403 Forbidden** → Check WebSecurityConfig: `.antMatchers("/auth/**").permitAll()`
3. **Connection timeout** → Check firewall/proxy port 587
4. **Email vào Spam** → Add SPF/DKIM records (cho production)

---

## ✅ Kết Luận

**Sau khi làm đúng 3 bước:**
1. ✅ Tạo Gmail App Password
2. ✅ Cập nhật `spring.mail.password`
3. ✅ Restart backend

**Kết quả:**
- ✅ POST `/auth/forgot-password` → `200 OK`
- ✅ Email được gửi thành công
- ✅ User nhận được link reset
- ✅ Full flow hoạt động: Forgot → Email → Reset → Login

**🎉 Frontend đã sẵn sàng và hoạt động hoàn hảo!**
