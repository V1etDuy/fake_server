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
// Đặt hàng
router.post('/orders/create', authenticateToken, (req, res) => {
    const id_user = req.user.id;
    console.log(req.body);
    console.log("id_user" + id_user);
    const {
        name,
        telephone_number,
        email,
        total_price,
        shipping_price,
        subtotal_price,
        province,
        district,
        ward,
        street,
        voucher_code,
        payment_method,
        note
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    // Tạo danh sách chứa các trường bị thiếu
    let missingFields = [];

    if (!name) missingFields.push('name');
    if (!telephone_number) missingFields.push('telephone_number');
    if (!email) missingFields.push('email');
    if (!total_price) missingFields.push('total_price');
    if (!shipping_price) missingFields.push('shipping_price');
    if (!province) missingFields.push('province');
    if (!district) missingFields.push('district');
    if (!ward) missingFields.push('ward');
    if (!street) missingFields.push('street');
    if (!payment_method) missingFields.push('paymentMethod');

    // Nếu có bất kỳ trường nào thiếu, trả về thông báo lỗi
    if (missingFields.length > 0) {
        console.log("Các trường bị thiếu:", missingFields.join(', '));
        return res.status(400).json({
            message: 'Vui lòng nhập đầy đủ thông tin',
            missingFields: missingFields
        });
    }


    const id_order = Date.now().toString();


    // Xử lý logic lưu đơn hàng
    const newOrder = {
        id: id_order,
        id_user: id_user,
        name: name,
        telephone_number: telephone_number,
        email: email,
        total_price: total_price,
        shipping_price: shipping_price,
        subtotal_price: subtotal_price,
        date: new Date(),
        province: province,
        district: district,
        ward: ward,
        street: street,
        voucher_code: voucher_code || null,
        payment_method: payment_method,
        note: note || null,
        status: 3
    };

    // Lưu đơn hàng vào database
    try {
        db.get('orders').push(newOrder).write();
        console.log("Đã thêm order mới");
    } catch (err) {
        console.log("Lỗi khi thêm đơn hàng:", err);
        return res.status(500).json({ message: 'Lỗi server khi lưu đơn hàng' });
    }

    // Lấy tất cả các cart_items có id_user này
    const cartItems = db.get("cart_items").filter({ id_user: id_user }).value();

    if (cartItems.length === 0) {
        console.log("Không có sản phẩm trong giỏ hàng");
        return res.status(400).json({ message: 'Không có sản phẩm trong giỏ hàng' });
    }

    // Duyệt qua các cart_items và chép vào bảng order_items
    try {
        cartItems.forEach(cartItem => {
            const orderItem = {
                id: Date.now().toString(),
                id_order: id_order.toString(),
                id_product_variant: cartItem.id_product_variant,
                category: cartItem.category,
                quantity: cartItem.quantity
            };

            // Lưu từng order_item vào bảng order_items
            db.get('order_items').push(orderItem).write();
        });
        console.log("Đã thêm order items");
    } catch (err) {
        console.log("Lỗi khi thêm order items:", err);
        return res.status(500).json({ message: 'Lỗi server khi lưu sản phẩm đặt hàng' });
    }

    // Xóa tất cả các cart_items có id_user này
    try {
        db.get('cart_items').remove({ id_user: id_user }).write();
        console.log("Đã xóa các sản phẩm trong giỏ hàng");
    } catch (err) {
        console.log("Lỗi khi xóa giỏ hàng:", err);
        return res.status(500).json({ message: 'Lỗi server khi xóa giỏ hàng' });
    }

    // Trả về phản hồi thành công
    return res.status(201).json({ message: 'Đặt hàng thành công', orderId: newOrder.id });
});
// Lấy danh sách đơn hàng của 1 user
router.get('/orders/user', authenticateToken, (req, res) => {
    const id_user = req.user.id;
    try {
        const orders = db.get('orders').filter({ id_user: id_user }).value();

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không có đơn hàng nào' });
        }

        return res.status(200).json(orders);
    } catch (err) {
        console.log("Lỗi khi lấy đơn hàng:", err);
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
    }
});
// Lấy thông tin 1 order của user từ id_order
router.get('/orders/user/detail', authenticateToken, (req, res) => {
    // Lấy id_order từ query parameters
    const id_order = req.query.id_order; // Thay đổi từ req.body thành req.query
    console.log("id_order: " + id_order);
    // Tìm kiếm đơn hàng dựa trên id_order
    const order = db.get('orders').find({ id: id_order }).value();
    if (!order) {
        console.log("Khong tim thay order co id: " + id_order);
        console.log(order.id);
        return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });
    }

    const orderInfo = {
        id: order.id,
        date: order.date,
        status: order.status,
        subtotal_price: order.subtotal_price,
        shipping_price: order.shipping_price,
        total_price: order.total_price,
        payment_method: order.payment_method,
        note: order.note,
        name: order.name,
        telephone_number: order.telephone_number,
        email: order.email,
        nationality: order.nationality,
        province: order.province,
        district: order.district,
        ward: order.ward,
        street: order.street
    };

    // Gửi thông tin đơn hàng dưới dạng JSON
    res.json(orderInfo);
});
// Lấy danh sách order items của 1 order dựa trên id_order
router.get('/orders/user/items', authenticateToken, (req, res) => {
    // Lấy id_order từ query parameters
    const id_order = req.query.id_order;

    // Kiểm tra xem id_order có được cung cấp không
    if (!id_order) {
        return res.status(400).json({ message: 'Vui lòng cung cấp id_order' });
    }

    // Tìm tất cả các order_items liên quan đến id_order này
    const orderItems = db.get('order_items').filter({ id_order: id_order }).value();

    if (!orderItems || orderItems.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm nào cho đơn hàng này' });
    }
    const completeOrderItems = orderItems.map(item => {
        let completeItem = {
            id: item.id,
            id_product_variant: item.id_product_variant,
            category: item.category,
            quantity: item.quantity,
            ingredient: "",
            weight: "",
            size: "",
            color: ""
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

    // Trả về danh sách order_items dưới dạng JSON
    return res.status(200).json(completeOrderItems);
});

module.exports = router;