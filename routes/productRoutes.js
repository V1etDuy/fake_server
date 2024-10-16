const express = require("express");
const router = express.Router();
const db = require("json-server").router("data.json").db; // Truy cập database

// API để lấy tất cả sản phẩm loại "pet"
router.get('/products/pet', (req, res) => {
    // Lấy danh sách sản phẩm loại pet từ data.json
    const petProducts = db.get('pet').value(); // Tìm tất cả sản phẩm loại pet
    const allProducts = db.get('products').value(); // Tìm tất cả sản phẩm

    const petProductList = petProducts.map(pet => {
        // Tìm sản phẩm tương ứng với id_product trong danh sách allProducts
        const product = allProducts.find(prod => prod.id === pet.id_product && prod.status === 1); // Kiểm tra status
        if (product) {
            return {
                ...product, // Kết hợp các thuộc tính của sản phẩm
                price: pet.price // Gán giá cho sản phẩm
            };
        }
        return null; // Trả về null nếu không tìm thấy sản phẩm có status = 1
    }).filter(item => item !== null); // Loại bỏ các sản phẩm null

    if (petProductList.length > 0) {
        res.jsonp(petProductList);
    } else {
        res.status(404).jsonp({ message: "Không có sản phẩm nào" });
    }
});

router.get('/products/food', (req, res) => {
    // Lấy danh sách sản phẩm từ bảng product
    const allProducts = db.get('products').filter(product => product.category === "food" && product.status === 1).value();

    // Lấy danh sách food 
    const foods = db.get('food').value();

    // Tạo một Map để lưu trữ các sản phẩm đã được kết hợp với variations
    const productMap = new Map();

    // Kết hợp sản phẩm với các biến thể tương ứng
    foods.forEach(food => {
        // Tìm sản phẩm tương ứng với id_product trong danh sách allProducts
        const product = allProducts.find(prod => prod.id === food.id_product);
        if (product) {
            if (!productMap.has(product.id)) {
                // Nếu sản phẩm chưa có trong Map, thêm sản phẩm vào và khởi tạo mảng variations_food
                productMap.set(product.id, {
                    ...product,
                    variations_food: []
                });
            }
            // Thêm biến thể vào sản phẩm
            const currentProduct = productMap.get(product.id);
            currentProduct.variations_food.push({
                id_variation: food.id,
                ingredient: food.ingredient,
                weight: food.weight,
                price: food.price
            });
        }
    });

    // Chuyển Map thành array để trả về
    const productList = Array.from(productMap.values());

    if (productList.length > 0) {
        res.jsonp(productList);
    } else {
        res.status(404).jsonp({ message: "Không có sản phẩm nào thuộc danh mục này" });
    }
});
router.get('/products/supplies', (req, res) => {
    // Lấy danh sách sản phẩm có category = 3 từ bảng product
    const allProducts = db.get('products').filter(prod => prod.category === "supplies" && prod.status === 1).value();

    // Lấy danh sách các variations từ bảng supplies
    const supplies = db.get('supplies').value();

    // Kết hợp sản phẩm với các biến thể tương ứng
    const productList = allProducts.map(product => {
        // Tìm các variations tương ứng với id_product trong danh sách supplies
        const productVariations = supplies
            .filter(supply => supply.id_product === product.id) // Lọc các variations theo id_product
            .map(supply => ({
                id_variation: supply.id,
                color: supply.color,
                size: supply.size,
                price: supply.price
            }));

        return {
            ...product, // Kết hợp thông tin sản phẩm
            variations_supplies: productVariations // Thêm danh sách variations
        };
    });

    // Trả về danh sách sản phẩm với variations
    if (productList.length > 0) {
        res.jsonp(productList);
    } else {
        res.status(404).jsonp({ message: "Không có sản phẩm nào thuộc danh mục này" });
    }
});
//-------------------------------DETAILS-----------------------------------------
// API lấy thông tin chi tiết của food cùng với thông tin sản phẩm
router.get('/food/:id', (req, res) => {
    const foodId = req.params.id; // Lấy ID từ tham số URL

    // Lấy thông tin food theo ID
    const food = db.get('food').find({ id_product: foodId }).value(); // Sử dụng id thay vì id_product

    if (!food) {
        return res.status(404).jsonp({ message: "Food không tồn tại" });
    }

    // Lấy thông tin sản phẩm tương ứng
    const product = db.get('products').find({ id: food.id_product }).value();

    if (!product) {
        return res.status(404).jsonp({ message: "Sản phẩm không tồn tại" });
    }

    // Lấy tất cả variations của sản phẩm từ bảng food
    const allVariations = db.get('food').filter({ id_product: product.id }).value();

    // Tạo mảng variations_food từ allVariations
    const variationsFood = allVariations.map(variation => ({
        id_variation: variation.id,
        ingredient: variation.ingredient,
        weight: variation.weight,
        price: variation.price,
        quantity: variation.quantity
    }));

    // Tạo đối tượng response
    const responseData = {
        id: product.id,
        category: product.category,
        name: product.name,
        description: product.description,
        image: product.image,
        status: product.status,
        date_created: product.date_created,
        rating: product.rating,
        pet_type: food.pet_type,
        nutrition_info: food.nutrition_info,
        expire_date: food.expire_date,
        brand: food.brand,
        date_created: food.date_created,
        variations_food: variationsFood,
    };

    res.jsonp(responseData);
});
// API lấy thông tin chi tiết của food cùng với thông tin sản phẩm
router.get('/supplies/:id', (req, res) => {
    const supplyId = req.params.id; // Lấy ID từ tham số URL

    // Lấy thông tin food theo ID
    const supply = db.get('supplies').find({ id_product: supplyId }).value(); 

    if (!supply) {
        return res.status(404).jsonp({ message: "Supply không tồn tại" });
    }

    // Lấy thông tin sản phẩm tương ứng
    const product = db.get('products').find({ id: supply.id_product }).value();

    if (!product) {
        return res.status(404).jsonp({ message: "Sản phẩm không tồn tại" });
    }

    // Lấy tất cả variations của sản phẩm từ bảng supply
    const allVariations = db.get('supplies').filter({ id_product: product.id }).value();

    // Tạo mảng variations_supplies từ allVariations
    const variationsSupplies = allVariations.map(variation => ({
        id_variation: variation.id,
        color: variation.color,
        size: variation.size,
        price: variation.price,
        quantity: variation.quantity
    }));

    // Tạo đối tượng response
    const responseData = {
        id: product.id,
        category: product.category,
        name: product.name,
        description: product.description,
        image: product.image,
        status: product.status,
        date_created: product.date_created,
        rating: product.rating,
        material: supply.material,
        type: supply.type,
        expire_date: supply.expire_date,
        brand: supply.brand,
        date_created: supply.date_created,
        variations_supplies: variationsSupplies,
    };

    res.jsonp(responseData);
});

// API lấy thông tin chi tiết của food cùng với thông tin sản phẩm
router.get('/pets/:id', (req, res) => {
    const petId = req.params.id; // Lấy ID từ tham số URL

    // Lấy thông tin pet theo ID
    const pet = db.get('pet').find({ id_product: petId }).value(); 

    if (!pet) {
        return res.status(404).jsonp({ message: "Pet không tồn tại" });
    }

    // Lấy thông tin sản phẩm tương ứng
    const product = db.get('products').find({ id: pet.id_product }).value();

    if (!product) {
        return res.status(404).jsonp({ message: "Sản phẩm không tồn tại" });
    }

    // Tạo đối tượng response
    const responseData = {
        id: product.id,
        category: product.category,
        name: product.name,
        description: product.description,
        image: product.image,
        status: product.status,
        date_created: product.date_created,
        rating: product.rating,
        gender: pet.gender,
        health: pet.health,
        father: pet.father,
        mother: pet.mother,
        type: pet.type,
        deworming: pet.deworming,
        vaccine: pet.vaccine,
        breed: pet.breed,
        breed_origin: pet.breed_origin,
        trait: pet.trait,
        date_of_birth: pet.date_of_birth,
        quantity: pet.quantity,
        price: pet.price,
    };

    res.jsonp(responseData);
});

router.get('/products/test', (req, res) => {
    res.jsonp({ message: "Test route is working!" });
});

// API để lấy chi tiết sản phẩm theo ID
router.get('/products/:id', (req, res) => {
    const { id } = req.params;
    const product = db.get('products').find({ id }).value(); // Tìm sản phẩm theo ID

    if (product) {
        res.jsonp(product);
    } else {
        res.status(404).jsonp({ message: "Sản phẩm không tồn tại" });
    }
});

module.exports = router;
