import express from 'express';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Farmer from '../models/Farmer.js';
import { calculateDistance } from '../utils/locationUtils.js';

const router = express.Router();

const calculateETA = (distanceKm, sourceType) => {
    if (sourceType === 'SHOP') return '10-15 min';
    if (distanceKm < 5) return 'Within 2 hours';
    if (distanceKm < 15) return 'Same day delivery';
    return 'Next day delivery';
};

const searchAliases = {
    'paal': 'milk',
    'à®ªà®¾à®²à¯': 'milk',
    'thakkali': 'tomato',
    'à®¤à®•à¯à®•à®¾à®³à®¿': 'tomato',
    'arisi': 'rice',
    'à®…à®°à®¿à®šà®¿': 'rice',
    'sarkkarai': 'sugar',
    'pazham': 'fruit',
    'vazhaipazham': 'banana',
    'vengayam': 'onion',
    'à®µà¯†à®™à¯à®•à®¾à®¯à®®à¯': 'onion',
    'muttai': 'egg',
    'à®®à¯à®Ÿà¯à®Ÿà¯ˆ': 'egg',
    'sattai': 'shirt',
    'à®šà®Ÿà¯à®Ÿà¯ˆ': 'shirt',
    'phone': 'mobile',
    'à®ªà¯‹à®©à¯': 'mobile',
    'aappl': 'apple',
    'à®†à®ªà¯à®ªà®¿à®³à¯': 'apple',
    'charg': 'charger',
    'à®šà®¾à®°à¯à®œà®°à¯': 'charger',
    'biscut': 'biscuit'
};

const getSearchRegex = (q) => {
    let normalizedQ = q.toLowerCase();
    let words = normalizedQ.split(/\s+/).filter(w => w.length > 0);
    
    words.forEach(word => {
        if (searchAliases[word]) {
            words.push(searchAliases[word]);
        }
    });

    return words.map(w => new RegExp(w, 'i'));
};

const calculateSearchScore = (product, queryRegexes, rawQuery) => {
    let score = 0;
    const title = product.title.toLowerCase();
    const rawQ = rawQuery.toLowerCase();
    
    if (title === rawQ) score += 100;
    else if (title.startsWith(rawQ)) score += 80;
    else if (title.includes(rawQ)) score += 50;

    queryRegexes.forEach(regex => {
        if (regex.test(product.title)) score += 40;
        if (product.brand && regex.test(product.brand)) score += 60;
        if (regex.test(product.category)) score += 50;
        if (product.subcategory && regex.test(product.subcategory)) score += 40;
        
        if (product.searchKeywords && product.searchKeywords.some(k => regex.test(k))) {
            score += 40;
        }
        if (product.description && regex.test(product.description)) score += 10;
    });

    return score;
};

// --- Check Availability ---
router.get('/availability', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);

        if (!userLat || !userLng) {
            return res.json({ shoppingAvailable: true, quickAvailable: false, freshAvailable: false });
        }

        const nearbyShops = await Shop.find({
            locationGeo: {
                $near: {
                    $geometry: { type: "Point", coordinates: [userLng, userLat] },
                    $maxDistance: 10000 // 10km radius
                }
            },
            isActive: true
        });

        const nearbyFarmers = await Farmer.find({
            farmLocationGeo: {
                $near: {
                    $geometry: { type: "Point", coordinates: [userLng, userLat] },
                    $maxDistance: 15000 // 15km radius
                }
            },
            verificationStatus: 'APPROVED'
        });

        const quickAvailable = nearbyShops.some(shop => {
            const dist = calculateDistance(userLat, userLng, shop.locationGeo.coordinates[1], shop.locationGeo.coordinates[0]);
            return dist <= 5;
        });

        const hasShoppingProducts = await Product.exists({ marketplaceType: 'SHOPPING', sellerType: 'ADMIN', availableQuantity: { $gt: 0 } });

        res.json({
            shoppingAvailable: nearbyShops.length > 0 || nearbyFarmers.length > 0 || !!hasShoppingProducts,
            quickAvailable: quickAvailable,
            freshAvailable: nearbyFarmers.length > 0
        });
    } catch (error) {
        console.error("Availability check error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Shopping Metadata (Counts, Deals, Popular) ---
router.get('/shopping-meta', async (req, res) => {
    try {
        const [counts, bestDeals, newArrivals] = await Promise.all([
            Product.aggregate([
                { $match: { marketplaceType: 'SHOPPING', isActive: true, availableQuantity: { $gt: 0 } } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Product.find({ marketplaceType: 'SHOPPING', isActive: true, discountPercentage: { $gt: 0 }, availableQuantity: { $gt: 0 } })
                .sort({ discountPercentage: -1 })
                .limit(10)
                .lean(),
            Product.find({ marketplaceType: 'SHOPPING', isActive: true, availableQuantity: { $gt: 0 } })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
        ]);
        
        let formattedCounts = {};
        let totalShopping = 0;
        counts.forEach(c => {
            if (c._id) {
                formattedCounts[c._id] = c.count;
                totalShopping += c.count;
            }
        });
        formattedCounts['All'] = totalShopping;

        res.json({
            categoryCounts: formattedCounts,
            bestDeals: bestDeals.map(p => ({ ...p, id: p._id })),
            newArrivals: newArrivals.map(p => ({ ...p, id: p._id }))
        });
    } catch (error) {
        console.error("Meta error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- Search Suggestions ---
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);
        
        const regexes = getSearchRegex(q);
        const products = await Product.find({
            availableQuantity: { $gt: 0 },
            $or: [
                { title: { $in: regexes } },
                { brand: { $in: regexes } },
                { searchKeywords: { $in: regexes } },
                { category: { $in: regexes } }
            ]
        }).limit(8).lean();

        const suggestions = products.map(p => ({
            id: p._id,
            title: p.title,
            brand: p.brand,
            category: p.category
        }));

        res.json(suggestions);
    } catch (error) {
        console.error("Suggestions error:", error);
        res.status(500).json([]);
    }
});

// --- General Product Search API (Shopping) ---
router.get('/products', async (req, res) => {
    try {
        let { lat, lng, q, category, page = 1, limit = 20 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        let shops = [];
        let eligibleFarmers = [];
        let shopIds = [];
        let farmerIds = [];
        
        let hasLocation = false;
        if (lat && lng && lat !== 'undefined' && lng !== 'undefined') {
            hasLocation = true;
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);

            shops = await Shop.find({
                locationGeo: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [userLng, userLat] },
                        $maxDistance: 10000 
                    }
                },
                isActive: true
            }).lean();
            shopIds = shops.map(s => s._id);

            eligibleFarmers = await Farmer.find({
                farmLocationGeo: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [userLng, userLat] },
                        $maxDistance: 15000 
                    }
                },
                verificationStatus: 'APPROVED'
            }).lean();
            farmerIds = eligibleFarmers.map(f => f._id);
        }

        let baseQuery = {
            availableQuantity: { $gt: 0 },
            $or: [
                { sellerType: 'ADMIN', marketplaceType: 'SHOPPING' }
            ]
        };

        if (hasLocation) {
            baseQuery.$or.push({ sellerId: { $in: shopIds }, sourceType: 'SHOP', marketplaceType: 'SHOPPING' });
            baseQuery.$or.push({ sellerId: { $in: farmerIds }, sourceType: 'FARMER', marketplaceType: 'SHOPPING' });
        }

        if (category && category !== 'All') {
            baseQuery.category = category;
        }

        let regexes = [];
        if (q && q.trim() !== '') {
            regexes = getSearchRegex(q);
            baseQuery = {
                ...baseQuery,
                $or: [
                    { title: { $in: regexes } },
                    { brand: { $in: regexes } },
                    { category: { $in: regexes } },
                    { subcategory: { $in: regexes } },
                    { searchKeywords: { $in: regexes } },
                    { description: { $in: regexes } }
                ]
            };
            if (hasLocation || baseQuery.$or) {
                 baseQuery = {
                    availableQuantity: { $gt: 0 },
                    $and: [
                        { $or: [
                            { sellerType: 'ADMIN', marketplaceType: 'SHOPPING' },
                            ...(hasLocation ? [
                                { sellerId: { $in: shopIds }, sourceType: 'SHOP', marketplaceType: 'SHOPPING' },
                                { sellerId: { $in: farmerIds }, sourceType: 'FARMER', marketplaceType: 'SHOPPING' }
                            ] : [])
                        ]},
                        { $or: [
                            { title: { $in: regexes } },
                            { brand: { $in: regexes } },
                            { category: { $in: regexes } },
                            { subcategory: { $in: regexes } },
                            { searchKeywords: { $in: regexes } },
                            { description: { $in: regexes } }
                        ]}
                    ]
                 };
                 if (category && category !== 'All') {
                     baseQuery.category = category;
                 }
            }
        }

        let products = await Product.find(baseQuery).lean();

        const userLat = hasLocation ? parseFloat(lat) : null;
        const userLng = hasLocation ? parseFloat(lng) : null;

        let mappedProducts = products.map(p => {
            let productObj = { ...p, id: p._id };
            let distance = 0;
            
            if (p.sourceType === 'SHOP' && hasLocation) {
                const shop = shops.find(s => s._id.toString() === p.sellerId?.toString());
                if (shop) {
                    distance = calculateDistance(userLat, userLng, shop.locationGeo.coordinates[1], shop.locationGeo.coordinates[0]);
                    productObj.sourceName = shop.name;
                    productObj.isQuickEligible = distance <= 5;
                }
            } else if (p.sourceType === 'FARMER' && hasLocation) {
                let farmer = eligibleFarmers.find(f => f._id.toString() === p.sellerId?.toString() || f._id.toString() === p.farmerId?.toString());
                if (farmer) {
                    distance = calculateDistance(userLat, userLng, farmer.farmLocationGeo.coordinates[1], farmer.farmLocationGeo.coordinates[0]);
                    productObj.sourceName = farmer.name;
                    productObj.isVerifiedFarmer = farmer.verificationStatus === 'APPROVED';
                    productObj.isQuickEligible = false;
                }
            } else if (p.sellerType === 'ADMIN') {
                productObj.sourceName = 'GreenBond Hub';
                productObj.isVerifiedFarmer = false;
                productObj.isQuickEligible = false;
                distance = 0; 
            }
            
            productObj.distanceKm = distance.toFixed(1);
            productObj.eta = p.sellerType === 'ADMIN' ? '1-2 Days' : calculateETA(distance, p.sourceType);
            
            if (q && q.trim() !== '') {
                productObj.searchScore = calculateSearchScore(p, regexes, q);
            } else {
                productObj.searchScore = 0;
            }
            return productObj;
        });

        if (q && q.trim() !== '') {
            mappedProducts = mappedProducts.filter(p => p.searchScore > 0).sort((a, b) => b.searchScore - a.searchScore);
        }

        // Apply Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProducts = mappedProducts.slice(startIndex, endIndex);

        res.json({
            products: paginatedProducts,
            totalPages: Math.ceil(mappedProducts.length / limit),
            currentPage: page,
            totalProducts: mappedProducts.length
        });

    } catch (error) {
        console.error("Products error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Quick Delivery API ---
router.get('/quick', async (req, res) => {
    try {
        let { lat, lng, q, category, page = 1, limit = 20 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        
        if (!lat || !lng || lat === 'undefined' || lng === 'undefined') {
            return res.json([]);
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const shops = await Shop.find({
            locationGeo: {
                $near: {
                    $geometry: { type: "Point", coordinates: [userLng, userLat] },
                    $maxDistance: 5000 // Only extremely close shops for quick
                }
            },
            isActive: true
        }).lean();
        
        if (shops.length === 0) return res.json([]);
        const shopIds = shops.map(s => s._id);

        let baseQuery = {
            availableQuantity: { $gt: 0 },
            sellerId: { $in: shopIds },
            marketplaceType: 'QUICK'
        };

        if (category && category !== 'All') {
            baseQuery.category = category;
        }

        let regexes = [];
        if (q && q.trim() !== '') {
            regexes = getSearchRegex(q);
            baseQuery = {
                ...baseQuery,
                $and: [
                    { sellerId: { $in: shopIds }, marketplaceType: 'QUICK', availableQuantity: { $gt: 0 } },
                    { $or: [
                        { title: { $in: regexes } },
                        { brand: { $in: regexes } },
                        { category: { $in: regexes } },
                        { subcategory: { $in: regexes } },
                        { searchKeywords: { $in: regexes } },
                        { description: { $in: regexes } }
                    ]}
                ]
            };
            if (category && category !== 'All') {
                baseQuery.category = category;
                baseQuery.$and.push({ category: category });
            }
        }

        let products = await Product.find(baseQuery).lean();

        let mappedProducts = products.map(p => {
            let productObj = { ...p, id: p._id };
            const shop = shops.find(s => s._id.toString() === p.sellerId?.toString());
            let distance = 0;
            if (shop) {
                distance = calculateDistance(userLat, userLng, shop.locationGeo.coordinates[1], shop.locationGeo.coordinates[0]);
                productObj.sourceName = shop.name;
                productObj.isQuickEligible = true;
            }
            productObj.distanceKm = distance.toFixed(1);
            productObj.eta = "10-15 min";
            
            if (q && q.trim() !== '') {
                productObj.searchScore = calculateSearchScore(p, regexes, q);
            } else {
                productObj.searchScore = 0;
            }
            return productObj;
        });

        if (q && q.trim() !== '') {
            mappedProducts = mappedProducts.filter(p => p.searchScore > 0).sort((a, b) => b.searchScore - a.searchScore);
        }

        // Apply Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProducts = mappedProducts.slice(startIndex, endIndex);

        res.json({
            products: paginatedProducts,
            totalPages: Math.ceil(mappedProducts.length / limit),
            currentPage: page,
            totalProducts: mappedProducts.length
        });
    } catch (error) {
        console.error("Quick API error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Fresh Marketplace API ---
router.get('/fresh', async (req, res) => {
    try {
        let { lat, lng, q, category, page = 1, limit = 20 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        
        if (!lat || !lng || lat === 'undefined' || lng === 'undefined') {
            return res.json([]);
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const farmers = await Farmer.find({
            farmLocationGeo: {
                $near: {
                    $geometry: { type: "Point", coordinates: [userLng, userLat] },
                    $maxDistance: 15000 
                }
            },
            verificationStatus: 'APPROVED'
        }).lean();
        
        if (farmers.length === 0) return res.json([]);
        const farmerIds = farmers.map(f => f._id);

        let baseQuery = {
            availableQuantity: { $gt: 0 },
            $or: [
                { sellerId: { $in: farmerIds } },
                { farmerId: { $in: farmerIds } }
            ],
            marketplaceType: 'FRESH'
        };

        if (category && category !== 'All') {
            baseQuery.category = category;
        }

        let regexes = [];
        if (q && q.trim() !== '') {
            regexes = getSearchRegex(q);
            baseQuery = {
                ...baseQuery,
                $and: [
                    { $or: [{ sellerId: { $in: farmerIds } }, { farmerId: { $in: farmerIds } }] },
                    { marketplaceType: 'FRESH', availableQuantity: { $gt: 0 } },
                    { $or: [
                        { title: { $in: regexes } },
                        { brand: { $in: regexes } },
                        { category: { $in: regexes } },
                        { searchKeywords: { $in: regexes } }
                    ]}
                ]
            };
             if (category && category !== 'All') {
                baseQuery.$and.push({ category: category });
            }
        }

        let products = await Product.find(baseQuery).lean();

        let mappedProducts = products.map(p => {
            let productObj = { ...p, id: p._id };
            let farmer = farmers.find(f => f._id.toString() === p.sellerId?.toString() || f._id.toString() === p.farmerId?.toString());
            let distance = 0;
            if (farmer) {
                distance = calculateDistance(userLat, userLng, farmer.farmLocationGeo.coordinates[1], farmer.farmLocationGeo.coordinates[0]);
                productObj.sourceName = farmer.name;
                productObj.isVerifiedFarmer = farmer.verificationStatus === 'APPROVED';
            }
            productObj.distanceKm = distance.toFixed(1);
            productObj.eta = calculateETA(distance, 'FARMER');
            productObj.isQuickEligible = false;
            
            if (q && q.trim() !== '') {
                productObj.searchScore = calculateSearchScore(p, regexes, q);
            } else {
                productObj.searchScore = 0;
            }
            return productObj;
        });

        if (q && q.trim() !== '') {
            mappedProducts = mappedProducts.filter(p => p.searchScore > 0).sort((a, b) => b.searchScore - a.searchScore);
        }

        // Apply Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProducts = mappedProducts.slice(startIndex, endIndex);

        res.json({
            products: paginatedProducts,
            totalPages: Math.ceil(mappedProducts.length / limit),
            currentPage: page,
            totalProducts: mappedProducts.length
        });
    } catch (error) {
        console.error("Fresh API error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;




