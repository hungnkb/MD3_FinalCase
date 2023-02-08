const db = require('../controller/dbConfig');

class query {
    static async selectProduct(sql) {
        return new Promise((resolve, reject) => {
            db.connect().query(sql, (err, result) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(result);
                }
            })
        })
    }
}

module.exports = query;