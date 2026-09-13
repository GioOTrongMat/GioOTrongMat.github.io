# Quản trị portfolio Gió Ở Trong Mắt

Đã thêm Decap CMS và backend xác thực Cloudflare Worker vào dự án. Admin online dùng username `admin`; mật khẩu chỉ tồn tại dưới dạng bản ghi dẫn xuất trong Cloudflare Secrets, không nằm trong mã nguồn hay trình duyệt.

## Sử dụng trên máy

Cài Node.js có npm. Mở hai terminal trong folder dự án.

Terminal 1 (lần đầu chạy npm ci để cài đúng phiên bản trong lockfile):

```powershell
npm ci
npm run dev
```

Terminal 2:

```powershell
npm run cms
```

Mở http://localhost:4173/admin/ và bấm Đăng nhập. Đây là chế độ local, ghi trực tiếp file vào folder dự án; không cần tài khoản GitHub. Hai server chỉ lắng nghe trên máy này. Đóng bằng Ctrl+C khi không dùng.

Chọn Website → Nội dung & bố cục. Sửa nội dung rồi chọn Công bố → Công bố ngay. Trang chính http://localhost:4173/ hiển thị thay đổi sau khi tải lại. Link “Xem bản hoàn chỉnh” trong CMS hiện trỏ đến website online, vì vậy khi thử local hãy mở địa chỉ localhost ở trên.

## Những gì chỉnh sửa được

- Tiêu đề tab, logo, tiêu đề và video YouTube mở đầu.
- Ảnh chân dung, giới thiệu, trích dẫn và chuyên môn. Text hỗ trợ xuống dòng, không chèn HTML.
- Thêm/xóa/sắp xếp tác phẩm, thay ảnh, file video MP4 hoặc URL và link dự án.
- Thêm/xóa/sắp xếp dự án nhúng YouTube hoặc Google Drive; tỷ lệ ngang/dọc.
- Số liệu, nội dung liên hệ và email. Formspree giữ nguyên cấu hình hiện tại.
- Kéo sắp xếp các phần, bật/tắt hiển thị; 1–3 cột tác phẩm trên desktop; đổi bên ảnh giới thiệu; màu nhấn và màu nền. Mobile tự chuyển về một cột.
- Upload ảnh trong trường ảnh hoặc mục Tập tin. File mới lưu vào uploads/. Chọn ảnh xong cần Công bố nội dung để lưu cả file đang ở trạng thái bản nháp.

Layout theo khối có sẵn, không phải trình kéo thả tự do. Video dài nên dùng link YouTube/Drive; các video MP4 cũ vẫn được giữ.

## Đăng nhập online

Mở `https://giootrongmat.github.io/admin/`. Trang này chuyển sang Worker tại `https://gio-portfolio-admin.thangnv-bmt594.workers.dev`, sau đó đăng nhập bằng username `admin` và mật khẩu đã đặt.

Worker giữ phiên đăng nhập trong cookie `HttpOnly`, hết hạn sau một giờ; giới hạn số lần thử mật khẩu; kiểm tra CSRF và nguồn gửi; chỉ cho sửa `content/site.json` cùng file trong `uploads/`. Nội dung được Worker commit trực tiếp vào nhánh `main` bằng GitHub fine-grained token chỉ có quyền Contents trên repository này.

Để đổi mật khẩu hoặc GitHub token, chạy `node scripts/setup-auth.mjs`, rồi tải lại secrets và deploy:

```powershell
npx wrangler secret bulk .secrets/cloudflare.json
npm run admin:deploy
```

Không commit `.secrets/`, `.dev.vars` hoặc thư mục `.wrangler/`.

## File và kiểm tra

- content/site.json: dữ liệu được CMS quản lý.
- admin/index.html và admin/config.yml: giao diện và các trường quản trị.
- assets/content.js: nạp dữ liệu trước khi khởi tạo hiệu ứng, tạo danh sách tác phẩm/dự án và áp dụng layout.
- assets/content.css: bố cục theo cấu hình và responsive.
- index.html: giữ nội dung gốc làm dự phòng khi không tải được JSON; đã sửa tên file ảnh/video sai chữ hoa/thường.
- scripts/: server local và kiểm tra cấu hình; package-lock.json khóa phiên bản phụ thuộc.

Chạy npm run check để kiểm tra dữ liệu tương thích CMS, tên file media (có phân biệt chữ hoa/thường), thứ tự section hợp lệ và cú pháp JavaScript.

Đã thử qua trình duyệt: đăng nhập local; sửa và lưu text; upload, chọn và lưu ảnh; trang chính đọc ảnh đã upload; slider chuyển slide; danh sách dự án trống; ảnh không video; ẩn section và đảo thứ tự; chặn URL javascript và hiển thị text thay vì thực thi HTML; layout 390px không tràn ngang. Đã khôi phục dữ liệu và chuyển file thử nghiệm ra khỏi repository sau kiểm tra.

Việc phát video từ YouTube/Google Drive phụ thuộc quyền chia sẻ và truy cập dịch vụ ngoài; chưa xác nhận phát video từ xa trong môi trường kiểm tra này. Không gửi thử form liên hệ để tránh tạo tin nhắn ngoài ý muốn.
