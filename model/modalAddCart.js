class modalAddCart {
    static str = (id, name, category, maxAmount) => {
        return `


    <!-- Button trigger modal -->
    <form method="GET">
    
    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#id-${id}">
      Add to cart
    </button>
    </form>
    
    <!-- Modal -->
    <form action="/addCart" method="POST">
    <div class="modal fade" id="id-${id}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">

          
          <label for="" class="form-label">ID</label>
          <input readonly="true" type="number" id="" value="${id}" name="id" class="form-control" 
          <label for="" class="form-label">Name</label>
          <input readonly="true" type="text" value="${name}" id="" name="name" class="form-control" aria-describedby="passwordHelpBlock">
          <label for="" class="form-label">Name</label>
          <input readonly="true" type="text" value="${category}" id="" name="category" class="form-control" aria-describedby="passwordHelpBlock">
         
          <label for="" class="form-label">Amount</label>
          <input type="number" min="1" max="${maxAmount}" id="" name="amount" class="form-control" aria-describedby="passwordHelpBlock">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-dark" data-bs-dismiss="modal">Close</button>
           <button type="submit" class="btn btn-secondary"
                    >Apply</button>
        </div>
          </div>
        </div>
      </div>
    </div>
    </form>
  
  `
    };
}

module.exports = modalAddCart;


