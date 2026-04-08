---
name: admin
description: "Skill for the Admin area of TMDT. 11 symbols across 3 files."
---

# Admin

11 symbols | 3 files | Cohesion: 100%

## When to Use

- Working with code in `FrontEnd/`
- Understanding how AdminProducts, fetchProducts, openEdit work
- Modifying admin-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `FrontEnd/src/pages/admin/AdminProducts.jsx` | AdminProducts, fetchProducts, openEdit, removeImage, handleDelete (+1) |
| `FrontEnd/src/pages/admin/AdminUsers.jsx` | AdminUsers, toggleStatus, toggleRole |
| `FrontEnd/src/pages/admin/AdminOrders.jsx` | AdminOrders, handleStatusChange |

## Entry Points

Start here when exploring this area:

- **`AdminProducts`** (Function) — `FrontEnd/src/pages/admin/AdminProducts.jsx:14`
- **`fetchProducts`** (Function) — `FrontEnd/src/pages/admin/AdminProducts.jsx:32`
- **`openEdit`** (Function) — `FrontEnd/src/pages/admin/AdminProducts.jsx:61`
- **`removeImage`** (Function) — `FrontEnd/src/pages/admin/AdminProducts.jsx:105`
- **`handleDelete`** (Function) — `FrontEnd/src/pages/admin/AdminProducts.jsx:138`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AdminProducts` | Function | `FrontEnd/src/pages/admin/AdminProducts.jsx` | 14 |
| `fetchProducts` | Function | `FrontEnd/src/pages/admin/AdminProducts.jsx` | 32 |
| `openEdit` | Function | `FrontEnd/src/pages/admin/AdminProducts.jsx` | 61 |
| `removeImage` | Function | `FrontEnd/src/pages/admin/AdminProducts.jsx` | 105 |
| `handleDelete` | Function | `FrontEnd/src/pages/admin/AdminProducts.jsx` | 138 |
| `getThumbnail` | Function | `FrontEnd/src/pages/admin/AdminProducts.jsx` | 149 |
| `AdminUsers` | Function | `FrontEnd/src/pages/admin/AdminUsers.jsx` | 15 |
| `toggleStatus` | Function | `FrontEnd/src/pages/admin/AdminUsers.jsx` | 32 |
| `toggleRole` | Function | `FrontEnd/src/pages/admin/AdminUsers.jsx` | 41 |
| `AdminOrders` | Function | `FrontEnd/src/pages/admin/AdminOrders.jsx` | 21 |
| `handleStatusChange` | Function | `FrontEnd/src/pages/admin/AdminOrders.jsx` | 36 |

## How to Explore

1. `gitnexus_context({name: "AdminProducts"})` — see callers and callees
2. `gitnexus_query({query: "admin"})` — find related execution flows
3. Read key files listed above for implementation details
