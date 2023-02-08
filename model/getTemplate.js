const fs = require('fs');

class getTemplate {
    static async readHtml(src) {
        return new Promise((resolve, reject) => {
            fs.readFile(src, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        })
    }
}

module.exports = getTemplate;