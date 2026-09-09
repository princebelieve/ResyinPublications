//client/src/utils/cart.js
export function createBuyNowCart(product) {
  return [
    {
      productId: product._id,
      name: product.name,
      image: product.coverImage,
      price: Number(product.price || 0),
      quantity: 1,
    },
  ];
}
