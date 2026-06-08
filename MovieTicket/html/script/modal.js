function openModal() {
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editName').value = localStorage.getItem("userFullname") || "";
    document.getElementById('editPhone').value = localStorage.getItem("userPhone") || "";
    document.getElementById('editEmail').value = localStorage.getItem("userEmail") || "";
    document.getElementById('editDob').value = localStorage.getItem("userDob") || "";
    
    
    // Lấy giới tính và chọn đúng option trong select
    const gender = localStorage.getItem("userGender");
    const genderSelect = document.getElementById('editGender');
    if (gender && genderSelect) {
        // Nếu DB lưu "Nam"/"Nữ", hãy khớp với value của <option>
        genderSelect.value = (gender === "Nam") ? "male" : "female";
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveProfile() {
    const newName = document.getElementById('editName').value;
    const newPhone = document.getElementById('editPhone').value;
    const email = localStorage.getItem("userEmail");

    try {
        const response = await fetch("http://127.0.0.1:5000/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: email, 
                hovaten: newName, 
                sdt: newPhone 
            })
        });

        const result = await response.json();
        if (result.success) {
            // Cập nhật các key lẻ
            localStorage.setItem("userFullname", newName);
            localStorage.setItem("userPhone", newPhone);

            // Cập nhật đối tượng currentUser
            const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
            storedUser.fullname = newName;
            storedUser.phone = newPhone;
            localStorage.setItem("currentUser", JSON.stringify(storedUser));
            
            document.getElementById("display-fullname").innerText = newName;
            document.getElementById("display-phone").innerText = newPhone;
            
            alert("Cập nhật thông tin thành công!");
            closeModal();
        } else {
            alert("Lỗi: " + result.msg);
        }
    } catch (err) {
        alert("Không thể kết nối máy chủ để cập nhật");
    }
}