const http = require('http');
const qs = require('qs');
const url = require('url')
const PORT = 5000;
const { handlers } = require('./controller/handlers');
const fs = require('fs');
const getTemplate = require('./model/getTemplate');

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
            default:
                res.writeHead(301, { Location: '/' });
                res.end()
        }
    }
})

server.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
})