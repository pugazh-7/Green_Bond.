import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = React.useState([]);
    const [products, setProducts] = React.useState([]);

    React.useEffect(() => {
        const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        setOrders(savedOrders);

        const savedProducts = JSON.parse(localStorage.getItem('green_bond_products') || '[]');
        setProducts(savedProducts);
    }, []);

    const handleDeleteProduct = (productId) => {
        if (window.confirm('Are you sure you want to remove this product listing?')) {
            const updatedProducts = products.filter(p => p.id !== productId);
            setProducts(updatedProducts);
            localStorage.setItem('green_bond_products', JSON.stringify(updatedProducts));
            toast.success('Product listing removed successfully');
        }
    };

    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const produceSold = orders.reduce((sum, order) => sum + (parseInt(order.qty) || 0), 0);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h2>
                <button
                    onClick={() => navigate('/client/add-product')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 font-medium text-sm"
                >
                    + Add New Listing
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Live</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
                    <p className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Produce Sold</h3>
                    <p className="text-2xl font-bold text-gray-900">{produceSold} units</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <span className="text-xs font-bold text-gray-500">Active</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Active Listings</h3>
                    <p className="text-2xl font-bold text-gray-900">{products.length} Items</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">New Orders</h3>
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders Table */}
                <div className="lg:col-span-2 space-y-8">
                    {/* MY LISTINGS SECTION */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">My Active Listings</h3>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <th className="pb-4">Image</th>
                                            <th className="pb-4">Product Name</th>
                                            <th className="pb-4">Price</th>
                                            <th className="pb-4">Category</th>
                                            <th className="pb-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="space-y-4">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-gray-400 text-sm">
                                                    No active listings found.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3">
                                                        <img src={product.image || 'https://via.placeholder.com/40'} alt={product.title} className="w-10 h-10 rounded-lg object-cover" />
                                                    </td>
                                                    <td className="py-3 text-sm font-bold text-gray-900">{product.title}</td>
                                                    <td className="py-3 text-sm text-gray-500">{product.price}</td>
                                                    <td className="py-3 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block text-xs font-bold">{product.category}</td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Remove Product"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Recent Sales</h3>
                            <button onClick={() => navigate('/client/orders')} className="text-sm text-green-600 font-medium hover:text-green-700">Manage Orders</button>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <th className="pb-4">Order ID</th>
                                            <th className="pb-4">Customer</th>
                                            <th className="pb-4">Produce</th>
                                            <th className="pb-4 text-right">Qty</th>
                                            <th className="pb-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="space-y-4">
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-gray-400 text-sm">
                                                    No recent sales.
                                                </td>
                                            </tr>
                                        ) : (
                                            orders.map((order, idx) => (
                                                <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 text-sm text-gray-500 font-mono">{order.id}</td>
                                                    <td className="py-3 text-sm font-medium text-gray-900">{order.customer}</td>
                                                    <td className="py-3 text-sm text-gray-500">{order.item}</td>
                                                    <td className="py-3 text-sm text-gray-900 text-right">{order.qty}</td>
                                                    <td className="py-3 text-sm font-bold text-green-600 text-right">{order.total}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bond Performance */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
                    <h3 className="font-bold text-gray-900 mb-6">Bond Funding Status</h3>
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="60" stroke="#f3f4f6" strokeWidth="8" fill="none"></circle>
                                    <circle cx="64" cy="64" r="60" stroke="#16a34a" strokeWidth="8" fill="none" strokeDasharray="377" strokeDashoffset="94"></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-3xl font-bold text-gray-900">75%</span>
                                    <span className="text-xs text-gray-500">Funded</span>
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-900">Organic Wheat Expansion</h4>
                            <p className="text-sm text-gray-500">Target: ₹5,00,000</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
