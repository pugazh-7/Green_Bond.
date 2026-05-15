import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import logo from './assets/logo.jpeg';


const Layout = () => {
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
                            <a href="/#objectives" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                🌱Objectives
                            </a>
                            <a href="/#solution" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                🕵️Solution
                            </a>
                            <a href="/#contact" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                ☎️Contact
                            </a>
                        </div>


                    </div>
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
