const fs = require('fs');
const path = require('path');

const recipesDir = path.join(__dirname, '..', 'content', 'recipes');
const DATE_FIELD = 'date'; // The field we want to verify is present

function validateRecipes() {
    if (!fs.existsSync(recipesDir)) {
        console.error(`Recipes directory not found: ${recipesDir}`);
        process.exit(1);
    }

    const folders = fs.readdirSync(recipesDir);
    const errors = [];
    
    folders.forEach(folder => {
        const recipePath = path.join(recipesDir, folder);
        if (fs.statSync(recipePath).isDirectory()) {
            const indexMdPath = path.join(recipePath, 'index.md');
            if (!fs.existsSync(indexMdPath)) {
                errors.push(`[${folder}] Missing index.md file`);
                return;
            }
            
            const content = fs.readFileSync(indexMdPath, 'utf8');
            const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
            const match = content.match(frontmatterRegex);
            
            if (!match) {
                errors.push(`[${folder}] Invalid or missing frontmatter delimiter (---)`);
                return;
            }
            
            const frontmatter = match[1];
            
            // Check for the date field
            const dateRegex = new RegExp(`^${DATE_FIELD}:\\s*([\\s\\S]*?)$`, 'm');
            const dateMatch = frontmatter.match(dateRegex);
            
            if (!dateMatch) {
                errors.push(`[${folder}] Missing required frontmatter field: "${DATE_FIELD}"`);
                return;
            }
            
            const dateVal = dateMatch[1].trim();
            
            // Check if date is in YYYY-MM-DD format
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
            // Handle optional quotes around the date
            const cleanedDateVal = dateVal.replace(/^['"]|['"]$/g, '');
            if (!isoDateRegex.test(cleanedDateVal)) {
                errors.push(`[${folder}] Invalid date format: "${dateVal}". Must be YYYY-MM-DD.`);
            }

            // Check for season field (optional)
            const lines = frontmatter.split('\n');
            const seasonIndex = lines.findIndex(line => line.trim().startsWith('season:'));
            if (seasonIndex !== -1) {
                const seasonLine = lines[seasonIndex];
                let values = [];
                
                // Try parsing inline array format: season: ["Spring", "Summer"]
                const inlineMatch = seasonLine.match(/\[(.*?)\]/);
                if (inlineMatch) {
                    values = inlineMatch[1]
                        .split(',')
                        .map(v => v.replace(/^['"\s\-\[\]]+|['"\s\-\[\]]+$/g, ''))
                        .filter(Boolean);
                } else {
                    // Try parsing block format: read subsequent lines starting with "-"
                    let nextIndex = seasonIndex + 1;
                    while (nextIndex < lines.length && (lines[nextIndex].trim().startsWith('-') || lines[nextIndex].trim() === '')) {
                        const line = lines[nextIndex].trim();
                        if (line.startsWith('-')) {
                            const val = line.substring(1).trim().replace(/^['"\s]+|['"\s]+$/g, '');
                            if (val) values.push(val);
                        }
                        nextIndex++;
                    }
                }
                
                const allowedSeasons = ["Spring", "Summer", "Autumn", "Winter", "All-year"];
                values.forEach(v => {
                    if (!allowedSeasons.includes(v)) {
                        errors.push(`[${folder}] Invalid season value: "${v}". Allowed options are: ${allowedSeasons.join(', ')}`);
                    }
                });
            }
        }
    });

    if (errors.length > 0) {
        console.error('\x1b[31m%s\x1b[0m', '=== RECIPE VALIDATION FAILED ===');
        errors.forEach(err => console.error('\x1b[31m%s\x1b[0m', `  - ${err}`));
        console.error('');
        process.exit(1);
    } else {
        console.log('\x1b[32m%s\x1b[0m', '✓ All recipes validated successfully (all have valid dates).');
        process.exit(0);
    }
}

validateRecipes();
