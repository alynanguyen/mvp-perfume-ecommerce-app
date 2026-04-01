/**
 * Material Icon Component
 * Uses Google Material Symbols font (weight 200)
 *
 * @param {string} icon - The Material Symbol icon name (e.g., 'menu', 'shopping_cart')
 * @param {string} variant - 'outlined' or 'rounded' (default: 'outlined')
 * @param {string} className - Additional CSS classes
 * @param {number} size - Icon size in pixels (default: 24)
 * @param {boolean} filled - Whether to use filled variant (default: false)
 */
const MaterialIcon = ({
  icon,
  variant = 'outlined',
  className = '',
  size = 24,
  filled = false
}) => {
  const fontFamily = variant === 'rounded' ? 'Material Symbols Rounded' : 'Material Symbols Outlined';
  const fill = filled ? 1 : 0;

  return (
    <span
      className={`material-symbols-${variant} ${className}`}
      style={{
        fontFamily,
        fontWeight: 200,
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 200, 'GRAD' 0, 'opsz' 24`,
        display: 'inline-block',
        lineHeight: 1,
      }}
    >
      {icon}
    </span>
  );
};

export default MaterialIcon;

