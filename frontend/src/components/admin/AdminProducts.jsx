import { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import MaterialIcon from '../common/MaterialIcon';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for filtering
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    volume: '',
    stock: 0,
    image_path: '',
    gender: [],
    season: [],
    onSale: false,
    bestSeller: false,
    limitedEdition: false,
  });
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const filterProductsByQuery = (productsList, query) => {
    if (!query.trim()) {
      return productsList;
    }

    const searchTerm = query.toLowerCase().trim();
    return productsList.filter((product) => {
      const name = product.name?.toLowerCase() || '';
      const brand = product.brand?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';

      return (
        name.includes(searchTerm) ||
        brand.includes(searchTerm) ||
        description.includes(searchTerm)
      );
    });
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Load all products for search (no pagination for admin search)
      const response = await productsAPI.getProducts({ limit: 1000 });
      const fetchedProducts = response.data.data || [];
      setAllProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (allProducts.length === 0) return;

    const filtered = filterProductsByQuery(allProducts, searchQuery);
    setTotal(filtered.length);
    const maxPage = Math.ceil(filtered.length / 30);
    setTotalPages(maxPage || 1);

    // Reset to page 1 if current page is beyond available pages or if search changed
    const pageToUse = currentPage > maxPage && filtered.length > 0 ? 1 : currentPage;
    if (pageToUse !== currentPage && currentPage > maxPage) {
      setCurrentPage(1);
      return;
    }

    const startIndex = (pageToUse - 1) * 30;
    const endIndex = startIndex + 30;
    setProducts(filtered.slice(startIndex, endIndex));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Reset to page 1 when search query changes
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allProducts, currentPage]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === 'gender' || name === 'season') {
      // Handle array fields - split by comma
      setFormData((prev) => ({
        ...prev,
        [name]: value ? value.split(',').map((v) => v.trim()) : [],
      }));
    } else if (name === 'price' || name === 'volume') {
      // Handle array fields - split by comma and convert to numbers
      setFormData((prev) => ({
        ...prev,
        [name]: value ? value.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v)) : [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      price: Array.isArray(product.price) ? product.price.join(', ') : product.price || '',
      volume: Array.isArray(product.volume) ? product.volume.join(', ') : product.volume || '',
      stock: product.stock || 0,
      image_path: product.image_path || '',
      gender: Array.isArray(product.gender) ? product.gender.join(', ') : '',
      season: Array.isArray(product.season) ? product.season.join(', ') : '',
      onSale: product.onSale || false,
      bestSeller: product.bestSeller || false,
      limitedEdition: product.limitedEdition || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsAPI.deleteProduct(id);
      setMessage('Product deleted successfully');
      loadProducts();
    } catch (error) {
      setMessage('Error deleting product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const submitData = {
        ...formData,
        price: formData.price ? (Array.isArray(formData.price) ? formData.price : formData.price.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v))) : [],
        volume: formData.volume ? (Array.isArray(formData.volume) ? formData.volume : formData.volume.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v))) : [],
        gender: formData.gender ? (Array.isArray(formData.gender) ? formData.gender : formData.gender.split(',').map((v) => v.trim()).filter((v) => v)) : [],
        season: formData.season ? (Array.isArray(formData.season) ? formData.season : formData.season.split(',').map((v) => v.trim()).filter((v) => v)) : [],
      };

      if (editingProduct) {
        await productsAPI.updateProduct(editingProduct._id, submitData);
        setMessage('Product updated successfully');
      } else {
        await productsAPI.createProduct(submitData);
        setMessage('Product created successfully');
      }

      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        description: '',
        price: '',
        volume: '',
        stock: 0,
        image_path: '',
        gender: [],
        season: [],
        onSale: false,
        bestSeller: false,
        limitedEdition: false,
      });
      await loadProducts();
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      volume: '',
      stock: 0,
      image_path: '',
      gender: [],
      season: [],
      onSale: false,
      bestSeller: false,
      limitedEdition: false,
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
            <p className="mt-2 text-gray-600">
              Showing {products.length} of {total} products
              {searchQuery && ' (filtered)'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Add Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Products:</label>
          <div className="relative">
            <MaterialIcon
              icon="search"
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, or description..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon icon="close" size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (comma-separated) *</label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="240, 380"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Volume (comma-separated) *</label>
                <input
                  type="text"
                  name="volume"
                  value={formData.volume}
                  onChange={handleInputChange}
                  placeholder="50, 100"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image Path</label>
                <input
                  type="text"
                  name="image_path"
                  value={formData.image_path}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender (comma-separated)</label>
                <input
                  type="text"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  placeholder="Male, Female, Unisex"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Season (comma-separated)</label>
                <input
                  type="text"
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                  placeholder="Spring, Summer, Fall, Winter"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="onSale"
                  checked={formData.onSale}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">On Sale</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="bestSeller"
                  checked={formData.bestSeller}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Best Seller</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="limitedEdition"
                  checked={formData.limitedEdition}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Limited Edition</span>
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.image_path ? (
                      <img
                        src={getImageUrl(product.image_path)}
                        alt={product.name}
                        className="h-16 w-16 object-contain"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.brand}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Array.isArray(product.price) && product.price.length > 0
                        ? `€${Math.min(...product.price).toFixed(2)} - €${Math.max(...product.price).toFixed(2)}`
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

