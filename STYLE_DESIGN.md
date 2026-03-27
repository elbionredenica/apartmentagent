# ApartmentAgent — Design System

## Design Philosophy

Inspired by Airbnb — clean layouts, generous whitespace, strong typography hierarchy. Warm, approachable, and easy to navigate. The UI should feel like a trusted tool, not a cold dashboard.

---

## Color Palette

```
--white:        #FFFFFF   — primary background
--off-white:    #F7F6F5   — secondary background, cards
--border:       #EBEBEB   — all borders
--ink:          #222222   — primary text, headings
--ink-mid:      #484848   — secondary text, labels
--ink-muted:    #767676   — placeholders, captions
--accent:       #FF5A5F   — primary brand color (Airbnb coral)
--accent-light: #FFF0F0   — accent tint for backgrounds
--accent-dark:  #E04E53   — accent hover state
--success:      #008A05   — confirmed / booked state
--warning:      #B45309   — partial match state
--error:        #C13515   — error state
```

---

## Typography

```
Headings:  "Cereal" (or fallback: "Inter", sans-serif)
Body:      "Cereal" (or fallback: "Inter", sans-serif)
```

```
Import fallback:
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

### Type Scale

```
xs:    12px — timestamps, labels
sm:    14px — captions, secondary info
base:  16px — body text
md:    18px — card titles
lg:    22px — section headings
xl:    28px — page headings
2xl:   36px — hero headings
```

### Weights

```
700 — page titles
600 — section headings, buttons
500 — emphasized body, card values
400 — regular body, descriptions
300 — timestamps, muted captions
```

---

## Spacing

Base unit: **8px**

```
4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px / 80px
```

Page padding: `80px` horizontal on desktop, `24px` on mobile.

---

## Border Radius

```
sm:    8px   — tags, badges
md:    12px  — inputs, small cards
lg:    16px  — main cards
xl:    24px  — modals, large panels
full:  9999px — pill badges, avatars
```

---

## Shadows

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.08);
--shadow-md:  0 4px 16px rgba(0,0,0,0.10);
--shadow-lg:  0 8px 32px rgba(0,0,0,0.12);
```

Use borders (`1px solid var(--border)`) for flat cards. Shadows only for floating elements (modals, dropdowns).

---

## Components

### Buttons

**Primary**
```
background: var(--accent)
color: #FFFFFF
padding: 14px 24px
border-radius: var(--radius-md)
font: 600 16px
hover: background var(--accent-dark)
```

**Secondary**
```
background: transparent
border: 1.5px solid var(--border)
color: var(--ink)
padding: 14px 24px
hover: border-color var(--ink-mid)
```

**Ghost**
```
background: transparent
color: var(--ink-mid)
padding: 8px 12px
hover: color var(--ink), background var(--off-white)
```

---

### Input Fields

```
border: 1.5px solid var(--border)
border-radius: var(--radius-md)
padding: 14px 16px
font: 400 16px
focus: border-color var(--ink), box-shadow var(--shadow-sm)
placeholder: var(--ink-muted)
```

---

### Cards

```
background: var(--white)
border: 1px solid var(--border)
border-radius: var(--radius-lg)
padding: 24px
hover: box-shadow var(--shadow-md)
transition: all 200ms ease
```

---

### Badges / Status Pills

Pill-shaped, small font, always labeled clearly.

```
Shortlisted:    bg #FFF8E6, text #92670A
Booked:         bg #EDFBEE, text var(--success)
Reaching Out:   bg var(--accent-light), text var(--accent)
Unable to Reach: bg #F5F5F5, text var(--ink-muted)
```

---

### Navigation

```
height: 80px
background: var(--white)
border-bottom: 1px solid var(--border)
padding: 0 80px

nav links: 500 15px, color var(--ink-mid)
active:    color var(--ink), font-weight 600
logo:      700 18px
```

---

## Layout

```
Max width:      1280px
Page padding:   80px horizontal
Column gutter:  24px

Dashboard:
  Sidebar: 320px
  Main: flex 1
  Separator: 1px border (no gap)

Chat view:
  Chat: 60%
  Info panel: 40%
```

---

## Icons

Use **Lucide Icons**.

```
stroke-width: 1.5
sizes: 16px (inline), 20px (nav/sidebar), 24px (empty states)
color: inherit
```

---

## Motion

Keep it simple and purposeful.

```
Enter:   opacity 0→1 + translateY(8px)→0, 200ms ease-out
Leave:   opacity 1→0, 150ms ease-in
Hover:   160ms
```

No decorative animations. Animate state changes only.

---

## Empty States

```
Centered icon: 32px, color var(--border)
One line text: 14px, color var(--ink-muted)
No illustrations
```

Example:
```
[Calendar icon]
No viewings booked yet
```