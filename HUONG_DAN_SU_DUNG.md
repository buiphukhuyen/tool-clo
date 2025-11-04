# Hướng dẫn sử dụng Tool Chấm Điểm CLO

## Giới thiệu

Tool Chấm Điểm CLO là ứng dụng web giúp giảng viên tạo và quản lý bảng điểm chấm đồ án theo tiêu chí CLO (Course Learning Outcomes).

## Các tính năng chính

### 1. Quản lý Nhóm Tiêu chí
- Tạo, chỉnh sửa, xóa nhóm tiêu chí
- Mỗi nhóm có tên và mô tả riêng
- Tự động validate tổng tỷ lệ % = 100%

### 2. Quản lý Tiêu chí
- Thêm các tiêu chí CLO cho từng nhóm
- Mỗi tiêu chí có: mã (VD: CLO1), tên, tỷ lệ %
- Hỗ trợ dấu phẩy và dấu chấm cho số thập phân
- Tự động tính tổng % theo nhóm

### 3. Quản lý Mẫu chấm
- Tạo mẫu chấm với thông tin: tên trường, khoa, học phần
- Chọn nhóm tiêu chí cho mỗi mẫu
- Xem trước cấu trúc bảng điểm

### 4. Tạo Bảng điểm
- Chọn mẫu chấm đã tạo
- Nhập thông tin: tên học phần, lớp, nhóm
- Import danh sách sinh viên (từ Excel hoặc paste)
- Chọn thuật toán phân bổ điểm:
  - **Phân bổ đều**: Chia đều điểm tổng ra các CLO
  - **Ngẫu nhiên**: Random điểm các CLO (có tối ưu hóa)
  - **Theo trọng số**: Phân bổ theo tỷ lệ % của từng CLO
- Xem trước realtime khi nhập thông tin
- Hỗ trợ sinh viên vắng (điểm = "V")

### 5. Xuất kết quả
- Xuất file Excel với format chuẩn:
  - Header merge cells (tên trường, khoa, học phần)
  - Bảng điểm có border, alignment, auto-width
  - Header 2 tầng (tiêu đề CLO và tên cột)
- Xuất CSV để import vào Google Sheets
- Thống kê tự động: tổng SV, SV vắng, điểm TB, khớp chính xác

### 6. Lưu và xem lại Lịch sử
- Lưu kết quả vào lịch sử
- Xem lại kết quả đã lưu
- Tạo lại bảng điểm từ lịch sử
- Xóa lịch sử không cần thiết

## Quy trình sử dụng

### Bước 1: Tạo Nhóm Tiêu chí
1. Vào **Quản lý Tiêu chí > Nhóm tiêu chí**
2. Click **Thêm nhóm tiêu chí**
3. Nhập tên và mô tả (VD: "Đồ án cuối kỳ")
4. Lưu

### Bước 2: Thêm Tiêu chí
1. Vào **Quản lý Tiêu chí > Chi tiết tiêu chí**
2. Click **Thêm tiêu chí**
3. Chọn nhóm vừa tạo
4. Nhập:
   - Mã CLO (VD: CLO1)
   - Tên tiêu chí (VD: "Phân tích yêu cầu")
   - Tỷ lệ % (VD: 25)
5. Thêm đủ tiêu chí sao cho tổng % = 100%

### Bước 3: Tạo Mẫu chấm
1. Vào **Quản lý Mẫu chấm**
2. Click **Tạo mẫu mới**
3. Nhập:
   - Tên mẫu (VD: "Bảng điểm Đồ án Công nghệ phần mềm")
   - Tên trường
   - Tên khoa
   - Tên học phần
4. Chọn nhóm tiêu chí
5. Xem trước và lưu

### Bước 4: Tạo Bảng điểm
1. Vào **Tạo bảng điểm**
2. Chọn mẫu chấm
3. Nhập:
   - Tên học phần (VD: "Công nghệ phần mềm")
   - Lớp (VD: "CNPM01")
   - Nhóm (VD: "Nhóm 1")
4. Import sinh viên:
   - Click **Paste dữ liệu**
   - Dán danh sách từ Excel (MSSV, Họ tên, Điểm)
   - Format: mỗi dòng 1 SV, các cột cách nhau bởi Tab
   - Sinh viên vắng ghi điểm = "V"
5. Chọn thuật toán phân bổ
6. Click **Tạo bảng điểm**
7. Xem kết quả trong modal fullscreen

### Bước 5: Xuất và Lưu
1. Trong modal kết quả:
   - Click **Xuất Excel**: Tải file .xlsx
   - Click **Google Sheet (CSV)**: Tải file .csv
   - Click **Lưu lịch sử**: Lưu để xem lại sau
2. File Excel sẽ có format đẹp, chuẩn để in hoặc nộp

### Bước 6: Xem lại Lịch sử
1. Vào **Lịch sử**
2. Danh sách hiển thị các lần tạo điểm trước
3. Mỗi item có 3 nút:
   - **Xem**: Mở lại modal kết quả
   - **Tạo lại**: Generate lại bảng điểm mới (random khác)
   - **Xóa**: Xóa khỏi lịch sử

## Lưu ý

### Format Import Sinh viên
- Copy trực tiếp từ Excel
- Định dạng: `MSSV<TAB>Họ tên<TAB>Điểm`
- Có thể có nhiều tab giữa các cột
- Điểm cuối cùng là điểm tổng mong muốn
- Sinh viên vắng: ghi "V" hoặc "v"

### Tính toán Điểm
- Thuật toán tự động phân bổ điểm CLO sao cho:
  - Tổng điểm CLO = điểm tổng ban đầu
  - Mỗi điểm CLO trong khoảng [0, 10]
  - Tối ưu hóa để khớp chính xác nhất

### Xuất Excel
- File Excel có format chuẩn công văn
- Header merge cells đẹp mắt
- Border và alignment tự động
- Độ rộng cột tự động fit nội dung
- Có thể in trực tiếp hoặc nộp lên hệ thống

### Lưu trữ
- Dữ liệu lưu trong LocalStorage của trình duyệt
- **Quan trọng**: Không xóa cache trình duyệt nếu chưa backup
- Nên xuất Excel thường xuyên để backup
- Có thể xóa lịch sử cũ để giải phóng bộ nhớ

## Khắc phục sự cố

### Không thấy danh sách sinh viên sau khi paste
- Kiểm tra format: phải có Tab hoặc dấu phẩy giữa các cột
- Copy lại từ Excel và paste
- Kiểm tra có ít nhất 3 cột: MSSV, Tên, Điểm

### Tổng % tiêu chí không bằng 100%
- Kiểm tra lại tổng % trong phần **Chi tiết tiêu chí**
- Chỉnh sửa hoặc thêm/bớt tiêu chí cho đủ 100%
- Tool sẽ cảnh báo nếu != 100%

### File Excel không mở được
- Đảm bảo đã cài Microsoft Excel hoặc LibreOffice
- Thử tải lại file
- Nếu vẫn lỗi, xuất CSV và import vào Google Sheets

### Mất dữ liệu
- Dữ liệu lưu trong LocalStorage, sẽ mất nếu:
  - Xóa cache trình duyệt
  - Dùng chế độ Incognito
  - Chuyển trình duyệt khác
- **Giải pháp**: Luôn xuất Excel để backup

## Hỗ trợ

Mọi thắc mắc và góp ý, vui lòng liên hệ bộ phận IT hoặc quản trị viên hệ thống.

---

**Phiên bản**: 2.0  
**Cập nhật**: 2024
