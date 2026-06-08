function renderLayout() {
    const headerHTML = `
        <header class="header">
            <div class="logo"><img src="./IMAGE/logo.png" style="max-width: 50px;"></div>
            <nav class="nav">
                <ul class="nav-list">
                    <li class="has-dropdown">
                        <a href="#">Phim <span class="arrow">&#9662;</span></a>
                        <ul class="dropdown" id="movie-dropdown-list">
                            <li><a href="#">Đang tải...</a></li>
                        </ul>
                    </li>

                    <li class="has-dropdown">
                        <a href="#">Star Shop <span class="arrow">&#9662;</span></a>
                        <ul class="dropdown" id="food-dropdown-list">
                            <li><a href="#">Combo Solo</a></li>
                            <li><a href="#">Combo Couple</a></li>
                            <li><a href="#">Combo Gia Đình</a></li>
                            <li><a href="#">Nước uống</a></li>
                        </ul>
                    </li>

                    <li class="has-dropdown">
                        <a href="#">
                            Góc Điện Ảnh 
                            <span class="arrow">&#9662;</span>
                        </a>

                        <ul class="dropdown">
                            <li><a href="#">Tin tức</a></li>
                            <li><a href="#">Review</a></li>
                        </ul>
                    </li>

                    <li><a href="../vechungtoi.html">Sự Kiện</a></li>
                    <li><a href="../quychehoatdong.html">Rạp/Giá Vé</a></li>
                </ul>
            </nav>
            <div class="nav-right" id="auth-container">
                <li class="has-dropdown" style="list-style: none;">
                    <a href="#" class="user-menu-wrapper">
                        <i class="fa-duotone fa-regular fa-user"></i>
                        <span id="user-display-name">Tài khoản</span>
                    </a>
                    <ul class="dropdown">
                        <li><a href="./dangnhap.html">Đăng nhập</a></li>
                        <li><a href="./dangky.html">Đăng ký</a></li>
                    </ul>
                </li>
            </div>
        </header>
    `;

    const footerHTML = `
        <footer class="footer">
            <div class="footer-container">
                <div class="footer-grid">
                    <!-- Brand Column -->
                    <div class="footer-column brand-info">
                        <h2 class="footer-logo">RẠP PHIM RỖ</h2>
                        <p class="brand-description">
                            Trải nghiệm điện ảnh đỉnh cao với chất lượng hình ảnh và âm thanh sống động nhất. 
                            Kết nối đam mê, chia sẻ cảm xúc.
                        </p>
                    </div>

                    <!-- Navigation Column -->
                    <div class="footer-column">
                        <h3>GIỚI THIỆU</h3>
                        <ul>
                            <li><a href="../vechungtoi.html">Về chúng tôi</a></li>
                            <li><a href="../quychehoatdong.html">Quy chế hoạt động</a></li>
                            <li><a href="../gopy.html">Góp ý</a></li>
                        </ul>
                    </div>

                    <!-- Policy Column -->
                    <div class="footer-column">
                        <h3>ĐIỀU KHOẢN</h3>
                        <ul>
                            <li><a href="./chinhsachbaomat.html">Chính sách Bảo Mật</a></li>
                            <li><a href="../chinhsachthanhtoan.html">Chính sách Thanh toán</a></li>
                            <li><a href="../thoathuansudung.html">Thoả Thuận Sử Dụng</a></li>
                            <li><a href="../chinhsachhoanve.html">Chính sách hoàn vé</a></li>
                        </ul>
                    </div>

                <div class="footer-column social-column">
                        <h3>KẾT NỐI VỚI CHÚNG TÔI</h3>
                        <ul class="social-links-list">
                            <li>
                                <a href="https://www.facebook.com/anhh.lee.569424" class="social-link facebook" aria-label="Facebook">
                                    <i class="fab fa-facebook-f"></i>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.facebook.com/messages/e2ee/t/27125538810378280/" class="social-link messenger" aria-label="Messenger">
                                    <i class="fab fa-facebook-messenger"></i>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.youtube.com/@nhom3" class="social-link youtube" aria-label="YouTube">
                                    <i class="fab fa-youtube"></i>
                                </a>
                            </li>
                            <li>
                                <a href="https://zalo.me/0365970914" class="social-link zalo" aria-label="Zalo">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/3840px-Icon_of_Zalo.svg.png" alt="Zalo" class="zalo-icon">
                                </a>
                            </li>
                        </ul>
                    </div>

                    <!-- Contact Column -->
                    <div class="footer-column">
                        <h3>CHĂM SÓC KHÁCH HÀNG</h3>
                        <div class="contact-info">
                            <p>Hotline: <span>1900 3636</span></p>
                            <p>Giờ làm việc: 8:00 - 22:00</p>
                            <p>Email: <a href="mailto:Nhom3@gmail.com">Nhom3@gmail.com</a></p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Bottom Bar -->
            <div class="footer-bottom">
                <div class="footer-container">
                    <p>©Nhom3@2026</p>
                </div>
            </div>
        </footer>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}
renderLayout();

// LOGIC XỬ LÝ ĐĂNG NHẬP DÀNH CHO CÁC TRANG CON
document.addEventListener("DOMContentLoaded", () => {
const storedUser = localStorage.getItem("currentUser");
    
    // Tìm vùng chứa khối tài khoản góc phải (nơi chứa chữ Tài khoản)
    const navRight = document.querySelector(".nav-right"); 

    if (storedUser && navRight) {
        const user = JSON.parse(storedUser);
        const formattedBalance = Number(user.balance).toLocaleString('vi-VN');
        fetch(`http://127.0.0.1:5000/api/khachhang/${user.id}`)
            .then(res => res.json())
            .then(data => {
                const currentBalance = data.SoDu !== undefined ? data.SoDu : 0;
                const formattedBalance = Number(currentBalance).toLocaleString('vi-VN');
                
                // Đổ số dư thực tế từ DB này vào phần Dropdown Header
                const balanceWrapper = document.getElementById("header-balance-id"); // Thêm ID vào thẻ hiển thị số dư trên header của bạn
                if (balanceWrapper) {
                    balanceWrapper.innerText = `Số dư: ${formattedBalance}đ`;
                }
            });


        // 2. Tiến hành thay đổi giao diện nút "Tài khoản" thành Dropdown đã đăng nhập
        navRight.innerHTML = `
            <li class="has-dropdown" style="list-style: none;">
                <a href="#" class="user-menu-wrapper">
                    <i class="fa-duotone fa-regular fa-user"></i>
                    <span>${user.email}</span>
                </a>
                
                <ul class="dropdown">
                    <li>
                        <a href="#" id="header-balance" style="color: #ffc107; font-weight: bold; pointer-events: none;">
                            Số dư: ${formattedBalance}đ
                        </a>
                    </li>
                    <li><a href="./profile.html">Thông tin cá nhân</a></li>
                    <li><a href="#" id="logoutBtn" style="color: #ff4d4d;">Đăng xuất</a></li>
                </ul>
            </li>
        `;

        // 3. Xử lý sự kiện Đăng xuất ngay trên các trang con
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function(e) {
                e.preventDefault();
                localStorage.clear(); // Xóa sạch bộ nhớ đăng nhập
                window.location.href = "trangchu.html"; // Đá người dùng về trang chủ
            });
        }
    }
    window.syncHeaderBalance();
});

window.syncHeaderBalance = async function() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    const balanceEl = document.getElementById("header-balance");

    if (user.id) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/khachhang/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                const currentBalance = data.SoDu !== undefined ? data.SoDu : 0;
                const formatted = Number(currentBalance).toLocaleString('vi-VN');
                
                // Cập nhật UI Header
                if (balanceEl) balanceEl.innerText = `Số dư: ${formatted}đ`;
                
                // Đồng bộ LocalStorage
                user.balance = currentBalance;
                localStorage.setItem("currentUser", JSON.stringify(user));
                localStorage.setItem("userBalance", currentBalance);
            }
        } catch (error) {
            console.error("Lỗi đồng bộ số dư:", error);
        }
    }
};