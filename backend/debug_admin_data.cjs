(async () => {
    const adminRes = await fetch('http://localhost:5000/api/auth/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@greenbond.com', password: 'admin123' })
    });
    const adminData = await adminRes.json();
    const token = adminData.token;
    const headers = { 'Authorization': 'Bearer ' + token };
    
    const endpoints = [
        ['users', 'http://localhost:5000/api/admin/users'],
        ['farmers', 'http://localhost:5000/api/admin/farmers'],
        ['deliveryPartners', 'http://localhost:5000/api/admin/delivery-partners'],
        ['orders', 'http://localhost:5000/api/orders/admin/all'],
        ['products', 'http://localhost:5000/api/products'],
        ['audit', 'http://localhost:5000/api/admin/audit'],
        ['revenue', 'http://localhost:5000/api/admin/revenue'],
        ['config', 'http://localhost:5000/api/admin/config']
    ];
    
    for (const [name, url] of endpoints) {
        try {
            const res = await fetch(url, { headers });
            const data = await res.json();
            console.log(name, 'status:', res.status, 'isArray:', Array.isArray(data), 'type:', typeof data, 'keys:', Object.keys(data).slice(0, 5));
        } catch (e) {
            console.error(name, 'error:', e.message);
        }
    }
})();
