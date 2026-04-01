const mongoose = require('mongoose');

const scentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Quiz answers
  answers: {
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Unisex'],
      required: true
    },
    vibe: {
      type: String,
      enum: ['Sexy', 'Romantic', 'Playful', 'Fresh', 'Elegant', 'Dark', 'Comforting', 'Bold', 'Unusual', 'Natural'],
      required: true
    },
    occasion: {
      type: [String],
      required: true
    },
    season: {
      type: [String],
      enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'All-year'],
      required: true
    },
    longevity_category: {
      type: String,
      enum: ['Soft / Moderate', 'Moderate / Strong', 'Very Strong'],
      required: true
    },
    accords: {
      type: [String],
      required: true
    },
    liked_notes: {
      type: [String],
      required: true
    },
    disliked_notes: {
      type: [String],
      default: []
    },
    secondary_accords: {
      type: [String],
      default: []
    },
    price: {
      label: { type: String, enum: ['Budget', 'Mid', 'Luxury'] },
      range: [{ type: Number }]
    }
  },
  // Calculated recommendations
  recommendations: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    reasons: [String] // Why this product was recommended
  }],
  // When profile was created/updated
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
scentProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Explicitly set collection name to ensure it's created
const ScentProfile = mongoose.model('ScentProfile', scentProfileSchema);

module.exports = ScentProfile;

