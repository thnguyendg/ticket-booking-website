const stars = document.querySelectorAll('.star-input');
const ratingLabel = document.getElementById('rating-label');
let selectedRating = 0;

const ratingTexts = {
    1: "Tệ",
    2: "Tạm được",
    3: "Bình thường",
    4: "Hay",
    5: "Tuyệt vời!"
};

stars.forEach(star => {
    star.addEventListener('mouseover', function() {
        const val = parseInt(this.getAttribute('data-value'));
        highlightStars(val);
        ratingLabel.textContent = `(${ratingTexts[val]})`;
    });

    star.addEventListener('mouseout', function() {
        highlightStars(selectedRating);
        ratingLabel.textContent = selectedRating > 0 ? `(${ratingTexts[selectedRating]})` : "(Chọn đánh giá)";
    });

    star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value'));
        highlightStars(selectedRating);
    });
});

// Hàm highlight chỉ làm đúng 1 nhiệm vụ: Thêm/Xóa class 'active'
function highlightStars(count) {
    stars.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-value'));
        // Nếu sVal <= count thì thêm class 'active', ngược lại thì xóa đi
        s.classList.toggle('active', sVal <= count);
    });
}