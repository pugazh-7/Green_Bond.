import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/logo.jpeg';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const handleAnchorClick = (e, anchorId) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        if (location.pathname === '/') {
            const el = document.getElementById(anchorId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/', { state: { scrollTo: anchorId } });
        }
    };
    // const image=Logo

    const navigate = useNavigate();
    // Mock auth state - replace with real auth context later
    const isLoggedIn = false;


    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16">
                    <div className="flex justify-between h-14 md:h-16">
                        <div className="flex items-center">
                            <Link
                                to="/"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="flex items-center gap-2"
                            >
                                <img src={logo} alt="Green Bond" className="w-10 h-10 md:w-12 md:h-12 2xl:w-16 2xl:h-16 object-contain" />
                                <span className="text-xl 2xl:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                                    GreenBond
                                </span>
                            </Link>
                        </div>

                        <div className="hidden md:flex items-center space-x-6 2xl:space-x-10 2xl:text-lg">
                            <Link
                                to="/"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="text-gray-600 hover:text-green-600 transition-colors font-medium"
                            >
                                🏚️Home
                            </Link>
                            <a href="#" onClick={(e) => handleAnchorClick(e, 'objectives')} className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                🌱Objectives
                            </a>
                            <a href="#" onClick={(e) => handleAnchorClick(e, 'solution')} className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                🕵️Solution
                            </a>
                            <a href="#" onClick={(e) => handleAnchorClick(e, 'contact')} className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                ☎️Contact
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-600 hover:text-green-600 focus:outline-none p-2"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Content */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 px-2 space-y-3 bg-white border-t border-gray-100">
                            <Link
                                to="/"
                                onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                            >
                                🏚️Home
                            </Link>
                            <a 
                                href="#" 
                                onClick={(e) => handleAnchorClick(e, 'objectives')}
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                            >
                                🌱Objectives
                            </a>
                            <a 
                                href="#" 
                                onClick={(e) => handleAnchorClick(e, 'solution')}
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                            >
                                🕵️Solution
                            </a>
                            <a 
                                href="#" 
                                onClick={(e) => handleAnchorClick(e, 'contact')}
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                            >
                                ☎️Contact
                            </a>
                            <div className="border-t border-gray-100 pt-2 pb-1">
                                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                                <Link to="/login/user" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50">Login as User</Link>
                                <Link to="/login/farmer" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50">Login as Farmer</Link>
                                <Link to="/login/delivery" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50">Delivery Partner</Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 text-white py-12">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-xl 2xl:text-3xl font-bold mb-4">GreenBond</h3>
                            <p className="text-gray-400 2xl:text-xl">
                                Connecting farmers directly with buyers for a sustainable future.
                            </p>
                        </div>
                        {/* <div>
                            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/" className="hover:text-green-400">Home</Link></li>
                                <li><Link to="/login" className="hover:text-green-400">Login</Link></li>
                                <li><Link to="/signup" className="hover:text-green-400">Sign Up</Link></li>
                            </ul>
                        </div> */}
                        <div>
                            <h4 className="text-lg 2xl:text-2xl font-semibold mb-4">Contact</h4>
                            <p className="text-gray-400 2xl:text-xl">support@greenbond.com</p>
                            <p className="text-gray-400 2xl:text-xl">+91 7358859792</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2026 GreenBond. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
