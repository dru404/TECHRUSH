function decreaseQuantity(button)
{
  let cost = (Number)(button.closest('.product-item').querySelector('.quantity').innerHTML);

  if(cost>0)
    cost--;
  button.closest('.product-item').querySelector('.quantity').innerHTML = cost;
}

function increaseQuantity(button)
{
  let cost = (Number)(button.closest('.product-item').querySelector('.quantity').innerHTML);
  let max = (Number)(button.closest('.product-item').querySelector('.stock').innerHTML);
  if(cost<max)
    cost++;
  button.closest('.product-item').querySelector('.quantity').innerHTML = cost;
}
