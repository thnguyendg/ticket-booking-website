let currentRating = 5; 

// Lấy ID phim từ URL (Giả sử URL của bạn là chitietphim.html?id=1)
const urlParams = new URLSearchParams(window.location.search);
const currentMovieId = urlParams.get('id'); 

document.addEventListener("DOMContentLoaded", () => {
    setupStarRating();
    loadComments(); // Gọi hàm load bình luận khi tải trang
});

// 2. Logic xử lý hiệu ứng bấm chọn Ngôi sao
function setupStarRating() {
    const stars = document.querySelectorAll('.star-input');
    const label = document.getElementById('rating-label');

    // Tô màu vàng mặc định cho 5 sao ban đầu
    highlightStars(5, stars);

    stars.forEach(star => {
        star.addEventListener('click', function() {
            currentRating = this.getAttribute('data-value');
            highlightStars(currentRating, stars);
            
            // Đổi chữ hiển thị
            const ratingTexts = ["(Tệ)", "(Không hay)", "(Bình thường)", "(Hay)", "(Tuyệt vời)"];
            label.innerText = ratingTexts[currentRating - 1];
        });
        // CSS con trỏ chuột cho đẹp
        star.style.cursor = 'pointer'; 
    });
}

function highlightStars(rating, stars) {
    stars.forEach(s => {
        if (s.getAttribute('data-value') <= rating) {
            s.style.color = '#ffc107'; // Màu vàng
        } else {
            s.style.color = '#444';    // Màu xám
        }
    });
}

// 3. Hàm Gửi bình luận lên Backend
async function submitComment() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        alert("Bạn cần đăng nhập để viết đánh giá!");
        return;
    }
    const user = JSON.parse(storedUser);
    
    const commentBox = document.getElementById("user-comment");
    const commentText = commentBox.value.trim();

    if (!currentMovieId) {
        alert("Không xác định được phim để bình luận!");
        return;
    }

    if (commentText === "") {
        alert("Vui lòng nhập nội dung nhận xét!");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user.id,
                movie_id: currentMovieId,
                rating: currentRating,
                comment: commentText
            })
        });

        const data = await response.json();
        if (data.success) {
            alert("Cảm ơn bạn đã đánh giá!");
            commentBox.value = ""; // Xóa trắng ô nhập
            currentRating = 5;     // Reset về 5 sao
            highlightStars(5, document.querySelectorAll('.star-input'));
            
            // Tải lại danh sách bình luận ngay lập tức
            loadComments(); 
        } else {
            alert(data.msg);
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi: Không thể gửi bình luận vào Database. Kiểm tra app.py!");
    }
}

// 4. Hàm Lấy dữ liệu bình luận đổ ra giao diện
async function loadComments() {
    const listContainer = document.getElementById("comments-list");
    if (!listContainer) return; 
    
    try {
        // Gọi API lấy danh sách bình luận của phim
        const response = await fetch(`http://127.0.0.1:5000/api/reviews/${currentMovieId}`);
        const result = await response.json();

        if (result.success) {
            if (result.data.length === 0) {
                listContainer.innerHTML = "<p style='color: #888; padding: 10px;'>Chưa có nhận xét nào. Hãy là người đầu tiên đánh giá!</p>";
                return;
            }

            let html = "";
            result.data.forEach(item => {
                // 1. Xử lý ngôi sao đánh giá
                let starsHtml = "";
                for(let i = 1; i <= 5; i++) {
                    if(i <= item.SoSao) starsHtml += '<i class="fa-solid fa-star" style="color:#ffc107; font-size: 0.8rem;"></i>';
                    else starsHtml += '<i class="fa-solid fa-star" style="color:#444; font-size: 0.8rem;"></i>';
                }

                const dateShort = item.NgayDanhGia ? item.NgayDanhGia.split(" ")[0] : ""; 

                // 2. BỔ SUNG: Xử lý đường dẫn Avatar của người bình luận
                // Nếu tài khoản chưa có avatar hoặc rỗng, ta dùng ảnh mặc định khachhang.png (hoặc default-avatar.png)
                const avatarFile = (item.Avatar && item.Avatar !== "default-avatar.png") ? item.Avatar : "default-avatar.png";
                const avatarSrc = `./IMAGE/avatars/${avatarFile}`;

                // 3. Thay đổi cấu trúc HTML: Sử dụng Flexbox để đưa Avatar sang bên trái
                html += `
                    <div class="comment-item" style="display: flex; gap: 15px; border-bottom: 1px solid #222; padding-bottom: 15px; margin-bottom: 5px; align-items: flex-start;">
                        
                        <div class="comment-avatar" style="width: 45px; height: 45px; flex-shrink: 0;">
                            <img src="${avatarSrc}" 
                                 style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid #333;"
                                 onerror="this.src='./IMAGE/avatars/default-avatar.png'">
                        </div>

                        <div style="flex-grow: 1;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                                <strong style="color: #fff; font-size: 0.95rem;">${item.Hovaten}</strong>
                                <span style="color: #666; font-size: 0.8rem;">${dateShort}</span>
                            </div>
                            <div class="star-display" style="margin-bottom: 8px;">${starsHtml}</div>
                            <p style="color: #ccc; margin: 0; font-size: 0.9rem; line-height: 1.4;">${item.BinhLuan}</p>
                        </div>

                    </div>
                `;
            });
            listContainer.innerHTML = html;
        }
    } catch (error) {
        console.error("Lỗi tải bình luận:", error);
        listContainer.innerHTML = "<p style='color: red;'>Không thể tải bình luận.</p>";
    }
}