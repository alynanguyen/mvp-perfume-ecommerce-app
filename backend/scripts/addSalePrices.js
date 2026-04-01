const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    addSalePrices();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

async function addSalePrices() {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    // Update approximately 30% of products to be on sale (with 10-30% discount)
    const productsToUpdate = Math.floor(products.length * 0.3);
    const shuffled = products.sort(() => 0.5 - Math.random());
    const selectedProducts = shuffled.slice(0, productsToUpdate);

    let updatedCount = 0;

    for (const product of selectedProducts) {
      if (!product.price || product.price.length === 0) {
        continue;
      }

      // Calculate original prices (10-30% higher than current price)
      const discountPercent = 10 + Math.random() * 20; // Random discount between 10-30%
      const originalPrices = product.price.map(price => {
        // Calculate original price: salePrice / (1 - discountPercent/100)
        const originalPrice = price / (1 - discountPercent / 100);
        return Math.round(originalPrice * 100) / 100; // Round to 2 decimal places
      });

      // Update product with originalPrice
      product.originalPrice = originalPrices;
      await product.save();
      updatedCount++;

      console.log(`Updated ${product.name}: Original prices: [${originalPrices.join(', ')}], Sale prices: [${product.price.join(', ')}]`);
    }

    console.log(`\nSuccessfully updated ${updatedCount} products with sale prices!`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    process.exit(1);
  }
}

