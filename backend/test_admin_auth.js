import axios from 'axios';

async function testAdminAuth() {
    const baseUrl = 'http://localhost:5000/api/auth';
    
    console.log('--- Admin Login Verification ---');

    // 1. User Portal
    try {
        console.log('\nTesting Admin Login via User Portal...');
        const userRes = await axios.post(`${baseUrl}/login-user`, {
            email: 'admin@greenbond.com',
            password: 'admin123'
        });
        console.log('Status:', userRes.status);
        console.log('Role:', userRes.data.user.role);
    } catch (error) {
        console.error('User Portal Admin Login Failed:', error.response?.data || error.message);
    }

    // 2. Farmer Portal
    try {
        console.log('\nTesting Admin Login via Farmer Portal...');
        const farmerRes = await axios.post(`${baseUrl}/login-farmer`, {
            name: 'Admin',
            mobile: '0000000000',
            pin: '1234'
        });
        console.log('Status:', farmerRes.status);
        console.log('Role:', farmerRes.data.farmer.role);
    } catch (error) {
        console.error('Farmer Portal Admin Login Failed:', error.response?.data || error.message);
    }

    // 3. Delivery Portal
    try {
        console.log('\nTesting Admin Login via Delivery Portal...');
        const deliveryRes = await axios.post(`${baseUrl}/login-delivery`, {
            email: 'admin@greenbond.com',
            password: 'admin123'
        });
        console.log('Status:', deliveryRes.status);
        console.log('Role:', deliveryRes.data.partner.role);
    } catch (error) {
        console.error('Delivery Portal Admin Login Failed:', error.response?.data || error.message);
    }
}

testAdminAuth();
