import axios from 'axios';

(async () => {
    try {
        console.log('Sending registration request to port 5999...');
        const response = await axios.post('http://localhost:5999/api/auth/register-user', {
            name: "Test User ESM Final",
            email: `test_final_${Date.now()}@example.com`,
            mobile: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
            password: "securepassword",
            confirmPassword: "securepassword"
        });
        console.log("Response:", response.status, response.data);
    } catch (e) {
        console.error("Request failed:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
    }
})();


