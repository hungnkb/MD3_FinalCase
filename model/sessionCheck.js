const cookie = require('cookie');
const fs = require('fs')

class sessionCheck {
    static check = (html, req, res) => {
        let cookies = req.headers.cookie;
        if (cookies != undefined) {
            let dataCookie = cookie.parse(cookies);
            let nameSession = dataCookie.u_user;
            if (nameSession != undefined) {
                const path = './sessions/' + nameSession + ".txt";
                try {
                    if (fs.existsSync(path)) {
                        html = html.replace('{hidden-login}', 'hidden');
                        html = html.replace('{hidden-register}', 'hidden');
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(html);
                        res.end();
                    } else {
                        throw new Error('file not exist');
                    }
                } catch (err) {
                    html = html.replace('{hidden-logout}', 'hidden');
                    html = html.replace('{hidden-cart}', 'hidden');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(html);
                    return res.end();
                }
            } else {
                html = html.replace('{hidden-logout}', 'hidden');
                html = html.replace('{hidden-cart}', 'hidden');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(html);
                res.end();
            }
        } else {
            html = html.replace('{hidden-logout}', 'hidden');
            html = html.replace('{hidden-cart}', 'hidden');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(html);
            res.end();
        }



    }

    static checkRoleUser = async (req) => {
        return new Promise((resolve, reject) => {
            let cookies = req.headers.cookie;

            //role == 0 => admin;
            // role == 1 => user;
            if (cookies) {
                let dataCookie = cookie.parse(cookies);
                let nameSession = dataCookie.u_user;
                if (dataCookie.u_role == 0) {
                    return resolve('admin');
                } else {
                    return resolve('user');
                }
            } else {
                return resolve('user')
            }
        })
    }

    static checkSession =  (req, res) => {
        return new Promise((resolve, reject) => {
            let cookies = req.headers.cookie;
            if (cookies != undefined) {
                let dataCookie = cookie.parse(cookies);
                let nameSession = dataCookie.u_user;
                if (nameSession != undefined) {
                    const path = './sessions/' + nameSession + ".txt";
                    if (fs.existsSync(path)) {
                        resolve('exist')
                    } else {
                        reject('notExist')
                    }
                }
            }
        })
    }
}



module.exports = sessionCheck;