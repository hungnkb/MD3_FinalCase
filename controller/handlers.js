const sqlQuery = require('../model/query');
const getTemplate = require('../model/getTemplate');
const fs = require('fs');
const qs = require('qs');
const formidable = require('formidable');
const query = require('../model/query');
var cookie = require('cookie');

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

        let sqlCheckLogin = `select username, role from account where username = '${data.username}' and password = '${data.password}'`;
        let resultCheckLogin = await query.selectProduct(sqlCheckLogin);
        if (resultCheckLogin.length == 0) {
            res.writeHead(301, { 'Location': '/login' });
            res.end();
        } else {
            let fileSession = resultCheckLogin[0].username + '.txt';
            let dataSession = JSON.stringify(resultCheckLogin[0]);

            fs.writeFile('./sessions/' + fileSession, dataSession, err => {
                if (err) {
                    console.log(err);
                } else {
                    res.setHeader('Set-Cookie', [
                        cookie.serialize("u_user", resultCheckLogin[0].username),
                        cookie.serialize("u_role", resultCheckLogin[0].role)
                    ])

                    //role == 0 => admin;
                    // role == 1 => user; 
                    if (resultCheckLogin[0].role == 0) {
                        res.writeHead(301, { 'Location': '/product' });
                        res.end();
                    } else {
                        res.writeHead(301, { 'Location': '/home' });
                        res.end();
                    }

                }
            })
        }
    });

}

handlers.logout = (req, res) => {
    let cookies = req.headers.cookie;
    let dataCookie = cookie.parse(cookies);
    let nameSession = dataCookie.u_user;
    fs.unlink('./sessions/' + nameSession + '.txt', () => {
        res.writeHead(301, { 'Location': '/login' });
        res.end();
    })
}




module.exports = { handlers };