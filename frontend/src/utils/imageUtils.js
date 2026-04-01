/**
 * Get the full URL for a product image
 * @param {string} imagePath - The image path from the product (e.g., "imgs/creed/love_in_white.png")
 * @returns {string} - The full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Remove leading slash if present
  let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // Handle new image structure: imgs/products/ and imgs/notes/
  // If path starts with "imgs/" but not "imgs/products/" or "imgs/notes/",
  // assume it's a product image and add "products/" to the path
  if (cleanPath.startsWith('imgs/') && !cleanPath.startsWith('imgs/products/') && !cleanPath.startsWith('imgs/notes/')) {
    // Convert "imgs/creed/love_in_white.png" to "imgs/products/creed/love_in_white.png"
    cleanPath = cleanPath.replace(/^imgs\//, 'imgs/products/');
  }

  // Get the base URL (remove /api from the end if present)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');

  // Construct the full URL
  return `${baseUrl}/${cleanPath}`;
};

// Generate an inline SVG data URI placeholder (works offline and avoids external calls)
export const placeholderDataUri = (width = 400, height = 400, text = 'Perfume') => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='20' fill='%239ca3af'>${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

