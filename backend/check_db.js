import mongoose from 'mongoose';

async function testAPI() {
    await mongoose.connect('mongodb://127.0.0.1:27017/green_bond');
    const db = mongoose.connection.db;
    const allProducts = await db.collection('products').find({}).toArray();
    console.log('Total products:', allProducts.length);
    console.log('Marketplace types:', [...new Set(allProducts.map(p => p.marketplaceType))]);
    console.log('Farmer Products (has farmer or farmerId):', allProducts.filter(p => p.farmer || p.farmerId).length);
    
    const sampleFarmer = allProducts.find(p => p.farmer || p.farmerId);
    if(sampleFarmer) {
        console.log('Sample Farmer Product marketplaceType:', sampleFarmer.marketplaceType);
        console.log('Sample Farmer Product:', JSON.stringify(sampleFarmer, null, 2));
    }
    process.exit(0);
}
testAPI();
