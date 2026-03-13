const axios = require('axios');

async function testSimple() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const timestamp = Date.now();
    const testUser = {
        name: 'Simple Verify',
        email: `s_${timestamp}@test.com`,
        mobile: `88${timestamp.toString().slice(-8)}`,
        password: 'password123',
        confirmPassword: 'password123'
    };

    try {
        console.log('1. Registering...');
        const r1 = await axios.post(`${baseUrl}/register-user`, testUser);
        console.log('Success:', r1.data.message);

        console.log('2. Logging in...');
        const r2 = await axios.post(`${baseUrl}/login-user`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Success:', r2.data.message, r2.data.user.name);

        console.log('3. Checking Duplicate Mobile...');
        try {
            await axios.post(`${baseUrl}/register-user`, {
                ...testUser,
                email: `s2_${timestamp}@test.com`
            });
            console.log('FAIL: Duplicate mobile allowed!');
        } catch (e) {
            console.log('Success: Duplicate caught:', e.response.data.message);
        }

    } catch (e) {
        if (e.response) {
            console.error('ERROR DATA:', e.response.data);
            console.error('ERROR STATUS:', e.response.status);
        } else {
            console.error('ERROR:', e.message);
        }
    }
}

testSimple();
