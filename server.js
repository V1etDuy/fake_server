const jsonServer = require("json-server");
const auth = require("json-server-auth");
const queryString = require("query-string");
const server = jsonServer.create();
const router = jsonServer.router("data.json");
const middlewares = jsonServer.defaults();

// Import các route
const authRoutes = require('./routes/authRoutes');
const serverRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const commentRoutes = require('./routes/commentRoutes');
const cartRoutes = require('./routes/cartItemRoutes');
server.use(middlewares);
server.use(auth);
server.use(jsonServer.bodyParser);
server.db = router.db;

// Sử dụng các route đã import
server.use('/api', authRoutes);
server.use("/api", serverRoutes);
server.use("/api", productRoutes);
server.use("/api", commentRoutes);
server.use("/api", cartRoutes);

server.get('/test', (req, res) => {
    res.jsonp({ message: "Test route is working!" });
});

server.use((req, res, next) => {
    if (req.method === "POST") {
        req.body.createdAt = Date.now();
        req.body.updatedAt = Date.now();
    }
    next();
});

router.render = (req, res) => {
    const headers = res.getHeaders();
    const totalCountHeader = headers["x-total-count"];
    if (req.method === "GET" && totalCountHeader) {
        const queryParams = queryString.parse(req._parsedOriginalUrl.query);
        const results = {
            data: res.locals.data,
            pagination: {
                _page: Number.parseInt(queryParams._page) || 1,
                _limit: Number.parseInt(queryParams._limit) || 10,
                _totalRows: Number.parseInt(totalCountHeader),
            },
        };
        return res.jsonp(results);
    }
    return res.jsonp(res.locals.data);
};

server.use("/api", router);
server.listen(4444, () => {
    console.log("JSON Server is running");
    console.log("http://localhost:4444");
});
