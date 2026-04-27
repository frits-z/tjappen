document.addEventListener('DOMContentLoaded', () => {

    const mainContainer = document.querySelector('main[data-base-servings]');
    if (!mainContainer) return;

    // --- 1. Step Parsers for Method & Ingredient Highlighting ---
    const rawContent = document.getElementById('methodContentRaw');
    const container = document.getElementById('methodContainer');
    
    // Setup ingredients parsing for crossover highlighting
    const ingredientItems = Array.from(document.querySelectorAll('.ingredient-item'));
    const ingredientContainer = document.querySelector('.ingredient-item')?.closest('ul');
    
    const ingredientsData = ingredientItems.map(item => {
        const nameEl = item.querySelector('.ingredient-name');
        const cleanedStr = nameEl ? nameEl.textContent.toLowerCase().replace(/\([^)]*\)/g, '').trim() : '';
        const words = cleanedStr.split(/[\s,-]+/).filter(w => w.length > 2 && !['and', 'the', 'with', 'cloves', 'fresh', 'light', 'dark', 'medium', 'large', 'small', 'big', 'tsp', 'tbsp', 'cup', 'cups', 'gram', 'grams', 'ml', 'kg', 'oz', 'of', 'for', 'bag', 'bags', 'pinch', 'pieces'].includes(w));
        return { item, words, nameStr: cleanedStr };
    });

    if (rawContent && container) {
        const children = Array.from(rawContent.children).filter(el => {
            return ['P', 'UL', 'OL', 'H3', 'H4'].includes(el.tagName);
        });

        let stepIndex = 1;
        children.forEach(child => {
            const numStr = stepIndex.toString().padStart(2, '0');
            
            const stepDiv = document.createElement('div');
            stepDiv.className = 'method-step flex gap-6 group';
            
            // Clean up the text of the child to search without HTML tag artifacts
            const stepTextContent = child.textContent.toLowerCase();
            
            stepDiv.innerHTML = `
                <span class="step-num text-3xl font-black text-gray-200 transition-colors shrink-0 w-12 text-right tabular-nums">${numStr}</span>
                <div class="pt-1 w-full prose">
                    ${child.outerHTML}
                </div>
            `;
            container.appendChild(stepDiv);
            stepIndex++;

            stepDiv.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                const isActive = stepDiv.classList.contains('active');
                const steps = document.querySelectorAll('.method-step');
                steps.forEach(s => s.classList.remove('active'));
                
                // Clear ingredients
                ingredientItems.forEach(i => i.classList.remove('active-ingredient'));
                if (ingredientContainer) ingredientContainer.classList.remove('has-active-step');
                
                if (!isActive) {
                    stepDiv.classList.add('active');
                    container.classList.add('has-active-step');
                    
                    let matchFound = false;
                    ingredientsData.forEach(ing => {
                        // Priority 1: exact base name match, Priority 2: partial word match
                        let isMatch = false;
                        if (ing.nameStr && stepTextContent.includes(ing.nameStr)) {
                            isMatch = true;
                        } else if (ing.words.length > 0 && ing.words.some(w => stepTextContent.includes(w))) {
                            isMatch = true;
                        }
                        
                        if (isMatch) {
                            ing.item.classList.add('active-ingredient');
                            matchFound = true;
                        }
                    });
                    
                    if (matchFound && ingredientContainer) {
                        ingredientContainer.classList.add('has-active-step');
                    }
                } else {
                    container.classList.remove('has-active-step');
                }
            });
        });

        rawContent.remove();
    }


    // --- 2. Yield Scaling ---
    const servingCountEl = document.getElementById('servingCount');
    const decBtn = document.getElementById('decServings');
    const incBtn = document.getElementById('incServings');
    const qtys = document.querySelectorAll('.ingredient-qty');

    if (servingCountEl) {
        const baseServings = parseFloat(mainContainer.getAttribute('data-base-servings'));
        let currentServings = baseServings;

        decBtn.addEventListener('click', () => {
            if (currentServings > 1) {
                currentServings--;
                updateYield();
            }
        });
        incBtn.addEventListener('click', () => {
            currentServings++;
            updateYield();
        });

        function smartRound(val) {
            if (val >= 100) return Math.round(val);
            if (val >= 10) return parseFloat(val.toFixed(1));
            return parseFloat(val.toFixed(2));
        }

        function updateYield() {
            if (isNaN(baseServings)) return;
            servingCountEl.textContent = currentServings;
            const ratio = currentServings / baseServings;
            qtys.forEach(qty => {
                const baseStr = qty.getAttribute('data-base');
                const base = parseFloat(baseStr);
                if (!isNaN(base)) {
                    let newVal = smartRound(base * ratio);
                    qty.textContent = baseStr.replace(/^[0-9.]+/, newVal);
                }
            });
        }
    }


    // --- 3. Screen Wake Lock ---
    const wakeLockBtn = document.getElementById('wakeLockBtn');
    const wakeLockStatus = document.getElementById('wakeLockStatus');
    let wakeLock = null;

    async function toggleWakeLock() {
        if (!('wakeLock' in navigator)) {
            wakeLockStatus.textContent = 'Not Supported';
            return;
        }

        try {
            if (wakeLock !== null) {
                await wakeLock.release();
                wakeLock = null;
                wakeLockStatus.textContent = 'Screen Lock: Off';
                wakeLockBtn.classList.remove('text-black');
                wakeLockBtn.classList.add('text-gray-400');
            } else {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLockStatus.textContent = 'Screen Lock: On';
                wakeLockBtn.classList.remove('text-gray-400');
                wakeLockBtn.classList.add('text-black');
                
                wakeLock.addEventListener('release', () => {
                    wakeLock = null;
                    wakeLockStatus.textContent = 'Screen Lock: Off';
                    wakeLockBtn.classList.remove('text-black');
                    wakeLockBtn.classList.add('text-gray-400');
                });
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }

    if (wakeLockBtn) {
        wakeLockBtn.addEventListener('click', toggleWakeLock);
    }

    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    });

});
