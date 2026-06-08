from flask import Flask, jsonify, request
from flask_cors import CORS
import pyodbc
import json
import random
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)
CORS(app) # Cho phép Frontend truy cập

# Cấu hình thư mục lưu ảnh
UPLOAD_FOLDER = 'html/IMAGE/avatars'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def get_db_connection():
    conn_str = (
        f"Driver={{ODBC Driver 17 for SQL Server}};"
        f"Server={os.getenv('DB_SERVER')};"
        f"Database={os.getenv('DB_NAME')};"
        "Trusted_Connection=yes;"
    )
    return pyodbc.connect(conn_str)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # BỔ SUNG THÊM CỘT MAKH VÀO CUỐI CÂU SELECT
        query = """
            SELECT Email, Hovaten, SoDu, SDT, Ngaysinh, GioiTinh, IsDeleted, IsBanned, LyDoBan, MaVaiTro, MAKH
            FROM Khach_hang 
            WHERE Email = ? AND PasswordHash = ?
        """
        cursor.execute(query, (email, password))
        user = cursor.fetchone()
        conn.close()

        if user:
            if user[6] == 1: 
                return jsonify({"success": False, "message": "Tài khoản của bạn đã bị xoá!"}), 403

            if user[7] == 1:
                ly_do = user[8] if user[8] else "Vi phạm tiêu chuẩn cộng đồng"
                return jsonify({"success": False, "message": f"Tài khoản của bạn đã bị cấm với lý do: {ly_do}"}), 403 

            # ĐĂNG NHẬP THÀNH CÔNG: Trả thêm trường "id" lấy từ user[10] về cho Frontend
            return jsonify({
                "success": True,
                "id": user[10],  # <--- QUAN TRỌNG: MAKH từ Database
                "email": user[0],
                "fullname": user[1],
                "balance": float(user[2]) if user[2] else 0,
                "phone": user[3],
                "dob": str(user[4]) if user[4] else "", 
                "gender": user[5],
                "role": user[9]  
            })
        else:
            return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401
            
    except Exception as e:
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    # Lấy chính xác các key bạn gửi từ JS
    hovaten = data.get('hovaten')
    email = data.get('email')
    sdt = data.get('sdt')
    gioitinh = data.get('gioitinh')
    ngaysinh = data.get('ngaysinh')
    password = data.get('password')

    # Validate input lengths
    if len(sdt) > 10:
        return jsonify({"success": False, "msg": "Số điện thoại không được quá 10 số!"}), 400
    if len(password) > 200:
        return jsonify({"success": False, "msg": "Mật khẩu không được quá 200 ký tự!"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Kiểm tra xem email đã tồn tại chưa
        cursor.execute("SELECT Email FROM Khach_hang WHERE Email = ?", (email,))
        if cursor.fetchone():
            return jsonify({"success": False, "msg": "Email này đã được đăng ký!"}), 400

        # 2. Thêm người dùng mới (Mặc định SoDu = 0, IsDeleted = 0)
        query = """
            INSERT INTO Khach_hang (Hovaten, SDT, Email, GioiTinh, Ngaysinh, PasswordHash, SoDu, IsDeleted)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0)
        """
        # Chuyển đổi 'male'/'female' sang Tiếng Việt để khớp với database (nếu cần)
        gender_vn = "Nam" if gioitinh == "male" else "Nữ"

        cursor.execute(query, (hovaten, sdt, email, gender_vn, ngaysinh, password))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "msg": "Tài khoản đã được tạo thành công!"})

    except Exception as e:
        print(f"Lỗi Register: {e}")
        return jsonify({"success": False, "msg": "Lỗi hệ thống, vui lòng thử lại sau!"}), 500

@app.route('/deposit', methods=['POST'])
def deposit():
    data = request.json
    email = data.get('email')
    amount = data.get('amount') # Số tiền nạp từ frontend

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Cập nhật số dư trực tiếp trong SQL
        query = "UPDATE Khach_hang SET SoDu = SoDu + ? WHERE Email = ?"
        cursor.execute(query, (amount, email))
        conn.commit()

        # 2. Lấy lại số dư mới để trả về cho khách
        cursor.execute("SELECT SoDu FROM Khach_hang WHERE Email = ?", (email,))
        new_balance = cursor.fetchone()[0]
        
        conn.close()
        return jsonify({
            "success": True, 
            "new_balance": float(new_balance),
            "msg": f"Đã nạp thành công {amount:,}đ"
        })
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500
    
    
@app.route('/deduct-balance', methods=['POST'])
def deduct_balance():
    data = request.json
    user_id = data.get('id')
    amount = data.get('amount')
    
    # Nhận thêm thông tin vé từ frontend gửi lên để lưu lịch sử
    movie_name = data.get('movie_name', 'Vé xem phim')
    ticket_quantity = data.get('quantity', 1)

    # Khởi tạo giá trị None để khối finally có thể nhận biết
    conn = None 
    try:
        # Ép kiểu an toàn để tính toán dữ liệu chính xác
        amount_val = float(amount) if amount else 0
        quantity_val = int(ticket_quantity) if ticket_quantity else 1

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Kiểm tra số dư tài khoản
        cursor.execute("SELECT SoDu FROM Khach_hang WHERE MAKH = ?", (user_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"success": False, "msg": "Không tìm thấy tài khoản!"}), 404
            
        current_balance = float(result[0]) if result[0] else 0

        if current_balance < amount_val:
            return jsonify({"success": False, "msg": "Số dư tài khoản không đủ!"}), 400

        # 2. Thực hiện trừ tiền người dùng
        cursor.execute("UPDATE Khach_hang SET SoDu = SoDu - ? WHERE MAKH = ?", (amount_val, user_id))

        # 3. GHI LỊCH SỬ GIAO DỊCH VÀO BẢNG
        insert_history_query = """
            INSERT INTO Lich_su_giao_dich (MAKH, TenPhim, SoLuongVe, TongTien)
            VALUES (?, ?, ?, ?)
        """
        cursor.execute(insert_history_query, (user_id, movie_name, quantity_val, amount_val))
        
        # Xác nhận lưu cả 2 lệnh UPDATE và INSERT vào database cùng lúc
        conn.commit()

        # 4. Lấy lại số dư mới trả về
        cursor.execute("SELECT SoDu FROM Khach_hang WHERE MAKH = ?", (user_id,))
        new_balance = cursor.fetchone()[0]
        
        return jsonify({
            "success": True, 
            "new_balance": float(new_balance),
            "msg": "Thanh toán và lưu lịch sử thành công!"
        })
        
    except Exception as e:
        print(f"Lỗi thanh toán tại Backend: {e}")
        return jsonify({"success": False, "msg": f"Lỗi hệ thống khi thanh toán: {str(e)}"}), 500
        
    finally:
        # BẮT BUỘC: Đóng kết nối dù code chạy thành công hay lỗi
        if conn:
            conn.close()

@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.json
    email = data.get('email')
    hovaten = data.get('hovaten')
    sdt = data.get('sdt')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Thực hiện cập nhật vào Database
        query = """
            UPDATE Khach_hang 
            SET Hovaten = ?, SDT = ? 
            WHERE Email = ?
        """
        cursor.execute(query, (hovaten, sdt, email))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True, 
            "msg": "Cập nhật thông tin thành công"
        })
    except Exception as e:
        return jsonify({
            "success": False, 
            "msg": str(e)
        }), 500

@app.route('/delete-account', methods=['POST'])
def delete_account():
    data = request.json
    email = data.get('email')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Thay vì DELETE, chúng ta UPDATE cột IsDeleted
        query = "UPDATE Khach_hang SET IsDeleted = 1 WHERE Email = ?"
        cursor.execute(query, (email,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "msg": "Tài khoản của bạn đã được xóa thành công."})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

@app.route('/change-password', methods=['POST'])
def change_password():
    data = request.json
    email = data.get('email')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Kiểm tra mật khẩu cũ có khớp với Email không
        query_check = "SELECT PasswordHash FROM Khach_hang WHERE Email = ? AND PasswordHash = ?"
        cursor.execute(query_check, (email, old_password))
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({"success": False, "message": "Mật khẩu cũ không chính xác"}), 401

        # 2. Cập nhật mật khẩu mới
        query_update = "UPDATE Khach_hang SET PasswordHash = ? WHERE Email = ?"
        cursor.execute(query_update, (new_password, email))
        
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Đổi mật khẩu thành công"})

    except Exception as e:
        print(f"Lỗi Change Password: {e}")
        return jsonify({"success": False, "message": "Lỗi hệ thống"}), 500

@app.route('/api/movies', methods=['GET'])
def get_movies_api():
    """API để Frontend lấy danh sách phim từ file JSON"""
    try:
        with open('html/products.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify([]), 500

@app.route('/api/food', methods=['GET'])
def get_food_api():
    try:
        with open('html/food.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify([]), 500

@app.route('/update-food', methods=['POST'])
def update_food():
    food_data = request.json
    try:
        file_path = 'html/food.json'
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(food_data, f, ensure_ascii=False, indent=2)
        return jsonify({"success": True, "message": "Đã lưu thay đổi vào file đồ ăn thành công!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/movies/<int:movie_id>/rating', methods=['GET'])
def get_movie_rating(movie_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Chỉ SELECT từ bảng Danh_gia_phim của bạn
        query = """
            SELECT 
                AVG(CAST(SoSao AS FLOAT)) as DiemTrungBinh,
                COUNT(MADG) as TongSoDanhGia
            FROM Danh_gia_phim
            WHERE MaPhim = ?
        """
        cursor.execute(query, (movie_id,))
        row = cursor.fetchone()
        
        # Nếu chưa có ai đánh giá, row[0] sẽ là None
        diem_tb = round(row[0], 1) if row[0] is not None else 0.0
        tong_dg = row[1] if row[1] is not None else 0
        
        conn.close()
        return jsonify({
            "success": True, 
            "DiemTrungBinh": diem_tb, 
            "TongSoDanhGia": tong_dg
        })
        
    except Exception as e:
        print("====== LỖI API TÍNH SAO =====:", str(e))
        return jsonify({"success": False, "msg": str(e)}), 500

@app.route('/update-movies', methods=['POST'])
def update_movies():
    movies_data = request.json
    try:
        file_path = 'html/products.json'
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(movies_data, f, ensure_ascii=False, indent=2)
        return jsonify({"success": True, "message": "Đã lưu thay đổi vào file thành công!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/get-users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Thêm cột IsBan vào câu SELECT
        cursor.execute("SELECT MAKH, Hovaten, Email, SDT, IsDeleted, GioiTinh, Ngaysinh, SoDu, IsBanned, MaVaiTro FROM Khach_hang")
        users = cursor.fetchall()
        conn.close()

        user_list = []
        for u in users:
            user_list.append({
                "id": u[0],
                "fullname": u[1],
                "email": u[2],
                "phone": u[3],
                "isDeleted": u[4],
                "gender": u[5],
                "dob": str(u[6]) if u[6] else "",
                "balance": float(u[7]) if u[7] else 0,
                "isBanned": u[8],
                "role": u[9] if u[9] is not None else 0
            })
        return jsonify(user_list)
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    
@app.route('/toggle-user-status', methods=['POST'])
def toggle_user_status():
    data = request.json
    user_id = data.get('id')
    new_status = data.get('status') # 1 là cấm, 0 là mở
    reason = data.get('reason', '') # Lấy lý do cấm từ Frontend gửi lên

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if new_status == 1:
            # Nếu là CẤM: Cập nhật cả IsBanned và LyDoBan
            cursor.execute("UPDATE Khach_hang SET IsBanned = 1, LyDoBan = ? WHERE MAKH = ?", (reason, user_id))
        else:
            # Nếu là MỞ CẤM: Set IsBanned = 0 và xóa trắng lý do cũ (gán về NULL)
            cursor.execute("UPDATE Khach_hang SET IsBanned = 0, LyDoBan = NULL WHERE MAKH = ?", (user_id,))
            
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Cập nhật trạng thái thành công!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
@app.route('/update-user-role', methods=['POST'])
def update_user_role():
    data = request.json
    user_id = data.get('id')
    new_role = data.get('role') # 1 cho Customer, 2 cho Staff

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Cập nhật quyền mới
        cursor.execute("UPDATE Khach_hang SET MaVaiTro = ? WHERE MAKH = ?", (new_role, user_id))
        
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Phân quyền tài khoản thành công!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
otp_store = {}
otp_cooldown = {}

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    conn = None
    try:
        data = request.json
        email = (data.get("email") or "").strip()

        now = time.time()

        if email in otp_cooldown:
            remain = 60 - (now - otp_cooldown[email])
            if remain > 0:
                return jsonify({
                    "success": False,
                    "msg": f"Vui lòng đợi {int(remain)} giây"
                }), 429

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT MAKH FROM Khach_hang WHERE Email = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({
                "success": False,
                "msg": "Email không tồn tại trong hệ thống"
            }), 400

        otp = str(random.randint(100000, 999999))

        otp_store[email] = {
            "otp": otp,
            "expire": datetime.now() + timedelta(minutes=5)
        }

        otp_cooldown[email] = now

        return jsonify({
            "success": True,
            "msg": "OTP đã được tạo",
            "otp": otp
        })

    except Exception as e:
        print(f"FORGOT PASSWORD ERROR: {e}")
        return jsonify({
            "success": False,
            "msg": str(e)
        }), 500

@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.json
        email = (data.get("email") or "").strip()
        otp_input = (data.get("otp") or "").strip()

        if email not in otp_store:
            return jsonify({
                "success": False,
                "msg": "Vui lòng yêu cầu OTP trước"
            }), 400

        otp_data = otp_store[email]
        
        if datetime.now() > otp_data["expire"]:
            del otp_store[email]
            return jsonify({
                "success": False,
                "msg": "Mã OTP đã hết hạn"
            }), 400

        if otp_data["otp"] != otp_input:
            return jsonify({
                "success": False,
                "msg": "Mã OTP không chính xác"
            }), 400

        return jsonify({
            "success": True,
            "msg": "Xác thực thành công"
        })

    except Exception as e:
        print(f"VERIFY OTP ERROR: {e}")
        return jsonify({
            "success": False,
            "msg": str(e)
        }), 500

@app.route("/reset-password", methods=["POST"])
def reset_password():
    conn = None
    try:
        data = request.json
        email = (data.get("email") or "").strip()
        new_password = data.get("new_password")

        if email not in otp_store:
            return jsonify({
                "success": False,
                "msg": "Phiên xác thực đã hết hạn"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE Khach_hang SET PasswordHash = ? WHERE Email = ?", (new_password, email))
        conn.commit()
        conn.close()

        del otp_store[email]
        if email in otp_cooldown:
            del otp_cooldown[email]

        return jsonify({
            "success": True,
            "msg": "Đổi mật khẩu thành công"
        })

    except Exception as e:
        print(f"RESET PASSWORD ERROR: {e}")
        return jsonify({
            "success": False,
            "msg": str(e)
        }), 500
        
@app.route('/api/khachhang/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Lấy toàn bộ thông tin profile để đồng bộ Database với Frontend"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor() 
        
        query = """
            SELECT SoDu, Email, Hovaten, SDT, Ngaysinh, GioiTinh, MaVaiTro, Avatar 
            FROM Khach_hang 
            WHERE MAKH = ?
        """ 
        
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return jsonify({
                "SoDu": float(result[0]) if result[0] else 0,
                "Email": result[1],
                "Hovaten": result[2],
                "SDT": result[3],
                "Ngaysinh": str(result[4]) if result[4] else "",
                "GioiTinh": result[5],
                "MaVaiTro": result[6],
                "Avatar": result[7]
            })
        else:
            return jsonify({"error": "Không tìm thấy khách hàng"}), 404
            
    except Exception as e:
        print(f"LỖI API GET BALANCE: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/giao-dich/<int:user_id>', methods=['GET'])
def get_transaction_history(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT MAGD, MAKH, TenPhim, SoLuongVe, TongTien, NgayGiaoDich, TrangThai 
            FROM Lich_su_giao_dich
            WHERE MAKH = ?
            ORDER BY NgayGiaoDich DESC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        
        result_data = []
        for row in rows:
            result_data.append({
                "MAGD": row[0],
                "MAKH": row[1],
                "TenPhim": row[2],
                "SoLuongVe": row[3],
                "TongTien": float(row[4]) if row[4] else 0, # Chuyển Decimal sang Float để tránh lỗi JSON
                "NgayGiaoDich": str(row[5]) if row[5] else "", # Chuyển DateTime sang Chuỗi
                "TrangThai": row[6]
            })
            
        cursor.close()
        conn.close()
        
        # Trả mảng dữ liệu đã xử lý về cho Frontend
        return jsonify({"success": True, "data": result_data})
        
    except Exception as e:
        # Dòng này sẽ in chi tiết lỗi thực sự ra Terminal cho bạn xem
        print(f"LỖI LẤY LỊCH SỬ GIAO DỊCH VÀO TERMINAL: {e}")
        return jsonify({"success": False, "msg": str(e)}), 500
    
# API 1: LƯU BÌNH LUẬN MỚI
@app.route('/api/reviews', methods=['POST'])
def add_review():
    data = request.json
    user_id = data.get('user_id')
    movie_id = data.get('movie_id')
    rating = data.get('rating')
    comment = data.get('comment')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO Danh_gia_phim (MAKH, MaPhim, SoSao, BinhLuan) 
            VALUES (?, ?, ?, ?)
        """
        cursor.execute(query, (user_id, movie_id, rating, comment))
        conn.commit()
        
        return jsonify({"success": True, "msg": "Đã gửi bình luận thành công!"})
    except Exception as e:
        print(f"Lỗi lưu đánh giá: {e}")
        return jsonify({"success": False, "msg": "Lỗi hệ thống"}), 500
    finally:
        if conn:
            conn.close()

# API 2: LẤY DANH SÁCH BÌNH LUẬN CỦA 1 BỘ PHIM
@app.route('/api/reviews/<int:movie_id>', methods=['GET'])
def get_reviews(movie_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Câu lệnh SQL: Bạn hãy kiểm tra kỹ tên bảng DanhGia, Khach_hang 
        # và tên các cột MAKH, PhimID, Hovaten, Avatar xem viết đúng chính tả trong DB chưa nhé!
        query = """
            SELECT r.BinhLuan, r.SoSao, r.NgayDanhGia, k.Hovaten, k.Avatar
            FROM Danh_gia_phim r
            JOIN Khach_hang k ON r.MAKH = k.MAKH
            WHERE r.MaPhim = ?
            ORDER BY r.NgayDanhGia DESC
        """
        cursor.execute(query, (movie_id,))
        rows = cursor.fetchall()
        
        reviews = []
        for row in rows:
            reviews.append({
                "BinhLuan": row[0],
                "SoSao": row[1],
                "NgayDanhGia": str(row[2]) if row[2] else "",
                "Hovaten": row[3],
                "Avatar": row[4] if row[4] else "default-avatar.png"
            })
            
        conn.close()
        return jsonify({"success": True, "data": reviews})
        
    except Exception as e:
        # Dòng này vô cùng quan trọng: Nó sẽ in lỗi chi tiết ra màn hình Terminal (cmd) của Flask
        print("====== LỖI API REVIEWS =====:", str(e))
        return jsonify({"success": False, "msg": str(e)}), 500

@app.route('/api/upload-avatar', methods=['POST'])
def upload_avatar():
    user_id = request.form.get('user_id')
    file = request.files.get('avatar')

    if not file or not user_id:
        return jsonify({"success": False, "msg": "Thiếu thông tin!"}), 400

    # Đặt tên file theo ID user để không bao giờ trùng
    filename = f"avatar_{user_id}.jpg"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Cập nhật vào DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Khach_hang SET Avatar = ? WHERE MAKH = ?", (filename, user_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "avatar_url": filename})

# 1. API nhận góp ý từ trang gopy.html
@app.route('/api/feedback', methods=['POST'])
def send_feedback():
    try:
        data = request.json
        fullname = data.get('fullname')
        email = data.get('email')
        phone = data.get('phone')
        content = data.get('content')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO Gop_y (Hovaten, Email, Sodt, NoiDung)
            VALUES (?, ?, ?, ?)
        """
        cursor.execute(query, (fullname, email, phone, content))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "msg": "Gửi góp ý thành công!"})
    except Exception as e:
        print("Lỗi lưu góp ý:", str(e))
        return jsonify({"success": False, "msg": str(e)}), 500

# 2. API lấy danh sách góp ý hiển thị ở admin.html
@app.route('/api/admin/feedbacks', methods=['GET'])
def get_all_feedbacks():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Sắp xếp góp ý mới nhất lên đầu
        query = "SELECT MAGY, Hovaten, Email, Sodt, NoiDung, NgayGui FROM Gop_y ORDER BY NgayGui DESC"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        feedbacks = []
        for row in rows:
            feedbacks.append({
                "MAGY": row[0],
                "Hovaten": row[1],
                "Email": row[2],
                "Sodt": row[3],
                "NoiDung": row[4],
                "NgayGui": row[5].strftime("%d/%m/%Y %H:%M") if row[5] else ""
            })
        conn.close()
        return jsonify({"success": True, "data": feedbacks})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500
    
@app.route('/api/admin/feedbacks/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "DELETE FROM Gop_y WHERE MAGY = ?"
        cursor.execute(query, (feedback_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "msg": "Xóa góp ý thành công!"})
    except Exception as e:
        print("Lỗi xóa góp ý:", str(e))
        return jsonify({"success": False, "msg": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)
