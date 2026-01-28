---
layout: default
title: Inventory
subtitle: Quality Pre-Owned Vehicles at Unbeatable Prices
description: Browse our complete inventory of quality pre-owned vehicles. Find your perfect car today.
permalink: /inventory/
---

<div class="bg-white">
  <!-- Page Header -->
  <div class="bg-gradient-to-r from-primary to-primary-dark py-12">
    <div class="container mx-auto px-4 text-center text-white">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">Browse Our Inventory</h1>
      <p class="text-lg md:text-xl">Quality Pre-Owned Vehicles at Unbeatable Prices</p>
    </div>
  </div>

  <!-- Breadcrumb -->
  <div class="bg-gray-100 py-3">
    <div class="container mx-auto px-4">
      <nav class="text-sm">
        <a href="/" class="text-gray-600 hover:text-primary">Home</a>
        <span class="mx-2 text-gray-400">/</span>
        <span class="text-gray-900">Inventory</span>
      </nav>
    </div>
  </div>

  <!-- Filters and Results - FULL WIDTH -->
  <div class="w-full px-4 lg:px-8 xl:px-12 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-6 lg:gap-8">

      <!-- Sidebar Filters -->
      <aside class="w-full">
        <div class="bg-white rounded-lg shadow-md p-6 sticky top-24">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Filters</h2>
            <button id="clear-filters" class="text-sm text-primary hover:text-primary-dark font-semibold">Clear All</button>
          </div>

          <!-- Active Filters Display -->
          <div id="active-filters" class="mb-6 hidden">
            <div class="flex flex-wrap gap-2" id="filter-badges"></div>
          </div>

          <!-- Make Filter -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Make</label>
            <select id="filter-make" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">All Makes</option>
            </select>
          </div>

          <!-- Model Filter -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Model</label>
            <select id="filter-model" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" disabled>
              <option value="">All Models</option>
            </select>
          </div>

          <!-- Year Range -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Year</label>
            <div class="grid grid-cols-2 gap-2">
              <select id="filter-year-min" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="">Min</option>
              </select>
              <select id="filter-year-max" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="">Max</option>
              </select>
            </div>
          </div>

          <!-- Price Range -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Price Range</label>
            <select id="filter-price" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">Any Price</option>
              <option value="0-20000">Under $20,000</option>
              <option value="0-15000">Under $15,000</option>
              <option value="15000-25000">$15,000 - $25,000</option>
              <option value="25000-35000">$25,000 - $35,000</option>
              <option value="35000-50000">$35,000 - $50,000</option>
              <option value="50000-999999">Over $50,000</option>
            </select>
          </div>

          <!-- Body Type -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Body Type</label>
            <select id="filter-body-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">All Types</option>
            </select>
          </div>

          <!-- Transmission -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Transmission</label>
            <select id="filter-transmission" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">All Transmissions</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <!-- Fuel Type -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Fuel Type</label>
            <select id="filter-fuel-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">All Fuel Types</option>
            </select>
          </div>

        </div>
      </aside>

      <!-- Vehicle Grid -->
      <div class="w-full">

        <!-- Results Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p class="text-gray-600">
              Showing <span id="results-count" class="font-bold text-primary">0</span> of <span id="total-count" class="font-bold">0</span> vehicles
            </p>
          </div>
          <div>
            <label class="text-sm text-gray-600 mr-2">Sort by:</label>
            <select id="sort-by" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="mileage-asc">Mileage: Low to High</option>
              <option value="mileage-desc">Mileage: High to Low</option>
              <option value="year-desc">Year: Newest First</option>
              <option value="year-asc">Year: Oldest First</option>
            </select>
          </div>
        </div>

        <!-- Vehicle Cards Grid -->
        <div id="vehicle-grid" class="grid gap-6 mb-8" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));">
          {% assign all_vehicles = site.vehicles | where: "status", "available" | sort: "date_added" | reverse %}
          {% for vehicle in all_vehicles %}
          <div class="vehicle-card border border-gray-300 rounded-lg overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
               data-make="{{ vehicle.make }}"
               data-model="{{ vehicle.model }}"
               data-year="{{ vehicle.year }}"
               data-price="{{ vehicle.price }}"
               data-body-type="{{ vehicle.body_type }}"
               data-transmission="{{ vehicle.transmission }}"
               data-fuel-type="{{ vehicle.fuel_type }}"
               data-date="{{ vehicle.date_added }}">

            <!-- Vehicle Image -->
            <a href="{{ vehicle.url }}" class="block w-full h-64 bg-gray-100 overflow-hidden relative">
              {% if vehicle.primary_image %}
                <img src="{{ vehicle.primary_image }}"
                     alt="{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}"
                     class="w-full h-full object-contain"
                     loading="lazy"
                     onerror="this.src='/assets/images/placeholder-car.jpg'">
              {% else %}
                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                  <span class="text-gray-400 text-4xl">🚗</span>
                </div>
              {% endif %}

              {% if vehicle.featured %}
              <div class="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                FEATURED
              </div>
              {% endif %}
            </a>

            <!-- Vehicle Info -->
            <div class="p-6 flex flex-col">
              <!-- Vehicle Title - Fixed height for up to 2 lines -->
              <div class="h-12 mb-3">
                <h3 class="text-lg font-bold text-gray-900 line-clamp-2">
                  {{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}
                  {% if vehicle.trim %}<span class="text-gray-600">{{ vehicle.trim }}</span>{% endif %}
                </h3>
              </div>

              <!-- Price - Always shown -->
              <p class="text-primary text-2xl font-bold mb-4">
                ${{ vehicle.price | divided_by: 1.0 | round | number_with_delimiter }}
              </p>

              <!-- Vehicle Details - Fixed structure, always 6 lines -->
              <ul class="space-y-2 mb-4 text-gray-700 text-sm flex-grow">
                <!-- 1. Mileage - Always shown -->
                <li class="flex items-center gap-2">
                  <span class="text-base">📍</span>
                  <span>{{ vehicle.mileage | divided_by: 1000 | round }}K miles</span>
                </li>

                <!-- 2. Title Status - Always shown, document icon, bold -->
                <li class="flex items-center gap-2">
                  <span class="text-base">📄</span>
                  <span class="font-bold">{% if vehicle.title_status %}{{ vehicle.title_status }}{% else %}N/A{% endif %} Title</span>
                </li>

                <!-- 3. Transmission - Always shown -->
                <li class="flex items-center gap-2">
                  <span class="text-base">⚙️</span>
                  <span>{% if vehicle.transmission %}{{ vehicle.transmission }}{% else %}N/A{% endif %}</span>
                </li>

                <!-- 4. Fuel Type - Always shown -->
                <li class="flex items-center gap-2">
                  <span class="text-base">⛽</span>
                  <span>{% if vehicle.fuel_type %}{{ vehicle.fuel_type }}{% else %}N/A{% endif %}</span>
                </li>

                <!-- 5. Exterior Color - Always shown -->
                <li class="flex items-center gap-2">
                  <span class="text-base">🎨</span>
                  <span>{% if vehicle.exterior_color %}{{ vehicle.exterior_color }}{% else %}N/A{% endif %}{% if vehicle.interior_color %} / {{ vehicle.interior_color }}{% endif %}</span>
                </li>
              </ul>

              <!-- View Details Button -->
              <a href="{{ vehicle.url }}"
                 class="inline-block w-full text-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold mt-auto">
                View Details
              </a>
            </div>
          </div>
          {% endfor %}
        </div>

        <!-- No Results Message -->
        <div id="no-results" class="hidden text-center py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">No vehicles found</h3>
          <p class="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
          <button onclick="document.getElementById('clear-filters').click()"
                  class="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold">
            Clear All Filters
          </button>
        </div>

      </div>
    </div>
  </div>
</div>

<!-- Filter and Sort JavaScript -->
<script>
(function() {
  'use strict';

  // Get all vehicle cards
  const vehicleCards = document.querySelectorAll('.vehicle-card');
  const totalCount = vehicleCards.length;

  // Filter elements
  const filterMake = document.getElementById('filter-make');
  const filterModel = document.getElementById('filter-model');
  const filterYearMin = document.getElementById('filter-year-min');
  const filterYearMax = document.getElementById('filter-year-max');
  const filterPrice = document.getElementById('filter-price');
  const filterBodyType = document.getElementById('filter-body-type');
  const filterTransmission = document.getElementById('filter-transmission');
  const filterFuelType = document.getElementById('filter-fuel-type');
  const sortBy = document.getElementById('sort-by');
  const clearFiltersBtn = document.getElementById('clear-filters');

  // Results elements
  const resultsCount = document.getElementById('results-count');
  const totalCountEl = document.getElementById('total-count');
  const noResults = document.getElementById('no-results');
  const vehicleGrid = document.getElementById('vehicle-grid');
  const activeFiltersDiv = document.getElementById('active-filters');
  const filterBadges = document.getElementById('filter-badges');

  // Populate filter dropdowns from actual vehicle data
  function populateFilters() {
    const makes = new Set();
    const bodyTypes = new Set();
    const fuelTypes = new Set();
    const years = new Set();

    vehicleCards.forEach(card => {
      const make = card.dataset.make;
      const bodyType = card.dataset.bodyType;
      const fuelType = card.dataset.fuelType;
      const year = card.dataset.year;

      if (make) makes.add(make);
      if (bodyType) bodyTypes.add(bodyType);
      if (fuelType) fuelTypes.add(fuelType);
      if (year) years.add(parseInt(year));
    });

    // Populate Make
    Array.from(makes).sort().forEach(make => {
      const option = document.createElement('option');
      option.value = make;
      option.textContent = make;
      filterMake.appendChild(option);
    });

    // Populate Body Type
    Array.from(bodyTypes).sort().forEach(type => {
      if (type) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        filterBodyType.appendChild(option);
      }
    });

    // Populate Fuel Type
    Array.from(fuelTypes).sort().forEach(fuel => {
      if (fuel) {
        const option = document.createElement('option');
        option.value = fuel;
        option.textContent = fuel;
        filterFuelType.appendChild(option);
      }
    });

    // Populate Years
    const yearArray = Array.from(years).sort((a, b) => b - a);
    yearArray.forEach(year => {
      const optionMin = document.createElement('option');
      optionMin.value = year;
      optionMin.textContent = year;
      filterYearMin.appendChild(optionMin);

      const optionMax = document.createElement('option');
      optionMax.value = year;
      optionMax.textContent = year;
      filterYearMax.appendChild(optionMax);
    });
  }

  // Update model dropdown based on selected make
  function updateModelFilter() {
    const selectedMake = filterMake.value;
    filterModel.innerHTML = '<option value="">All Models</option>';

    if (!selectedMake) {
      filterModel.disabled = true;
      return;
    }

    const models = new Set();
    vehicleCards.forEach(card => {
      if (card.dataset.make === selectedMake) {
        models.add(card.dataset.model);
      }
    });

    Array.from(models).sort().forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      filterModel.appendChild(option);
    });

    filterModel.disabled = false;
  }

  // Apply filters
  function applyFilters() {
    const selectedMake = filterMake.value;
    const selectedModel = filterModel.value;
    const selectedYearMin = filterYearMin.value ? parseInt(filterYearMin.value) : null;
    const selectedYearMax = filterYearMax.value ? parseInt(filterYearMax.value) : null;
    const selectedPrice = filterPrice.value;
    const selectedBodyType = filterBodyType.value;
    const selectedTransmission = filterTransmission.value;
    const selectedFuelType = filterFuelType.value;

    let visibleCount = 0;
    const visibleCards = [];

    vehicleCards.forEach(card => {
      const make = card.dataset.make;
      const model = card.dataset.model;
      const year = parseInt(card.dataset.year);
      const price = parseFloat(card.dataset.price);
      const bodyType = card.dataset.bodyType;
      const transmission = card.dataset.transmission;
      const fuelType = card.dataset.fuelType;

      let show = true;

      // Make filter
      if (selectedMake && make !== selectedMake) show = false;

      // Model filter
      if (selectedModel && model !== selectedModel) show = false;

      // Year filter
      if (selectedYearMin && year < selectedYearMin) show = false;
      if (selectedYearMax && year > selectedYearMax) show = false;

      // Price filter
      if (selectedPrice) {
        const [min, max] = selectedPrice.split('-').map(p => parseFloat(p));
        if (price < min || price > max) show = false;
      }

      // Body Type filter
      if (selectedBodyType && bodyType !== selectedBodyType) show = false;

      // Transmission filter
      if (selectedTransmission && transmission !== selectedTransmission) show = false;

      // Fuel Type filter
      if (selectedFuelType && fuelType !== selectedFuelType) show = false;

      if (show) {
        card.style.display = 'block';
        visibleCount++;
        visibleCards.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    // Update results count
    resultsCount.textContent = visibleCount;
    totalCountEl.textContent = totalCount;

    // Show/hide no results message
    if (visibleCount === 0) {
      noResults.classList.remove('hidden');
      vehicleGrid.classList.add('hidden');
    } else {
      noResults.classList.add('hidden');
      vehicleGrid.classList.remove('hidden');
    }

    // Update active filters display
    updateActiveFilters();

    // Apply sorting to visible cards
    applySorting(visibleCards);

    // Update URL parameters
    updateURL();
  }

  // Update active filters badges
  function updateActiveFilters() {
    filterBadges.innerHTML = '';
    let hasFilters = false;

    const filters = [
      { element: filterMake, label: 'Make' },
      { element: filterModel, label: 'Model' },
      { element: filterYearMin, label: 'Year Min' },
      { element: filterYearMax, label: 'Year Max' },
      { element: filterPrice, label: 'Price', formatter: (v) => v.split('-').map(p => '$' + parseInt(p).toLocaleString()).join(' - ') },
      { element: filterBodyType, label: 'Body Type' },
      { element: filterTransmission, label: 'Transmission' },
      { element: filterFuelType, label: 'Fuel Type' }
    ];

    filters.forEach(filter => {
      if (filter.element.value) {
        hasFilters = true;
        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm';
        const displayValue = filter.formatter ? filter.formatter(filter.element.value) : filter.element.value;
        badge.innerHTML = `${filter.label}: ${displayValue} <button class="hover:text-primary-dark font-bold" onclick="document.getElementById('${filter.element.id}').value=''; document.getElementById('${filter.element.id}').dispatchEvent(new Event('change'))">×</button>`;
        filterBadges.appendChild(badge);
      }
    });

    activeFiltersDiv.classList.toggle('hidden', !hasFilters);
  }

  // Apply sorting
  function applySorting(cards) {
    const sortValue = sortBy.value;
    const [field, direction] = sortValue.split('-');

    cards.sort((a, b) => {
      let aVal, bVal;

      switch(field) {
        case 'price':
          aVal = parseFloat(a.dataset.price);
          bVal = parseFloat(b.dataset.price);
          break;
        case 'year':
          aVal = parseInt(a.dataset.year);
          bVal = parseInt(b.dataset.year);
          break;
        case 'mileage':
          aVal = parseFloat(a.dataset.mileage || 0);
          bVal = parseFloat(b.dataset.mileage || 0);
          break;
        case 'date':
          aVal = new Date(a.dataset.date);
          bVal = new Date(b.dataset.date);
          break;
      }

      if (direction === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    // Reorder DOM elements
    cards.forEach(card => {
      vehicleGrid.appendChild(card);
    });
  }

  // Clear all filters
  function clearFilters() {
    filterMake.value = '';
    filterModel.value = '';
    filterModel.disabled = true;
    filterYearMin.value = '';
    filterYearMax.value = '';
    filterPrice.value = '';
    filterBodyType.value = '';
    filterTransmission.value = '';
    filterFuelType.value = '';
    sortBy.value = 'date-desc';
    applyFilters();
  }

  // Update URL with filter parameters
  function updateURL() {
    const params = new URLSearchParams();

    if (filterMake.value) params.set('make', filterMake.value);
    if (filterModel.value) params.set('model', filterModel.value);
    if (filterYearMin.value) params.set('yearMin', filterYearMin.value);
    if (filterYearMax.value) params.set('yearMax', filterYearMax.value);
    if (filterPrice.value) params.set('price', filterPrice.value);
    if (filterBodyType.value) params.set('bodyType', filterBodyType.value);
    if (filterTransmission.value) params.set('transmission', filterTransmission.value);
    if (filterFuelType.value) params.set('fuelType', filterFuelType.value);
    if (sortBy.value !== 'date-desc') params.set('sort', sortBy.value);

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
  }

  // Load filters from URL on page load
  function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('make')) filterMake.value = params.get('make');
    if (params.get('model')) {
      updateModelFilter();
      filterModel.value = params.get('model');
    }
    if (params.get('yearMin')) filterYearMin.value = params.get('yearMin');
    if (params.get('yearMax')) filterYearMax.value = params.get('yearMax');
    if (params.get('price')) filterPrice.value = params.get('price');
    if (params.get('bodyType')) filterBodyType.value = params.get('bodyType');
    if (params.get('transmission')) filterTransmission.value = params.get('transmission');
    if (params.get('fuelType')) filterFuelType.value = params.get('fuelType');
    if (params.get('sort')) sortBy.value = params.get('sort');
  }

  // Event listeners
  filterMake.addEventListener('change', () => {
    updateModelFilter();
    applyFilters();
  });
  filterModel.addEventListener('change', applyFilters);
  filterYearMin.addEventListener('change', applyFilters);
  filterYearMax.addEventListener('change', applyFilters);
  filterPrice.addEventListener('change', applyFilters);
  filterBodyType.addEventListener('change', applyFilters);
  filterTransmission.addEventListener('change', applyFilters);
  filterFuelType.addEventListener('change', applyFilters);
  sortBy.addEventListener('change', applyFilters);
  clearFiltersBtn.addEventListener('click', clearFilters);

  // Initialize
  populateFilters();
  loadFiltersFromURL();
  applyFilters();
})();
</script>
