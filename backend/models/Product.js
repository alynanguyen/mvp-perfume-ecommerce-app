const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  brand: { type: String, required: true },
  country: String,
  gender: [{ type: String }],
  type: String,
  accords: [{ type: String }],
  notes: {
    top_notes: [{ type: String }],
    middle_notes: [{ type: String }],
    base_notes: [{ type: String }]
  },
  description: { type: String, required: true },
  season: [{ type: String }],
  weather: [{ type: String }],
  price: [{ type: Number }],
  originalPrice: [{ type: Number }], // Original price before sale
  volume: [{ type: Number }],
  year: { type: Number },
  reviews: { type: Number, default: 0 }, // average rating
  longevity: {
    min: { type: Number },
    max: { type: Number }
  },
  sillage: String,
  image_path: String,
  stock: { type: Number, default: 0 },
  onSale: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  limitedEdition: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Text index for search
productSchema.index({ name: 'text', brand: 'text', description: 'text', accords: 'text' });

module.exports = mongoose.model('Product', productSchema);