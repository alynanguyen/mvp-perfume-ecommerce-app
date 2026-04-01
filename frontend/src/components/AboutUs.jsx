import MaterialIcon from './common/MaterialIcon';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Welcome to our perfume store, where luxury meets authenticity. We are passionate about bringing you the finest fragrances from the world's most prestigious brands.
          </p>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Founded with a vision to make luxury perfumes accessible to everyone, our store has been a trusted destination for fragrance enthusiasts since our inception. We believe that a great perfume is more than just a scent—it's a statement, a memory, and an expression of your unique personality.
            </p>
            <p>
              Our journey began with a simple mission: to curate the finest collection of authentic perfumes from renowned brands around the world. We carefully select each fragrance in our collection, ensuring that every bottle meets our high standards for quality and authenticity.
            </p>
            <p>
              Today, we are proud to offer an extensive range of perfumes, from timeless classics to the latest releases, all while maintaining our commitment to exceptional customer service and genuine products.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MaterialIcon icon="verified" size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authenticity</h3>
                <p className="text-gray-600">
                  We guarantee 100% authentic products. Every perfume in our store is sourced directly from authorized distributors and comes with a certificate of authenticity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MaterialIcon icon="star" size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality</h3>
                <p className="text-gray-600">
                  We are committed to offering only the highest quality fragrances. Our team carefully tests and verifies each product to ensure it meets our strict quality standards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MaterialIcon icon="support_agent" size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Service</h3>
                <p className="text-gray-600">
                  Your satisfaction is our priority. Our dedicated customer service team is here to help you find the perfect fragrance and answer any questions you may have.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MaterialIcon icon="eco" size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sustainability</h3>
                <p className="text-gray-600">
                  We are committed to sustainable practices and work with brands that share our environmental values. We use eco-friendly packaging whenever possible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">What Makes Us Different</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MaterialIcon icon="check_circle" size={24} className="text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Perfume Finder Quiz</h3>
                <p className="text-gray-600">
                  Our innovative Perfume Finder quiz helps you discover fragrances that match your personality, preferences, and lifestyle. Simply answer a few questions, and we'll recommend the perfect scents for you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MaterialIcon icon="check_circle" size={24} className="text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Expert Curation</h3>
                <p className="text-gray-600">
                  Our team of fragrance experts carefully curates our collection, ensuring we offer a diverse range of scents from established luxury brands to emerging niche perfumers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MaterialIcon icon="check_circle" size={24} className="text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Free Shipping</h3>
                <p className="text-gray-600">
                  We offer free shipping on orders over €90, making luxury fragrances more accessible. Fast and secure delivery ensures your perfumes arrive in perfect condition.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MaterialIcon icon="check_circle" size={24} className="text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">30-Day Return Policy</h3>
                <p className="text-gray-600">
                  We stand behind our products with a generous 30-day return policy. If you're not completely satisfied, we'll make it right.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            To inspire and empower individuals to express their unique identity through the art of fragrance. We believe that everyone deserves to find their perfect scent—one that resonates with their personality, enhances their confidence, and creates lasting memories.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-indigo-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-700 mb-6">
            We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, our team is here to help.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MaterialIcon icon="email" size={24} className="text-indigo-600" />
              <a
                href="mailto:support@perfumestore.com"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                support@perfumestore.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <MaterialIcon icon="phone" size={24} className="text-indigo-600" />
              <a
                href="tel:+15551234567"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                +1 (555) 123-4567
              </a>
            </div>
            <div className="flex items-center gap-3">
              <MaterialIcon icon="schedule" size={24} className="text-indigo-600" />
              <span className="text-gray-700">Monday - Friday, 9 AM - 6 PM CET</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

