import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center bg-gradient-to-br from-green-950 via-green-800 to-teal-950 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/new_farmer_hero.png')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16 relative z-10 text-center">
                    <h1 className="text-5xl md:text-6xl 2xl:text-8xl font-extrabold text-white mb-6 2xl:mb-10 leading-tight drop-shadow-2xl">
                        Empowering Farmers, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-300">Connecting Futures</span>
                    </h1>
                    <p className="text-xl md:text-2xl 2xl:text-3xl text-gray-200 mb-8 2xl:mb-12 max-w-3xl 2xl:max-w-5xl mx-auto drop-shadow-lg">
                        Directly connect with buyers, ensure fair pricing, and promote sustainable agriculture through our secure digital platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup/user" className="px-8 py-4 2xl:px-12 2xl:py-6 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 hover:scale-105 transform transition-all text-lg 2xl:text-2xl flex items-center justify-center gap-2 border border-green-400/20">
                            Join as User
                        </Link>
                        <Link to="/signup/farmer" className="px-8 py-4 2xl:px-12 2xl:py-6 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-500/30 hover:scale-105 transform transition-all text-lg 2xl:text-2xl flex items-center justify-center gap-2 border border-teal-400/20">
                            <span>Join as Farmer</span>
                        </Link>
                    </div>
                    <div className="mt-8 2xl:mt-12 flex gap-6 2xl:gap-10 justify-center text-sm 2xl:text-lg font-medium text-gray-400">
                        <Link to="/login/user" className="hover:text-green-400 transition-colors">
                            Login as User
                        </Link>
                        <span className="text-gray-600">|</span>
                        <Link to="/login/farmer" className="hover:text-teal-400 transition-colors">
                            Login as Farmer
                        </Link>
                        <span className="text-gray-600">|</span>
                        <Link to="/login/delivery" className="hover:text-blue-400 transition-colors">
                            Delivery Partner
                        </Link>
                    </div>
                </div>
            </section>

            {/* Abstract/Intro */}
            <section className="py-20 bg-white">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16 text-center">
                    <h2 className="text-3xl 2xl:text-5xl font-bold text-gray-900 mb-8 2xl:mb-12">About GreenBond</h2>
                    <p className="text-lg 2xl:text-2xl text-gray-600 max-w-4xl 2xl:max-w-6xl mx-auto leading-relaxed">
                        GreenBond is a farmer-centric digital platform that connects farmers directly with buyers, ensures fair pricing, promotes sustainable agriculture, and enables secure digital transactions using a React frontend and Node.js backend. We support farmers by reducing middlemen dependency and improving income through technology-driven solutions.
                    </p>
                </div>
            </section>

            {/* Objectives */}
            <section id="objectives" className="py-20 bg-gradient-to-b from-gray-50 to-green-50/30">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16">
                    <h2 className="text-3xl 2xl:text-5xl font-bold text-gray-900 mb-12 2xl:mb-16 text-center">Our Objectives</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Direct Connection", desc: "Direct Farmer to Buyer connection eliminating intermediaries." },
                            { title: "Fair Pricing", desc: "Transparent pricing models ensuring farmers get their worth." },
                            { title: "Sustainability", desc: "Promoting eco-friendly and sustainable agricultural practices." },
                            { title: "Digital Payments", desc: "Secure and fast digital transaction capabilities." }
                        ].map((item, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                                <h3 className="text-xl 2xl:text-2xl font-bold text-green-700 mb-4 2xl:mb-6">{item.title}</h3>
                                <p className="text-gray-600 2xl:text-lg">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Problem & Solution */}
            <section id="solution" className="py-20 bg-white">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl 2xl:text-5xl font-bold text-gray-900 mb-6 2xl:mb-10">The Problem</h2>
                            <p className="text-lg 2xl:text-xl text-gray-600 mb-8 2xl:mb-12">
                                Farmers face low profits, lack of transparency, and limited access to technology and finance options. The gap between producers and consumers is widening.
                            </p>
                            <h2 className="text-3xl 2xl:text-5xl font-bold text-gray-900 mb-6 2xl:mb-10">Our Solution</h2>
                            <p className="text-lg 2xl:text-xl text-gray-600">
                                GreenBond provides a digital marketplace with authentication, crop listing, payments, logistics, and advisory modules. We bridge the gap effectively.
                            </p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-200 rounded-3xl transform rotate-3"></div>
                            <img
                                src="/new_solution.png"
                                alt="Farming Solution"
                                className="relative rounded-3xl shadow-xl transform -rotate-3 transition-transform hover:rotate-0 duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>



            {/* Impact */}
            <section className="py-24 bg-gradient-to-br from-green-900 to-teal-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl 2xl:text-6xl font-bold mb-6 2xl:mb-10">Sustainability Impact</h2>
                    <p className="text-xl 2xl:text-3xl text-green-100 max-w-3xl 2xl:max-w-5xl mx-auto leading-relaxed">
                        Promotes eco-friendly farming, reduces waste, and supports rural livelihoods.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
