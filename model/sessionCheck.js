const cookie = require('cookie');
const fs = require('fs')

class sessionCheck {
    static check = (html, req, res) => {
        let cookies = req.headers.cookie;
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
    }
}

module.exports = sessionCheck;