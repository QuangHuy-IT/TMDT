---
name: pages
description: "Skill for the Pages area of TMDT. 11 symbols across 3 files."
---

# Pages

11 symbols | 3 files | Cohesion: 100%

## When to Use

- Working with code in `FrontEnd/`
- Understanding how TimKiem, handleClearSearch, handlePageChange work
- Modifying pages-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `FrontEnd/src/pages/TimKiem.jsx` | TimKiem, handleClearSearch, handlePageChange, getPageNumbers |
| `FrontEnd/src/pages/Home.jsx` | Home, toggleBrand, handlePageChange, getPageNumbers |
| `FrontEnd/src/pages/Cart.jsx` | Cart, handleUpdateQuantity, handleRemoveItem |

## Entry Points

Start here when exploring this area:

- **`TimKiem`** (Function) — `FrontEnd/src/pages/TimKiem.jsx:8`
- **`handleClearSearch`** (Function) — `FrontEnd/src/pages/TimKiem.jsx:72`
- **`handlePageChange`** (Function) — `FrontEnd/src/pages/TimKiem.jsx:77`
- **`getPageNumbers`** (Function) — `FrontEnd/src/pages/TimKiem.jsx:83`
- **`Home`** (Function) — `FrontEnd/src/pages/Home.jsx:124`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `TimKiem` | Function | `FrontEnd/src/pages/TimKiem.jsx` | 8 |
| `handleClearSearch` | Function | `FrontEnd/src/pages/TimKiem.jsx` | 72 |
| `handlePageChange` | Function | `FrontEnd/src/pages/TimKiem.jsx` | 77 |
| `getPageNumbers` | Function | `FrontEnd/src/pages/TimKiem.jsx` | 83 |
| `Home` | Function | `FrontEnd/src/pages/Home.jsx` | 124 |
| `toggleBrand` | Function | `FrontEnd/src/pages/Home.jsx` | 151 |
| `handlePageChange` | Function | `FrontEnd/src/pages/Home.jsx` | 199 |
| `getPageNumbers` | Function | `FrontEnd/src/pages/Home.jsx` | 205 |
| `Cart` | Function | `FrontEnd/src/pages/Cart.jsx` | 4 |
| `handleUpdateQuantity` | Function | `FrontEnd/src/pages/Cart.jsx` | 21 |
| `handleRemoveItem` | Function | `FrontEnd/src/pages/Cart.jsx` | 26 |

## How to Explore

1. `gitnexus_context({name: "TimKiem"})` — see callers and callees
2. `gitnexus_query({query: "pages"})` — find related execution flows
3. Read key files listed above for implementation details
