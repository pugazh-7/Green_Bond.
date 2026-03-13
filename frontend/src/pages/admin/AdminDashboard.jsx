import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        toast.success('Logged out successfully');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-white">GreenBond Admin</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-emerald-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Users</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">1,245</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-teal-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Farmers</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">850</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Active Orders</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">342</p>
                    </div>
                </div>

                <div className="bg-white shadow rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent System Activity</h3>
                    </div>
                    <div className="px-6 py-5">
                        <div className="text-center text-gray-500 py-10">
                            <p>System metrics and user management tables will appear here.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
