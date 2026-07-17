# Trang Tin Tức Bóng Đá 2026

Đồ án môn học - website tin tức bóng đá tổng hợp World Cup 2026, Champions League và 5 giải VĐQG hàng đầu châu Âu, cùng tin tức bóng đá Việt Nam.

Chạy hoàn toàn bằng HTML/CSS/JS thuần, dữ liệu là các file JSON tĩnh, không gọi API bên thứ ba nào (không cần key, không giới hạn quota).

## Nhóm thực hiện

- Hoài
- Hiếu
- Huy

## Cấu trúc thư mục

```
bongda-pro/
├── index.html                  Trang chủ
├── README.md
├── data/                       Dữ liệu tĩnh (JSON)
│   ├── news-home.json          Tin tức trang chủ (có phân trang)
│   ├── news-impressive.json    Tin tức trang "Thông tin ấn tượng"
│   ├── matches-latest.json     Kết quả trận đấu (bản gốc, giữ lại tham khảo)
│   ├── matches-recent.json     Kết quả trận đấu dùng để render (trang chủ + "Các trận đấu vừa qua")
│   ├── matches-upcoming.json   Lịch thi đấu sắp tới
│   ├── standings.json          Bảng xếp hạng theo từng giải đấu
│   ├── standings-national.json Bảng xếp hạng FIFA các đội tuyển quốc gia
│   ├── topscorers.json         Vua phá lưới theo từng giải đấu
│   ├── players-featured.json   Ngôi sao tiêu biểu
│   ├── leagues.json            Danh sách các giải đấu
│   └── videos.json             Video trình diễn ấn tượng
├── assets/
│   ├── css/
│   │   ├── unified-styles.css  CSS dùng chung (menu, footer, sidebar, bảng, phân trang...)
│   │   └── pages/
│   │       ├── home.css
│   │       ├── matches.css
│   │       ├── info.css
│   │       └── showcase.css
│   ├── js/
│   │   ├── data.js             Dữ liệu nhúng sẵn (window.LOCAL_DATA), phòng khi fetch() bị chặn
│   │   ├── main.js             Hàm dùng chung: loadData(), escapeHtml(), phân trang, logo đội bóng...
│   │   └── pages/
│   │       ├── home.js
│   │       ├── matches.js
│   │       ├── impressive.js
│   │       └── showcase.js
│   └── img/                    Hình ảnh (banner, cầu thủ...)
└── pages/
    ├── cactrandauvuaqua.html   Các trận đấu vừa qua
    ├── thongtinantuong.html    Thông tin ấn tượng
    ├── trinhdienantuong.html   Trình diễn ấn tượng
    ├── gioithieu.html          Giới thiệu
    └── lienhe.html             Liên hệ
```

## Cách chạy

Các trang dùng `fetch()` để tải dữ liệu từ thư mục `data/`, nên chạy qua 1 local server sẽ an toàn hơn (mở trực tiếp file cũng chạy được vì có bản dữ liệu nhúng sẵn trong `data.js` dự phòng, nhưng có server vẫn tốt hơn):

- **VS Code:** cài extension "Live Server" → chuột phải vào `index.html` → "Open with Live Server".
- **XAMPP:** copy cả thư mục vào `htdocs/`, bật Apache, truy cập `http://localhost/bongda-pro/`.
- **Python:** mở terminal tại thư mục gốc, chạy `python -m http.server 8000`, rồi vào `http://localhost:8000`.

## Tính năng chính

- Trang chủ đổi ngẫu nhiên 1 giải đấu "nổi bật" cho khối BXH/Vua phá lưới mỗi lần tải lại trang, có ô search theo tên giải đấu / đội bóng / cầu thủ.
- Trang "Các trận đấu vừa qua" gom kết quả trận đấu tất cả giải, có ô lọc và phân trang.
- Trang "Thông tin ấn tượng" cho chọn giải qua dropdown để xem thống kê (vua phá lưới, vua kiến tạo, hàng công/thủ tốt nhất).
- Trang "Trình diễn ấn tượng" là video bàn thắng đẹp/kỹ thuật/cứu thua, lọc theo thể loại.
- Modal xem nhanh chi tiết tin tức khi bấm vào 1 thẻ tin.

## Có thể làm thêm

- Trang chi tiết riêng cho từng bài viết thay vì chỉ mở modal.
- Nếu môn học yêu cầu backend, có thể thay data tĩnh bằng API PHP/Node tự viết.

---
Dữ liệu trong trang chỉ mang tính minh hoạ cho đồ án, không phải nguồn tin chính thức.
