const axios = require('axios');

const testErrors = async () => {
    console.log('--- Testing Duplicate Email (User) ---');
    try {
        // First, register a user
        const email = "dup_" + Date.now() + "@example.com";
        await axios.post('http://localhost:5000/api/auth/register-user', {
            name: "First User",
            email: email,
            mobile: "9999999991",
            password: "password123",
            confirmPassword: "password123"
        });
        
        // Try to register again with same email
        const res = await axios.post('http://localhost:5000/api/auth/register-user', {
            name: "Second User",
            email: email,
            mobile: "9999999992",
            password: "password123",
            confirmPassword: "password123"
        });
        console.log('Error: Duplicate email allowed!', res.status);
    } catch (err) {
        console.log('Success: Duplicate caught:', err.response.status, err.response.data.message);
    }

    console.log('\n--- Testing Validation Error (Short Name) ---');
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register-user', {
            name: "T", // minlength 3
            email: "valid@example.com",
            mobile: "1234567890",
            password: "password123",
            confirmPassword: "password123"
        });
        console.log('Error: Invalid name allowed!', res.status);
    } catch (err) {
        console.log('Success: Validation caught:', err.response.status, err.response.data.message);
    }
    
    console.log('\n--- Testing Mobile Number Length ---');
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register-user', {
            name: "Valid Name",
            email: "valid2@example.com",
            mobile: "123", // exactly 10
            password: "password123",
            confirmPassword: "password123"
        });
        console.log('Error: Invalid mobile allowed!', res.status);
    } catch (err) {
        console.log('Success: Mobile validation caught:', err.response.status, err.response.data.message);
    }
};

testErrors();
