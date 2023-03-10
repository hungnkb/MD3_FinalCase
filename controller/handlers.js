const sqlQuery = require('../model/query');
const getTemplate = require('../model/getTemplate');
const fs = require('fs');
const qs = require('qs');
const formidable = require('formidable');
const query = require('../model/query');
const cookie = require('cookie');
const sessionCheck = require('../model/sessionCheck');
const checkUserNameEmail = require('../model/checkUsernameEmail');
const modalAddCart = require('../model/modalAddCart');
const modalEditCart = require('../model/modalEditCart');
const modalPaymentCart = require('../model/modalPaymentCart');
const checkCart = require('../model/checkCart');



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

let handlers = {};

handlers.showHomePage = async (req, res) => {
    let html = '';
    let productsSql = `
    select p.idProduct, p.imgsrc, p.name, c.priceCategories, c.nameCategories from product as p
    join categories as c on p.idCategories = c.idCategories
    `
    let products = await query.selectProduct(productsSql);
    let htmlProducts = ``
    for (let i = 0; i < products.length; i++) {
        htmlProducts += `
        <div class="card m-2" style="width: 18rem;">
                <img style="width: 238px; height: 264px;" src="/public/images/${products[i].imgsrc}" class="card-img-top" alt="...">
                <div class="card-body">
                    <h5 class="card-title">${products[i].name}</h5>
                    <p class="card-title">Size ${products[i].nameCategories}</p>
                    <p class="card-text">${products[i].priceCategories.toLocaleString('en-US')}</p>
                    <div>${modalAddCart.str(products[i].idProduct, products[i].name, products[i].nameCategories, products[i].amount)}
                </div>
            </div>
        `
    }
    sessionCheck.checkSession(req, res).then(async () => {
        let cookies = req.headers.cookie;
        let account = cookie.parse(cookies).u_user;
        let idAccount = await query.selectProduct(`select idAccount from account where username = '${account}'`);
        idAccount = idAccount[0].idAccount;

        let checkRole = await sessionCheck.checkRoleUser(req);
        if (checkRole == 'admin') {
            res.writeHead(301, { 'Location': '/admin-product' });
            res.end()
        } else {

            let cart = await checkCart.check(idAccount);
            html = await getTemplate.readHtml('./view/home.html');
            html = html.replace('{cart-count}', cart.length);
            html = html.replace('{list-product}', htmlProducts);
            sessionCheck.check(html, req, res);
        }
    })
        .catch(async (err) => {
            html = await getTemplate.readHtml('./view/home.html');
            html = html.replace('{hidden-logout}', 'hidden');
            html = html.replace('{hidden-cart}', 'hidden');
            html = html.replace('{list-product}', htmlProducts);
            sessionCheck.check(html, req, res);
        })
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
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
            case 2:
                html = html.replace('{isValidEmail}', 'is-invalid');
                html = html.replace('{feedback-email}', 'This email is exist, please try again.');
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
            case 3:
                html = html.replace('{isValidEmail}', 'is-invalid');
                html = html.replace('{isValidUsername}', 'is-invalid');
                html = html.replace('{feedback-user}', 'This username is exist, please try again.');
                html = html.replace('{feedback-email}', 'This email is exist, please try again.');
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
        }
    })

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

        htmlP += `<tr><td>${p.idProduct}</td><td>${p.name}</td><td>${p.nameCategories}</td><td>${p.priceCategories.toLocaleString('en-US')}</td><td><img style="width: 200px;" src="/public/images/${p.imgsrc}"></td>
        <td>${modalAddCart.str(p.idProduct, p.name, p.nameCategories, p.amount)}</td></tr>`

    });
    let cookies = req.headers.cookie;
    let account = cookie.parse(cookies).u_user;
    let idAccount = await query.selectProduct(`select idAccount from account where username = '${account}'`);
    idAccount = idAccount[0].idAccount;
    let cart = await checkCart.check(idAccount);
    let html = await getTemplate.readHtml('./view/user/showProduct.html');
    html = html.replace('{product-list}', htmlP);
    html = html.replace('{cart-count}', cart.length);

    sessionCheck.check(html, req, res)

}

handlers.showAllProductAdmin = async (req, res) => {
    let sql = `call showAllProduct()`;
    let product = await query.selectProduct(sql);
    let htmlP = '';
    for (let p of product[0]) {
        htmlP += `<tr><td>${p.idProduct}</td><td>${p.name}</td><td>${p.nameCategories}</td><td>${p.priceCategories.toLocaleString('en-US')}</td><td><img style="width: 200px;" src="/public/images/${p.imgsrc}"></td>
        <td>${p.amount}</td>
        <td><a href="edit?id=${p.idProduct}"><button type="button"class="btn btn-dark btn-sm">Edit</button></a>  <a href="delete?id=${p.idProduct}">
        <button onclick="return confirm('Are you sure?')" type="button"class="btn btn-dark btn-sm">Delete</button></a></td></tr>
        `
    }
    let html = await getTemplate.readHtml('./view/admin/showProduct.html');
    html = html.replace('{product-list}', htmlP);
    html = html.replace('{hidden-register}', 'hidden');
    html = html.replace('{hidden-login}', 'hidden');
    html = html.replace('{hidden-cart}', 'hidden');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

handlers.showEditProductAdmin = async (id, req, res) => {
    let sql = `select p.idProduct, p.name, p.amount, p.imgsrc, p.idCategories, c.nameCategories from product as p
    join categories as c on c.idCategories = p.idCategories
    where idProduct = ${id}`
    let data = await query.selectProduct(sql);
    let name = data[data.length - 1].name;
    let amount = data[data.length - 1].amount;
    let imgsrc = data[data.length - 1].imgsrc;
    let idCategories = data[data.length - 1].idCategories;
    let nameCategories = data[data.length - 1].nameCategories;

    let html = await getTemplate.readHtml('./view/admin/editProduct.html');
    html = html.replace("{name-default}", name);
    html = html.replace("{amount-default}", amount);
    html = html.replace("{imgsrc-default}", imgsrc);
    html = html.replace("{idCategory-default}", idCategories);
    html = html.replace("{nameCategory-default}", nameCategories);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

handlers.editProductAdmin = async (id, req, res) => {

    let form = new formidable.IncomingForm();
    form.uploadDir = './public/images/';
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.end(err.message);
        } else {
            let tmpPath = files.imgsrc.filepath;
            let newPath = (form.uploadDir + files.imgsrc.originalFilename).split(" ").join('');
            let newImg = files.imgsrc.originalFilename.split(" ").join('');

            fs.rename(tmpPath, newPath, async (err) => {
                if (err) {
                    throw err;
                } else {

                    let fileType = files.imgsrc.mimetype;
                    let mimeTypes = ["image/jpeg", "image/jpg", "image/png"];

                    if (mimeTypes.indexOf(fileType) == -1) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });

                        return res.end('File is not correct format: png, jpeg, jpg');
                    } else {
                        let sqlFirstProduct = `select name from product where idProduct = ${id}`
                        let nameFirst = await query.selectProduct(sqlFirstProduct);
                        let sqlAllProduct = `select * from product where not name = '${nameFirst}'`
                        let allProduct = await query.selectProduct(sqlAllProduct);

                        let isNameExist = false;
                        let index = 0;
                        for (let i = 0; i < allProduct.length; i++) {
                            if (allProduct[i].idProduct == id) {
                                index = i;
                            }
                        }
                        for (let i = 0; i < allProduct.length; i++) {
                            if (fields.name == allProduct[i].name && fields.idCategory == allProduct[i].idCategories && i != index) {
                                isNameExist = true;
                                break;
                            }
                        }

                        if (!isNameExist) {
                            let updateProductSql = `update product set name = "${fields.name}", amount = '${fields.amount}', imgsrc = "${newImg}", idCategories = ${fields.idCategory} where idProduct = ${id}`
                            await query.selectProduct(updateProductSql).catch((err) => {
                                console.log(err);
                            });
                            html = await getTemplate.readHtml('./view/admin/showProduct.html');

                            res.writeHead(301, { 'Location': '/admin-product' });
                            res.write(html);
                            res.end();
                        } else {
                            console.log(123);
                            html = await getTemplate.readHtml('./view/admin/addProduct.html');
                            html = html.replace('{isValidName}', 'is-invalid');
                            html = html.replace('{feedback-name}', 'This product is exist. Please try again');
                            html = html.replace('{hidden-login}', 'hidden');
                            html = html.replace('{hidden-sigup}', 'hidden');
                            html = html.replace('{hidden-cart}', 'hidden');
                            res.writeHead(400, { 'Content-Type': 'text/html' });
                            res.write(html);
                            res.end();
                        }
                    }
                }
            })
        }
    })
}

handlers.showAddProductAdmin = async (req, res) => {
    let html = await getTemplate.readHtml('./view/admin/addProduct.html');
    html = html.replace('{hidden-register}', 'hidden');
    html = html.replace('{hidden-login}', 'hidden');
    html = html.replace('{hidden-cart}', 'hidden');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

handlers.addProductAdmin = async (req, res) => {
    let html = '';
    let form = new formidable.IncomingForm();
    form.uploadDir = './public/images/';
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.end(err.message);
        } else {
            let tmpPath = files.imgsrc.filepath;
            let newPath = (form.uploadDir + files.imgsrc.originalFilename).split(" ").join('');
            let newImg = files.imgsrc.originalFilename.split(" ").join('');

            fs.rename(tmpPath, newPath, async (err) => {
                if (err) {
                    throw err;
                } else {

                    let fileType = files.imgsrc.mimetype;
                    let mimeTypes = ["image/jpeg", "image/jpg", "image/png"];

                    if (mimeTypes.indexOf(fileType) == -1) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        return res.end('File is not correct format: png, jpeg, jpg');
                    } else {
                        let isProductExist = `select * from product where name = '${fields.name}' and idCategories = ${fields.idCategory}`
                        let resultCheck = await query.selectProduct(isProductExist);

                        if (resultCheck.length == 0) {
                            let sqlAddProduct = `call addProduct("${fields.name}", "${fields.amount}","${newImg}", "${fields.idCategory}")`
                            await query.selectProduct(sqlAddProduct);
                            html = await getTemplate.readHtml('./view/admin/showProduct.html');

                            res.writeHead(301, { 'Location': '/admin-product' });
                            res.write(html);
                            res.end();
                        } else {
                            html = await getTemplate.readHtml('./view/admin/addProduct.html');
                            html = html.replace('{isValidName}', 'is-invalid');
                            html = html.replace('{feedback-name}', 'This product is exist. Please try again');
                            res.writeHead(400, { 'Content-Type': 'text/html' });
                            res.write(html);
                            res.end();
                        }
                    }
                }
            })
        }
    })

}

handlers.deleteProductAdmin = async (id, req, res) => {
    let sqlDelete = `delete from product where idProduct = ${id}`;
    await query.selectProduct(sqlDelete);
    res.writeHead(301, { 'Location': '/admin-product' });
    res.end();
}

handlers.showAllUserAdmin = async (req, res) => {
    let userListSql = `select * from account`;
    let userList = await query.selectProduct(userListSql);
    let htmlU = '';
    for (let i = 0; i < userList.length; i++) {
        if (userList[i].role == 0) {
            htmlU += `
            <tr>
            <td>${userList[i].name}</td>
            <td>${userList[i].UserName}</td>
            <td>${userList[i].Password}</td>
            <td>${userList[i].phoneNumber}</td>
            <td>${userList[i].Email}</td>
            <td>${userList[i].Address}</td>
            <td>admin</td>
            <td>
            <a href="/showEditUser?id=${userList[i].idAccount}">
            <button type="button"class="btn btn-dark btn-sm">Edit</button></a>  
            <a href="/deleteUser?id=${userList[i].idAccount}">
            <button type="button"class="btn btn-dark btn-sm">Delete</button></a>
            </td>
            </tr>
            `
        }
        else {
            htmlU += `
            <tr>
            <td>${userList[i].name}</td>
            <td>${userList[i].UserName}</td>
            <td>${userList[i].Password}</td>
            <td>${userList[i].phoneNumber}</td>
            <td>${userList[i].Email}</td>
            <td>${userList[i].Address}</td>
            <td>user</td>
            <td>
            <a href="/showEditUser?id=${userList[i].idAccount}">
            <button type="button"class="btn btn-dark btn-sm">Edit</button></a>  
            <a href="/deleteUser?id=${userList[i].idAccount}">
            <button type="button"class="btn btn-dark btn-sm">Delete</button></a>
            </td>
            </tr>
            `
        }

    }
    let html = await getTemplate.readHtml('./view/admin/showUser.html');
    html = html.replace('{user-list}', htmlU);
    sessionCheck.check(html, req, res)
}

handlers.showAddUser = async (req, res) => {
    let html = await getTemplate.readHtml('./view/admin/addUser.html');
    await sessionCheck.check(html, req, res);
}

handlers.addUser = async (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    })
    req.on('end', async () => {
        data = qs.parse(data);
        let result = await checkUserNameEmail.check(data.username, data.email);
        switch (result) {
            case 0:
                let sqlAddUser = `call addUser("${data.name}","${data.username}", "${data.password}", "${data.phone}", "${data.email}", "${data.address}");`

                await query.selectProduct(sqlAddUser);
                res.writeHead(301, { 'Location': '/login' });
                res.end();
                break;
            case 1:
                html = html.replace('{isValidUsername}', 'is-invalid');
                html = html.replace('{feedback-user}', 'This username is exist, please try again.');
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
            case 2:
                html = html.replace('{isValidEmail}', 'is-invalid');
                html = html.replace('{feedback-email}', 'This email is exist, please try again.');
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
            case 3:
                html = html.replace('{isValidEmail}', 'is-invalid');
                html = html.replace('{isValidUsername}', 'is-invalid');
                html = html.replace('{feedback-user}', 'This username is exist, please try again.');
                html = html.replace('{feedback-email}', 'This email is exist, please try again.');
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
                break;
        }
    })
}

handlers.deleteUser = async (idAccount, req, res) => {
    let deleteUserSql = `delete from account where idAccount = ${idAccount}`;
    await query.selectProduct(deleteUserSql);
    res.writeHead(301, { 'Location': '/admin-user-manager' });
    res.end()
}

handlers.showEditUser = async (editIdAccount, req, res) => {
    let userDataSql = `select * from account where idAccount = ${editIdAccount}`;
    let user = await query.selectProduct(userDataSql);
    user = user[0];

    let html = await getTemplate.readHtml('./view/admin/editUser.html');
    html = html.replace('{default-username}', user.UserName);
    html = html.replace('{default-name}', user.name);
    html = html.replace('{default-password}', user.Password);
    html = html.replace('{default-email}', user.Email);
    html = html.replace('{default-phonenumber}', user.phoneNumber);
    html = html.replace('{default-address}', user.Address);
    if (user.role == 0) {
        html = html.replace('{default-role}', 'Admin');
        html = html.replace('{default-value-role}', user.role);
    } else {
        html = html.replace('{default-role}', user.role);
    }
    sessionCheck.check(html, req, res);
}

handlers.editUser = async (editIdAccount, req, res) => {
    let userDataSql = `select * from account where idAccount = ${editIdAccount}`;
    let user = await query.selectProduct(userDataSql);
    user = user[0];


    let data = ''
    req.on('data', chunk => {
        data += chunk;
    })
    req.on('end', async () => {

        data = qs.parse(data);

        let html = await getTemplate.readHtml('./view/admin/editUser.html');

        let resultCheckUsernameEmail = await checkUserNameEmail.checkEditUser(editIdAccount, data.username, data.email);
        // result == 0 => Username && Email is not exist
        // result == 1 => Only Username is exist
        // result == 2 => Only Email is exist
        // result == 3 => Username && Email is exist

        if (resultCheckUsernameEmail == 0) {
            let editUserSql = `update account 
            set name = '${data.name}', UserName = '${data.username}', Password = '${data.password}', email = '${data.email}', phoneNumber = '${data.phone}',
            role = ${data.role}, address = '${data.address}' where idAccount = ${editIdAccount}`
            await query.selectProduct(editUserSql);
            res.writeHead(301, { 'Location': '/admin-user-manager' });
            return res.end();
        } else if (resultCheckUsernameEmail == 1) {
            html = html.replace('{isValidUsername}', 'is-invalid');
            html = html.replace('{feedback-user}', 'This Username is exist, please try again.');
        } else if (resultCheckUsernameEmail == 2) {
            html = html.replace('{isValidEmail}', 'is-invalid');
            html = html.replace('{feedback-email}', 'This Email is exist, please try again.');
        } else if (resultCheckUsernameEmail == 3) {
            html = html.replace('{isValidUsername}', 'is-invalid');
            html = html.replace('{feedback-user}', 'This Username is exist, please try again.');
            html = html.replace('{isValidEmail}', 'is-invalid');
            html = html.replace('{feedback-email}', 'This Email is exist, please try again.');
        }

        html = html.replace('{default-username}', data.username);
        html = html.replace('{default-name}', data.name);
        html = html.replace('{default-password}', data.password);
        html = html.replace('{default-email}', data.email);
        html = html.replace('{default-phonenumber}', data.phone);
        html = html.replace('{default-address}', data.address);
        if (data.role == 0) {
            html = html.replace('{default-role}', 'Admin');
            html = html.replace('{default-value-role}', data.role);
        } else {
            html = html.replace('{default-role}', data.role);
        }

        sessionCheck.check(html, req, res);
    })
}

handlers.showCart = async (req, res) => {
    let cookies = req.headers.cookie;
    let account = cookie.parse(cookies).u_user;
    let idAccount = await query.selectProduct(`select idAccount from account where username = '${account}'`);
    idAccount = idAccount[0].idAccount;
    let html = await getTemplate.readHtml('./view/user/cart.html');
    let dataCartSql = `select T.idOrder, T.idProduct, T.name, T.nameCategories, T.priceCategories, T.imgsrc, T.amountProduct, T.statusPayment from (
        select tOrder.idAccount ,tOrder.idOrder, od.idProduct, p.name, p.imgsrc, c.nameCategories, c.priceCategories,od.amountProduct, torder.statusPayment  from tOrder
        join orderDetail as od on tOrder.idOrder = od.idOrder
        join product as p on od.idProduct = p.idProduct
        join categories as c on c.idCategories = p.idCategories
        join account as a on a.idAccount = tOrder.idAccount
        ) as T where T.idAccount = ${idAccount} and T.statusPayment = 'cart';`
    let htmlP = '';
    let htmlPayment = ''
    query.selectProduct(dataCartSql)
        .then(async (result) => {
            htmlPayment = `${modalPaymentCart.str(result[result.length - 1].idOrder)}`

            for (let i = 0; i < result.length; i++) {
                htmlP += `
                <tr>
                    <td>${result[i].idOrder}</td>
                    <td>${result[i].name}</td>
                    <td>${result[i].nameCategories}</td>
                    <td><img style="width: 200px;" src="/public/images/${result[i].imgsrc}"></td>
                    <td>${result[i].priceCategories.toLocaleString('en-US')}</td>
                    <td>${result[i].amountProduct}</td>
                    <td>${result[i].statusPayment}</td>
                    <td>${modalEditCart.str(result[i].idProduct, result[i].idOrder, result[i].name, result[i].nameCategories, result[i].amount)}</td>
                </tr>
                `
            }

            let paymentSql = `select o.idOrder, od.idProduct, (od.amountProduct * c.priceCategories) as subtotal from torder as o 
            join orderdetail as od on od.idOrder = o.idOrder
            join product as p on od.idProduct = p.idProduct
            join categories as c on p.idCategories = c.idCategories
            where o.idOrder = ${result[result.length - 1].idOrder}`

            let payments = await query.selectProduct(paymentSql);
            let payment = 0;
            for (let i = 0; i < payments.length; i++) {
                payment += payments[i].subtotal
            }
            // end total

            html = html.replace('{cart-count}', result.length);
            html = html.replace('{product-list}', htmlP);
            html = html.replace('{modal-payment}', htmlPayment);
            html = html.replace('{total-cart}', payment.toLocaleString('en-US'))

            sessionCheck.check(html, req, res);

        })
        .catch(() => {

            html = html.replace('{modal-payment}', 'Total');
            html = html.replace('{total-cart}', 0)
            html = html.replace('{cart-count}', 0);
            html = html.replace('{product-list}', '');
            sessionCheck.check(html, req, res);
        })
}


handlers.addCart = async (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    })
    req.on('end', async () => {
        data = qs.parse(data);
        let cookies = req.headers.cookie;
        let account = cookie.parse(cookies).u_user;

        let idAccount = await query.selectProduct(`select idAccount from account where username = '${account}'`);
        idAccount = idAccount[0].idAccount;
        let dataOrderSql = `select * from tOrder where idAccount = ${idAccount}`;
        let dataOrder = query.selectProduct(dataOrderSql).then(async (result) => {
            if (result.length == 0 || (result.length > 0 && result[result.length - 1].statusPayment == 'paid')) {
                let cartOrderSql = `call addCartOrder(${idAccount}, 'cart')`;
                await query.selectProduct(cartOrderSql);
                let idOrder = await query.selectProduct(`select idOrder from torder order by idOrder asc`);

                idOrder = idOrder[idOrder.length - 1].idOrder;


                let cartOrderDetailSql = `call addCartOrderDetail(${idOrder}, ${data.id}, ${data.amount})`;
                await query.selectProduct(cartOrderDetailSql);

                res.writeHead(301, { 'Location': '/cart' });
                res.end();
            } else if (result.length > 0 && result[result.length - 1].statusPayment == 'cart') {
                let idOrder2 = await query.selectProduct(`select idOrder from torder where idAccount = ${idAccount}`);
                idOrder2 = idOrder2[result.length - 1].idOrder;
                let idProducts = await query.selectProduct(`select idProduct from orderdetail where idOrder = ${idOrder2}`)
                let isIdProductExist = true;
                for (let i = 0; i < idProducts.length; i++) {
                    if (idProducts[i].idProduct == data.id) {
                        isIdProductExist = true;
                        break;
                    } else {
                        isIdProductExist = false;
                    }
                }

                if (isIdProductExist == false) {
                    let addOrderDetail = `call addCartOrderDetail('${idOrder2}', '${data.id}', '${data.amount}')`;
                    await query.selectProduct(addOrderDetail);
                    res.writeHead(301, { 'Location': '/cart' });
                    res.end();
                } else {
                    let idOrder = await query.selectProduct(`select idOrder from torder where idAccount = ${idAccount} and statusPayment = 'cart'`);
                    idOrder = idOrder[idOrder.length - 1].idOrder;
                    let checkOrderDetailExist = `select * from orderDetail where idOrder = ${idOrder}`;
                    let result = await query.selectProduct(checkOrderDetailExist);
                    if (result.length == 0) {
                        let cartOrderDetailSql = `call addCartOrderDetail('${idOrder}', '${data.id}', '${data.amount}')`;
                        await query.selectProduct(cartOrderDetailSql);
                        res.writeHead(301, { 'Location': '/cart' });
                        res.end();
                    } else {
                        let addProductInCartSql = `update orderDetail set amountProduct = (amountProduct + '${data.amount}') where idOrder = '${idOrder}' and idProduct = '${data.id}'`;
                        await query.selectProduct(addProductInCartSql);
                        res.writeHead(301, { 'Location': '/cart' });
                        res.end();
                    }
                }
            }
        });
    })
}

handlers.editCart = async (req, res) => {
    data = '';
    req.on('data', chunk => {
        data += chunk;
    })
    req.on('end', async () => {
        data = qs.parse(data);
        let cookies = req.headers.cookie;
        let account = cookie.parse(cookies).u_user;
        let idAccount = await query.selectProduct(`select idAccount from account where username = '${account}'`);
        idAccount = idAccount[0].idAccount;
        let idOrder = await query.selectProduct(`select idOrder from torder where idAccount = ${idAccount} and statusPayment = 'cart'`);
        idOrder = idOrder[0].idOrder;

        let addProductInCartSql = `update orderDetail set amountProduct = ('${data.amount}') where idOrder = ${idOrder} and idProduct = ${data.idProduct}`;
        await query.selectProduct(addProductInCartSql);
        res.writeHead(301, { 'Location': '/cart' });
        res.end();
    })
}

handlers.payment = async (idOrder, req, res) => {
    let updateStorageSql = `select idProduct, amountProduct from orderDetail where idOrder = ${idOrder}`;
    let dataUpdateStorage = await query.selectProduct(updateStorageSql);

    // check Storage
    let storageDataSql = `select idProduct, amount from product`;
    let storageData = await query.selectProduct(storageDataSql);
    let invalidAmountProduct = []
    for (let i = 0; i < dataUpdateStorage.length; i++) {
        for (let j = 0; j < storageData.length; j++) {
            if (dataUpdateStorage[i].idProduct == storageData[j].idProduct && dataUpdateStorage[i].amountProduct > storageData[j].amountProduct) {
                invalidAmountProduct.push(dataUpdateStorage[i].idProduct);
            }
        }
    }

    // update Storage
    let editStorageSql = '';
    for (let i = 0; i < dataUpdateStorage.length; i++) {
        editStorageSql = `update product set amount = (amount - ${dataUpdateStorage[i].amountProduct}) where idProduct = ${dataUpdateStorage[i].idProduct}`;
        await query.selectProduct(editStorageSql);
    }


    // update Status Payment
    let updateStatusPaymentSql = `update tOrder set statusPayment = 'paid' where idOrder = ${idOrder}`;
    await query.selectProduct(updateStatusPaymentSql);
    res.writeHead(301, { 'Location': '/cart' });
    res.end();
}

handlers.financialReport = async (req, res) => {
    // get data
    let dataSql = `select o.idOrder, p.idProduct, p.name, c.nameCategories, p.imgsrc, c.costCategories, c.priceCategories, od.amountProduct, (c.costCategories * od.amountProduct) as totalCost, (c.priceCategories * od.amountProduct) as totalRevenue from torder as o
    join orderdetail as od on o.idOrder = od.idOrder
    join product as p on p.idProduct = od.idProduct
    join categories as c on c.idCategories = p.idCategories
    where o.statuspayment = 'paid'`
    let resultReport = await query.selectProduct(dataSql);


    // render
    let htmlData = ''
    for (let i = 0; i < resultReport.length; i++) {
        htmlData += `
        <tr>
            <td>${resultReport[i].idOrder}</td>
            <td>${resultReport[i].name}</td>
            <td>${resultReport[i].nameCategories}</td>
            <td><img style="width: 200px;" src="/public/images/${resultReport[i].imgsrc}"></td>
            <td>${resultReport[i].costCategories.toLocaleString('en-US')}</td>
            <td>${resultReport[i].priceCategories.toLocaleString('en-US')}</td>
            <td>${resultReport[i].amountProduct}</td>
            <td>${resultReport[i].totalCost.toLocaleString('en-US')}</td>
            <td>${resultReport[i].totalRevenue.toLocaleString('en-US')}</td>
        </tr>
        `
    }
    let html = await getTemplate.readHtml('./view/admin/revenue.html');
    try {
        let checkRole = await sessionCheck.checkRoleUser(req);
        let totalRevenue = 0;
        let totalProfit = 0;
        if (checkRole == 'admin') {
            for (let i = 0; i < resultReport.length; i++) {
                totalRevenue += resultReport[i].totalRevenue;
                totalProfit += resultReport[i].totalCost
            }
            html = html.replace('{report-profit}', totalProfit.toLocaleString('en-US'))
            html = html.replace('{report-revenue}', totalRevenue.toLocaleString('en-US'))
            html = html.replace('{hidden-cart}', 'hidden');
            html = html.replace('{report-list}', htmlData);
            sessionCheck.check(html, req, res);
        } else {
            res.writeHead(301, { 'Location': '/' });
            res.end();
        }
    }
    catch {
        res.writeHead(301, { 'Location': '/' });
        res.end();
    }
}

module.exports = { handlers };

