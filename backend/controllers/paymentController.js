/**
 * DEMO-ONLY PAYMENT CONTROLLER
 *
 * ⚠️ WARNING: This is a demonstration/practice application.
 * NO REAL MONEY WILL EVER BE CHARGED.
 *
 * This controller supports two modes:
 * 1. Mock Mode (default): Simulates payment without any Stripe API calls
 * 2. Test Mode: Uses Stripe test keys (sk_test_*) which never charge real money
 *
 * REAL STRIPE KEYS (sk_live_*) ARE BLOCKED FOR SAFETY.
 */

const Stripe = require('stripe');

// Check if Stripe is configured and validate it's a test key only
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;
let isDemoMode = true;

if (STRIPE_SECRET_KEY) {
  // SECURITY: Only allow test keys - block any live/production keys
  if (STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.error('❌ SECURITY ERROR: Live Stripe keys are not allowed in this demo application!');
    console.error('   Only test keys (sk_test_*) are permitted.');
    throw new Error('Live Stripe keys are not allowed. This is a demo-only application.');
  }

  if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    stripe = Stripe(STRIPE_SECRET_KEY);
    isDemoMode = false;
    console.log('✅ Stripe Test Mode enabled (no real charges will occur)');
  } else {
    console.warn('⚠️  Invalid Stripe key format. Using mock mode (no Stripe API calls).');
  }
} else {
  console.log('ℹ️  No Stripe key provided. Using mock/demo mode (no Stripe API calls).');
}

/**
 * Generate a mock client secret for demo purposes
 */
function generateMockClientSecret() {
  // Generate a fake client secret that looks like Stripe's format
  const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `pi_mock_${randomId}_secret_demo_${Date.now()}`;
}

/**
 * @desc    Create Payment Intent (DEMO ONLY - NO REAL CHARGES)
 * @route   POST /api/payments/create-payment-intent
 * @access  Private
 *
 * This endpoint simulates payment intent creation for demonstration purposes.
 * In mock mode, it returns a fake client secret without calling Stripe.
 * In test mode, it uses Stripe test keys (which never charge real money).
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'eur', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount (in cents) is required and must be greater than 0'
      });
    }

    // Add demo flag to metadata
    const demoMetadata = {
      ...metadata,
      demo_mode: 'true',
      practice_app: 'true',
      no_real_charge: 'true'
    };

    let clientSecret;
    let paymentIntentId;

    if (isDemoMode || !stripe) {
      // MOCK MODE: Simulate payment intent without Stripe API
      console.log('🎭 Mock Payment Intent created (demo mode)');
      clientSecret = generateMockClientSecret();
      paymentIntentId = `pi_mock_${Date.now()}`;

      res.status(201).json({
        success: true,
        clientSecret,
        paymentIntentId,
        mode: 'mock',
        warning: 'This is a demonstration. No real payment will be processed.',
        demo: true
      });
    } else {
      // TEST MODE: Use Stripe test keys (safe - no real charges)
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.floor(amount),
          currency: currency.toLowerCase(),
          metadata: demoMetadata,
          automatic_payment_methods: { enabled: true },
          // Explicitly set as a test payment
          description: `Demo Payment - Practice App (Amount: ${amount / 100} ${currency.toUpperCase()})`
        });

        console.log('✅ Test Payment Intent created (Stripe test mode)');

        res.status(201).json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          mode: 'test',
          warning: 'Using Stripe test mode. No real payment will be charged.',
          demo: true
        });
      } catch (stripeError) {
        console.error('Stripe API Error:', stripeError.message);
        // Fallback to mock mode if Stripe fails
        console.log('🔄 Falling back to mock mode due to Stripe error');
        clientSecret = generateMockClientSecret();
        paymentIntentId = `pi_mock_fallback_${Date.now()}`;

        res.status(201).json({
          success: true,
          clientSecret,
          paymentIntentId,
          mode: 'mock_fallback',
          warning: 'Stripe API error. Using mock mode. No real payment will be processed.',
          demo: true,
          stripeError: stripeError.message
        });
      }
    }
  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      demo: true
    });
  }
};

/**
 * @desc    Verify Payment Intent (DEMO ONLY)
 * @route   POST /api/payments/verify-payment
 * @access  Private
 *
 * This endpoint simulates payment verification.
 * In demo mode, it always returns success without checking Stripe.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, clientSecret } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // In demo mode, always return success
    if (isDemoMode || !stripe || paymentIntentId.startsWith('pi_mock_')) {
      console.log('🎭 Mock Payment verified (demo mode)');
      return res.json({
        success: true,
        verified: true,
        status: 'succeeded',
        mode: 'mock',
        warning: 'This is a demonstration. No real payment was processed.',
        demo: true
      });
    }

    // In test mode, verify with Stripe (still safe - test mode)
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      res.json({
        success: true,
        verified: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        mode: 'test',
        warning: 'Using Stripe test mode. No real payment was charged.',
        demo: true,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });
    } catch (stripeError) {
      // If verification fails, still return success in demo mode
      console.warn('Stripe verification error (using mock response):', stripeError.message);
      res.json({
        success: true,
        verified: true,
        status: 'succeeded',
        mode: 'mock_fallback',
        warning: 'Stripe verification failed. Using mock response. No real payment was processed.',
        demo: true
      });
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      demo: true
    });
  }
};
