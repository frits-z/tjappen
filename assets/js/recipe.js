/**
 * @fileoverview recipe.js
 * Handles client-side interactivity on the single recipe page, including:
 * 1. Step Parsers for Method & Ingredient Cross-Highlighting
 * 2. Yield Scaling (Serving adjustments)
 * 3. Screen Wake Lock (Keeping the screen on while cooking)
 */

document.addEventListener('DOMContentLoaded', () => {

    const mainContainer = document.querySelector('main[data-base-servings]');
    if (!mainContainer) return;

    // =========================================================================
    // 1. Step Parsers for Method & Ingredient Highlighting
    // =========================================================================
    
    /**
     * This section parses the raw HTML content of the method steps, wraps them
     * in clickable divs, and sets up cross-highlighting logic. When a user clicks
     * a method step, any ingredients mentioned in that step are highlighted in the
     * ingredients list.
     */
    const rawContent = document.getElementById('methodContentRaw');
    const container = document.getElementById('methodContainer');
    
    // Setup ingredients parsing for crossover highlighting
    const ingredientItems = Array.from(document.querySelectorAll('.ingredient-item'));
    const ingredientContainer = document.querySelector('.ingredient-item')?.closest('ul');
    
    /**
     * @typedef {Object} IngredientData
     * @property {HTMLElement} item - The DOM element of the ingredient list item.
     * @property {string[]} words - Filtered array of significant words from the ingredient name.
     * @property {string} nameStr - The full, cleaned ingredient name string.
     */
    
    /** @type {IngredientData[]} */
    const ingredientsData = ingredientItems.map(item => {
        const nameEl = item.querySelector('.ingredient-name');
        // Clean string: lower case, remove text in parentheses, trim whitespace
        const cleanedStr = nameEl ? nameEl.textContent.toLowerCase().replace(/\([^)]*\)/g, '').trim() : '';
        // Split into words and filter out common/insignificant words to prevent false-positive matches
        const words = cleanedStr.split(/[\s,-]+/).filter(w => w.length > 2 && !['and', 'the', 'with', 'cloves', 'fresh', 'light', 'dark', 'medium', 'large', 'small', 'big', 'tsp', 'tbsp', 'cup', 'cups', 'gram', 'grams', 'ml', 'kg', 'oz', 'of', 'for', 'bag', 'bags', 'pinch', 'pieces'].includes(w));
        return { item, words, nameStr: cleanedStr };
    });

    if (rawContent && container) {
        // Only extract meaningful structural elements as steps
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

            /**
             * Click listener for each method step.
             * Toggles active state and highlights matching ingredients.
             */
            stepDiv.addEventListener('click', (e) => {
                // Don't trigger if they clicked a link inside the step
                if (e.target.closest('a')) return;
                
                const isActive = stepDiv.classList.contains('active');
                
                // Reset all steps and ingredients
                const steps = document.querySelectorAll('.method-step');
                steps.forEach(s => s.classList.remove('active'));
                ingredientItems.forEach(i => i.classList.remove('active-ingredient'));
                if (ingredientContainer) ingredientContainer.classList.remove('has-active-step');
                
                if (!isActive) {
                    // Activate this step
                    stepDiv.classList.add('active');
                    container.classList.add('has-active-step');
                    
                    let matchFound = false;
                    ingredientsData.forEach(ing => {
                        // Priority 1: exact base name match. Priority 2: partial significant word match.
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
                    // Deactivated, remove container state
                    container.classList.remove('has-active-step');
                }
            });
        });

        // Remove the raw hidden content now that it's been parsed
        rawContent.remove();
    }


    // =========================================================================
    // 2. Yield Scaling
    // =========================================================================
    
    /**
     * Handles dynamically scaling ingredient quantities up or down based on
     * the requested number of servings.
     */
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

        /**
         * Intelligently rounds scaled numbers so they look natural
         * (e.g. 1.25 instead of 1.253, 15 instead of 14.8 for large numbers).
         * @param {number} val - The raw scaled value.
         * @returns {number} The rounded value.
         */
        function smartRound(val) {
            if (val >= 100) return Math.round(val);
            if (val >= 10) return parseFloat(val.toFixed(1));
            return parseFloat(val.toFixed(2));
        }

        /**
         * Updates all ingredient quantity elements on the page based on the
         * current serving ratio.
         */
        function updateYield() {
            if (isNaN(baseServings)) return;
            servingCountEl.textContent = currentServings;
            const ratio = currentServings / baseServings;
            
            qtys.forEach(qty => {
                const baseStr = qty.getAttribute('data-base');
                const base = parseFloat(baseStr);
                if (!isNaN(base)) {
                    let newVal = smartRound(base * ratio);
                    // Replace only the leading number to preserve units (e.g., "400 g" -> "800 g")
                    qty.textContent = baseStr.replace(/^[0-9.]+/, newVal);
                }
            });
        }
    }


    // =========================================================================
    // 3. Screen Wake Lock
    // =========================================================================
    
    /**
     * Uses the Screen Wake Lock API to prevent the device screen from dimming
     * or locking while the user is actively cooking.
     */
    const wakeLockBtn = document.getElementById('wakeLockBtn');
    const wakeLockStatus = document.getElementById('wakeLockStatus');
    let wakeLock = null;

    /**
     * Toggles the wake lock state on and off, updating the UI accordingly.
     */
    async function toggleWakeLock() {
        if (!('wakeLock' in navigator)) {
            wakeLockStatus.textContent = 'Not Supported';
            return;
        }

        try {
            if (wakeLock !== null) {
                // Release the wake lock
                await wakeLock.release();
                wakeLock = null;
                wakeLockStatus.textContent = 'Screen Lock: Off';
                wakeLockBtn.classList.remove('text-black');
                wakeLockBtn.classList.add('text-gray-400');
            } else {
                // Request the wake lock
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLockStatus.textContent = 'Screen Lock: On';
                wakeLockBtn.classList.remove('text-gray-400');
                wakeLockBtn.classList.add('text-black');
                
                // Handle system-forced releases (e.g., low battery)
                wakeLock.addEventListener('release', () => {
                    wakeLock = null;
                    wakeLockStatus.textContent = 'Screen Lock: Off';
                    wakeLockBtn.classList.remove('text-black');
                    wakeLockBtn.classList.add('text-gray-400');
                });
            }
        } catch (err) {
            console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        }
    }

    if (wakeLockBtn) {
        wakeLockBtn.addEventListener('click', toggleWakeLock);
    }

    /**
     * The wake lock is automatically released by the browser when the page
     * goes into the background. This listener attempts to re-acquire it
     * automatically when the user returns to the page.
     */
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    });

});
