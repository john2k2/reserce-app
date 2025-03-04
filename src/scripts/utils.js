/**
 * Utility functions for client-side JavaScript
 */

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time in milliseconds to wait
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a dropdown menu toggle functionality
 * @param {HTMLElement} buttonElement - The button that toggles the dropdown
 * @param {HTMLElement} menuElement - The dropdown menu element
 */
export function setupDropdownMenu(buttonElement, menuElement) {
  if (!buttonElement || !menuElement) return;
  
  // Toggle menu on button click
  buttonElement.addEventListener('click', (e) => {
    e.stopPropagation();
    menuElement.classList.toggle('hidden');
  });
  
  // Close when clicking outside
  document.addEventListener('click', () => {
    if (!menuElement.classList.contains('hidden')) {
      menuElement.classList.add('hidden');
    }
  });
}

/**
 * Create a dynamic dropdown menu
 * @param {HTMLElement} buttonElement - The button that toggles the dropdown
 * @param {Array} items - Menu items with {text, href, icon} structure
 * @param {Object} options - Additional configuration
 * @returns {HTMLElement} The created menu element
 */
export function createDropdownMenu(buttonElement, items, options = {}) {
  if (!buttonElement || !items?.length) return null;
  
  const {
    menuClass = 'absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden',
    itemClass = 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150'
  } = options;
  
  // Create menu container
  const menu = document.createElement('div');
  menu.className = menuClass;
  menu.id = 'dropdown-menu';
  
  // Add menu items
  items.forEach(item => {
    const menuItem = document.createElement('a');
    menuItem.href = item.href;
    menuItem.className = itemClass;
    menuItem.textContent = item.text;
    menu.appendChild(menuItem);
  });
  
  // Append to DOM
  buttonElement.parentNode?.appendChild(menu);
  
  // Setup event handlers
  setupDropdownMenu(buttonElement, menu);
  
  return menu;
}

/**
 * Add auto-submit behavior to form elements
 * @param {HTMLFormElement} formElement - The form to enhance
 * @param {Object} options - Configuration options
 */
export function enhanceFormWithAutoSubmit(formElement, options = {}) {
  if (!formElement) return;
  
  const {
    elements = 'select', // Elements that trigger auto-submit
    delay = 300 // Debounce delay in milliseconds
  } = options;
  
  const autoSubmit = debounce(() => {
    formElement.submit();
  }, delay);
  
  const inputs = formElement.querySelectorAll(elements);
  inputs.forEach(input => {
    input.addEventListener('change', autoSubmit);
  });
} 