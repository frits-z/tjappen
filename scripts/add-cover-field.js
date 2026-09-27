const fs = require('fs');
const path = require('path');

const recipesDir = path.join(__dirname, '..', 'content', 'recipes');

function addCoverFields() {
    if (!fs.existsSync(recipesDir)) {
        console.error(`Recipes directory not found: ${recipesDir}`);
        process.exit(1);
    }

    const folders = fs.readdirSync(recipesDir);
    let updatedCount = 0;
    let skippedCount = 0;

    folders.forEach(folder => {
        const recipePath = path.join(recipesDir, folder);
        if (!fs.statSync(recipePath).isDirectory()) return;

        const indexMdPath = path.join(recipePath, 'index.md');
        if (!fs.existsSync(indexMdPath)) return;

        // Find cover image in the folder
        const files = fs.readdirSync(recipePath);
        const imageFile = files.find(f => /^cover\.(jpe?g|png|webp|avif)$/i.test(f))
            || files.find(f => /^hero\.(jpe?g|png|webp|avif)$/i.test(f))
            || files.find(f => /\.(jpe?g|png|webp|avif)$/i.test(f));

        if (!imageFile) {
            console.warn(`[${folder}] No image file found in recipe directory.`);
            return;
        }

        const content = fs.readFileSync(indexMdPath, 'utf8');
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            console.warn(`[${folder}] Could not find frontmatter delimiters.`);
            return;
        }

        let frontmatter = match[1];

        // Check if cover: is already defined
        if (/^cover:\s*.+$/m.test(frontmatter)) {
            skippedCount++;
            return;
        }

        // Insert cover: right after title: (or date:)
        const lines = frontmatter.split('\n');
        const titleIndex = lines.findIndex(l => l.trim().startsWith('title:'));
        const insertIndex = titleIndex !== -1 ? titleIndex + 1 : 0;

        lines.splice(insertIndex, 0, `cover: "${imageFile}"`);
        const newFrontmatter = lines.join('\n');
        const newContent = content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---`);

        fs.writeFileSync(indexMdPath, newContent, 'utf8');
        console.log(`[${folder}] Added cover: "${imageFile}"`);
        updatedCount++;
    });

    console.log(`\nFinished: updated ${updatedCount} recipes, skipped ${skippedCount} (already had cover).`);
}

addCoverFields();
