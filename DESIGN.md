---
name: Zest
colors:
  surface: '#fdf9e9'
  surface-dim: '#dedacb'
  surface-bright: '#fdf9e9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f4e4'
  surface-container: '#f2eede'
  surface-container-high: '#ece8d9'
  surface-container-highest: '#e6e3d3'
  on-surface: '#1c1c13'
  on-surface-variant: '#5c3f40'
  inverse-surface: '#323126'
  inverse-on-surface: '#f5f1e1'
  outline: '#906f70'
  outline-variant: '#e5bdbe'
  surface-tint: '#be0037'
  primary: '#b80035'
  on-primary: '#ffffff'
  primary-container: '#e11d48'
  on-primary-container: '#fffaf9'
  inverse-primary: '#ffb3b6'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc329'
  on-secondary-container: '#6f5100'
  tertiary: '#5f5a58'
  on-tertiary: '#ffffff'
  tertiary-container: '#787370'
  on-tertiary-container: '#fffbfa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b6'
  on-primary-fixed: '#40000c'
  on-primary-fixed-variant: '#920028'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e9e1dd'
  tertiary-fixed-dim: '#ccc5c2'
  on-tertiary-fixed: '#1e1b19'
  on-tertiary-fixed-variant: '#4a4643'
  background: '#fdf9e9'
  on-background: '#1c1c13'
  surface-variant: '#e6e3d3'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The design system is built upon the "Playful Precision" north star. It balances the exuberant energy of a modern culinary lifestyle with the meticulous engineering of high-quality kitchenware. The aesthetic is **Modern-Tactile**: it utilizes heavy, intentional whitespace and a vibrant color palette to feel fresh, while employing soft, generous curves to evoke the non-toxic, safe, and approachable nature of the products.

The target audience consists of home cooks who value both performance and personality. The UI should evoke a sense of culinary inspiration, cleanliness, and effortless joy. Visuals are crisp and structured (Precision), but never cold or clinical (Playful).

## Colors

The palette is rooted in appetizing, organic tones. 

- **Primary (Rose Red):** Used for primary actions and high-energy focal points. It represents the "Zest" of the brand.
- **Secondary (Warm Mustard):** Acts as a supporting accent for highlights, promotions, and secondary interactions.
- **Background (Butter Cream):** A soft, warm off-white that provides a sophisticated and less straining alternative to pure white, enhancing the "non-toxic" and "natural" brand feel.
- **Text (Dark Stone):** A near-black with warm undertones to ensure high legibility while maintaining the organic aesthetic.

## Typography

Typography focuses on clarity and personality. **Plus Jakarta Sans** is used for headlines to provide a geometric yet friendly rhythm that feels optimistic. **DM Sans** is utilized for body copy and UI labels for its understated modernism and excellent readability at smaller sizes.

Large display headings should use heavy weights to lean into the "Playful" aspect. Body text remains airy with a slightly increased line height to ensure a premium, breezy reading experience.

## Layout & Spacing

This design system employs a **Fluid Grid** model based on an 8px root unit. 

- **Desktop:** 12-column layout with 24px gutters and generous 64px margins to allow the product photography to breathe.
- **Mobile:** 4-column layout with 20px margins. 
- **Rhythm:** Spacing should be used to group related "culinary kits." Use `lg` (48px) and `xl` (80px) vertical padding between major sections to maintain a high-end, editorial feel. 

Components should use internal padding that reflects the "Pill" shape language—wider horizontal padding than vertical padding (e.g., 12px top/bottom, 24px left/right).

## Elevation & Depth

To maintain the "non-toxic" and "soft" brand feel, elevation is achieved through **Tonal Layering** and **Ambient Shadows** rather than harsh outlines.

- **Level 1 (Surface):** Butter Cream background.
- **Level 2 (Cards):** Pure white surfaces with a very soft, diffused shadow (15% opacity of Dark Stone, 20px blur) to make kitchenware items feel like they are sitting on a clean countertop.
- **Interactions:** On hover, elements should slightly lift (increase shadow spread) to simulate a physical, tactile response.
- **Overlays:** Use a subtle backdrop blur (8px) for modals to keep the focus on the "Precision" of the task at hand without losing the "Playful" color context of the background.

## Shapes

The shape language is the primary driver of the "Playful" personality. 

- **Primary Actions:** Buttons and tags must be fully pill-shaped (`rounded-full`).
- **Containers:** Large containers like product cards and image carousels use `rounded-xl` (1.5rem / 24px) to avoid looking sharp or dangerous. 
- **Inputs:** Form fields should use `rounded-lg` (1rem / 16px) to bridge the gap between the ultra-round buttons and the structured layout.

## Components

- **Buttons:** Primary buttons are pill-shaped, filled with Rose Red, and use white bold DM Sans text. Secondary buttons use a Rose Red outline with no fill.
- **Product Cards:** Use a white background with 24px rounded corners. Image should be centered with a subtle Warm Mustard or Rose Red accent badge in the top-right corner.
- **Chips/Filters:** Always pill-shaped. Unselected states use a Butter Cream stroke; selected states use a solid Warm Mustard fill.
- **Input Fields:** Generous height (48px+) with a 1px Dark Stone border at 10% opacity. Focus states switch to a 2px Rose Red border.
- **Lists:** Use custom bullet points that are small Rose Red circles to reinforce the brand's precision.
- **Kitchenware Iconography:** Use thick-stroke (2pt) icons with rounded ends to match the typography's weight and the "Soft" shape language.