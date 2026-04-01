const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    addAvailabilityFlags();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

async function addAvailabilityFlags() {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    // Mark approximately 20% as best sellers
    const bestSellerCount = Math.floor(products.length * 0.2);
    const shuffledForBestSeller = products.sort(() => 0.5 - Math.random());
    const bestSellers = shuffledForBestSeller.slice(0, bestSellerCount);

    // Mark approximately 15% as limited edition
    const limitedEditionCount = Math.floor(products.length * 0.15);
    const shuffledForLimited = products.sort(() => 0.5 - Math.random());
    const limitedEditions = shuffledForLimited.slice(0, limitedEditionCount);

    let bestSellerUpdated = 0;
    let limitedEditionUpdated = 0;

    // Update best sellers
    for (const product of bestSellers) {
      product.bestSeller = true;
      await product.save();
      bestSellerUpdated++;
      console.log(`Marked "${product.name}" as Best Seller`);
    }

    // Update limited editions (avoid overlap with best sellers)
    const limitedEditionProducts = limitedEditions.filter(p => !bestSellers.includes(p));
    for (const product of limitedEditionProducts.slice(0, limitedEditionCount)) {
      product.limitedEdition = true;
      await product.save();
      limitedEditionUpdated++;
      console.log(`Marked "${product.name}" as Limited Edition`);
    }

    console.log(`\nSuccessfully updated:`);
    console.log(`- ${bestSellerUpdated} products marked as Best Seller`);
    console.log(`- ${limitedEditionUpdated} products marked as Limited Edition`);
    console.log(`- Products with originalPrice are automatically considered "On Sale"`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    process.exit(1);
  }
}

