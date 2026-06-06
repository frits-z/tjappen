# How to Add a New Recipe to tjappen

Adding a new recipe is as simple as creating a folder and a text file! You don't need any coding knowledge, just follow these three steps:

## Step 1: Create a Folder
1. Go into the **`content/recipes/`** folder.
2. Create a new folder for your recipe. Name it something simple using lowercase letters and dashes instead of spaces. 
   *(Example: `content/recipes/spaghetti-bolognese/`)*

## Step 2: Add your Image (Optional but recommended)
1. Find a nice photo of your recipe.
2. Save the photo inside the folder you just created.
3. Rename the photo so the filename contains the word **"hero"** or **"cover"** (for example: `hero.jpg` or `pasta-cover.png`).
   *Note: If no image contains "hero" or "cover", the website will fall back to the first `.jpg` or `.png` it finds. If you are uploading multiple images to the folder, make sure the main banner image has "hero" or "cover" in its name so it is selected correctly.*

## Step 3: Write the Recipe
1. Inside your new recipe folder, create a text file exactly named **`index.md`**.
2. Open this file in any basic text editor and paste the template below.
3. Fill in the blanks!

---

### Copy-Paste Template:
```markdown
---
title: "Your Recipe Name Here"
description: "A short, mouth-watering summary of the dish." # Optional (used for SEO and page summaries)
time_active: 15
time_total: 45
servings: 4
cuisine: ["Italian"]
category: ["Main"]
diet: ["Vegetarian"]
occasion: ["Batch-cook"]
ingredients:
  - "# Pasta"
  - "400 | Pasta (grams)"
  - "# Sauce"
  - "1 | Jar of tomato sauce"
  - "0.5 | Splash of olive oil (cup)"
  - "Salt and pepper to taste"
notes:
  - "You can add extra cheese on top."
---

First, write your first step here. The website will automatically number this as "01" for you!

Leave an empty line, and then write your second step here. The website will number this "02".

Keep writing paragraphs separated by empty lines. Each paragraph becomes a new numbered step in the method. You should NOT include numbers yourself. The website does this in its processing. Enjoy!
```

### Important Formatting Rules:

- **Ingredients:** For the yield-scaler (+/- buttons) to work, you MUST separate the number and the ingredient text with a straight pipe character `|`. 
  - *Correct:* `"1.5 | Potatoes (kg)"`
  - *Correct (No scaling needed):* `"Salt and pepper"` 
  - *Incorrect:* `"1.5 kg Potatoes"` (The math won't work on this!)
  - **Quantity Constraint:** The value to the left of the pipe must be a strict integer or decimal (e.g. `1` or `0.5`). Do not use fractions (e.g., `1/2`), ranges (e.g., `2-3`), or descriptive text (e.g., `a pinch`) on the left side of the pipe, as this will break the automatic scaling calculations. Instead, write them like:
    - `"0.5 | Onion"` (use decimals instead of `1/2`)
    - `"2 | Carrots (approx. 2-3)"` (put ranges/details in parentheses on the right)
    - `"A pinch of salt"` (omit the pipe entirely if scaling is not relevant)
  - *Subcategories:* You can group ingredients by prefixing a line with `# ` (e.g., `"# Sauce"` or `"# Main"`).

- **Standardized Tags (Taxonomies):** To keep search filters clean and consistent, try to reuse existing tags where possible:
  - **Cuisine:** `Catalan`, `Dutch`, `European`, `French`, `Fusion`, `Indonesian`, `Italian`, `Korean`, `Middle Eastern`, `Thai`
  - **Category:** `Main`, `Salad`, `Essential`
  - **Diet:** `Meat`, `Fish`, `Vegetarian`, `Plant-based`, `Low-carb`
  - **Occasion:** `Weeknight`, `Batch-cook`, `Special`

- **Lists:** Notice that things inside `cuisine`, `category`, `diet`, `occasion`, `ingredients`, and `notes` are wrapped in square brackets `[ ]` or list dashes `-`. Keep those intact!

- **Text:** The text at the very bottom (underneath the `---` lines) is your method. Just write it like a normal story, separating each step by pressing `Enter` twice to leave a blank line. Do not manually number the steps or use markdown lists, as they will interfere with the site's automatic step-by-step layout.
