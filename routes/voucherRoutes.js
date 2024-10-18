const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken"); // Import thư viện jsonwebtoken
const db = require("json-server").router("data.json").db; // Truy cập database
const SECRET_KEY = '0f5f43b5b226531628722a0f20b4c276de87615dfc8516ea4240c93f4135d4b1';

// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' }); // Không có token

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            // Kiểm tra xem lỗi có phải là do token hết hạn hay không
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Token has expired' }); // Token hết hạn
            }
            return res.status(403).json({ message: 'Invalid token' }); // Token không hợp lệ
        }
        req.user = user; // Lưu thông tin người dùng vào request
        next();
    });
};

// Route để nhận mã voucher và kiểm tra tính hợp lệ
router.get('/voucher/apply/:code', authenticateToken, (req, res) => {
    
    const { code } = req.params; // Lấy code từ params
    console.log(code);
    
    if (!code) {
        return res.status(400).json({ message: 'Voucher code is required' }); // Nếu không có mã
    }

    // Tìm voucher theo code
    const voucher = db.get('voucher').find({ code: code, status: 1 }).value();

    if (!voucher) {
        return res.status(404).json({ message: 'Invalid or expired voucher code' }); // Nếu không tìm thấy hoặc hết hạn
    }

    // Nếu voucher hợp lệ, trả về thông tin voucher
    return res.status(200).json({
        id: voucher.id,
        code: voucher.code,
        percent: voucher.percent,
        date_created: voucher.date_created,
    });
});

router.get('/voucher/test', (req, res) => {
    res.jsonp({ message: "Test route is working!" });
});
module.exports = router;