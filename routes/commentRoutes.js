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

// API lấy comment theo id_product
router.get('/comments/:id_product', (req, res) => {
    const productId = req.params.id_product;

    // Lấy tất cả các comments từ database
    const comments = db.get('comments').filter({ id_product: productId }).value();

    if (comments.length === 0) {
        return res.status(404).json({ message: 'No comments found for this product.' });
    }

    // Lấy thông tin user tương ứng từ database
    const enrichedComments = comments.map(comment => {
        const user = db.get('users').find({ id: comment.id_user }).value();
        return {
            id_comment: comment.id,
            id_user: user.id,
            email: user.email,
            name: user.name,
            star: comment.star,
            content: comment.content,
            time: comment.time
        };
    });

    // Trả về danh sách comment đã được làm giàu dữ liệu user
    res.json(enrichedComments);
});

// API thêm comment (với xác thực token)
router.post('/comments', authenticateToken, (req, res) => {
    const { id_user, id_product, star, content } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!id_user || !id_product || star === undefined || !content) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Tạo một bình luận mới
    const newComment = {
        id: Date.now().toString(), // Sử dụng thời gian hiện tại để tạo ID
        id_user: id_user,
        id_product: id_product,
        star: star,
        content: content,
        time: new Date().toLocaleDateString() // Lấy ngày hiện tại
    };

    // Thêm bình luận vào cơ sở dữ liệu
    db.get('comments').push(newComment).write();

    // Trả về bình luận đã thêm
    res.status(201).json(newComment);
});


module.exports = router;