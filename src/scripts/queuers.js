// Cuando se carga la página, configure los controladores de eventos para los filtros
document.addEventListener('DOMContentLoaded', function() {
  // Elementos del formulario
  const filterForm = document.getElementById('filter-form');
  const searchInputs = document.querySelectorAll('input[type="search"]');
  const selectInputs = document.querySelectorAll('select');
  const filterButton = document.getElementById('apply-filters');
  
  // Función para aplicar filtros
  function applyFilters() {
    if (filterForm && filterForm instanceof HTMLFormElement) {
      filterForm.submit();
    }
  }
  
  // Configurar event listeners
  if (filterButton) {
    filterButton.addEventListener('click', function(e) {
      e.preventDefault();
      applyFilters();
    });
  }
  
  // Para búsquedas en mobile e inputs select
  searchInputs.forEach(function(input) {
    // Aplicar filtro al presionar Enter en el campo de búsqueda
    if (input.id === 'search-mobile') {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFilters();
        }
      });
    }
  });
  
  // Aplicar filtros al cambiar un select
  selectInputs.forEach(function(input) {
    input.addEventListener('change', function() {
      applyFilters();
    });
  });
}); 