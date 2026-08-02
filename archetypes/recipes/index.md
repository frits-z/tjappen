---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ dateFormat "2006-01-02" .Date }}
description: "A short, engaging summary of the recipe."
time_active: 15  # Active prep time in minutes (integer)
time_total: 30   # Total time in minutes (integer)
servings: 4      # Base yield (integer)

# Taxonomies (use existing tags from your filters where possible):
cuisine: []      # e.g. (not limited) ["Italian", "Thai", "Korean", "Catalan", "Dutch", "Fusion", "European"]
category: []     # Options: ["Main", "Salad", "Snack", "Essential", "Soup", "Side", "Dessert", "Baking", "Breakfast", "Drink"]
diet: []         # e.g. (not limited) ["Vegetarian", "Plant-based", "Meat", "Fish", "Low-carb"]
occasion: []     # Options: ["Midweek", "Weekend project", "Batch-cook", "Party", "Holiday", "Make-ahead"]

# Ingredients structure: "Quantity | Item name (Unit)"
# CRITICAL: The value to the left of the pipe MUST be a strict integer or float (e.g., 1.5 or 2)
# to allow client-side servings scaling. Qualitative amounts belong on the right.
# Use "- '# Section Name'" to create subtitle separators in the list.
ingredients:
  - "# Section Title (Optional)"
  - "1 | Item description"

# Optional fields (uncomment to use):
# draft: true                    # Set to true to hide this recipe from the live site (standard Hugo feature)
# rating: 5                      # Personal rating (e.g., 1-5 integer)
# source: "Author or Cookbook Name"
# source_url: "https://..."      # Links the source name above if defined
# author: "Guest Author Name"    # Default is "Frits" if omitted. Displays in Credits section.
# season: []                     # List of seasons (options: "Spring", "Summer", "Autumn", "Winter")
# notes:
#   - "Top tip: write a helpful cooking note or variation here"
---

Write your step-by-step method here. 

CRITICAL FOR STEP PARSING: 
- Make sure to leave an empty line (blank row) between each step.
- Markdown requires a blank line to render text as separate paragraphs (<p>). 
- If you don't leave a blank line, two lines of text will merge into a single step.

Example:
First, preheat the oven to 200°C.

Then, chop the onions and garlic finely.


--- FORMATTING QUICK-GUIDE ---

1. HOW TO ADD PHOTOS INSIDE STEPS:
- First, place your photo file (e.g. "mixing.jpg" or "step2.png") directly inside the same folder as this index.md file.
- Inside your step text, write the photo tag exactly like this:
  ![Short description of the photo](photo-filename.jpg)
  
  Example:
  Whisk the eggs in a medium bowl until frothy.
  ![Whisked eggs in a bowl](eggs-whisk.jpg)

2. HOW TO ADD WEBSITES / LINKS:
- To link a word or phrase to another website, write it like this:
  [The text you want people to read](https://www.website.com)
  
  Example:
  This recipe was inspired by a technique found on [Serious Eats](https://www.seriouseats.com).
