const http = require('http');
const qs = require('qs');
const url = require('url')
const PORT = 5000;
const { handlers } = require('./controller/handlers');
const fs = require('fs');
const getTemplate = require('./model/getTemplate');
const sessionCheck = require('./model/sessionCheck');

let mimeType = {
    "png": "image/png",
    "jpeg": "image/jpeg",
    "jpg": "image/jpg",
    'js': 'text/javascript',
    'css': 'text/css',
    'svg': 'image/svg+xml',
    'ttf': 'font/ttf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'eot': 'application/vnd.ms-fontobject'
}

const server = http.createServer(async (req, res) => {
    let getUrl = url.parse(req.url, true);
    let id = qs.parse(getUrl.query).id;
    let searchName = qs.parse(getUrl.query).name;
    let extensionType = getUrl.pathname.split(".")[1];
    let idCart = 0;


    if (mimeType[extensionType] !== undefined) {
        fs.readFile(__dirname + getUrl.pathname, (err, data) => {
            if (err) {
                throw new Error(err.message)
            }
            res.writeHead(200, { 'Content-Type': mimeType[extensionType] })
            res.write(data);
            return res.end();
        })
    } else {
        switch (getUrl.pathname) {
            case '/':
                handlers.showHomePage(req, res);
                break;
            case '/register':
                if (req.method == 'GET') {
                    handlers.showRegister(req, res);
                } else {
                    handlers.register(req, res);
                }
                break;
            case '/login':
                if (req.method == "GET") {
                    handlers.showLogin(req, res);
                } else {
                    handlers.login(req, res);
                }
                break;
            case '/logout':
                handlers.logout(req, res);
                break;
            case '/user-product':
                if (req.method == 'GET') {
                    handlers.showAllProduct(req, res);
                } else {
                    handlers.addCart(req, res);
                }
                break;
            case '/admin-product':
                let checkRole = await sessionCheck.checkRoleUser(req, res);
                if (checkRole == 'admin') {
                    handlers.showAllProductAdmin(req, res);
                } else {
                    handlers.showAllProduct(req, res);
                }
                break;
            case '/addproduct':
                if (req.method == 'GET') {
                    handlers.showAddProductAdmin(req, res)
                } else {
                    handlers.addProductAdmin(req, res);
                }
                break;
            case '/delete':
                handlers.deleteProductAdmin(id, req, res);
                break;
            case '/edit':
                if (req.method == 'GET') {
                    handlers.showEditProductAdmin(id, req, res);
                } else {
                    handlers.editProductAdmin(id, req, res);
                }
                break;
            case '/admin-user-manager':
                if (req.method == 'GET') {
                    handlers.showAllUserAdmin(req, res);
                }
                break;
            case '/showEditUser':
                let editIdAccount = getUrl.query.id;
                if (req.method == 'GET') {
                    handlers.showEditUser(editIdAccount, req, res);
                } else {
                    handlers.editUser(editIdAccount, req, res);
                }
                break;
            case '/cart':
                handlers.showCart(req, res);

                break;
            case '/addCart':
                if (req.method == 'POST') {
                    handlers.addCart(req, res);
                }
                break;
            case '/edit-cart':
                if (req.method == 'GET') {
                    // handlers.editCart(req, res);
                } else {
                    handlers.editCart(req, res);
                }
                break;
            case '/payment':
                if (req.method == 'GET') {
                    let idOrder = getUrl.query.idOrder;
                    handlers.payment(idOrder, req, res);
                }
                break;
            case '/admin-financial-report':
                handlers.financialReport(req, res)
                break;
            default:
                res.writeHead(301, { Location: '/' });
                res.end();
                break;
        }
    }
})

server.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
})