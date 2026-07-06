const Razorpay = require('razorpay');

let razorpayInstance;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay credentials not set. Payment functions will run in simulated fallback mode.');
  razorpayInstance = {
    orders: {
      create: async (options) => {
        console.log('💳 [MOCK RAZORPAY ORDER CREATE]', options);
        return {
          id: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
          amount: options.amount,
          currency: options.currency,
        };
      }
    }
  };
}

module.exports = razorpayInstance;
