// Helper to generate semantic images (fallback)
const getDynamicImage = (id, title, category) => {
    // Enhance keywords for better matches
    let keywords = `${category}`;
    const cleanTitle = title.toLowerCase();

    if (cleanTitle.includes('tomato')) keywords += ',tomato';
    else if (cleanTitle.includes('carrot')) keywords += ',carrot';
    else if (cleanTitle.includes('onion')) keywords += ',onion';
    else if (cleanTitle.includes('potato')) keywords += ',potato';
    else if (cleanTitle.includes('bean')) keywords += ',beans';
    else if (cleanTitle.includes('apple')) keywords += ',apple';
    else if (cleanTitle.includes('banana')) keywords += ',banana';
    else if (cleanTitle.includes('orange')) keywords += ',orange';
    else if (cleanTitle.includes('grape')) keywords += ',grapes';
    else if (cleanTitle.includes('mango')) keywords += ',mango';
    else if (cleanTitle.includes('rice')) keywords += ',rice';
    else if (cleanTitle.includes('dal')) keywords += ',lentils';
    else if (cleanTitle.includes('leaf')) keywords += ',leaf';
    else if (cleanTitle.includes('coconut')) keywords += ',coconut';
    else keywords += `,${title.split(' ')[0]}`;

    return `https://loremflickr.com/500/500/${keywords}?lock=${id}`;
};

// --- LOCAL ASSETS MAPPING ---
// Dynamically import all images from the assets folder
const ASSET_IMAGES = import.meta.glob('../assets/*.{png,jpg,jpeg,webp,avif,jfif,gif}', { eager: true, import: 'default' });

const getLocalImage = (title) => {
    // Normalize title: lowercase, remove everything in parentheses, trim
    const cleanTitle = title.toLowerCase().replace(/\(.*\)/, '').trim();
    
    // Try to find a match in the keys
    const match = Object.keys(ASSET_IMAGES).find(key => {
        const filename = key.split('/').pop().toLowerCase();
        
        // Exact match (without extension)
        const nameWithoutExt = filename.split('.').slice(0, -1).join('.').trim();
        if (nameWithoutExt === cleanTitle) return true;
        
        // Substring match
        if (cleanTitle.includes(nameWithoutExt) || (nameWithoutExt.length > 3 && cleanTitle.startsWith(nameWithoutExt))) return true;
        
        // Special mapping for common variations
        if (cleanTitle.includes('tomato') && nameWithoutExt.includes('tomat')) return true;
        if (cleanTitle.includes('brinjal') && nameWithoutExt.includes('brin')) return true;
        if (cleanTitle.includes('banana leaf') && nameWithoutExt.includes('banana leaf')) return true;
        if (cleanTitle.includes('snake gourd') && (nameWithoutExt.includes('snake_gourd') || nameWithoutExt.includes('snake gourd'))) return true;
        if (nameWithoutExt === 'drumstick' && cleanTitle.includes('drumstick')) return true;
        if (cleanTitle.includes('amla') && nameWithoutExt.includes('amla')) return true;

        return false;
    });

    return match ? ASSET_IMAGES[match] : null;
};

const RAW_PRODUCTS = [
    // --- SPECIAL REQUEST ---
    { id: 1001, title: 'Fresh Banana Leaf', farmer: 'Madurai Green Farms', location: 'Madurai', price: '₹5/piece', minOrder: '10 pcs', category: 'Greens' },
    { id: 1002, title: 'Large Banana Leaf (Thalaivazhai)', farmer: 'Theni Organic Groves', location: 'Theni', price: '₹8/piece', minOrder: '5 pcs', category: 'Greens' },
    { id: 1003, title: 'Banana Leaf Bundle (100 pcs)', farmer: 'Kaveri Delta Farmers', location: 'Thanjavur', price: '₹400/bundle', minOrder: '1 bundle', category: 'Greens' },

    // --- VEGETABLES ---
    { id: 1, title: 'Organic Tomatoes', farmer: 'Ramesh Kumar', location: 'Madurai', price: '₹40/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 2, title: 'Fresh Carrots', farmer: 'Lakshmi Devi', location: 'Ooty', price: '₹60/kg', minOrder: '3 kg', category: 'Vegetables' },
    { id: 3, title: 'Red Onions', farmer: 'Nashik Aggregators', location: 'Nashik', price: '₹35/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 4, title: 'Potatoes (New Harvest)', farmer: 'Agra Farms', location: 'Agra', price: '₹25/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 5, title: 'Green Beans', farmer: 'Nilgiri Veggies', location: 'Ooty', price: '₹55/kg', minOrder: '2 kg', category: 'Vegetables' },
    { id: 6, title: 'Brinjal (Eggplant)', farmer: 'Local Farmers', location: 'Dindigul', price: '₹30/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 7, title: 'Ladies Finger', farmer: 'Coimbatore Organics', location: 'Coimbatore', price: '₹40/kg', minOrder: '3 kg', category: 'Vegetables' },
    { id: 8, title: 'Beetroot', farmer: 'Hilltop Farms', location: 'Kodaikanal', price: '₹45/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 9, title: 'Cabbage', farmer: 'Green Valley', location: 'Munnar', price: '₹20/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 10, title: 'Cauliflower', farmer: 'Fresh Daily', location: 'Hosur', price: '₹35/pc', minOrder: '5 pcs', category: 'Vegetables' },
    { id: 11, title: 'Drumstick', farmer: 'Murugan Farms', location: 'Madurai', price: '₹60/kg', minOrder: '2 kg', category: 'Vegetables' },
    { id: 12, title: 'Pumpkin', farmer: 'Village Harvest', location: 'Tirunelveli', price: '₹15/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 13, title: 'Snake Gourd', farmer: 'Natural Farms', location: 'Trichy', price: '₹30/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 14, title: 'Bitter Gourd', farmer: 'Healthy Greens', location: 'Karur', price: '₹45/kg', minOrder: '3 kg', category: 'Vegetables' },
    { id: 15, title: 'Bottle Gourd', farmer: 'River Farms', location: 'Thanjavur', price: '₹20/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 16, title: 'White Radish', farmer: 'Cool Climate Crops', location: 'Ooty', price: '₹25/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 17, title: 'Green Capsicum', farmer: 'Greenhouse Growers', location: 'Hosur', price: '₹50/kg', minOrder: '3 kg', category: 'Vegetables' },
    { id: 18, title: 'Green Chilli', farmer: 'Spicy Fields', location: 'Guntur', price: '₹40/kg', minOrder: '1 kg', category: 'Vegetables' },
    { id: 19, title: 'Garlic', farmer: 'Ooty Spice', location: 'Ooty', price: '₹120/kg', minOrder: '1 kg', category: 'Vegetables' },
    { id: 20, title: 'Ginger', farmer: 'Kerala Spices', location: 'Wayanad', price: '₹80/kg', minOrder: '1 kg', category: 'Vegetables' },

    // --- FRUITS ---
    { id: 21, title: 'Shimla Apples', farmer: 'Himachal Farms', location: 'Shimla', price: '₹120/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 22, title: 'Robusta Banana', farmer: 'Theni Banana Co.', location: 'Theni', price: '₹30/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 23, title: 'Nagpur Oranges', farmer: 'Citrus Groves', location: 'Nagpur', price: '₹60/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 24, title: 'Black Grapes', farmer: 'Nashik Vineyards', location: 'Nashik', price: '₹90/kg', minOrder: '3 kg', category: 'Fruits' },
    { id: 25, title: 'Alphonso Mango', farmer: 'Ratnagiri Farms', location: 'Ratnagiri', price: '₹200/dz', minOrder: '2 dz', category: 'Fruits' },
    { id: 26, title: 'Papaya', farmer: 'Tropical Fruits', location: 'Coimbatore', price: '₹30/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 27, title: 'Pomegranate', farmer: 'Ruby Red Farms', location: 'Solapur', price: '₹110/kg', minOrder: '3 kg', category: 'Fruits' },
    { id: 28, title: 'Watermelon', farmer: 'Summer Harvest', location: 'Tindivanam', price: '₹15/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 29, title: 'Pineapple', farmer: 'Kerala Fresh', location: 'Kochi', price: '₹50/pc', minOrder: '5 pcs', category: 'Fruits' },
    { id: 30, title: 'Guava', farmer: 'Allahabad Farms', location: 'Allahabad', price: '₹50/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 31, title: 'Jackfruit', farmer: 'Panruti Jacks', location: 'Panruti', price: '₹200/fruit', minOrder: '1 fruit', category: 'Fruits' },
    { id: 32, title: 'Sapota (Chikoo)', farmer: 'Dahanu Orchards', location: 'Dahanu', price: '₹40/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 33, title: 'Strawberry', farmer: 'Mahabaleshwar Berries', location: 'Mahabaleshwar', price: '₹250/kg', minOrder: '1 kg', category: 'Fruits' },
    { id: 34, title: 'Kiwi', farmer: 'Arunachal Exotics', location: 'Itanagar', price: '₹300/kg', minOrder: '1 kg', category: 'Fruits' },
    { id: 35, title: 'Dragon Fruit', farmer: 'Gujarat Drylands', location: 'Kutch', price: '₹120/kg', minOrder: '2 kg', category: 'Fruits' },
    { id: 36, title: 'Muskmelon', farmer: 'Andhra Melons', location: 'Kadapa', price: '₹25/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 37, title: 'Avocado (Butter Fruit)', farmer: 'Kodai Estates', location: 'Kodaikanal', price: '₹150/kg', minOrder: '1 kg', category: 'Fruits' },
    { id: 38, title: 'Custard Apple', farmer: 'Telangana Sitaphal', location: 'Hyderabad', price: '₹60/kg', minOrder: '3 kg', category: 'Fruits' },
    { id: 39, title: 'Passion Fruit', farmer: 'Nilgiri Exotics', location: 'Coonoor', price: '₹100/kg', minOrder: '1 kg', category: 'Fruits' },
    { id: 40, title: 'Hill Banana', farmer: 'Dindigul Malai', location: 'Sirumalai', price: '₹60/kg', minOrder: '5 kg', category: 'Fruits' },

    // --- GRAINS ---
    { id: 41, title: 'Basmati Rice', farmer: 'Punjab Fields', location: 'Amritsar', price: '₹90/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 42, title: 'Ponni Rice', farmer: 'Kaveri Delta', location: 'Trichy', price: '₹55/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 43, title: 'Whole Wheat', farmer: 'MP Sharbati', location: 'Bhopal', price: '₹35/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 44, title: 'Ragi (Finger Millet)', farmer: 'Karnataka Millets', location: 'Mandya', price: '₹30/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 45, title: 'Bajra (Pearl Millet)', farmer: 'Rajasthan Crops', location: 'Jodhpur', price: '₹25/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 46, title: 'Toor Dal', farmer: 'Latur Pulses', location: 'Latur', price: '₹110/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 47, title: 'Moong Dal', farmer: 'Green Gram Co.', location: 'Vijayawada', price: '₹100/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 48, title: 'Chana Dal', farmer: 'Bengal Grams', location: 'Indore', price: '₹80/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 49, title: 'Urad Dal', farmer: 'Andhra Pulses', location: 'Guntur', price: '₹120/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 50, title: 'Corn / Maize', farmer: 'Karnataka Corn', location: 'Haveri', price: '₹20/kg', minOrder: '5 kg', category: 'Grains' },

    // --- GREENS & OTHERS ---
    { id: 51, title: 'Coriander Leaves', farmer: 'Fresh Herbs', location: 'Dindigul', price: '₹20/bun', minOrder: '5 bun', category: 'Greens' },
    { id: 52, title: 'Curry Leaves', farmer: 'Aroma Farms', location: 'Salem', price: '₹15/bun', minOrder: '5 bun', category: 'Greens' },
    { id: 53, title: 'Mint Leaves', farmer: 'Cool Herbs', location: 'Ooty', price: '₹20/bun', minOrder: '5 bun', category: 'Greens' },
    { id: 54, title: 'Spinach (Palak)', farmer: 'City Greens', location: 'Chennai Outskirts', price: '₹25/bun', minOrder: '5 bun', category: 'Greens' },
    { id: 55, title: 'Coconut (Large)', farmer: 'Pollachi Coconuts', location: 'Pollachi', price: '₹25/pc', minOrder: '10 pcs', category: 'Others' },
    { id: 56, title: 'Tender Coconut', farmer: 'Coimbatore Farms', location: 'Coimbatore', price: '₹40/pc', minOrder: '5 pcs', category: 'Others' },
    { id: 57, title: 'Sugarcane', farmer: 'Sweet Stalks', location: 'Erode', price: '₹30/pc', minOrder: '10 pcs', category: 'Others' },
    { id: 58, title: 'Arecanut', farmer: 'Shimoga Nuts', location: 'Shimoga', price: '₹400/kg', minOrder: '1 kg', category: 'Others' },
    { id: 59, title: 'Black Pepper', farmer: 'Kerala Spices', location: 'Idukki', price: '₹500/kg', minOrder: '0.5 kg', category: 'Spices' },
    { id: 60, title: 'Cardamom', farmer: 'Cardamom Hills', location: 'Thekkady', price: '₹1500/kg', minOrder: '0.1 kg', category: 'Spices' },

    // ... Volume variations ...
    { id: 61, title: 'Country Tomatoes', farmer: 'Organic Village', location: 'Theni', price: '₹45/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 62, title: 'Ooty Carrots', farmer: 'Highland Farms', location: 'Ooty', price: '₹65/kg', minOrder: '3 kg', category: 'Vegetables' },
    { id: 63, title: 'White Onions', farmer: 'Nashik Exports', location: 'Nashik', price: '₹40/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 64, title: 'Baby Potatoes', farmer: 'Mountain Spuds', location: 'Kodaikanal', price: '₹35/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 65, title: 'Broad Beans', farmer: 'Local Greens', location: 'Madurai', price: '₹40/kg', minOrder: '3 kg', category: 'Vegetables' },
    { id: 66, title: 'Variegated Brinjal', farmer: 'Heritage Seeds', location: 'Trichy', price: '₹35/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 67, title: 'Snake Gourd (Long)', farmer: 'Village Vine', location: 'Dindigul', price: '₹25/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 68, title: 'Red Capsicum', farmer: 'Greenhouse Growers', location: 'Hosur', price: '₹70/kg', minOrder: '2 kg', category: 'Vegetables' },
    { id: 69, title: 'Yellow Capsicum', farmer: 'Greenhouse Growers', location: 'Hosur', price: '₹70/kg', minOrder: '2 kg', category: 'Vegetables' },
    { id: 70, title: 'Bird Eye Chilli', farmer: 'Spice Hills', location: 'Kolli Hills', price: '₹150/kg', minOrder: '0.5 kg', category: 'Vegetables' },
    { id: 71, title: 'Kashmir Apples', farmer: 'Valley Orchards', location: 'Srinagar', price: '₹140/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 72, title: 'Yelakki Banana', farmer: 'Mysore Bananas', location: 'Mysore', price: '₹45/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 73, title: 'Kinnow Oranges', farmer: 'Punjab Citrus', location: 'Abohar', price: '₹50/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 74, title: 'Green Grapes', farmer: 'Nashik Vineyards', location: 'Nashik', price: '₹70/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 75, title: 'Banganapalli Mango', farmer: 'Andhra Mangoes', location: 'Vijayawada', price: '₹150/dz', minOrder: '3 dz', category: 'Fruits' },
    { id: 76, title: 'Brown Rice', farmer: 'Organic Paddy', location: 'Thanjavur', price: '₹70/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 77, title: 'Millet Mix', farmer: 'Healthy Grains', location: 'Coimbatore', price: '₹60/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 78, title: 'Red Banana', farmer: 'Kanyakumari Farms', location: 'Nagercoil', price: '₹50/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 79, title: 'Sweet Potato', farmer: 'Root Farms', location: 'Tirunelveli', price: '₹30/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 80, title: 'Tapioca', farmer: 'Salem Tubers', location: 'Salem', price: '₹25/kg', minOrder: '5 kg', category: 'Vegetables' },
    { id: 81, title: 'Raw Banana', farmer: 'Plantain Growers', location: 'Trichy', price: '₹10/pc', minOrder: '10 pcs', category: 'Vegetables' },
    { id: 82, title: 'Lemon', farmer: 'Citrus Farms', location: 'Perambalur', price: '₹5/pc', minOrder: '20 pcs', category: 'Fruits' },
    { id: 83, title: 'Amla (Gooseberry)', farmer: 'Healthy Berries', location: 'Tirupur', price: '₹40/kg', minOrder: '5 kg', category: 'Fruits' },
    { id: 84, title: 'Gongura Leaves', farmer: 'Andhra Greens', location: 'Guntur', price: '₹20/bun', minOrder: '5 bun', category: 'Greens' },
    { id: 85, title: 'Methi Leaves', farmer: 'Fenugreek Farms', location: 'Pune', price: '₹15/bun', minOrder: '10 bun', category: 'Greens' },
    { id: 86, title: 'Spring Onion', farmer: 'Salad Greens', location: 'Ooty', price: '₹30/bun', minOrder: '5 bun', category: 'Greens' },
    { id: 87, title: 'Button Mushrooms', farmer: 'Ooty Mushrooms', location: 'Ooty', price: '₹50/pack', minOrder: '5 packs', category: 'Vegetables' },
    { id: 88, title: 'Sweet Corn', farmer: 'Golden Grains', location: 'Coimbatore', price: '₹15/pc', minOrder: '10 pcs', category: 'Vegetables' },
    { id: 89, title: 'Groundnuts (Peanuts)', farmer: 'Dry Lands', location: 'Virudhunagar', price: '₹80/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 90, title: 'Cashew Nuts', farmer: 'Panruti Cashews', location: 'Panruti', price: '₹800/kg', minOrder: '0.5 kg', category: 'Others' },
    { id: 91, title: 'Coffee Beans', farmer: 'Coorg Estates', location: 'Coorg', price: '₹400/kg', minOrder: '1 kg', category: 'Others' },
    { id: 92, title: 'Tea Dust', farmer: 'Nilgiri Tea', location: 'Kotagiri', price: '₹200/kg', minOrder: '1 kg', category: 'Others' },
    { id: 93, title: 'Honey', farmer: 'Forest Collectives', location: 'Kodaikanal', price: '₹400/bottle', minOrder: '1 bottle', category: 'Others' },
    { id: 94, title: 'Jaggery (Vellam)', farmer: 'Natural Sweet', location: 'Erode', price: '₹60/kg', minOrder: '5 kg', category: 'Others' },
    { id: 95, title: 'Palm Jaggery (Karupatti)', farmer: 'Palm Grove', location: 'Tiruchendur', price: '₹250/kg', minOrder: '1 kg', category: 'Others' },
    { id: 96, title: 'Turmeric Powder', farmer: 'Erode Turmeric', location: 'Erode', price: '₹120/kg', minOrder: '1 kg', category: 'Spices' },
    { id: 97, title: 'Samba Rice', farmer: 'Traditional Paddy', location: 'Thanjavur', price: '₹65/kg', minOrder: '5 kg', category: 'Grains' },
    { id: 98, title: 'Curd Chilli', farmer: 'Grandma Recipe', location: 'Madurai', price: '₹200/kg', minOrder: '0.5 kg', category: 'Others' },
    { id: 99, title: 'Vathal (Sun Dried Veg)', farmer: 'Home Industry', location: 'Karaikudi', price: '₹250/kg', minOrder: '0.5 kg', category: 'Others' },
    { id: 100, title: 'Ghee', farmer: 'Dairy Farm', location: 'Uthukuli', price: '₹600/lt', minOrder: '1 lt', category: 'Dairy' }
];

export const PRODUCTS_DATA = RAW_PRODUCTS.map(item => ({
    ...item,
    image: getLocalImage(item.title) || getDynamicImage(item.id, item.title, item.category)
}));

export const PROJECTS_DATA = [
    { id: 101, title: 'Organic Wheat Expansion', farmer: 'Green Earth Co-op', category: 'Agriculture', raisedAmount: 375000, targetAmount: 500000, roi: '12%', duration: '12 Months', image: 'https://images.unsplash.com/photo-1574943320219-55edeb705382?auto=format&fit=crop&w=800&q=80' },
    { id: 102, title: 'Solar Powered Irrigation', farmer: 'Suryashakti Farms', category: 'Technology', raisedAmount: 120000, targetAmount: 800000, roi: '15%', duration: '36 Months', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80' },
    { id: 103, title: 'Hydroponic Greenhouse', farmer: 'City Greens', category: 'Technology', raisedAmount: 450000, targetAmount: 1000000, roi: '18%', duration: '24 Months', image: 'https://images.unsplash.com/photo-1559235038-1b0fca327248?auto=format&fit=crop&w=800&q=80' },
    { id: 104, title: 'Dairy Farm Expansion', farmer: 'Milkeway Farms', category: 'Agriculture', raisedAmount: 200000, targetAmount: 600000, roi: '14%', duration: '18 Months', image: 'https://images.unsplash.com/photo-1624823183578-18e404bcc390?auto=format&fit=crop&w=800&q=80' },
];
