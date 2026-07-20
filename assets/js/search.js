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
    const searchInput = document.getElementById('searchInput');
    const resultsCount = document.getElementById('resultsCount');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    // New UI Elements
    const desktopFilters = document.getElementById('desktopFilters');
    const mobileFilters = document.getElementById('mobileFilters');
    const activeFiltersContainer = document.getElementById('activeFiltersContainer');
    const activeFiltersList = document.getElementById('activeFiltersList');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const mobileClearFiltersBtn = document.getElementById('mobileClearFiltersBtn');
    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    const mobileFilterPanel = document.getElementById('mobileFilterPanel');
    const closeMobileFilterBtn = document.getElementById('closeMobileFilterBtn');
    
    let activeDropdown = null;

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
            renderFilters(); 
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            clearSearchBtn.classList.add('hidden');
            searchInput.focus();
            renderGrid();
            renderFilters();
        });

        const clearAllFilters = () => {
            activeFilters = { cuisine: [], category: [], diet: [], occasion: [] };
            renderFilters();
            renderGrid();
        };

        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
        if (mobileClearFiltersBtn) mobileClearFiltersBtn.addEventListener('click', clearAllFilters);

        if (mobileFilterBtn) {
            mobileFilterBtn.addEventListener('click', () => {
                isFilterOpen = !isFilterOpen;
                mobileFilterPanel.classList.toggle('hidden', !isFilterOpen);
            });
        }
        
        if (closeMobileFilterBtn) {
            closeMobileFilterBtn.addEventListener('click', () => {
                isFilterOpen = false;
                mobileFilterPanel.classList.add('hidden');
            });
        }
        
        // Close desktop dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (activeDropdown && !e.target.closest('.desktop-dropdown')) {
                const dropdownMenu = activeDropdown.querySelector('.dropdown-menu');
                if (dropdownMenu) dropdownMenu.classList.add('hidden');
                activeDropdown = null;
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
        if (!desktopFilters || !mobileFilters || !activeFiltersList) return;
        
        // Preserve open dropdown state
        const openCategory = activeDropdown ? activeDropdown.dataset.category : null;
        
        // Preserve open mobile accordion state
        const openMobileCategories = Array.from(mobileFilters.querySelectorAll('.mobile-accordion-section'))
            .filter(section => {
                const menu = section.querySelector('div');
                return menu && !menu.classList.contains('hidden');
            })
            .map(section => section.dataset.category);
        
        let desktopHtml = '';
        let mobileHtml = '';
        const categories = Object.entries(taxonomyOptions).filter(([_, options]) => options.length > 0);
        
        categories.forEach(([category, options], index) => {
            const isLast = index === categories.length - 1;
            const hasActive = activeFilters[category].length > 0;
            const headerColor = hasActive ? 'text-primary' : 'text-black';
            
            // --- Desktop Dropdown ---
            desktopHtml += `
                <div class="relative desktop-dropdown group/dropdown" data-category="${category}">
                    <button class="flex items-center gap-1 text-sm font-bold uppercase tracking-widest ${headerColor} hover:text-primary transition-colors filter-dropdown-btn">
                        ${category} <i class="ph-fill ph-caret-down text-[10px]"></i>
                    </button>
                    <div class="dropdown-menu absolute top-full left-0 mt-2 bg-white border border-gray-200 p-5 min-w-max pr-8 hidden shadow-xl z-30">
                        <div class="grid ${options.length > 6 ? 'grid-cols-2' : 'grid-cols-1'} gap-y-3 gap-x-6">
                            ${options.map(option => {
                                const isActive = activeFilters[category].includes(option);
                                const count = getOptionCount(category, option);
                                const disabledAttr = count === 0 && !isActive ? 'disabled' : '';
                                const opacityClass = count === 0 && !isActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:text-primary';
                                return `
                                    <label class="flex items-center gap-3 ${opacityClass} text-sm font-medium transition-colors whitespace-nowrap pr-4">
                                        <input type="checkbox" class="form-checkbox text-primary rounded-sm border-gray-300 w-4 h-4 cursor-pointer" 
                                            onchange="handleFilterClick('${category}', '${option}')" ${isActive ? 'checked' : ''} ${disabledAttr}>
                                        <span>${option} <span class="text-gray-400 text-xs font-normal">(${count})</span></span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            // --- Mobile Accordion ---
            const borderClass = isLast ? '' : 'border-b border-gray-200 pb-4 mb-4';
            const isMobileOpen = openMobileCategories.includes(category);
            const mobileMenuClass = isMobileOpen ? 'mt-4 pl-2 grid grid-cols-1 gap-3' : 'hidden mt-4 pl-2 grid grid-cols-1 gap-3';
            const caretClass = isMobileOpen ? 'ph ph-caret-down transition-transform duration-200 rotate-180' : 'ph ph-caret-down transition-transform duration-200';
            
            mobileHtml += `
                <div class="mobile-accordion-section ${borderClass}" data-category="${category}">
                    <button class="w-full flex justify-between items-center text-left text-sm font-bold uppercase tracking-widest ${headerColor} hover:text-primary transition-colors py-2" onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('i').classList.toggle('rotate-180')">
                        ${category} <i class="${caretClass}"></i>
                    </button>
                    <div class="${mobileMenuClass}">
                        ${options.map(option => {
                            const isActive = activeFilters[category].includes(option);
                            const count = getOptionCount(category, option);
                            const disabledAttr = count === 0 && !isActive ? 'disabled' : '';
                            const opacityClass = count === 0 && !isActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:text-primary';
                            return `
                                <label class="flex items-center gap-3 ${opacityClass} text-sm font-medium transition-colors">
                                    <input type="checkbox" class="form-checkbox text-primary rounded-sm border-gray-300 w-4 h-4 cursor-pointer" 
                                        onchange="handleFilterClick('${category}', '${option}')" ${isActive ? 'checked' : ''} ${disabledAttr}>
                                    <span>${option} <span class="text-gray-400 text-xs font-normal">(${count})</span></span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        desktopFilters.innerHTML = desktopHtml;
        mobileFilters.innerHTML = mobileHtml;
        
        // Re-attach desktop dropdown toggling
        const dropdownBtns = desktopFilters.querySelectorAll('.filter-dropdown-btn');
        dropdownBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const parent = btn.closest('.desktop-dropdown');
                const menu = parent.querySelector('.dropdown-menu');
                const isHidden = menu.classList.contains('hidden');
                
                // Close all others
                desktopFilters.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
                
                if (isHidden) {
                    menu.classList.remove('hidden');
                    activeDropdown = parent;
                } else {
                    activeDropdown = null;
                }
            });
        });
        
        // Re-open active dropdown if there was one
        if (openCategory) {
            const activeParent = desktopFilters.querySelector(`[data-category="${openCategory}"]`);
            if (activeParent) {
                activeParent.querySelector('.dropdown-menu').classList.remove('hidden');
                activeDropdown = activeParent;
            }
        }

        // --- Active Filters Row ---
        let activeTagsHtml = '';
        let hasActiveFilters = false;
        
        Object.entries(activeFilters).forEach(([category, selected]) => {
            selected.forEach(option => {
                hasActiveFilters = true;
                activeTagsHtml += `
                    <button class="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black text-black text-[11px] font-bold tracking-widest rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors group" onclick="handleFilterClick('${category}', '${option}')">
                        ${option} <i class="ph ph-x text-primary text-xs group-hover:text-white transition-colors"></i>
                    </button>
                `;
            });
        });
        
        activeFiltersList.innerHTML = activeTagsHtml;
        
        if (hasActiveFilters) {
            activeFiltersContainer.classList.remove('hidden');
            activeFiltersContainer.classList.add('flex');
        } else {
            activeFiltersContainer.classList.add('hidden');
            activeFiltersContainer.classList.remove('flex');
        }
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
        if (clearFiltersBtn) clearFiltersBtn.classList.toggle('hidden', !hasActiveFilters);
        if (mobileClearFiltersBtn) mobileClearFiltersBtn.classList.toggle('hidden', !hasActiveFilters);

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
