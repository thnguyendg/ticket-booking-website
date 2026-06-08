// Hàm render sao tách biệt, truyền MaPhim vào để gọi API
async function loadMovieRatingSummary(movieId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/movies/${movieId}/rating`);
        const result = await response.json();
        
        if (result.success) {
            const ratingContainer = document.getElementById("movie-rating-summary");
            if (!ratingContainer) return;

            const diem = result.DiemTrungBinh;
            const luotDanhGia = result.TongSoDanhGia;

            if (luotDanhGia === 0) {
                ratingContainer.innerHTML = `
                    <i class="fa-regular fa-star" style="color: #ffc107;"></i>
                    <span style="color: #888; font-size: 0.95rem; margin-left: 3px;">Chưa có đánh giá</span>
                `;
                return;
            }

            let starsHtml = "";
            const diemLamTron = Math.round(diem);
            const singleStarHtml = '<i class="fa-solid fa-star" style="color: #ffc107; font-size: 0.95rem; margin-right: 5px;"></i>';

            ratingContainer.innerHTML = `
                <span class="stars-list" style="display: flex; align-items: center;">
                    ${singleStarHtml}
                </span>
                <strong style="color: #fff; margin-left: 2px; font-size: 1rem;">${diem.toFixed(1)}/5</strong>
                <span style="color: #aaa; font-size: 0.85rem; margin-left: 6px;">(${luotDanhGia} đánh giá)</span>
            `;
        }
    } catch (error) {
        console.error("Lỗi tải điểm phim:", error);
    }
}