document.addEventListener('DOMContentLoaded', () => {
    let currentIdx = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.arrow-prev');
    const nextBtn = document.querySelector('.arrow-next');
    const totalSlides = slides.length;
    let slideInterval;

    if (totalSlides === 0) return;

    // --- Core Logic ---
    function showSlide(n) {
        // Reset index vòng lặp
        currentIdx = (n + totalSlides) % totalSlides;

        // Cập nhật UI
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[currentIdx].classList.add('active');
        dots[currentIdx].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentIdx + 1);
        resetTimer();
    }

    function prevSlide() {
        showSlide(currentIdx - 1);
        resetTimer();
    }

    // --- Event Listeners (Thay thế cho onclick trong HTML) ---
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetTimer();
        });
    });

    // --- Timer Management ---
    function startTimer() {
        slideInterval = setInterval(nextSlide, 6000);
    }

    function resetTimer() {
        clearInterval(slideInterval);
        startTimer();
    }

    // Khởi tạo
    startTimer();
});