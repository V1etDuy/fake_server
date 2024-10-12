// routes/authRoutes.js

const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("json-server").router("data.json").db; // Truy cập database

const SECRET_KEY = '0f5f43b5b226531628722a0f20b4c276de87615dfc8516ea4240c93f4135d4b1';

// Xử lý đăng nhập
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.get('users').find({ email, password }).value(); // Tìm người dùng theo email và password
    console.log('Password:', password);
    if (user) {
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            telephone_number: user.telephone_number,
            nationality: user.nationality,
            province: user.province,
            district: user.district,
            ward: user.ward,
            street: user.street,
            image: user.image
        }, SECRET_KEY, { expiresIn: '1h' }); // Token hết hạn sau 1 giờ

        res.jsonp({
            token: token,
        });
    } else {
        res.status(401).jsonp({ message: "Đăng nhập không thành công" });
    }
});

router.post('/dangky', (req, res) => {
    const { email, password } = req.body;
    console.log('Password:', password);
    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = db.get('users').find({ email }).value();
    if (existingUser) {
        return res.status(400).jsonp({ message: "Người dùng đã tồn tại" });
    }

    // Tạo người dùng mới với các giá trị mặc định cho name, role, telephone_number
    const newUser = {
        id: Date.now().toString(),
        email: req.body.email,
        password: req.body.password,
        name: req.body.name || "",  // Giá trị mặc định là chuỗi rỗng
        role: req.body.role || "user",  // Mặc định là "user"
        telephone_number: req.body.telephone_number || "",  // Giá trị mặc định là chuỗi rỗng
        country: req.body.country || "Vietnam",
        province: "",
        district: "",
        ward: "",
        street: "",
        image: "",
        status: 1
    };

    // Lưu người dùng vào db
    db.get('users').push(newUser).write();

    res.status(201).jsonp({ message: "Đăng ký thành công" });
});

// Route Hello World
router.get('/test', (req, res) => {
    res.jsonp({ message: "Hello, World!" });
});
module.exports = router;
