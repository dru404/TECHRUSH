function show(fruit, vegetables)
{
  console.log("show called");
  let productsHTML="";
  if(fruit!=null)
  {
    fruit.forEach((products) => {
      productsHTML += `   
    <div class="product-item">   
      <div class="stock-container">
        <div class="">Stock: </div>
        <div class="stock">${products.stock}</div>
      </div>
      <div>
        <img src="${products.image}" class="product-image">
      </div>
      <div class="product-name">
        ${products.name}
      </div>
      <div class="product-price-and-quantity">
        <div class="product-price-container">
          <div class="">Rs. </div>
          <div class="product-price">${products.cost}</div>
        </div>
        <div class="product-quantity">
          <div class="decrease" onclick="decreaseQuantity(this)">-</div>
          <div class="quantity">0</div>
          <div class="increase" onclick="increaseQuantity(this)">+</div>
        </div>
      </div>
      <div class="add-to-cart-button">
        <button>Add to Cart</button>
      </div>
    </div>`
    });
  }

  if(vegetables!=null)
  {
    vegetables.forEach((products) => {
      productsHTML += `   
    <div class="product-item">   
      <div class="stock-container">
        <div class="">Stock: </div>
        <div class="stock">${products.stock}</div>
      </div>
      <div>
        <img src="${products.image}" class="product-image">
      </div>
      <div class="product-name">
        ${products.name}
      </div>
      <div class="product-price-and-quantity">
        <div class="product-price-container">
          <div class="">Rs. </div>
          <div class="product-price">${products.cost}</div>
        </div>
        <div class="product-quantity">
          <div class="decrease" onclick="decreaseQuantity(this)">-</div>
          <div class="quantity">0</div>
          <div class="increase" onclick="increaseQuantity(this)">+</div>
        </div>
      </div>
      <div class="add-to-cart-button">
        <button>Add to Cart</button>
      </div>
    </div>`
    });
  }


  document.querySelector('.product-main-body').innerHTML = productsHTML;
}