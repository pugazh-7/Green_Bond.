import fetch from 'node-fetch';

async function testApi() {
  try {
    const res = await fetch('https://green-bond.onrender.com/api/marketplace/products?lat=12.9716&lng=77.5946&marketplaceType=SHOPPING');
    const data = await res.json();
    console.log("With Location:", data);

    const res2 = await fetch('https://green-bond.onrender.com/api/marketplace/products?marketplaceType=SHOPPING');
    const data2 = await res2.json();
    console.log("Without Location:", data2);
  } catch (err) {
    console.error(err);
  }
}

testApi();
