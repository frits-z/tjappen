# How to Add a New Recipe to tjappen.

Adding a new recipe is as simple as creating a folder and a text file! You don't need any coding knowledge, just follow these three steps:

## Step 1: Create a Folder
1. Go into the **`content/recipes/`** folder.
2. Create a new folder for your recipe. Name it something simple using lowercase letters and dashes instead of spaces. 
   *(Example: `content/recipes/spaghetti-bolognese/`)*

## Step 2: Add your Image (Optional but recommended)
1. Find a nice photo of your recipe.
2. Save the photo inside the folder you just created.
3. Rename the photo so the filename contains the word **"hero"** (for example: `hero.jpg` or `pasta-hero.png`). The website will automatically scale, compress, and crop it for you.

## Step 3: Write the Recipe
1. Inside your new recipe folder, create a text file exactly named **`index.md`**.
2. Open this file in any basic text editor and paste the template below.
3. Fill in the blanks!

---

### Copy-Paste Template:
```markdown
---
title: "Your Recipe Name Here"
time_active: 15
time_total: 45
servings: 4
cuisine: ["Italian"]
course: ["Dinner"]
effort: ["Medium"]
ingredients:
  - "400 | Pasta (grams)"
  - "1 | Jar of tomato sauce"
  - "0.5 | Splash of olive oil (cup)"
  - "Salt and pepper to taste"
notes:
  - "You can add extra cheese on top."
---

First, write your first step here. The website will automatically number this as "01" for you!

Leave an empty line, and then write your second step here. The website will number this "02".

Keep writing paragraphs separated by empty lines. Each paragraph becomes a new numbered step in the method. Enjoy!
```

### Important Formatting Rules:
- **Ingredients:** For the yield-scaler (+/- buttons) to work, you MUST separate the number and the ingredient text with a straight pipe character `|`. 
  - *Correct:* `"1.5 | Potatoes (kg)"*
  - *Correct (No scaling needed):* `"Salt and pepper"` 
  - *Incorrect:* `"1.5 kg Potatoes"` (The math won't work on this!)
- **Lists:** Notice that things inside `cuisine`, `course`, `effort`, `ingredients`, and `notes` are wrapped in square brackets `[ ]` or list dashes `-`. Keep those intact!
- **Text:** The text at the very bottom (underneath the `---` lines) is your method. Just write it like a normal story, separating each step by pressing `Enter` twice to leave a blank line.
