const query = require('./query')

class checkCart {

    static check = async (idAccount) => {
        return new Promise ((resolve, reject) => {
            let dataCartSql = `select T.idOrder, T.idProduct, T.name, T.nameCategories, T.priceCategories, T.imgsrc, T.amountProduct, T.statusPayment from (
                select tOrder.idAccount ,tOrder.idOrder, od.idProduct, p.name, p.imgsrc, c.nameCategories, c.priceCategories,od.amountProduct, torder.statusPayment  from tOrder
                join orderDetail as od on tOrder.idOrder = od.idOrder
                join product as p on od.idProduct = p.idProduct
                join categories as c on c.idCategories = p.idCategories
                join account as a on a.idAccount = tOrder.idAccount
                ) as T where T.idAccount = '${idAccount}' and T.statusPayment = 'cart';`
            query.selectProduct(dataCartSql)
                .then(async (result) => {
                    resolve (result)
                })
                .catch((err) => {
                    console.log(err);
                })
        })
    }
}

module.exports = checkCart