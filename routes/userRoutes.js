// routes/userRoutes.js

const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("json-server").router("data.json").db; // Truy cập database

const SECRET_KEY = '0f5f43b5b226531628722a0f20b4c276de87615dfc8516ea4240c93f4135d4b1';

// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// API để cập nhật thông tin người dùng
router.put('/user/update', authenticateToken, (req, res) => {
    const { name, telephone_number, nationality, province, district, ward, street, image } = req.body;
    const userId = req.user.id; // Lấy id người dùng từ token

    // Cập nhật thông tin người dùng
    const updatedUser = db.get('users').find({ id: userId }).assign({
        name,
        telephone_number,
        nationality,
        province,
        district,
        ward,
        street,
        image
    }).write();

    if (updatedUser) {
        res.jsonp({ message: "Cập nhật thông tin thành công", user: updatedUser });
    } else {
        res.status(404).jsonp({ message: "Người dùng không tồn tại" });
    }
});

// API để lấy thông tin người dùng
router.get('/user/info', authenticateToken, (req, res) => {
    const userId = req.user.id; // Lấy id từ token

    // Tìm người dùng trong database
    const user = db.get('users').find({ id: userId }).value();
    console.log('Image:' + user.image);
    if (user) {
        res.jsonp({
            name: user.name,
            email: user.email,
            telephone_number: user.telephone_number,
            nationality: user.nationality,
            province: user.province,
            district: user.district,
            ward: user.ward,
            street: user.street,
            image: user.image
        });
    } else {
        res.status(404).jsonp({ message: "Người dùng không tồn tại" });
    }
});

// API để thay đổi mật khẩu người dùng
router.put('/user/change-password', authenticateToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Lấy id người dùng từ token

    // Tìm người dùng trong database
    const user = db.get('users').find({ id: userId }).value();

    if (!user) {
        return res.status(404).jsonp({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra mật khẩu cũ
    if (user.password !== oldPassword) {
        return res.status(400).jsonp({ message: "Mật khẩu cũ không chính xác" });
    }

    // Cập nhật mật khẩu mới
    const updatedUser = db.get('users').find({ id: userId }).assign({
        password: newPassword
    }).write();

    if (updatedUser) {
        res.jsonp({ message: "Thay đổi mật khẩu thành công" });
    } else {
        res.status(500).jsonp({ message: "Đã có lỗi xảy ra" });
    }
});

module.exports = router;
