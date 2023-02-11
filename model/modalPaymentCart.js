class modalPaymentCart {
    static str = (idOrder) => {
        return `

    <button type="button" class="btn btn-dark mt-1" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Payment
    </button>

    <!--Modal Payment-->
    
        <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel"
            aria-hidden="true"> 
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">Payment confirmation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body">
                        Click "Confirm" to pay your cart
                    </div>
                    <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <a href="/payment?idOrder=${idOrder}"><button class="btn btn-dark">Confirm</button></a>
                    </div>
                </div> 
            </div>
        </div>
    `
    }
}

module.exports = modalPaymentCart;