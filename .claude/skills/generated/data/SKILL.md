---
name: data
description: "Skill for the Data area of TMDT. 3 symbols across 1 files."
---

# Data

3 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `FrontEnd/`
- Understanding how getReviewsByProductId, getAvgRating, getRatingDistribution work
- Modifying data-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `FrontEnd/src/data/reviews.js` | getReviewsByProductId, getAvgRating, getRatingDistribution |

## Entry Points

Start here when exploring this area:

- **`getReviewsByProductId`** (Function) — `FrontEnd/src/data/reviews.js:205`
- **`getAvgRating`** (Function) — `FrontEnd/src/data/reviews.js:209`
- **`getRatingDistribution`** (Function) — `FrontEnd/src/data/reviews.js:216`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getReviewsByProductId` | Function | `FrontEnd/src/data/reviews.js` | 205 |
| `getAvgRating` | Function | `FrontEnd/src/data/reviews.js` | 209 |
| `getRatingDistribution` | Function | `FrontEnd/src/data/reviews.js` | 216 |

## How to Explore

1. `gitnexus_context({name: "getReviewsByProductId"})` — see callers and callees
2. `gitnexus_query({query: "data"})` — find related execution flows
3. Read key files listed above for implementation details
