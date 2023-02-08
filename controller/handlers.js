const sqlQuery = require('../model/query');
const getTemplate = require('../model/getTemplate');
const fs = require('fs');
const qs = require('qs');
const formidable = require('formidable');

let handlers = {};

handlers.showHomePage = async (req, res) => {
    let html = await getTemplate.readHtml('./view/home.html')
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

handlers.showLogin = async (req, res) => {
    let html = await getTemplate.readHtml('./view/user/login.html')
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

handlers.login = async (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', async () => {
        data = qs.parse(data);
        console.log(data);

        
    })
}


module.exports = { handlers };