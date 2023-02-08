const query = require('./query');

class checkUserNameEmail {

    static checkUsernameAvailable = async (inputUsername, data) => {
        return new Promise((resolve, reject) => {
            for (let i of data) {
                if (inputUsername == i.username) {
                    reject(false);
                } else {
                    resolve(true);
                }
            }
        })
    }

    static checkEmailAvailable = async (inputEmail, data) => {
        return new Promise((resolve, reject) => {
            for (let i of data) {
                if (inputEmail == i.email) {
                    reject(false);
                } else {
                    resolve(true);
                }
            }
        })
    }

    static check = async (inputUsername, inputEmail) => {
        let sql = `select username, email from account`;
        let accounts = await query.selectProduct(sql);
        let result = 0;
        let resultUsername = 0;
        let resultEmail = 0;
        // result == 0 => Username && Email is not exist
        // result == 1 => Only Username is exist
        // result == 2 => Only Email is exist
        // result == 3 => Username && Email is exist
        return new Promise((resolve) => {
            
            for (let i of accounts) {
                if (inputUsername == i.username) {
                    resultUsername = 1;
                } else if (inputEmail == i.email) {
                    resultEmail = 1
                }
            }
         
            if (resultUsername == 1 && resultEmail == 0) {
                result = 1;
            } else if (resultUsername == 0 && resultEmail == 1) {
                result = 2;
            } else if (resultUsername == 1 && resultEmail == 1) {
                result = 3;
            }

            resolve(result);
        })
    }
}



module.exports = checkUserNameEmail;



