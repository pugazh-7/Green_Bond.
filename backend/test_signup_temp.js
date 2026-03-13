const axios = require('axios');

const testSignup = async () => {
    const signupData = {
        name: "Test User",
        email: "test_" + Date.now() + "@example.com",
        mobile: "1234567890",
        password: "password123",
        confirmPassword: "password123"
    };

    try {
        console.log('Attempting to register user...');
        const response = await axios.post('http://localhost:5000/api/auth/register-user', signupData);
        console.log('Signup Successful:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Signup Failed (Response):', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Signup Failed (No Response):', error.message);
        } else {
            console.error('Signup Failed (Error):', error.message);
        }
    }
};

testSignup();
