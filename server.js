const http = require('http');
const qs = require('qs');
const url = require('url')
const PORT = 5000;
const { handlers } = require('./controller/handlers');
const fs = require('fs');

let mimeType = {
    "png": "image/png",
    "jpeg": "image/jpeg",
    "jpg": "image/jpg",
}

const server = http.createServer(async (req, res) => { 
    let getUrl = url.parse(req.url, true);
    let id = qs.parse(getUrl.query).id;
    let searchName = qs.parse(getUrl.query).name;
    let extensionType = getUrl.pathname.split(".")[1];


})

server.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
})