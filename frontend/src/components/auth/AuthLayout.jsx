import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, heroImage, heroTitle, heroSubtitle, userRole = 'User' }) => {
    return (
        <div className="min-h-[100dvh] bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* Desktop Left Side (Hero Image & Branding) */}
            <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-green-900">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 hover:scale-100" 
                    style={{ backgroundImage: `url(${heroImage})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-green-900/70 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col h-full p-12 lg:p-16 text-white justify-between">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-700 shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                            </div>
                            <span className="text-2xl font-black tracking-tight font-heading">GREENBOND</span>
                        </Link>
                    </div>

                    <div className="mt-auto max-w-xl">
                        <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm border border-white/10">
                            {userRole} Portal
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight drop-shadow-md font-heading">
                            {heroTitle}
                        </h1>
                        <p className="text-lg lg:text-xl text-green-50 font-medium leading-relaxed max-w-md drop-shadow">
                            {heroSubtitle}
                        </p>
                    </div>
                    
                    <div className="mt-16 flex items-center gap-4 text-sm font-medium text-green-200/80">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Secure, encrypted authentication
                    </div>
                </div>
            </div>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden bg-white shadow-sm px-4 pt-safe py-4 sticky top-0 z-10 flex items-center justify-between border-b border-gray-100">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <span className="text-lg font-black text-green-800 tracking-tight font-heading">GREENBOND</span>
                </Link>
            </div>

            {/* Right Side (Form) */}
            <div className="flex-1 flex flex-col justify-start md:justify-center items-center p-4 pt-8 pb-safe sm:p-8 lg:p-12 relative overflow-y-auto">
                {/* Background Pattern for right side */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">
                    {children}
                </div>
                
                <div className="mt-12 text-center text-xs text-gray-400 font-medium">
                    &copy; {new Date().getFullYear()} GreenBond Marketplace. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
