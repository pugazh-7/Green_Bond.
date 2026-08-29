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

const normalizeSearchQuery = (q) => {
    let normalizedQ = q.toLowerCase();
    let words = normalizedQ.split(/\s+/).filter(w => w.length > 0);
    
    let expandedWords = new Set();
    words.forEach(word => {
        expandedWords.add(word);
        if (searchAliases[word]) {
            expandedWords.add(searchAliases[word]);
        }
    });

    return Array.from(expandedWords).join(' ');
};

const getSearchRegex = (q) => {
    if (!q) return [];
    const normalizedQ = normalizeSearchQuery(q);
    const words = normalizedQ.split(/\s+/).filter(w => w.length > 0);
    return words.map(w => new RegExp(w, 'i'));
};

const calculateSearchScore = (product, queryRegexes, rawQuery) => {
    let score = 0;
    const productName = product.name || product.title || '';
    const name = productName.toLowerCase();
    const rawQ = rawQuery.toLowerCase();
    
    if (name === rawQ) score += 100;
    else if (name.startsWith(rawQ)) score += 80;
    else if (name.includes(rawQ)) score += 50;

    queryRegexes.forEach(regex => {
        if (regex.test(product.name)) score += 40;
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

        const SHOPPING_CATEGORIES = [
            'Fruits & Vegetables', 'Grocery', 'Dairy & Breakfast', 'Snacks', 
            'Drinks', 'Personal Care', 'Household', 'Electronics', 
            'Fashion', 'Beauty', 'Home & Kitchen', 'Mobiles', 'Laptops', 'Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Gifts'
        ];
        
        let shoppingCriteria = {
            $or: [
                { marketplaceType: 'SHOPPING' },
                { category: { $in: SHOPPING_CATEGORIES }, marketplaceType: { $ne: 'QUICK' } }
            ]
        };

        const hasShoppingProducts = await Product.exists({ 
            ...shoppingCriteria, 
            stock: { $gt: 0 } 
        });

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

// --- Shopping Metadata (Counts, Deals, Popular, Category Sections) ---
router.get('/shopping-meta', async (req, res) => {
    try {
        const coreCategories = [
            'Fashion', 'Grocery', 'Snacks', 'Drinks', 'Beauty', 'Personal Care', 'Household'
        ];

        const SHOPPING_CATEGORIES = [
            'Fashion', 'Men', 'Women', 'Kids', 'Footwear', 'Grocery', 'Snacks', 'Drinks', 'Beauty', 'Personal Care', 'Household'
        ];

        let shoppingCriteria = {
            $and: [
                {
                    $or: [
                        { marketplaceType: 'SHOPPING' },
                        { category: { $in: SHOPPING_CATEGORIES }, marketplaceType: { $ne: 'QUICK' } }
                    ]
                },
                { category: { $nin: ['Electronics', 'Furniture', 'Gifts', 'Mobiles', 'Laptops', 'Medicines'] } }
            ]
        };

        // Prepare the promises
        const promises = [
            Product.aggregate([
                { $match: { ...shoppingCriteria, isActive: true, stock: { $gt: 0 } } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Product.find({ ...shoppingCriteria, isActive: true, discountPercentage: { $gt: 0 }, stock: { $gt: 0 } })
                .sort({ discountPercentage: -1 })
                .limit(6)
                .lean(),
            Product.find({ ...shoppingCriteria, isActive: true, stock: { $gt: 0 } })
                .sort({ createdAt: -1 })
                .limit(6)
                .lean()
        ];

        // Add a query for each core category to get top 6 products
        coreCategories.forEach(cat => {
            promises.push(
                Product.find({ ...shoppingCriteria, isActive: true, category: cat, stock: { $gt: 0 } })
                    .sort({ createdAt: -1, rating: -1 }) // simple heuristic for 'top'
                    .limit(6)
                    .lean()
            );
        });

        const results = await Promise.all(promises);

        const counts = results[0];
        const bestDeals = results[1];
        const newArrivals = results[2];

        let categoryProducts = {};
        for (let i = 0; i < coreCategories.length; i++) {
            const cat = coreCategories[i];
            const products = results[3 + i];
            if (products && products.length > 0) {
                categoryProducts[cat] = products.map(p => ({ ...p, id: p._id }));
            }
        }
        
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
            newArrivals: newArrivals.map(p => ({ ...p, id: p._id })),
            categoryProducts
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
            stock: { $gt: 0 },
            $or: [
                { name: { $in: regexes } },
                { brand: { $in: regexes } },
                { searchKeywords: { $in: regexes } },
                { category: { $in: regexes } }
            ]
        }).limit(8).lean();

        const suggestions = products.map(p => ({
            id: p._id,
            name: p.name,
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

        let baseQuery = { stock: { $gt: 0 } };

        const SHOPPING_CATEGORIES = ['Fashion', 'Men', 'Women', 'Kids', 'Footwear', 'Grocery', 'Snacks', 'Drinks', 'Beauty', 'Personal Care', 'Household'];
        
        let shoppingCriteria = {
            $and: [
                {
                    $or: [
                        { marketplaceType: 'SHOPPING' },
                        { category: { $in: SHOPPING_CATEGORIES }, marketplaceType: { $ne: 'QUICK' } }
                    ]
                },
                { category: { $nin: ['Electronics', 'Furniture', 'Gifts', 'Mobiles', 'Laptops', 'Medicines'] } }
            ]
        };

        if (hasLocation) {
            baseQuery.$and = [
                shoppingCriteria,
                {
                    $or: [
                        { sellerType: 'ADMIN' },
                        { sellerId: { $in: shopIds }, sourceType: 'SHOP' },
                        { sellerId: { $in: farmerIds }, sourceType: 'FARMER' },
                        { category: { $in: SHOPPING_CATEGORIES } } // Legacy products might lack correct seller mapping
                    ]
                }
            ];
        } else {
            baseQuery.$and = [shoppingCriteria];
        }

        if (category && category !== 'All') {
            baseQuery.category = category;
        }

        if (q && q.trim() !== '') {
            const normalizedQuery = normalizeSearchQuery(q);
            
            if (hasLocation) {
                // If location is provided, $or is already being used for location.
                // We must use $and to combine the location $or array with the $text search.
                const locationOr = baseQuery.$or;
                delete baseQuery.$or;
                
                baseQuery.$and = [
                    { $or: locationOr },
                    { $text: { $search: normalizedQuery } }
                ];
            } else {
                baseQuery.$text = { $search: normalizedQuery };
            }
        }


        const total = await Product.countDocuments(baseQuery);
        let products = await Product.find(baseQuery).lean();

        const userLat = hasLocation ? parseFloat(lat) : null;
        const userLng = hasLocation ? parseFloat(lng) : null;

        let mappedProducts = products.map(p => {
            let productObj = { ...p, id: p._id };
            let distance = 0;
            
            if (p.sellerType === 'ADMIN') {
                productObj.sourceName = 'GreenBond Hub';
                productObj.isVerifiedFarmer = false;
                productObj.isQuickEligible = false;
                distance = 0; 
            } else if (p.sourceType === 'SHOP' && hasLocation) {
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
            }
            
            
            productObj.distanceKm = distance.toFixed(1);
            productObj.eta = p.sellerType === 'ADMIN' ? '1-2 Days' : calculateETA(distance, p.sourceType);
            
            // Use the canonical image from DB
            productObj.primaryImageUrl = productObj.image;
            
            if (q && q.trim() !== '') {
                // MongoDB text search automatically sorts by textScore if projected
                productObj.searchScore = 1; // Basic placeholder for existing sorting since Mongo handles it
            } else {
                productObj.searchScore = 0;
            }
            return productObj;
        });

        if (q && q.trim() !== '') {
            // Mongo text search handles sorting naturally, but we can do a fallback filter if needed.
            // Since we queried with $text, all mappedProducts are inherently relevant.
        }

        // Apply Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProducts = mappedProducts.slice(startIndex, endIndex);

        res.json({
            success: true,
            products: paginatedProducts,
            pagination: {
                page: page,
                limit: limit,
                total: mappedProducts.length,
                totalPages: Math.ceil(mappedProducts.length / limit)
            }
        });

    } catch (error) {
        console.error("Products error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Quick Marketplace Metadata ---
router.get('/quick-meta', async (req, res) => {
    try {
        let { lat, lng } = req.query;
        let shopIds = [];
        
        if (lat && lng && lat !== 'undefined' && lng !== 'undefined') {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            let shops = await Shop.find({
                locationGeo: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [userLng, userLat] },
                        $maxDistance: 5000
                    }
                },
                isActive: true
            }).lean();
            
            if (shops.length === 0) {
                const mockShop = await Shop.findOne({ email: "quickmart@greenbond.com" }).lean();
                if (mockShop) shops = [mockShop];
            }
            
            shopIds = shops.map(s => s._id);
        }

        const coreCategories = ['Electronics', 'Gifts', 'Furniture', 'Medicines'];
        let baseMatch = { marketplaceType: 'QUICK', isActive: true, stock: { $gt: 0 } };
        if (shopIds.length > 0) {
            baseMatch.sellerId = { $in: shopIds };
        }

        const promises = [
            Product.aggregate([
                { $match: baseMatch },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ])
        ];

        // Fetch top 10 products for the key rails
        coreCategories.forEach(cat => {
            promises.push(
                Product.find({ ...baseMatch, category: cat })
                    .sort({ rating: -1, createdAt: -1 })
                    .limit(10)
                    .lean()
            );
        });

        const results = await Promise.all(promises);
        const counts = results[0];

        let formattedCounts = {};
        let totalQuick = 0;
        counts.forEach(c => {
            if (c._id) {
                formattedCounts[c._id] = c.count;
                totalQuick += c.count;
            }
        });
        formattedCounts['All'] = totalQuick;

        let categoryProducts = {};
        for (let i = 0; i < coreCategories.length; i++) {
            const cat = coreCategories[i];
            const products = results[1 + i];
            if (products && products.length > 0) {
                categoryProducts[cat] = products.map(p => ({ ...p, id: p._id }));
            }
        }

        res.json({
            categoryCounts: formattedCounts,
            categoryProducts: categoryProducts
        });

    } catch (error) {
        console.error("Quick Meta error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Quick Nearby Shops ---
router.get('/quick-shops', async (req, res) => {
    try {
        let { lat, lng } = req.query;
        if (!lat || !lng || lat === 'undefined' || lng === 'undefined') {
            return res.json([]);
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        let shops = await Shop.find({
            locationGeo: {
                $near: {
                    $geometry: { type: "Point", coordinates: [userLng, userLat] },
                    $maxDistance: 5000 // 5km service radius
                }
            },
            isActive: true
        }).lean();

        if (shops.length === 0) {
            const mockShop = await Shop.findOne({ email: "quickmart@greenbond.com" }).lean();
            if (mockShop) {
                mockShop.isFallback = true;
                shops = [mockShop];
            }
        }

        const shopResults = shops.map(shop => {
            let distanceKm = shop.isFallback ? 1.5 : calculateDistance(userLat, userLng, shop.locationGeo.coordinates[1], shop.locationGeo.coordinates[0]);
            // Preparation Time (e.g. 5 mins) + Travel time (e.g. 2 mins per km)
            const prepTime = 5;
            const travelTime = Math.ceil(distanceKm * 2);
            const minETA = prepTime + travelTime;
            const maxETA = minETA + 5;
            
            return {
                id: shop._id,
                name: shop.name,
                image: shop.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=200&auto=format&fit=crop', // default shop image
                distanceKm: distanceKm.toFixed(1),
                eta: `${minETA}-${maxETA} min`
            };
        });

        res.json(shopResults);
    } catch (error) {
        console.error("Quick Shops error:", error);
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

        let shops = await Shop.find({
            locationGeo: {
                $near: {
                    $geometry: { type: "Point", coordinates: [userLng, userLat] },
                    $maxDistance: 5000 // Only extremely close shops for quick
                }
            },
            isActive: true
        }).lean();
        
        if (shops.length === 0) {
            const mockShop = await Shop.findOne({ email: "quickmart@greenbond.com" }).lean();
            if (mockShop) {
                mockShop.isFallback = true;
                shops = [mockShop];
            }
        }
        
        if (shops.length === 0) return res.json([]);
        const shopIds = shops.map(s => s._id);

        let baseQuery = {
            stock: { $gt: 0 },
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
                    { sellerId: { $in: shopIds }, marketplaceType: 'QUICK', stock: { $gt: 0 } },
                    { $or: [
                        { name: { $in: regexes } },
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
                distance = shop.isFallback ? 1.5 : calculateDistance(userLat, userLng, shop.locationGeo.coordinates[1], shop.locationGeo.coordinates[0]);
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
            success: true,
            products: paginatedProducts,
            pagination: {
                page: page,
                limit: limit,
                total: mappedProducts.length,
                totalPages: Math.ceil(mappedProducts.length / limit)
            }
        });
    } catch (error) {
        console.error("Quick API error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Single Product Lookup API (Unified for Shopping, Quick, Fresh) ---
router.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.query;

        const product = await Product.findById(id).lean();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const userLat = lat && lat !== 'undefined' ? parseFloat(lat) : null;
        const userLng = lng && lng !== 'undefined' ? parseFloat(lng) : null;

        let distance = 0;
        let sourceName = 'GreenBond Marketplace';
        let isVerified = false;
        let eta = '1-2 Days';

        if (product.sourceType === 'FARMER' || product.sellerType === 'FARMER' || product.marketplaceType === 'FRESH') {
            const farmer = await Farmer.findById(product.sellerId || product.farmerId).lean();
            if (farmer) {
                sourceName = farmer.name;
                isVerified = farmer.verificationStatus === 'APPROVED';
                if (userLat && userLng && farmer.farmLocationGeo?.coordinates) {
                    distance = calculateDistance(userLat, userLng, farmer.farmLocationGeo.coordinates[1], farmer.farmLocationGeo.coordinates[0]);
                }
                eta = calculateETA(distance, 'FARMER');
            } else if (product.farmer) {
                sourceName = product.farmer;
                isVerified = true;
                eta = 'Same day harvest';
            }
        } else if (product.sourceType === 'SHOP' || product.marketplaceType === 'QUICK') {
            const shop = await Shop.findById(product.sellerId).lean();
            if (shop) {
                sourceName = shop.name;
                isVerified = true;
                if (userLat && userLng && shop.locationGeo?.coordinates) {
                    distance = calculateDistance(userLat, userLng, shop.locationGeo.coordinates[1], shop.locationGeo.coordinates[0]);
                }
                eta = distance <= 5 ? '10-15 min' : 'Within 1 hour';
            }
        }

        const formattedProduct = {
            ...product,
            id: product._id,
            name: product.name || product.title,
            stock: product.stock !== undefined ? product.stock : (product.availableQuantity || 0),
            sourceName,
            farmerName: product.farmer || sourceName,
            isVerifiedFarmer: isVerified,
            distanceKm: distance ? distance.toFixed(1) : '1.5',
            eta,
            primaryImageUrl: product.image
        };

        res.json({ success: true, product: formattedProduct });
    } catch (error) {
        console.error("Single product error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- Fresh Marketplace API ---
router.get('/fresh', async (req, res) => {
    try {
        let { lat, lng, q, category, page = 1, limit = 20 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        
        const hasCoords = lat && lng && lat !== 'undefined' && lng !== 'undefined';
        const userLat = hasCoords ? parseFloat(lat) : null;
        const userLng = hasCoords ? parseFloat(lng) : null;

        // Fetch approved farmers
        let farmers = [];
        if (hasCoords) {
            farmers = await Farmer.find({
                farmLocationGeo: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [userLng, userLat] },
                        $maxDistance: 50000 // 50km local radius
                    }
                },
                verificationStatus: 'APPROVED'
            }).lean();
        }

        // If no nearby farmers or no coords, load all approved farmers
        if (farmers.length === 0) {
            farmers = await Farmer.find({ verificationStatus: 'APPROVED' }).lean();
        }

        const farmerIds = farmers.map(f => f._id);

        let baseQuery = {
            $or: [
                { marketplaceType: 'FRESH' },
                { sourceType: 'FARMER' },
                { sellerType: 'FARMER' },
                { farmer: { $exists: true, $ne: '' } }
            ]
        };

        if (category && category !== 'All') {
            baseQuery.category = new RegExp(`^${category}$`, 'i');
        }

        let regexes = [];
        if (q && q.trim() !== '') {
            regexes = getSearchRegex(q);
            baseQuery.$and = [
                {
                    $or: [
                        { name: { $in: regexes } },
                        { title: { $in: regexes } },
                        { farmer: { $in: regexes } },
                        { category: { $in: regexes } },
                        { searchKeywords: { $in: regexes } },
                        { description: { $in: regexes } }
                    ]
                }
            ];
        }

        let products = await Product.find(baseQuery).lean();

        let mappedProducts = products.map(p => {
            let productObj = { ...p, id: p._id };
            productObj.name = p.name || p.title;
            productObj.stock = p.stock !== undefined ? p.stock : (p.availableQuantity || 50);

            let farmer = farmers.find(f => f._id.toString() === p.sellerId?.toString() || f._id.toString() === p.farmerId?.toString() || f.name === p.farmer);
            let distance = 0;
            if (farmer && hasCoords && farmer.farmLocationGeo?.coordinates) {
                distance = calculateDistance(userLat, userLng, farmer.farmLocationGeo.coordinates[1], farmer.farmLocationGeo.coordinates[0]);
            }
            
            productObj.sourceName = p.farmer || farmer?.name || 'Local Verified Farmer';
            productObj.isVerifiedFarmer = farmer ? farmer.verificationStatus === 'APPROVED' : true;
            productObj.distanceKm = distance > 0 ? distance.toFixed(1) : '2.5';
            productObj.eta = distance > 0 ? calculateETA(distance, 'FARMER') : 'Same day harvest';
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
        const total = mappedProducts.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedProducts = mappedProducts.slice(startIndex, endIndex);

        res.json({
            success: true,
            products: paginatedProducts,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Fresh API error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;




