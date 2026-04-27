document.addEventListener('DOMContentLoaded', () => {
    let currentSearch = "";
    let isFilterOpen = false;
    let activeFilters = { cuisine: [], course: [], diet: [], effort: [] };

    const grid = document.getElementById('recipeGrid');
    if (!grid) return;
    
    // Convert nodelist mapping wrappers and shuffle them
    const recipeWrappers = Array.from(document.querySelectorAll('.article-wrapper'));
    
    for (let i = recipeWrappers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recipeWrappers[i], recipeWrappers[j]] = [recipeWrappers[j], recipeWrappers[i]];
    }
    
    recipeWrappers.forEach(wrapper => grid.appendChild(wrapper));
    const cardsData = recipeWrappers.map(wrapper => {
        const card = wrapper.querySelector('.recipe-card');
        return {
            wrapper: wrapper,
            title: card.dataset.title.toLowerCase(),
            ingredients: (card.dataset.ingredients || '').toLowerCase(),
            taxonomies: {
                cuisine: (card.dataset.cuisine || "").split(' ').filter(Boolean).sort(),
                course: (card.dataset.course || "").split(' ').filter(Boolean).sort(),
                diet: (card.dataset.diet || "").split(' ').filter(Boolean).sort(),
                effort: (card.dataset.effort || "").split(' ').filter(Boolean).sort()
            }
        };
    });

    const taxonomyOptions = {
        cuisine: [...new Set(cardsData.flatMap(r => r.taxonomies.cuisine))].sort(),
        course: [...new Set(cardsData.flatMap(r => r.taxonomies.course))].sort(),
        diet: [...new Set(cardsData.flatMap(r => r.taxonomies.diet))].sort(),
        effort: [...new Set(cardsData.flatMap(r => r.taxonomies.effort))].sort()
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
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            clearSearchBtn.classList.add('hidden');
            searchInput.focus();
            renderGrid();
        });

        clearFiltersBtn.addEventListener('click', () => {
            activeFilters = { cuisine: [], course: [], diet: [], effort: [] };
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

    function renderFilters() {
        let html = '';
        for (const [category, options] of Object.entries(taxonomyOptions)) {
            if (options.length === 0) continue;
            html += `
                <div>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">${category}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${options.map(option => {
                            const isActive = activeFilters[category].includes(option);
                            const baseClasses = "px-3 py-1 text-xs font-medium cursor-pointer transition-colors border";
                            const activeClasses = isActive 
                                ? "bg-primary text-white border-primary" 
                                : "bg-white text-black border-gray-300 hover:border-primary hover:text-primary";
                            return `<button class="${baseClasses} ${activeClasses}" onclick="handleFilterClick('${category}', '${option}')">${option}</button>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        filterContainer.innerHTML = html;
    }

    function renderGrid() {
        let count = 0;
        
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
    }

    init();
});
