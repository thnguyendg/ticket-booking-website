// pagination.js
const PaginationSystem = {
    config: {
        itemsPerPage: 16,
        currentPage: 1,
        selectors: {
            grid: '#product-grid',
            items: '.product-card',
            numbers: '#page-numbers',
            prev: '#prev-page',
            next: '#next-page'
        }
    },

    init() {
        this.observeGridChanges();
        this.attachEventListeners();
        this.update();
    },

    // Listen for when renderProducts() from source[cite: 2] finishes
    observeGridChanges() {
        const grid = document.querySelector(this.config.selectors.grid);
        if (!grid) return;

        const observer = new MutationObserver(() => {
            this.config.currentPage = 1;
            this.update();
        });

        observer.observe(grid, { childList: true });
    },

    update() {
        const items = document.querySelectorAll(this.config.selectors.items);
        const totalPages = Math.ceil(items.length / this.config.itemsPerPage);
        
        this.displayItems(items);
        this.renderControls(totalPages);
        this.updateButtonStates(totalPages);
    },

    displayItems(items) {
        const start = (this.config.currentPage - 1) * this.config.itemsPerPage;
        const end = start + this.config.itemsPerPage;

        items.forEach((item, index) => {
            item.style.display = (index >= start && index < end) ? 'block' : 'none';
        });
    },

    renderControls(totalPages) {
        const container = document.querySelector(this.config.selectors.numbers);
        if (!container) return;

        container.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-num ${i === this.config.currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => {
                this.config.currentPage = i;
                this.update();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            container.appendChild(btn);
        }
    },

    updateButtonStates(totalPages) {
        const prevBtn = document.querySelector(this.config.selectors.prev);
        const nextBtn = document.querySelector(this.config.selectors.next);

        if (prevBtn) prevBtn.disabled = (this.config.currentPage === 1);
        if (nextBtn) nextBtn.disabled = (this.config.currentPage === totalPages || totalPages === 0);
    },

    attachEventListeners() {
        document.querySelector(this.config.selectors.prev)?.addEventListener('click', () => {
            if (this.config.currentPage > 1) {
                this.config.currentPage--;
                this.update();
            }
        });

        document.querySelector(this.config.selectors.next)?.addEventListener('click', () => {
            const items = document.querySelectorAll(this.config.selectors.items);
            const totalPages = Math.ceil(items.length / this.config.itemsPerPage);
            if (this.config.currentPage < totalPages) {
                this.config.currentPage++;
                this.update();
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => PaginationSystem.init());