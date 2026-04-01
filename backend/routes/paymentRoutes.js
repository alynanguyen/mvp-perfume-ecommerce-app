const express = require('express');
const router = express.Router();
const { createPaymentIntent, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * DEMO-ONLY PAYMENT ROUTES
 *
 * ⚠️ WARNING: These routes are for demonstration purposes only.
 * NO REAL MONEY WILL EVER BE CHARGED.
 *
 * - Uses Stripe test keys only (sk_test_*) - real keys are blocked
 * - Falls back to mock mode if Stripe is not configured
 * - All payments are simulated for practice/demo purposes
 */

// Create payment intent for authenticated user (DEMO ONLY)
router.post('/create-payment-intent', protect, createPaymentIntent);

// Verify payment (DEMO ONLY)
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;

