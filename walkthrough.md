# Shopping Marketplace Fix

## What Was Fixed
The "No products found" issue on the Shopping page was caused by a mismatch between the database schema evolution and the backend query logic in `marketplaceRoutes.js`. 

**Root Cause:**
1. **Legacy Data Compatibility:** The previous implementation used categories (like "Electronics", "Fashion") to identify shopping products. When the `marketplaceType` and `sellerType` fields were introduced, existing products defaulted to `FRESH` and `FARMER`, or completely lacked these new fields.
2. **Strict Location Constraints:** The backend strictly required shopping products to either have `sellerType: 'ADMIN'` or be linked to a nearby `SHOP`/`FARMER` within a 10km-15km radius. Because legacy data lacked the explicit `ADMIN` seller type, they were dropped by the query.
3. **Admin Mapping Bug:** When Admin products were loaded with a `sourceType` of `SHOP`, the backend attempted to look up the Admin ID inside the physical shops array, causing the product mapping step to fail at retrieving the `sourceName`.

## How It Was Fixed
1. **Query Flexibility (Backward Compatibility):**
   - Modified the `/products`, `/shopping-meta`, and `/availability` endpoints in `marketplaceRoutes.js`.
   - Introduced a `SHOPPING_CATEGORIES` fallback array.
   - Products are now fetched if they explicitly match `marketplaceType: 'SHOPPING'` **OR** if they belong to a known shopping category (and are not explicitly marked as `QUICK`).
2. **Location Constraint Relaxation:**
   - Relaxed the `$or` condition inside the location-based query to also pass through legacy shopping categories, ensuring they don't get unfairly filtered out when a user provides location data.
3. **Fixed Source Mapping:**
   - Fixed the `map` function to intercept `p.sellerType === 'ADMIN'` *before* checking `sourceType === 'SHOP'`, guaranteeing that Admin-seeded items get the correct `sourceName` ("GreenBond Hub") instead of failing the shop distance lookup.

## Verification
- Products from both modern seeding scripts (`seedMarketplace.js`) and legacy implementations will now properly load on the Shopping page.
- "No products found" will only legitimately show if the user searches for a term that has no matches.
- All product images, ADD to Cart buttons, and category navigations will function smoothly with the retrieved data.
