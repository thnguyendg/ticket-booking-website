document.addEventListener("DOMContentLoaded", () => {
    // 1. Gọi hàm tải thông tin cá nhân và lịch sử khi trang load xong
    loadTransactionHistory();
});

async function loadTransactionHistory() {
    // 2. Lấy gói dữ liệu user đã đăng nhập từ LocalStorage
    const storedUser = localStorage.getItem("currentUser");
    const tableBody = document.getElementById("history-table-body");

    if (!storedUser) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Vui lòng đăng nhập để xem lịch sử!</td></tr>`;
        }
        return;
    }

    const user = JSON.parse(storedUser);
    const userId = user.id; // Lấy MAKH

    try {
        // 3. Gọi API lấy danh sách giao dịch từ Backend
        const response = await fetch(`http://127.0.0.1:5000/api/giao-dich/${userId}`);
        if (!response.ok) throw new Error("Không thể kết nối đến máy chủ");

        const result = await response.json();

        if (result.success && tableBody) {
            const listTransactions = result.data;

            // Kiểm tra nếu người dùng chưa mua vé nào bao giờ
            if (listTransactions.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #aaa;">Bạn chưa có giao dịch nào gần đây.</td></tr>`;
                return;
            }

            // 4. Có dữ liệu -> Duyệt mảng và tạo các dòng <tr>
            let htmlContent = "";
            listTransactions.forEach(item => {
                // Định dạng hiển thị ngày tháng năm giờ phút (Ví dụ: 22/05/2026 15:30)
                const date = new Date(item.NgayGiaoDich);
                const formattedDate = date.toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                // Định dạng tiền tệ VND (Ví dụ: 100.000 đ)
                const formattedPrice = Number(item.TongTien).toLocaleString('vi-VN') + "đ";

                // Đổ dữ liệu khớp vào cấu trúc table của bạn
                htmlContent += `
                    <tr>
                        <td><strong>#GD${item.MAGD}</strong></td>
                        <td>
                            <div style="font-weight: bold; color: #fff;">${item.TenPhim}</div>
                            <small style="color: #aaa;">Số lượng: ${item.SoLuongVe} vé</small>
                        </td>
                        <td>${formattedDate}</td>
                        <td style="color: #ffc107; font-weight: bold;">-${formattedPrice}</td>
                        <td>
                            <span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
                                ${item.TrangThai || 'Thành công'}
                            </span>
                        </td>
                    </tr>
                `;
            });

            // 5. Chèn toàn bộ các dòng tr vừa tạo vào trong thẻ tbody
            tableBody.innerHTML = htmlContent;
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch sử giao dịch:", error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Lỗi tải dữ liệu lịch sử!</td></tr>`;
        }
    }
}