---
name: Architectural Surface System
colors:
  surface: '#0f141c'
  surface-dim: '#0f141c'
  surface-bright: '#343942'
  surface-container-lowest: '#090e16'
  surface-container-low: '#171c24'
  surface-container: '#1b2028'
  surface-container-high: '#252a33'
  surface-container-highest: '#30353e'
  on-surface: '#dee2ee'
  on-surface-variant: '#c4c6cc'
  inverse-surface: '#dee2ee'
  inverse-on-surface: '#2c3139'
  outline: '#8e9196'
  outline-variant: '#44474c'
  surface-tint: '#b9c8dd'
  primary: '#b9c8dd'
  on-primary: '#243142'
  primary-container: '#8492a6'
  on-primary-container: '#1d2b3b'
  inverse-primary: '#525f72'
  secondary: '#a5e7ff'
  on-secondary: '#003543'
  secondary-container: '#00d2ff'
  on-secondary-container: '#00566a'
  tertiary: '#aec6ff'
  on-tertiary: '#002e6b'
  tertiary-container: '#518eff'
  on-tertiary-container: '#00285f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d5e4fa'
  primary-fixed-dim: '#b9c8dd'
  on-primary-fixed: '#0e1c2c'
  on-primary-fixed-variant: '#3a4859'
  secondary-fixed: '#b6ebff'
  secondary-fixed-dim: '#47d6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#aec6ff'
  on-tertiary-fixed: '#001a43'
  on-tertiary-fixed-variant: '#004397'
  background: '#0f141c'
  on-background: '#dee2ee'
  surface-variant: '#30353e'
typography:
  display-xl:
    fontFamily: Syne
    fontSize: 4.5rem
    fontWeight: '800'
    lineHeight: 4.75rem
    letterSpacing: -0.04em
  display-xl-mobile:
    fontFamily: Syne
    fontSize: 2.75rem
    fontWeight: '800'
    lineHeight: 3rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Syne
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.25rem
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Syne
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.125rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Syne
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: '0'
  body-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: '0'
  label-mono:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.08em
  caption:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style
The design system establishes a visual language rooted in architectural precision, monolithic materiality, and technical luxury. Designed for an audience of architects, interior directors, and high-end residential clients, the interface rejects decorative softness in favor of crisp industrial structuralism. 

The aesthetic draws on Brutalist precision and gallery-grade curation: absolute right angles, sharp hairline dividers, deliberate structural negative space, and typographic tension between the sculptural curves of wide display letterforms and cold, technical body text. Visual cues reflect physical materials—polished aggregate, poured metallic polymers, and cold rolled steel—yielding an atmosphere that feels measured, durable, and uncompromisingly modern.

## Colors
The palette is built upon deep, light-absorbent industrial backdrops punctuated by razor-sharp atmospheric highlights.

- **Base Surfaces (`#0F141C`, `#161E2B`)**: Dense charcoal and obsidian slate form the foundational spatial planes, mirroring unlit polished substrate and deep cast resins.
- **Primary Structural Tone (`#8492A6`)**: Cool industrial gray utilized for structural borders, technical nomenclature, dimensional labels, and secondary interactive states.
- **Accent Signals (`#00D2FF`, `#0070F3`)**: High-luminance cyan and pure architectural cobalt provide functional contrast, used strictly for active states, focal indicators, structural cursor points, and status metrics.
- **High-Contrast Text (`#F8FAFC`, `#CBD5E1`)**: Crisp gallery whites ensure legibility and technical rigor against deep moody fields.

### Application Rules
Maintain an 85/10/5 ratio: 85% foundational dark slate/charcoal, 10% industrial gray structural definition and content, and 5% surgical cyan/cobalt focus. Color is an engineered tool for spatial orientation, never an arbitrary ornament.

## Typography
Typography is deployed as an architectural element. 

- **Display & Headlines (`Syne`)**: Expressive, wide, and sculptural. Used for portfolio headers, material names, and grand structural statements. The geometric contours of Syne echo fluid resin solidifying into brutal forms.
- **Body & Technical Metadata (`Geist`)**: Cold, ultra-legible, and disciplined. Renders specifications, technical pour depths, curing times, and editorial descriptions with mechanical clarity.
- **Labels & Micro-Badges**: Rendered strictly in uppercase via `label-mono`, using expanded letter-spacing to convey engineering drawings, cadastral survey data, and material grades.

## Layout & Spacing
The layout model is governed by a strict 12-column architectural grid with visible or implied construction axes.

- **Modular Rhythms**: All spacing tokens adhere to an exact 4px/8px incremental base. Internal component pads stay disciplined (`space-sm` to `space-md`), while container gutters evoke gallery scale and open floor plans.
- **Responsive Adaptations**:
  - **Desktop (1200px+)**: 12 columns, 48px canvas margin, 24px gutters. Structural panels may pin flush to viewport boundaries to emulate seamless surface coatings.
  - **Tablet (768px - 1199px)**: 8 columns, 32px canvas margin, 16px gutters. Technical matrices consolidate into 2-column modules.
  - **Mobile (320px - 767px)**: 4 columns, 20px canvas margin, 12px gutters. All multi-column property lists reflow into strictly gridded vertical registries.
- **Hairline Axis Alignment**: Sections are demarcated by full-width 1px solid boundaries rather than negative space alone, emphasizing planar shifts.

## Elevation & Depth
Elevation is expressed through tonal luminosity and planar borders, strictly avoiding blurry drop shadows or synthetic skeuomorphism.

- **Planar Stacking**: Depth is achieved via surface transitions. Base canvas (`#0F141C`) supports elevated structural tiles (`#161E2B`), while active overlays elevate to slate-tinted gunmetal (`#1F2937`).
- **Low-Contrast Hairlines**: All cards, modals, and panel intersections are defined by a crisp `1px solid rgba(132, 146, 166, 0.18)` outline. Under hover or focus, borders illuminate to `#8492A6` or pulse with `#00D2FF`.
- **Specular Inset Sheen**: To mimic polished concrete and wet-look metallic epoxy, prominent interactive elements utilize a subtle internal directional line: `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`.

## Shapes
Geometry is absolute and unyielding. Every container, button, input, badge, and image frame possesses an exact corner radius of `0px`. 

The design rejects radius rounding completely to reflect diamond-ground terrazzo cuts, poured self-leveling resins, and cast concrete edges. Visual variety is driven purely by line-weight contrast, geometric aspect ratios (such as square 1:1 swatch modules and 16:9 spatial captures), and technical grid coordinates.

## Components

### Buttons
- **Primary**: Solid architectural white (`#F8FAFC`) fill with deep obsidian text (`#0F141C`). Zero radius. Hover state swaps fill instantly to `#00D2FF` with zero motion lag, demonstrating industrial responsiveness.
- **Secondary / Ghost**: Transparent background with a `1px solid #8492A6` border, text in `#8492A6`. Hover elevates border to `#F8FAFC` and text to `#F8FAFC` with a `1px` subtle cyan corner accent.
- **Structural Action**: Monospaced uppercase text, tracked +0.08em, padded `space-sm` vertically and `space-lg` horizontally.

### Inputs & Form Controls
- **Fields**: Razor-sharp input blocks bounded by `1px solid rgba(132, 146, 166, 0.25)` over `#161E2B`. Labels sit atop fields using `caption` typography in full uppercase.
- **Focus State**: 1px sharp outline illuminated in `#00D2FF`; inset text remains `#F8FAFC`.
- **Checkboxes & Radios**: 16px square boxes with 0px radius. Checked state displays a solid `#00D2FF` fill with a high-contrast charcoal center point.

### Badges & Technical Micro-Tags
- Compact rectangular tags with 0px radius. Background set to `rgba(132, 146, 166, 0.08)` with a `1px solid rgba(132, 146, 166, 0.3)` border. Typography set to `label-mono`. Used for surface hardness ratings (e.g., `SHORE D 85`), slip coefficients (`R10`), and resin classifications.

### Cards & Spec Sheets
- Monolithic rectangular blocks encased in `1px solid rgba(132, 146, 166, 0.15)`. No shadows.
- Cards feature top header bands displaying technical indexing (e.g., `REF // SL-9042`) separated from the main content plane by a continuous 1px horizontal rule.

### Data Tables & Spec Grids
- Full-bleed bordered tables with hairline cell separators. Numerical values rendered in tabular monospace font formats. Alternate rows utilize alternating micro-shifts between `#0F141C` and `#131923`.