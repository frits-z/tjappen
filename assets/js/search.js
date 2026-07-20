/**
 * @fileoverview search.js
 * Handles the client-side search, filtering, and masonry grid layout for the recipe index.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentSearch = "";
    let isFilterOpen = false;
    let activeFilters = { cuisine: [], category: [], diet: [], occasion: [] };

    const grid = document.getElementById('recipeGrid');
    if (!grid) return;



    // --- DOM Parsing & Shuffling ---
    // Convert nodelist mapping wrappers and shuffle them
    const recipeWrappers = Array.from(document.querySelectorAll('.article-wrapper'));
    
    // Fisher-Yates shuffle to randomize the order of recipes on initial load
    for (let i = recipeWrappers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recipeWrappers[i], recipeWrappers[j]] = [recipeWrappers[j], recipeWrappers[i]];
    }
    
    recipeWrappers.forEach(wrapper => grid.appendChild(wrapper));
    
    /**
     * @typedef {Object} RecipeData
     * @property {HTMLElement} wrapper - The outer article wrapper element.
     * @property {HTMLElement} imageContainer - The container for the recipe image.
     * @property {string} title - The title of the recipe (lowercase).
     * @property {string} ingredients - The ingredients string (lowercase).
     * @property {Object} taxonomies - Arrays of tags for each category.
     */
    
    /** @type {RecipeData[]} */
    const cardsData = recipeWrappers.map(wrapper => {
        const card = wrapper.querySelector('.recipe-card');
        const imageContainer = wrapper.querySelector('.image-container');
        return {
            wrapper: wrapper,
            imageContainer: imageContainer,
            title: card.dataset.title.toLowerCase(),
            ingredients: (card.dataset.ingredients || '').toLowerCase(),
            taxonomies: {
                cuisine: (card.dataset.cuisine || "").split(',').map(s => s.trim()).filter(Boolean).sort(),
                category: (card.dataset.category || "").split(',').map(s => s.trim()).filter(Boolean).sort(),
                diet: (card.dataset.diet || "").split(',').map(s => s.trim()).filter(Boolean).sort(),
                occasion: (card.dataset.occasion || "").split(',').map(s => s.trim()).filter(Boolean).sort()
            }
        };
    });

    /** 
     * Extract unique sorted options for all taxonomy categories
     * @type {Object.<string, string[]>} 
     */
    const taxonomyOptions = {
        cuisine: [...new Set(cardsData.flatMap(r => r.taxonomies.cuisine))].sort(),
        category: [...new Set(cardsData.flatMap(r => r.taxonomies.category))].sort(),
        diet: [...new Set(cardsData.flatMap(r => r.taxonomies.diet))].sort(),
        occasion: [...new Set(cardsData.flatMap(r => r.taxonomies.occasion))].sort()
    };

    // --- DOM Elements ---
    const filterContainer = document.getElementById('filterContainer');
    const searchInput = document.getElementById('searchInput');
    const resultsCount = document.getElementById('resultsCount');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterToggleText = document.getElementById('filterToggleText');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const noResultsMessage = document.getElementById('noResultsMessage');

    /**
     * Initialize the UI by rendering filters, grid, and setting up listeners.
     */
    function init() {
        renderFilters();
        renderGrid();
        setupEventListeners();
    }

    /**
     * Attach event listeners for search and filter UI controls.
     */
    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            clearSearchBtn.classList.toggle('hidden', currentSearch.length === 0);
            renderGrid();
            renderFilters(); // Re-render to update counts based on new search
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            clearSearchBtn.classList.add('hidden');
            searchInput.focus();
            renderGrid();
            renderFilters();
        });

        clearFiltersBtn.addEventListener('click', () => {
            activeFilters = { cuisine: [], category: [], diet: [], occasion: [] };
            renderFilters();
            renderGrid();
        });

        filterToggleBtn.addEventListener('click', () => {
            isFilterOpen = !isFilterOpen;
            if (isFilterOpen) {
                filterPanel.classList.remove('hidden');
                filterToggleText.textContent = 'Close';
                filterToggleBtn.classList.replace('bg-black', 'bg-gray-200');
                filterToggleBtn.classList.replace('text-white', 'text-black');
            } else {
                filterPanel.classList.add('hidden');
                filterToggleText.textContent = 'Filters';
                filterToggleBtn.classList.replace('bg-gray-200', 'bg-black');
                filterToggleBtn.classList.replace('text-black', 'text-white');
            }
        });
    }

    /**
     * Global handler for filter button clicks, exposed to window for inline onclick usage.
     * Toggles a filter value in the activeFilters state.
     * @param {string} category - The taxonomy category (e.g., 'cuisine').
     * @param {string} value - The specific tag value.
     */
    window.handleFilterClick = function(category, value) {
        const index = activeFilters[category].indexOf(value);
        if (index > -1) {
            activeFilters[category].splice(index, 1);
        } else {
            activeFilters[category].push(value);
        }
        renderFilters();
        renderGrid();
    }

    /**
     * Calculate the number of recipes that would match if a specific filter option were selected,
     * considering the current search query and *other* active filter categories.
     * @param {string} category - The taxonomy category.
     * @param {string} option - The specific tag value.
     * @returns {number} The count of matching recipes.
     */
    function getOptionCount(category, option) {
        let count = 0;
        cardsData.forEach(recipe => {
            const matchesSearch = !currentSearch || recipe.title.includes(currentSearch) || recipe.ingredients.includes(currentSearch);
            if (!matchesSearch) return;

            // Check if recipe matches all *other* categories
            const matchesOtherCategories = Object.keys(activeFilters).every(cat => {
                if (cat === category) return true; // Ignore the category we're calculating for
                const selected = activeFilters[cat];
                if (selected.length === 0) return true;
                const tags = recipe.taxonomies[cat] || [];
                return selected.some(s => tags.includes(s));
            });

            if (matchesOtherCategories) {
                const tags = recipe.taxonomies[category] || [];
                if (tags.includes(option)) {
                    count++;
                }
            }
        });
        return count;
    }

    /**
     * Renders the filter panel UI, generating buttons with dynamic counts and states.
     */
    function renderFilters() {
        let html = '';
        const categories = Object.entries(taxonomyOptions).filter(([_, options]) => options.length > 0);
        categories.forEach(([category, options], index) => {
            const isLast = index === categories.length - 1;
            const marginStyle = isLast ? '' : 'style="margin-bottom: 16px;"';
            html += `
                <div ${marginStyle}>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3" style="margin-bottom: 12px;">${category}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${options.map(option => {
                            const isActive = activeFilters[category].includes(option);
                            const count = getOptionCount(category, option);
                            
                            let buttonHtml = '';
                            if (isActive) {
                                // Active button - always clickable to deselect
                                const baseClasses = "px-3 py-1 text-xs font-medium cursor-pointer transition-colors border";
                                const activeClasses = "bg-primary text-white border-primary";
                                buttonHtml = `<button class="${baseClasses} ${activeClasses}" onclick="handleFilterClick('${category}', '${option}')">${option} (${count})</button>`;
                            } else if (count === 0) {
                                // Disabled button - count is 0 and not active
                                const baseClasses = "px-3 py-1 text-xs font-medium border";
                                const disabledClasses = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60";
                                buttonHtml = `<button class="${baseClasses} ${disabledClasses}" disabled>${option} (0)</button>`;
                            } else {
                                // Enabled inactive button
                                const baseClasses = "px-3 py-1 text-xs font-medium cursor-pointer transition-colors border";
                                const inactiveClasses = "bg-white text-black border-gray-300 hover:border-primary hover:text-primary";
                                buttonHtml = `<button class="${baseClasses} ${inactiveClasses}" onclick="handleFilterClick('${category}', '${option}')">${option} (${count})</button>`;
                            }
                            return buttonHtml;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        filterContainer.innerHTML = html;
    }

    /**
     * Filters and renders the recipe grid based on current search and active filters.
     * Also applies dynamic visual slot shaping (big, portrait, standard) for a varied layout.
     */
    function renderGrid() {
        let count = 0;
        
        cardsData.forEach(recipe => {
            // Check text search
            const matchesSearch = !currentSearch || recipe.title.includes(currentSearch) || recipe.ingredients.includes(currentSearch);
            
            // Check taxonomy filters (OR within a category, AND across categories)
            const matchesTaxonomies = Object.keys(activeFilters).every(category => {
                const selected = activeFilters[category];
                if (selected.length === 0) return true;
                const tags = recipe.taxonomies[category] || [];
                return selected.some(s => tags.includes(s));
            });

            if (matchesSearch && matchesTaxonomies) {
                recipe.wrapper.style.display = 'block';
                count++;
            } else {
                recipe.wrapper.style.display = 'none';
            }
        });

        // Update UI counters and empty states
        resultsCount.textContent = `${count} recipes in the cookbook`;
        
        const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
        clearFiltersBtn.style.display = hasActiveFilters ? 'block' : 'none';

        if (count === 0) {
            noResultsMessage.classList.remove('hidden');
        } else {
            noResultsMessage.classList.add('hidden');
        }

        // Reflow the masonry grid after DOM display updates are complete
        if (typeof window.applyMasonry === 'function') {
            window.applyMasonry();
        }

        // Fade in the grid now that it's properly positioned (avoids jarring layout shifts)
        grid.classList.remove('opacity-0');
    }

    init();
});
