````markdown
# Design System Strategy: Clinical Intelligence & The Editorial Athlete

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Lab-Grade Editorial."**

We are moving away from the "loud" and aggressive aesthetics of typical fitness apps. Instead, we are designing a high-end, science-backed sanctuary. The experience should feel like a premium medical journal met a luxury timepiece: authoritative, quiet, and meticulously organized.

To achieve this, the design system leverages **RTL-first intentionality**, **tonal layering**, and **asymmetric white space**. We avoid the "boxed-in" look of standard mobile templates by treating the screen as a fluid canvas where data is elevated through light and depth rather than lines and containers.

---

## 2. Colors: Tonal Architecture

The palette is rooted in a "Deep Sea" dark mode that reduces eye strain and emphasizes clinical focus.

### The "No-Line" Rule

**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries are defined by the `surface-container` tiers. A section shift is signaled by a transition from `background` (#10141a) to `surface-container-low` (#181c22). If a separation is needed, use negative space.

### Surface Hierarchy & Nesting

Treat the UI as physical layers of smoked glass.

- **Base Layer:** `surface` (#10141a) - The canvas.
- **Secondary Layer:** `surface-container` (#1c2026) - Primary content groupings.
- **Elevated Layer:** `surface-container-high` (#262a31) - Modals, cards, and interactive elements.
- **Interaction Layer:** `surface-bright` (#353940) - Hover states or active selections.

### The Glass & Gradient Rule

For high-impact components (Progress Radials, Hero Stats), use a **Signature Gradient** transitioning from `primary` (#57f1db) to `primary-container` (#2dd4bf) at a 135-degree angle. Floating elements should utilize `backdrop-blur: 12px` combined with a semi-transparent `surface-variant` to allow the data beneath to "ghost" through, creating depth without clutter.

---

## 3. Typography: The Hebrew-First Grid

We use **Rubik** for its modern, humanist qualities which remain legible in Hebrew at small scales.

- **Display & Headlines:** Use `display-lg` and `headline-lg` (Bold) to anchor the page. In RTL layouts, these should have generous right-side margins to create a "starting point" for the eye.
- **Body & Labels:** `body-md` (Regular) provides the clinical legibility required for exercise instructions. `label-md` (Medium) is reserved for data headers and macro-nutrient categories.
- **Numerical Data:** While text is Right-aligned (RTL), all numbers (weights, reps, percentages) remain **Left-to-Right (LTR)**. Use `title-lg` for numbers to give them a distinct "data-viz" personality.

---

## 4. Elevation & Depth: Tonal Layering

We reject the standard "Drop Shadow." Instead, we use **Ambient Glow**.

- **The Layering Principle:** To lift a card, place a `surface-container-highest` card on a `surface-container-low` background. This "soft lift" is more sophisticated than a black shadow.
- **Ambient Shadows:** For floating Action Buttons or Overlays, use a shadow with a 24px blur, 0px offset, and 6% opacity using the `primary` color (#57f1db). This mimics the soft glow of a laboratory screen.
- **The Ghost Border Fallback:** If a border is required for accessibility (e.g., Input Fields), use `outline-variant` (#3c4a46) at **20% opacity**. It should be felt, not seen.

---

## 5. Components: Precision Primitives

### Buttons

- **Primary:** `primary` background with `on-primary` text. No border. 12px (`md`) radius.
- **Secondary:** Transparent background with a `ghost border` (#3c4a46 at 30%).
- **Tertiary:** Text-only, using `primary` color, with a subtle underline only on interaction.

### Cards & Lists

- **Rule:** Absolute prohibition of divider lines.
- **Implementation:** Separate list items using 8px of vertical space (`sm` scale). Use a slight background shift (`surface-container-low`) for the alternating items or on-press states.

### Input Fields (RTL)

- Labels must be right-aligned above the field.
- Iconography (e.g., search or lock) should be placed on the left side of the field to allow the Hebrew text to start cleanly from the right.

### Custom Component: The Macro-Bar

A segmented progress bar using the signature Macro Colors:

- **Protein:** #FB7185 (Rose)
- **Carbs:** #818CF8 (Indigo)
- **Fat:** #FBBF24 (Amber)
- _Design Note:_ Use a 4px gap between segments rather than a divider line.

---

## 6. Do’s and Don’ts

### Do:

- **Use Asymmetric Spacing:** Give headlines more "breath" (32px-48px) than the content below them to create an editorial feel.
- **Respect the RTL Flow:** Ensure the "Mental Model" moves from Right to Left. Icons that imply direction (arrows, chevrons) must be flipped.
- **Focus on Micro-Interactions:** Use the `secondary` (#bdc2ff) color for subtle hover glows on cards.

### Don't:

- **Don't use Pure Black:** The background must stay `#10141a` to maintain the "blue undertone" clinical warmth.
- **Don't use 100% Opaque Borders:** This shatters the "Clinical Calm" and creates visual noise.
- **Don't Center-Align Hebrew Body Text:** In an RTL environment, center-alignment is difficult to read for long passages. Stick to Right-aligned for all body content.
- **Don't Overuse the Accent Color:** The `primary` Teal is a scalpel, not a sledgehammer. Use it only for critical actions and active states.

---

## 7. Roundedness Scale

To maintain the "Modern Lab" aesthetic, we use a consistent 12px (`md`) radius for all primary containers.

- **Cards/Buttons:** 12px (`md`)
- **Outer Modals:** 24px (`xl`)
- **Tags/Chips:** 9999px (`full`) for a pill-shaped "capsule" look.

---

**Director's Final Note:** This design system is about the _space between_ the elements. By removing lines and embracing tonal shifts, we create a tool that feels intelligent and trustworthy—a digital companion for the serious athlete.```
````
