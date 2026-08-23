import axios from 'axios';

async function testAPIs() {
    const baseUrl = 'http://127.0.0.1:5000/api';
    const lat = 12.2274;
    const lng = 79.0673;

    console.log("--- 6. API COUNTS ---");
    
    // Shopping API Count
    try {
        const shopRes = await axios.get(`${baseUrl}/marketplace/products?marketplaceType=SHOPPING&limit=100`);
        console.log(`SHOPPING API: ${shopRes.data.products?.length || 0}`);
    } catch(e) { console.log(`SHOPPING API Error: ${e.message}`); }

    // Quick API Count
    try {
        const quickRes = await axios.get(`${baseUrl}/marketplace/quick?limit=100&lat=${lat}&lng=${lng}`);
        console.log(`QUICK API: ${quickRes.data.products?.length || quickRes.data?.length || 0}`);
    } catch(e) { console.log(`QUICK API Error: ${e.message}`); }

    // Fresh API Count
    try {
        const freshRes = await axios.get(`${baseUrl}/marketplace/fresh?limit=100&lat=${lat}&lng=${lng}`);
        console.log(`FRESH API: ${freshRes.data.products?.length || freshRes.data?.length || 0}`);
    } catch(e) { console.log(`FRESH API Error: ${e.message}`); }
    
    console.log("\n--- 12. SEARCH TEST ---");
    // Test Shopping Search
    for (let term of ['phone', 'laptop', 'shirt', 'chips']) {
        try {
            const res = await axios.get(`${baseUrl}/marketplace/products?marketplaceType=SHOPPING&q=${term}`);
            console.log(`Shopping search '${term}': ${res.data.products?.length || 0} results`);
        } catch(e) { console.log(`Error searching ${term}:`, e.message); }
    }
    
    // Test Quick Search
    for (let term of ['milk', 'charger', 'gift', 'earphones']) {
        try {
            const res = await axios.get(`${baseUrl}/marketplace/quick?q=${term}&lat=${lat}&lng=${lng}`);
            console.log(`Quick search '${term}': ${res.data.products?.length || res.data?.length || 0} results`);
        } catch(e) { console.log(`Error searching ${term}:`, e.message); }
    }

    // Test Fresh Search
    for (let term of ['tomato', 'thakkali', 'தக்காளி', 'banana']) {
        try {
            const res = await axios.get(`${baseUrl}/marketplace/fresh?q=${term}&lat=${lat}&lng=${lng}`);
            console.log(`Fresh search '${term}': ${res.data.products?.length || res.data?.length || 0} results`);
        } catch(e) { console.log(`Error searching ${term}:`, e.message); }
    }
}

testAPIs();
