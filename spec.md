# **Project: tjappen. Recipe Directory**

## **1\. Core Stack**

* **Framework:** Hugo (Extended version required for image processing).  
* **Hosting:** GitHub Pages via GitHub Actions.  
* **Styling:** Tailwind CSS (via local PostCSS build pipeline, NO CDN).  
* **Logic:** Vanilla JavaScript. No frontend frameworks.  
* **Icons:** Phosphor Icons (via CDN).  
* **Environment:** Docker DevContainer strictly enforced.

## **2\. Architecture & Data Structure**

* **Content Model:** Hugo Page Bundles. Every recipe is a directory (content/recipes/boerenkool/index.md) containing its text and images. No global /static/images/ folder.  
* **Taxonomies:** Configure three strict taxonomies in hugo.toml: cuisine, category, and occasion. Do not use generic tags.  
* **Front Matter Schema:** \* Required: title, time\_active, time\_total, servings (integer), cuisine (array), category (array), occasion (array), ingredients (array of strings).  
  * Optional: notes (array of strings).  
* **Ingredient Parsing:** The ingredients array must use a pipe | to separate quantity and item (e.g., \["1.5 | Floury potatoes (kg)"\]).  
  * **Constraint:** The value to the left of the pipe MUST be a strict integer or float to allow JS math. Qualitative amounts belong on the right (e.g., \["1 | Splash of milk"\]).

## **3\. Image Processing Pipeline**

* **Render Hook:** Create a custom Markdown render hook (layouts/\_default/\_markup/render-image.html).  
* **Processing:** Intercept all images, resize to max 1200px width, convert to WebP, and set quality to 75%.  
* **Styling:** The render hook must automatically apply the CSS class .inline-image to all images embedded within the markdown body.

## **4\. Client-Side Search**

* **Index:** Configure Hugo to output index.json during build.  
* **Payload Optimization:** Exclude .Content and .Plain. Index only frontmatter variables (title, URL, image path, taxonomies, ingredients) to prevent file bloat.  
* **Engine:** Vanilla JS search script (or Fuse.js).  
* **Logic:** \* Text input filters by title and ingredients.  
  * Faceted filters: OR logic within a category (e.g., Dutch OR Italian), AND logic across categories (e.g., Dutch AND Dinner).

## **5\. UI/UX Design System**

* **Identity:** Stark, high-contrast, text-heavy minimalism.  
* **Typography:** Inter font family. Heavy font weights (font-black headers, font-bold uppercase tracking-widest labels).  
* **Colors:** Strictly monochrome UI. Images render in full color.  
* **Global Components:** Footer contains branding, location ("Bussum, NL"), and a single link to about.html.  
* **Index Page:** \* Search/Filter hidden behind a toggle state.  
  * Grid: Title, time, and taxonomies underneath a 4:3 image.  
* **Recipe Page Layout:**  
  * Header: Title, Yield Adjuster, Split Time Metrics, taxonomies.  
  * Hero Image: 21:9 border box.  
  * Split View: Asymmetric split on desktop (1/3 ingredients left, 2/3 method right). Single column mobile.  
  * Notes: Render at bottom only if notes array exists. Use custom arrow bullets →.

## **6\. Functional Requirements (Recipe Page)**

* **Yield Scaling:** Render a \- \[num\] \+ stepper. JS calculates multiplier (Current / Base) and updates .ingredient-qty spans. Limit floats to 1 decimal.  
* **Ingredient Tracking:** Hidden checkboxes. CSS input:checked \+ span strikes through text and turns gray.  
* **Step Tracking:** Wrap method steps in a container. Clicking a step toggles an .active class. CSS dims sibling steps to 30% opacity.  
* **Screen Wake Lock:** Button in navbar utilizing navigator.wakeLock.request('screen'). Handle document visibility changes to reacquire lock