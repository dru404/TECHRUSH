function show(fruit, vegetables)
{
  console.log("show called");
  let productsHTML="";
  if(fruit!=null)
  {
    fruit.forEach((products) => {
      productsHTML += `   
    <div class="product-item">
      <form action="/addtocart" method="POST">
        <div class="stock-container">
          <div>Stock: <span class="stock">${products.stock}</span></div>
        </div>
        <div>
          <img src="${products.image}" class="product-image" alt="Apples">
        </div>
        <div class="product-name">${products.name}</div>
        <div class="product-price-and-quantity">
          <div class="product-price-container">
            <div>Rs. <span class="product-price" id="priceDisplay-apples">${products.cost}</span></div>
          </div>
          <div class="product-quantity">
            <button type="button" class="decrease" data-id="apples">-</button>
            <span class="quantity" id="quantity-apples">0</span>
            <button type="button" class="increase" data-id="apples">+</button>
          </div>
          <input type="hidden" name="productName" value="Apples">
          <input type="hidden" name="price" id="priceInput-apples" value="100">
          <input type="hidden" name="quantity" id="quantityInput-apples" value="1"> 
        </div>
        <div class="add-to-cart-button">
          <button type="submit" name="addtocart">Add to Cart</button>
        </div>
      </form>
    </div>`
    });
  }

  if(vegetables!=null)
  {
    vegetables.forEach((products) => {
      productsHTML += `    
      <div class="product-item">
      <form action="/addtocart" method="POST">
        <div class="stock-container">
          <div>Stock: <span class="stock">${products.stock}</span></div>
        </div>
        <div>
          <img src="${products.image}" class="product-image" alt="Apples">
        </div>
        <div class="product-name">${products.name}</div>
        <div class="product-price-and-quantity">
          <div class="product-price-container">
            <div>Rs. <span class="product-price" id="priceDisplay-apples">${products.cost}</span></div>
          </div>
          <div class="product-quantity">
            <button type="button" class="decrease" data-id="apples">-</button>
            <span class="quantity" id="quantity-apples">0</span>
            <button type="button" class="increase" data-id="apples">+</button>
          </div>
          <input type="hidden" name="productName" value="Apples">
          <input type="hidden" name="price" id="priceInput-apples" value="100">
          <input type="hidden" name="quantity" id="quantityInput-apples" value="1">
        </div>
        <div class="add-to-cart-button">
          <button type="submit" name="addtocart">Add to Cart</button>
        </div>
      </form>
    </div>`
    });
  }


  document.querySelector('.product-main-body').innerHTML = productsHTML;
}