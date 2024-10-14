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


// Route để thêm sản phẩm vào giỏ hàng
router.post('/cartItem/add', authenticateToken, (req, res) => {
    const { id_product_variant, category, quantity } = req.body;
    const id_user = req.user.id;  // Lấy id_user từ token sau khi xác thực

    // Truy xuất dữ liệu cart_items từ data.json
    const cartItems = db.get('cart_items').value();

    // Kiểm tra xem đã có bản ghi với cùng 4 tham số chưa
    const existingItem = cartItems.find(item =>
        item.id_user === id_user &&
        item.id_product_variant === id_product_variant &&
        item.category === category
    );

    if (existingItem) {
        // Nếu có, cập nhật quantity
        const updatedQuantity = (parseInt(existingItem.quantity, 10) 
            + parseInt(quantity, 10)).toString();
        console.log(updatedQuantity);
        db.get('cart_items')
            .find({ id_user, id_product_variant, category })
            .assign({ quantity: updatedQuantity })
            .write();
        
        res.status(200).json({ message: 'Cập nhật giỏ hàng thành công!' });
    } else {
        // Nếu không có, tạo bản ghi mới
        const newItem = {
            id: Date.now(),  // Tạo ID duy nhất cho cart item
            id_user,
            id_product_variant,
            category,
            quantity
        };

        db.get('cart_items')
            .push(newItem)
            .write();

        res.status(201).json({ message: 'Thêm vào giỏ hàng thành công!' });
    }
});
// Route load sản phẩm giỏ hàng của 1 user
router.get("/cartItems", authenticateToken, (req, res) => {
    
    const userId = req.user.id; // Lấy id_user từ token
    const cartItems = db.get("cart_items").filter({ id_user: userId }).value(); // Tìm cart items của user

    // Tạo một danh sách để lưu các item hoàn chỉnh
    const completeCartItems = cartItems.map(item => {
        let completeItem = {
            id: item.id,
            id_product_variant: item.id_product_variant,
            category: item.category,
            quantity: item.quantity,
            ingredient: "",
            weight:"",
            size:"",
            color:""
        };

        // Lấy thông tin từ bảng pet, food hoặc supplies dựa trên category
        if (item.category === "pets") {
            console.log("Pets");
            const productInfo = db.get("products").find({ id: item.id_product_variant }).value();
            const petInfo = db.get("pet").find({ id: item.id_product_variant }).value();
            if (productInfo) {
                completeItem.name = productInfo.name; // Lấy tên từ bảng pets
                completeItem.price = petInfo.price;
                completeItem.image = productInfo.image; // Lấy hình ảnh từ bảng pets
            }
        } else if (item.category === "food") {
            const foodInfo = db.get("food").find({ id: item.id_product_variant }).value();
            const productInfo = db.get("products").find({ id: foodInfo.id_product }).value();
            if (productInfo && foodInfo) {
                completeItem.name = productInfo.name; // Lấy tên 
                completeItem.price = foodInfo.price; // Lấy giá từ bảng food
                completeItem.image = productInfo.image;
                completeItem.ingredient = foodInfo.ingredient;
                completeItem.weight = foodInfo.weight;
            }
        } else if (item.category === "supplies") {
            const suppliesInfo = db.get("supplies").find({ id: item.id_product_variant }).value();
            const productInfo = db.get("products").find({ id: suppliesInfo.id_product }).value();
            if (suppliesInfo && productInfo) {
                completeItem.name = productInfo.name; // Lấy tên từ bảng supplies
                completeItem.image = productInfo.image; // Lấy hình ảnh 
                completeItem.price = suppliesInfo.price;
                completeItem.size = suppliesInfo.size;
                completeItem.color = suppliesInfo.color;
            }
        }

        return completeItem; // Trả về item hoàn chỉnh
    });

    // Trả về danh sách item hoàn chỉnh
    res.json(completeCartItems);
});

module.exports = router;