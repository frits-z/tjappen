const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const recipesDir = path.join(__dirname, '..', 'content', 'recipes');
const FIELD_NAME = 'date'; // Change to 'date_added' if you prefer custom naming

function getGitCreationDate(filePath) {
    try {
        const stdout = execSync(`git log --follow --format=%as -- "${filePath}"`, { encoding: 'utf8' });
        const dates = stdout.trim().split('\n').filter(Boolean);
        if (dates.length > 0) {
            return dates[dates.length - 1]; // The oldest date (first commit)
        }
    } catch (e) {
        // Silently fail and fallback
    }
    try {
        const stat = fs.statSync(filePath);
        return stat.birthtime.toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
}

function processRecipes() {
    if (!fs.existsSync(recipesDir)) {
        console.error(`Recipes directory not found: ${recipesDir}`);
        return;
    }

    const folders = fs.readdirSync(recipesDir);
    let count = 0;
    
    folders.forEach(folder => {
        const recipePath = path.join(recipesDir, folder);
        if (fs.statSync(recipePath).isDirectory()) {
            const indexMdPath = path.join(recipePath, 'index.md');
            if (fs.existsSync(indexMdPath)) {
                const content = fs.readFileSync(indexMdPath, 'utf8');
                
                // Regex to match the YAML frontmatter
                const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
                const match = content.match(frontmatterRegex);
                
                if (match) {
                    let frontmatter = match[1];
                    
                    // Extract existing date/date_added if present
                    let existingDate = null;
                    const dateMatch = frontmatter.match(/^(?:date|date_added):\s*([^\r\n]+)/m);
                    if (dateMatch) {
                        existingDate = dateMatch[1].trim();
                    }
                    
                    const dateVal = existingDate || getGitCreationDate(indexMdPath);
                    
                    // Clean up any existing date / date_added fields to avoid duplication
                    frontmatter = frontmatter
                        .split('\n')
                        .filter(line => !line.trim().startsWith('date:') && !line.trim().startsWith('date_added:'))
                        .join('\n');
                    
                    // Insert the new date field right after the title line
                    const lines = frontmatter.split('\n');
                    const titleIndex = lines.findIndex(line => line.trim().startsWith('title:'));
                    
                    if (titleIndex !== -1) {
                        lines.splice(titleIndex + 1, 0, `${FIELD_NAME}: ${dateVal}`);
                        const updatedFrontmatter = lines.join('\n');
                        const newContent = content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
                        fs.writeFileSync(indexMdPath, newContent, 'utf8');
                        count++;
                    } else {
                        console.warn(`Could not find title: in ${folder}`);
                    }
                }
            }
        }
    });
    console.log(`Finished processing. Updated ${count} recipes with field "${FIELD_NAME}".`);
}

processRecipes();
