import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/green_bond').then(async () => {
  const count = await mongoose.connection.db.collection('products').countDocuments({ marketplaceType: 'SHOPPING' });
  const sample = await mongoose.connection.db.collection('products').findOne({ marketplaceType: 'SHOPPING' });
  console.log('Count:', count);
  console.log('Sample:', JSON.stringify(sample, null, 2));
  process.exit(0);
});
