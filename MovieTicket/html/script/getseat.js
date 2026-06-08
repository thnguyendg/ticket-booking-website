const SEAT_LAYOUT = {
    A: 3, // Khu A
    B: 5, // Khu B
    C: 3  // Khu C
};
const TOTAL_ROWS = 4; 

// Tỷ lệ ngẫu nhiên ghế bị chặn (0.2 = 20% ghế sẽ bị disable)
const DISABLE_PERCENT = 0.2;

// Khai báo mảng rỗng để chứa danh sách ghế bị chặn sau khi random
let DISABLED_SEATS = [];

// --- HÀM MỚI: Random các ghế bị chặn ---
function generateRandomDisabledSeats() {
    DISABLED_SEATS = []; // Reset danh sách cũ mỗi khi chạy
    
    // Lấy danh sách các khu vực từ SEAT_LAYOUT
    const zones = Object.keys(SEAT_LAYOUT);

    for (let row = 1; row <= TOTAL_ROWS; row++) {
        zones.forEach(zone => {
            const totalCols = SEAT_LAYOUT[zone];
            
            for (let col = 1; col <= totalCols; col++) {
                // Tạo ra số ngẫu nhiên từ 0 đến 1
                const isDisabled = Math.random() < DISABLE_PERCENT;
                
                // Nếu ngẫu nhiên đúng tỷ lệ thì thêm vào danh sách disable
                if (isDisabled) {
                    const seatId = `${zone}${row}:${col}`;
                    DISABLED_SEATS.push(seatId);
                }
            }
        });
    }
    
    console.log("Các ghế đã bị ngẫu nhiên chặn:", DISABLED_SEATS);
}

function renderSeatMap() {
    const seatsContainer = document.getElementById('seats-container');
    if (!seatsContainer) return;
    
    seatsContainer.innerHTML = '';

    for (let row = 1; row <= TOTAL_ROWS; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        rowDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 6px; margin-bottom: 10px; width: 100%;';

        // ================= KHU A =================
        for (let col = 1; col <= SEAT_LAYOUT.A; col++) {
            createSeatElement(rowDiv, 'A', row, col);
        }

        createSpacer(rowDiv);

        // ================= KHU B =================
        for (let col = 1; col <= SEAT_LAYOUT.B; col++) {
            createSeatElement(rowDiv, 'B', row, col);
        }

        createSpacer(rowDiv);

        // ================= KHU C =================
        for (let col = 1; col <= SEAT_LAYOUT.C; col++) {
            createSeatElement(rowDiv, 'C', row, col);
        }

        seatsContainer.appendChild(rowDiv);
    }
}

function createSeatElement(targetRow, zone, rowNum, colNum) {
    const seat = document.createElement('div');
    const seatId = `${zone}${rowNum}:${colNum}`; 
    
    seat.className = 'seat';
    seat.setAttribute('data-seat', seatId);
    
    seat.style.cssText = 'width: 32px; height: 32px; background: #262626; border-radius: 6px; cursor: pointer; flex-shrink: 0;';

    // Kiểm tra xem ghế có trong danh sách random vừa tạo không
    if (DISABLED_SEATS.includes(seatId)) {
        seat.classList.add('occupied'); 
        seat.style.background = '#1a1a1a'; // Màu xám
        seat.style.cursor = 'not-allowed'; // Con trỏ gạch chéo
    }
    
    seat.addEventListener('click', () => {
        if (seat.classList.contains('occupied')) return; 
        
        seat.classList.toggle('selected');
        seat.style.background = seat.classList.contains('selected') ? '#e50914' : '#262626';
        calculateTotal();
    });

    targetRow.appendChild(seat);
}

function createSpacer(targetRow) {
    const spacer = document.createElement('div');
    spacer.style.cssText = 'width: 24px; height: 100%; flex-shrink: 0;'; 
    targetRow.appendChild(spacer);
}

function calculateTotal() {
    // Lấy số lượng ghế đang chọn
    const selectedSeats = document.querySelectorAll('.seat.selected').length;
    const costOfTickets = selectedSeats * ticketPrice;

    // Reset lại và tính tổng tiền combo một cách chuẩn xác từ trạng thái đã lưu
    totalComboPrice = 0;

    if (allCombos && allCombos.length > 0) {
        for (const comboId in selectedCombosState) {
            const qty = selectedCombosState[comboId] || 0;
            // Chỉ tính toán nếu số lượng lớn hơn 0
            if (qty > 0) {
                const comboData = allCombos.find(c => c.id == comboId);
                if (comboData) {
                    const price = comboData.sale_price || comboData.original_price;
                    totalComboPrice += price * qty;
                }
            }
        }
    }

    const grandTotal = costOfTickets + totalComboPrice; 

    // Đổ dữ liệu đồng bộ lên màn hình panel
    document.getElementById('ticket-count').textContent = selectedSeats;
    document.getElementById('ticket-price').textContent = formatCurrency(costOfTickets);
    document.getElementById('combo-price').textContent = formatCurrency(totalComboPrice); 
    document.getElementById('total-price').textContent = formatCurrency(grandTotal);
}

// --- QUAN TRỌNG: Thứ tự chạy ---
// 1. Tạo danh sách ghế bị chặn ngẫu nhiên
generateRandomDisabledSeats(); 
// 2. Vẽ sơ đồ ghế dựa trên danh sách đó
renderSeatMap();