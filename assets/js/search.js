document.addEventListener('DOMContentLoaded', () => {
    let currentSearch = "";
    let isFilterOpen = false;
    let activeFilters = { cuisine: [], category: [], diet: [], occasion: [] };

    const grid = document.getElementById('recipeGrid');
    if (!grid) return;

    // Pre-generate a stable array of random slot types for the standard shapes.
    // This allows true randomness without causing shapes to morph while filtering.
    const randomSlotTypes = Array.from({length: 1000}, () => {
        const rand = Math.random();
        if (rand < 0.20) return 'portrait-1';
        if (rand < 0.40) return 'portrait-2';
        return 'standard';
    });

    // Convert nodelist mapping wrappers and shuffle them
    const recipeWrappers = Array.from(document.querySelectorAll('.article-wrapper'));
    
    for (let i = recipeWrappers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recipeWrappers[i], recipeWrappers[j]] = [recipeWrappers[j], recipeWrappers[i]];
    }
    
    recipeWrappers.forEach(wrapper => grid.appendChild(wrapper));
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

    const taxonomyOptions = {
        cuisine: [...new Set(cardsData.flatMap(r => r.taxonomies.cuisine))].sort(),
        category: [...new Set(cardsData.flatMap(r => r.taxonomies.category))].sort(),
        diet: [...new Set(cardsData.flatMap(r => r.taxonomies.diet))].sort(),
        occasion: [...new Set(cardsData.flatMap(r => r.taxonomies.occasion))].sort()
    };

    const filterContainer = document.getElementById('filterContainer');
    const searchInput = document.getElementById('searchInput');
    const resultsCount = document.getElementById('resultsCount');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterToggleText = document.getElementById('filterToggleText');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const noResultsMessage = document.getElementById('noResultsMessage');

    function init() {
        renderFilters();
        renderGrid();
        setupEventListeners();
    }

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

    // Exported to window so onclick works from innerHTML
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

    function getOptionCount(category, option) {
        let count = 0;
        cardsData.forEach(recipe => {
            const matchesSearch = !currentSearch || recipe.title.includes(currentSearch) || recipe.ingredients.includes(currentSearch);
            if (!matchesSearch) return;

            const matchesOtherCategories = Object.keys(activeFilters).every(cat => {
                if (cat === category) return true;
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

    function renderGrid() {
        let count = 0;
        let visibleIndex = 0;
        let cooldown = 4;
        let bigSide = 'left';
        
        cardsData.forEach(recipe => {
            const matchesSearch = !currentSearch || recipe.title.includes(currentSearch) || recipe.ingredients.includes(currentSearch);
            
            const matchesTaxonomies = Object.keys(activeFilters).every(category => {
                const selected = activeFilters[category];
                if (selected.length === 0) return true;
                const tags = recipe.taxonomies[category] || [];
                return selected.some(s => tags.includes(s)); // OR within
            });

            if (matchesSearch && matchesTaxonomies) {
                recipe.wrapper.style.display = 'block';
                
                // --- DYNAMIC SLOT LOGIC ---
                let type = 'standard';
                if (visibleIndex === 0) {
                    type = 'big';
                    cooldown = 8;
                } else if (cooldown <= 0) {
                    type = 'big';
                    cooldown = 8;
                } else {
                    cooldown--;
                    type = randomSlotTypes[visibleIndex] || 'standard';
                }

                // Reset structural classes
                recipe.wrapper.className = 'article-wrapper block';
                recipe.imageContainer.className = 'image-container';

                // Apply slot shape
                if (type === 'big') {
                    if (bigSide === 'left') {
                        recipe.wrapper.classList.add('col-span-2', 'big-left');
                        bigSide = 'right';
                    } else {
                        recipe.wrapper.classList.add('col-span-2', 'big-right');
                        bigSide = 'left';
                    }
                    recipe.imageContainer.classList.add('aspect-[3/2]', 'md:aspect-square');
                } else if (type === 'portrait-1') {
                    recipe.wrapper.classList.add('col-span-1');
                    recipe.imageContainer.classList.add('aspect-[4/5]');
                } else if (type === 'portrait-2') {
                    recipe.wrapper.classList.add('col-span-1');
                    recipe.imageContainer.classList.add('aspect-[3/4]');
                } else {
                    recipe.wrapper.classList.add('col-span-1');
                    recipe.imageContainer.classList.add('aspect-square');
                }

                visibleIndex++;
                count++;
            } else {
                recipe.wrapper.style.display = 'none';
            }
        });

        resultsCount.textContent = `${count} recipes in the cookbook`;
        
        const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
        clearFiltersBtn.style.display = hasActiveFilters ? 'block' : 'none';

        if (count === 0) {
            noResultsMessage.classList.remove('hidden');
        } else {
            noResultsMessage.classList.add('hidden');
        }

        // Reflow the masonry grid after DOM display updates
        if (typeof window.applyMasonry === 'function') {
            window.applyMasonry();
        }
    }

    init();
});
