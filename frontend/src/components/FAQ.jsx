import { useState } from 'react';
import MaterialIcon from './common/MaterialIcon';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          question: 'How long does shipping take?',
          answer: 'We offer free shipping on orders over €90. Standard shipping typically takes 3-5 business days within Europe. Express shipping options are available at checkout for faster delivery.'
        },
        {
          question: 'What are the shipping costs?',
          answer: 'Shipping is free for orders over €90. For orders below €90, standard shipping costs €5.99. Express shipping options are available at checkout with varying costs based on your location.'
        },
        {
          question: 'Can I track my order?',
          answer: 'Yes! Once your order ships, you will receive a tracking number via email. You can use this number to track your package in real-time through our shipping partner\'s website.'
        },
        {
          question: 'What countries do you ship to?',
          answer: 'We currently ship to all countries within the European Union. We are working on expanding our shipping to other regions. Please check our shipping page for the most up-to-date list of countries.'
        }
      ]
    },
    {
      category: 'Products',
      questions: [
        {
          question: 'Are your perfumes authentic?',
          answer: 'Absolutely! We only sell 100% authentic, original perfumes directly from authorized distributors and brands. All our products are guaranteed authentic, and we provide certificates of authenticity upon request.'
        },
        {
          question: 'What sizes are available?',
          answer: 'Most perfumes are available in multiple sizes, typically 30ml, 50ml, and 100ml. Some fragrances may also be available in 15ml travel sizes. The available sizes for each product are displayed on the product page.'
        },
        {
          question: 'How do I choose the right perfume?',
          answer: 'We recommend using our Perfume Finder quiz, which asks you questions about your preferences, lifestyle, and scent profile. Based on your answers, we\'ll recommend perfumes that match your taste. You can also browse by brand, gender, season, or accord type.'
        },
        {
          question: 'Do you offer samples?',
          answer: 'Currently, we offer sample sets for select brands. Check our "Samples" section or contact our customer service team for more information about available sample options.'
        }
      ]
    },
    {
      category: 'Returns & Exchanges',
      questions: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for unopened and unused products in their original packaging. Items must be returned in their original condition with all seals intact. Opened products cannot be returned for hygiene reasons.'
        },
        {
          question: 'How do I return a product?',
          answer: 'To initiate a return, please log into your account, go to "My Account" > "Orders", select the order you wish to return, and click "Return Item". You will receive a return label and instructions via email. Returns are free for orders over €90.'
        },
        {
          question: 'Can I exchange a product?',
          answer: 'Yes, you can exchange a product for a different size or fragrance. Please initiate a return for the original item and place a new order for the desired product. Once we receive the returned item, we will process a refund for the original purchase.'
        },
        {
          question: 'How long does it take to process a refund?',
          answer: 'Once we receive your returned item, we will inspect it and process your refund within 5-7 business days. The refund will be issued to your original payment method and may take an additional 3-5 business days to appear in your account.'
        }
      ]
    },
    {
      category: 'Payment & Security',
      questions: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. All payments are processed securely through our encrypted payment gateway.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, absolutely. We use industry-standard SSL encryption to protect all payment information. We never store your full credit card details on our servers. All transactions are processed through secure, PCI-compliant payment gateways.'
        },
        {
          question: 'Do you charge real money?',
          answer: 'For demo purposes, we use a special "FREE" coupon code that provides 100% discount. In a production environment, real payment processing would be enabled. Currently, no actual charges are made to your card.'
        }
      ]
    },
    {
      category: 'Account & Support',
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'You can create an account by clicking "Sign Up" in the top navigation bar. You\'ll need to provide your name, email address, and create a password. Creating an account allows you to track orders, save your scent profile, and receive personalized recommendations.'
        },
        {
          question: 'I forgot my password. How do I reset it?',
          answer: 'Click "Login" and then "Forgot Password". Enter your email address, and you will receive instructions to reset your password. You will need to enter your 6-digit reset code that you set up during account creation or in your account settings.'
        },
        {
          question: 'How do I update my account information?',
          answer: 'Log into your account and go to "My Account" > "Settings". From there, you can update your profile information, change your password, and manage your account preferences.'
        },
        {
          question: 'How can I contact customer support?',
          answer: 'You can reach our customer support team via email at support@perfumestore.com or by phone at +1 (555) 123-4567. Our support team is available Monday through Friday, 9 AM to 6 PM CET.'
        }
      ]
    },
    {
      category: 'Perfume Care & Storage',
      questions: [
        {
          question: 'How should I store my perfume?',
          answer: 'Store perfumes in a cool, dry place away from direct sunlight and heat sources. Avoid storing them in the bathroom due to humidity and temperature fluctuations. Keep the cap tightly closed when not in use to prevent evaporation.'
        },
        {
          question: 'How long does perfume last?',
          answer: 'Unopened perfumes can last 3-5 years if stored properly. Once opened, most perfumes maintain their quality for 2-3 years. The shelf life can vary depending on the fragrance composition and storage conditions.'
        },
        {
          question: 'What is the difference between Eau de Parfum and Eau de Toilette?',
          answer: 'The main difference is the concentration of fragrance oils. Eau de Parfum (EDP) contains 15-20% fragrance oil and typically lasts 4-6 hours. Eau de Toilette (EDT) contains 5-15% fragrance oil and typically lasts 2-4 hours. EDP is generally more intense and longer-lasting.'
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">
            Find answers to common questions about our products, shipping, returns, and more.
          </p>

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="border-b border-gray-200 pb-6 last:border-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.category}</h2>
                <div className="space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const index = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openIndex === index;

                    return (
                      <div
                        key={questionIndex}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                          className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                          <MaterialIcon
                            icon={isOpen ? 'expand_less' : 'expand_more'}
                            size={24}
                            className="text-gray-500 flex-shrink-0"
                          />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-2 bg-gray-50">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
            <p className="text-gray-700">
              <strong>Still have questions?</strong> Our customer support team is here to help.{' '}
              <a
                href="mailto:support@perfumestore.com"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                Contact us
              </a>{' '}
              or call us at{' '}
              <a
                href="tel:+15551234567"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                +1 (555) 123-4567
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

