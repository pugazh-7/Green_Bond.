const axios = require('axios');

async function testAuth() {
    const baseUrl = 'http://localhost:5001/api/auth';
    const timestamp = Date.now();
    const testUser = {
        name: 'Test Verification User',
        email: `verify_${timestamp}@example.com`,
        mobile: `90${timestamp.toString().slice(-8)}`,
        password: 'password123',
        confirmPassword: 'password123'
    };

    console.log('--- Phase 1: Registration ---');
    try {
        const url = `${baseUrl}/register-user`;
        console.log('Calling:', url);
        const regRes = await axios.post(url, testUser);
        console.log('Registration Status:', regRes.status);
        console.log('Registration Data:', regRes.data);

        console.log('\n--- Phase 2: Duplicate Mobile Registration ---');
        try {
            await axios.post(`${baseUrl}/register-user`, {
                ...testUser,
                email: `different_${timestamp}@example.com`
            });
        } catch (error) {
            console.log('Duplicate Mobile Red Status:', error.response.status);
            console.log('Duplicate Mobile Red Data:', error.response.data);
        }

        console.log('\n--- Phase 3: Login (Correct) ---');
        const loginRes = await axios.post(`${baseUrl}/login-user`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Login Status:', loginRes.status);
        console.log('Login Data:', loginRes.data);

        console.log('\n--- Phase 4: Login (Incorrect Password) ---');
        try {
            await axios.post(`${baseUrl}/login-user`, {
                email: testUser.email,
                password: 'wrongpassword'
            });
        } catch (error) {
            console.log('Fail Login Status:', error.response.status);
        }

        console.log('\n--- Phase 5: Admin Login ---');
        const adminRes = await axios.post(`${baseUrl}/login-user`, {
            email: 'admin@greenbond.com',
            password: 'admin123'
        });
        console.log('Admin Login Status:', adminRes.status);
        console.log('Admin Login Data:', adminRes.data);

    } catch (error) {
        if (error.response) {
            console.error('Verification script API error:', error.response.status, error.response.data);
        } else {
            console.error('Verification script error:', error.message);
        }
    }
}

testAuth();
