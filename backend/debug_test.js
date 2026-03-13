const axios = require('axios');

const testRegistration = async () => {
    console.log('--- Testing User Registration ---');
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register-user', {
            name: "Test User",
            email: "test_" + Date.now() + "@example.com",
            mobile: "1234567890",
            password: "password123",
            confirmPassword: "password123"
        });
        console.log('User Reg Success:', res.status, res.data);
    } catch (err) {
        console.error('User Reg Failed:', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    }

    console.log('\n--- Testing Farmer Registration ---');
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register-farmer', {
            name: "Test Farmer",
            mobile: "9" + Math.floor(Math.random() * 1000000000),
            location: "Test Location",
            pin: "1234"
        });
        console.log('Farmer Reg Success:', res.status, res.data);
    } catch (err) {
        console.error('Farmer Reg Failed:', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    }

    console.log('\n--- Testing Delivery Partner Registration ---');
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register-delivery', {
            name: "Test Delivery",
            email: "delivery_" + Date.now() + "@example.com",
            mobile: "1234567890",
            password: "password123",
            confirmPassword: "password123"
        });
        console.log('Delivery Reg Success:', res.status, res.data);
    } catch (err) {
        console.error('Delivery Reg Failed:', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    }
};

testRegistration();
