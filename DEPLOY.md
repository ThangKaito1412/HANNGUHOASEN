# Hướng dẫn triển khai (Render + tên miền .id.vn)

## 1. Đưa code lên GitHub
```bash
git push origin main
```

## 2. Tạo dịch vụ trên Render
1. Vào https://render.com, đăng nhập bằng GitHub.
2. New → **Web Service** → chọn repo `HANNGUHOASEN`.
3. Language: **Docker** (Render tự dùng `Dockerfile`).
4. Instance type: **Free** (thử) hoặc **Starter** (chạy liên tục, ~7 USD/tháng).
5. Environment → thêm biến `GEMINI_API_KEY` = khóa của bạn (lấy tại https://aistudio.google.com/apikey).
   Không ghi khóa này vào code hoặc git.
6. Create Web Service. Sau vài phút có địa chỉ `https://<ten>.onrender.com`.

## 3. Mua tên miền .id.vn
Mua tại nhà đăng ký bất kỳ (PA Vietnam, Mắt Bão, Nhân Hòa, iNET…). Cần giấy tờ định danh cá nhân theo quy định.

## 4. Trỏ tên miền về Render
1. Render → service → Settings → **Custom Domains** → Add `tentrungtam.id.vn` (và `www.tentrungtam.id.vn`).
2. Render hiển thị bản ghi DNS cần thêm. Thường là:
   - `www`  CNAME → `<ten>.onrender.com`
   - tên miền gốc: `A` → IP do Render cung cấp (hoặc dùng ALIAS/ANAME nếu nhà đăng ký hỗ trợ).
3. Vào trang quản lý DNS của nhà đăng ký, thêm đúng các bản ghi đó.
4. Quay lại Render bấm **Verify**. HTTPS được cấp tự động (vài phút đến vài giờ).

## 5. Lưu ý vận hành
- Gói Free ngủ sau ~15 phút không có truy cập; lần mở đầu chậm.
- Server giới hạn 60 lượt gọi API/phút/IP để bảo vệ hạn mức Gemini.
- Trong Google AI Studio nên đặt hạn mức/cảnh báo chi phí cho khóa.
- Cập nhật trang: sửa code → `git push` → Render tự deploy lại.
