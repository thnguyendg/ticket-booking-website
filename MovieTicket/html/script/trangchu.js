// Trong hàm renderProducts của bạn
products.forEach(product => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.product-card');

    // Khi bấm vào card
    card.onclick = function() {
        // Chuyển hướng sang trang chitiet.html kèm theo ID của sản phẩm
        // Ví dụ: chitiet.html?id=5
        window.location.href = `chitiet.html?id=${product.id}`;
    };

    grid.appendChild(clone);
});