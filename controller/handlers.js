const sqlQuery = require('../model/query');
const getTemplate = require('../model/getTemplate');
const fs = require('fs');
const qs = require('qs');
const formidable = require('formidable');
const query = require('../model/query');
const cookie = require('cookie');
const sessionCheck = require('../model/sessionCheck');
const checkUserNameEmail = require('../model/checkUsernameEmail');


let handlers = {};

handlers.showHomePage = async (req, res) => {
    let html = await getTemplate.readHtml('./view/home.html')
    sessionCheck.check(html, req, res)
}

handlers.showRegister = async (req, res) => {
    let html = await getTemplate.readHtml('./view/user/register.html');
    sessionCheck.check(html, req, res);
}

handlers.register = async (req, res) => {
    let data = '';

    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', async () => {
        data = qs.parse(data);

        let inputUsername = data.username;
        let inputEmail = data.email;


        let checkUsernameEmail = await checkUserNameEmail.check(inputUsername, inputEmail)
        let html = await getTemplate.readHtml('./view/user/register.html');
        switch (checkUsernameEmail) {
            // result == 0 => Username && Email is not exist
            // result == 1 => Only Username is exist
            // result == 2 => Only Email is exist
            // result == 3 => Username && Email is exist
            case 0:
                let sqlAddUser = `call addUser("${data.name}","${inputUsername}", "${data.password}", "${data.phone}", "${inputEmail}", "${data.address}");`

                await query.selectProduct(sqlAddUser);
                res.writeHead(301, { 'Location': '/login' });
                res.end();
                break;
            case 1:
                html = html.replace('{isValidUsername}', 'is-invalid');
                html = html.replace('{feedback-user}', 'This username is exist, please try again.');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
            case 2:
                html = html.replace('{isValidEmail}', 'is-invalid');
                html = html.replace('{feedback-email}', 'This email is exist, please try again.');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
            case 3:
                html = html.replace('{isValidEmail}', 'is-invalid');
                html = html.replace('{isValidUsername}', 'is-invalid');
                html = html.replace('{feedback-user}', 'This username is exist, please try again.');
                html = html.replace('{feedback-email}', 'This email is exist, please try again.');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
        }
    })


    // checkUserNameEmail.checkEmailAvailable();

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

handlers.showAllProduct = async (req, res) => {
    let sql = `call showAllProduct()`;
    let product = await query.selectProduct(sql);
    let htmlP = '';
    product[0].forEach(p => {
        htmlP += `<tr><td>${p.idProduct}</td><td>${p.name}</td><td>${p.nameCategories}</td><td>${p.priceCategories}</td><td><img src="/public/images/${p.imgsrc}"></td><td><a href="addCart?id=${p.idProduct}"><button type="button"class="btn btn-dark btn-sm">Add to cart</button></a></td></tr>
        `
    });
    let html = await getTemplate.readHtml('./view/user/showProduct.html');
    html = html.replace('{product-list}', htmlP);

    sessionCheck.check(html, req, res)

}



module.exports = { handlers };