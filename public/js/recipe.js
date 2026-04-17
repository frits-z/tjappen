document.addEventListener('DOMContentLoaded', () => {

    const mainContainer = document.querySelector('main[data-base-servings]');
    if (!mainContainer) return;

    // --- 1. Step Parsers for Method ---
    const rawContent = document.getElementById('methodContentRaw');
    const container = document.getElementById('methodContainer');
    if (rawContent && container) {
        const children = Array.from(rawContent.children).filter(el => {
            return ['P', 'UL', 'OL', 'H3', 'H4'].includes(el.tagName);
        });

        let stepIndex = 1;
        children.forEach(child => {
            const numStr = stepIndex.toString().padStart(2, '0');
            
            const stepDiv = document.createElement('div');
            stepDiv.className = 'method-step flex gap-6 group';
            
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
                
                if (!isActive) {
                    stepDiv.classList.add('active');
                    container.classList.add('has-active-step');
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

        function updateYield() {
            if (isNaN(baseServings)) return;
            servingCountEl.textContent = currentServings;
            const ratio = currentServings / baseServings;
            qtys.forEach(qty => {
                const baseStr = qty.getAttribute('data-base');
                const base = parseFloat(baseStr);
                if (!isNaN(base)) {
                    let newVal = base * ratio;
                    newVal = Number.isInteger(newVal) ? newVal : newVal.toFixed(1).replace(/\.0$/, '');
                    
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
