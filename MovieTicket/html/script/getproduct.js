document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    
    if (!productGrid) {
        console.log('Không tìm thấy product-grid, bỏ qua load sản phẩm');
        return;
    }
    const filterLinks = document.querySelectorAll('.filter-link');
    let allMovies = [];

    console.log('=== DEBUG: Script loaded ===');
    console.log('Product grid element:', productGrid);

    if (!productGrid) {
        alert('LỖI: Không tìm thấy product-grid!');
        return;
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    async function fetchProducts() {
        try {
            console.log('Fetching products.json...');
            const response = await fetch('./products.json?v=1.0');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            allMovies = await response.json();
            console.log('Loaded', allMovies.length, 'products');
            renderProducts(allMovies);
        } catch (error) {
            console.error('Fetch error:', error);
            console.log('Using embedded data instead...');
            // Use embedded data as fallback
            allMovies = getEmbeddedData();
            renderProducts(allMovies);
        }
    }

    function getEmbeddedData() {
        return [
            {id: 1, name: "Khóa Xanh", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqD8SmKVSQN-p4D28bdmvQ3-Zx0X53sA6anQ&s", original_price: 120000, sale_price: 90000, rating: 8.0, age: 'T16'},
            {id: 2, name: "Kung Fu Panda 4", image: "https://upload.wikimedia.org/wikipedia/en/7/7f/Kung_Fu_Panda_4_poster.jpg", original_price: 100000, sale_price: 85000, rating: 7.5, age: 'T16'},
            {id: 3, name: "300", image: "https://images.openai.com/static-rsc-4/fNn_gBQrfwwDy4Ne-ZHdcD4AqiWBX3vt6dUMy8uiSDWYQYcFZ37wz3IXAT_Ii1c51gK3j4G3ekQsfKKXzemWTNluoHzkJPPi9GsmICuJP6B5ei-49YObmw1kvO4RN8u6Schpl2LhAjvS_lLFRG9FsWw1Fcx4M1NYJIy36JvzYAlsVtM7P-whd_uf66zamo4L?purpose=fullsize", original_price: 110000, sale_price: 75000, rating: 7.8, age: 'T18'},
            {id: 4, name: "Độ Mixi: Ấn Độ Phiêu Lưu Ký", image: "https://danviet-24h.ex-cdn.com/files/upload/2-2021/images/2021-06-26/42725836-adf9-4fc7-8764-9f671109ee3a-1624678195-502-width600height400.jpeg", original_price: 150000, sale_price: 120000, rating: 6.5, age: 'T16'}
        ];
    }

    function renderProducts(products) {
        console.log('Rendering', products.length, 'products...');
        productGrid.innerHTML = ''; 
        
        productGrid.style.display = 'flex';
        productGrid.style.flexWrap = 'wrap';
        productGrid.style.gap = '20px';
        productGrid.style.width = '100%';

        products.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'product-card';
            // Thêm con trỏ bàn tay để người dùng biết có thể click
            card.style.cssText = 'flex: 0 0 calc(25% - 15px); background: transparent; border: none; min-width: 200px; cursor: pointer;';
            
            // --- ĐOẠN MÃ QUAN TRỌNG: XỬ LÝ CLICK ---
            card.addEventListener('click', () => {
                const productId = item.id || index;
                window.location.href = `product.html?id=${productId}`;
            });
            // --------------------------------------

            const name = item.name || 'Sản phẩm ' + (index + 1);
            const image = item.image || 'https://via.placeholder.com/200x300';
            const originalPrice = item.original_price ? formatCurrency(item.original_price) : '';
            const salePrice = item.sale_price ? formatCurrency(item.sale_price) : '';
            const hasDiscount = item.original_price && item.sale_price && item.original_price > item.sale_price;
            
            card.innerHTML = `
                <div class="img-container" style="position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 2/3; background: #333;">
                    <img src="${image}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/200x300/333/fff?text=No+Image'">
                </div>
                <div style="margin-top: 10px;">
                    <h3 style="font-size: 1rem; text-align: left; color: #FFFFFF; font-weight: 500; margin: 10px 0 5px 0;">${name}</h3>
                    <div style="margin-top: 5px; font-size: 0.9rem;">
                        ${hasDiscount ? `<span style="text-decoration: line-through; color: #B3B3B3; margin-right: 8px;">${originalPrice}</span>` : ''}
                        <span style="color: #E50914; font-weight: bold;">${salePrice || originalPrice}</span>
                    </div>
                </div>
            `;

            const category = item.category || 'Phim';
            card.querySelector('.img-container').insertAdjacentHTML('afterbegin', `
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(229, 9, 20, 0.85); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; z-index: 1;">
                    ${category}
                </div>
            `);

            productGrid.appendChild(card);
        });
    }

    // Filter event listeners
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            filterLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');

            const type = e.target.dataset.filter;
            let filtered = [...allMovies];
            
            if(type === 'popular') {
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            } else if(type === 'newest') {
                filtered.reverse();
            }
            
            renderProducts(filtered);
        });
    });

    fetchProducts();
});
