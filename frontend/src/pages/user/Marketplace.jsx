import React, { useState } from 'react';




import { PRODUCTS_DATA as DEFAULT_PRODUCTS, PROJECTS_DATA as DEFAULT_BONDS } from '../../data/products';
import toast from 'react-hot-toast';

const Marketplace = () => {
    // ... same component logic ...
    const [activeTab, setActiveTab] = useState('produce');
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const [products, setProducts] = useState(DEFAULT_PRODUCTS);
    const [bonds, setBonds] = useState(DEFAULT_BONDS);
    // const [isLoading, setIsLoading] = useState(true);

    // React.useEffect(() => {
    //     const fetchData = async () => {
    //         setIsLoading(true);
    //         try {
    //             const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
    //             if (response.ok) {
    //                 const backendProducts = await response.json();
                    
    //                 // Add unique backend products (mapped to include an id for React keys)
    //                 const normalizedBackend = backendProducts.map(p => ({
    //                     ...p,
    //                     id: p._id || p.id // Mongodb uses _id
    //                 }));
                    
    //                 // Filter out any backend products that might already be in DEFAULT_PRODUCTS (unlikely)
    //                 const uniqueBackend = normalizedBackend.filter(bp => 
    //                     !DEFAULT_PRODUCTS.some(dp => dp.title === bp.title && dp.farmer === bp.farmer)
    //                 );

    //                 setProducts([...DEFAULT_PRODUCTS, ...uniqueBackend]);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching marketplace data:', error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };

    //     fetchData();
    // }, []);



    const [selectionProduct, setSelectionProduct] = useState(null);
    const [detailsProduct, setDetailsProduct] = useState(null);
    const [orderStep, setOrderStep] = useState('selection'); // 'selection' | 'quantity'
    const [quantity, setQuantity] = useState(1);
    const [bulkQuantity, setBulkQuantity] = useState(10);

    const handleAction = (item, type) => {
        if (type === 'produce') {
            setSelectionProduct(item);
            setOrderStep('selection');
            setQuantity(1);
            // Default bulk quantity to 50 as per user example, or minOrder if higher
            const minQ = parseInt(item.minOrder?.replace(/[^\d]/g, '') || '10');
            setBulkQuantity(Math.max(50, minQ));
        } else {
            toast.success(`Thank you for Investing in "${item.title}". \n\nRedirecting to Payment Gateway... (Simulation)`);
        }
    };

    const saveBulkInquiry = (product, customQuantity) => {
        const inquiries = JSON.parse(localStorage.getItem('green_bond_bulk_orders') || '[]');
        // Check if already inquired today
        const today = new Date().toDateString();
        const existing = inquiries.find(i => i.id === product.id && new Date(i.date).toDateString() === today);

        if (!existing) {
            const currentUser = JSON.parse(localStorage.getItem('green_bond_current_user') || 'null');

            const newInquiry = {
                ...product,
                requestedQuantity: customQuantity || bulkQuantity,
                // Ensure unique ID for the order itself, distinct from product ID
                orderId: Date.now(),
                date: new Date().toISOString(),
                status: 'Inquiry Sent',
                customer: currentUser ? {
                    name: currentUser.name,
                    email: currentUser.email,
                    // If phone is added to signup later, we can use it here. For now using email as contact text.
                    contact: currentUser.email
                } : {
                    name: 'Guest User',
                    contact: 'No contact info'
                }
            };
            localStorage.setItem('green_bond_bulk_orders', JSON.stringify([newInquiry, ...inquiries]));
            toast.success("Added to your Bulk Orders list!");
        }
    };

    const matchesSearch = (item) => {
        const term = search.toLowerCase();
        const title = item?.title || '';
        const farmer = item?.farmer || '';
        const location = item?.location || '';
        
        return title.toLowerCase().includes(term) ||
            farmer.toLowerCase().includes(term) ||
            location.toLowerCase().includes(term);
    };

    const getUnit = (priceStr) => {
        if (!priceStr) return 'unit';
        const parts = priceStr.split('/');
        if (parts.length > 1) {
            const unit = parts[1].trim();
            return unit.charAt(0).toUpperCase() + unit.slice(1);
        }
        return 'unit';
    };

    const filteredProducts = products.filter(p => (filter === 'All' || p.category === filter) && matchesSearch(p));
    const filteredBonds = bonds.filter(b => (filter === 'All' || b.category === filter) && matchesSearch(b));

    return (
        <div className="space-y-8 relative">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
                        <p className="text-gray-600 mt-1">
                            {activeTab === 'bonds' ? 'Invest in sustainable projects.' : 'Buy fresh produce directly from farmers.'}
                        </p>
                    </div>

                    {/* Toggle / Tabs */}
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => { setActiveTab('produce'); setFilter('All'); }}
                            className={`px-6 py-2 rounded-md font-semibold transition-all ${activeTab === 'produce' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Farm Produce
                        </button>
                        <button
                            onClick={() => { setActiveTab('bonds'); setFilter('All'); }}
                            className={`px-6 py-2 rounded-md font-semibold transition-all ${activeTab === 'bonds' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {/* Project Bonds */}
                        </button>
                    </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    {/* Search Input */}
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search farms, produce, or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                    </div>

                    {/* Sub-Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['All', ...(activeTab === 'bonds' ? ['Agriculture', 'Technology'] : ['Vegetables', 'Fruits'])].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${filter === cat ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {(activeTab === 'produce' ? filteredProducts : filteredBonds).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">No matches found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any {activeTab === 'produce' ? 'produce' : 'projects'} matching your search filters.</p>
                    <button
                        onClick={() => { setFilter('All'); setSearch(''); }}
                        className="mt-6 px-6 py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 md:gap-6 xl:gap-8">
                    {activeTab === 'bonds' ? (
                        // BONDS GRID
                        filteredBonds.map(bond => {
                            const progress = (bond.raisedAmount / bond.targetAmount) * 100;
                            return (
                                <div key={bond.id} className="bg-white rounded-lg lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group h-full border border-gray-100">
                                    <div className="aspect-square lg:aspect-[4/3] w-full overflow-hidden relative bg-gray-50">
                                        <img src={bond.image} alt={bond.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute top-1 lg:top-4 right-1 lg:right-4 bg-white/90 backdrop-blur-sm px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full text-[6px] lg:text-xs font-bold text-green-700 uppercase">{bond.category}</div>
                                    </div>
                                    <div className="p-2 lg:p-5 flex-1 flex flex-col">
                                        <h3 className="text-[10px] lg:text-xl font-bold text-gray-900 mb-0.5 lg:mb-1 leading-tight line-clamp-1">{bond.title}</h3>
                                        <p className="text-[8px] lg:text-base text-gray-500 mb-1 lg:mb-4 truncate">{bond.farmer}</p>
                                        <div className="grid grid-cols-2 gap-1 lg:gap-2 mb-2 lg:mb-4">
                                            <div className="bg-green-50 p-1 lg:p-2 rounded text-center"><p className="text-[6px] lg:text-xs text-gray-500 uppercase font-semibold">ROI</p><p className="text-[8px] lg:text-sm font-bold text-green-700">{bond.roi}</p></div>
                                            <div className="bg-blue-50 p-1 lg:p-2 rounded text-center"><p className="text-[6px] lg:text-xs text-gray-500 uppercase font-semibold">Term</p><p className="text-[8px] lg:text-sm font-bold text-blue-700">{bond.duration}</p></div>
                                        </div>
                                        <div className="mb-2 lg:mb-4 hidden lg:block">
                                            <div className="w-full bg-gray-200 rounded-full h-1 lg:h-2">
                                                <div className="bg-green-600 h-1 lg:h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <p className="text-[8px] lg:text-xs text-right text-gray-500 mt-1">{Math.round(progress)}% Funded</p>
                                        </div>
                                        <div className="mt-auto">
                                            <button onClick={() => handleAction(bond, 'bond')} className="w-full py-1 lg:py-2 bg-gray-900 text-white text-[8px] lg:text-base font-bold rounded-md lg:rounded-lg hover:bg-gray-800 transition-colors">Invest Now</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // PRODUCE GRID
                        filteredProducts.map(item => (
                            <div key={item.id} className="bg-white rounded-lg lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group h-full border border-gray-100">
                                <div className="aspect-square lg:aspect-[4/3] w-full overflow-hidden relative bg-gray-50">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-1 lg:top-4 left-1 lg:left-4 bg-green-600 text-white px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full text-[6px] lg:text-xs font-bold uppercase shadow-sm">{item.category}</div>
                                </div>
                                <div className="p-2 lg:p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1 lg:mb-2">
                                        <h3 className="text-[10px] lg:text-xl font-bold text-gray-900 leading-tight pr-1 lg:pr-2 line-clamp-1 truncate" title={item.title}>{item.title}</h3>
                                        <div className="hidden lg:flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{item.minOrder} Min</span>
                                            {item.orderType === 'bulk' && (
                                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Bulk Only</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[8px] lg:text-sm text-gray-500 mb-2 lg:mb-4 flex items-center gap-0.5 lg:gap-1">
                                        <svg className="w-2 h-2 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <span className="truncate">{item.location}</span>
                                    </p>

                                    <div className="mt-auto flex flex-col gap-1 lg:gap-3 pt-2 lg:pt-4 border-t border-gray-50">
                                        <div>
                                            <p className="text-[6px] lg:text-xs text-gray-400 font-medium mb-0">Price / {getUnit(item.price)}</p>
                                            <p className="text-[10px] lg:text-2xl font-bold text-gray-900 truncate" title={item.price}>{item.price}</p>
                                        </div>
                                        <button onClick={() => handleAction(item, 'produce')} className="w-full py-1.5 lg:py-2.5 bg-green-600 text-white text-[8px] lg:text-base font-bold rounded-md lg:rounded-lg hover:bg-green-700 transition-colors shadow-sm text-center">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}


            {/* SELECTION MODAL */}
            {selectionProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectionProduct(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectionProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        {orderStep === 'selection' ? (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">How would you like to buy?</h3>
                                <p className="text-gray-500 text-sm mb-6">Select your preferred order type for <b>{selectionProduct.title}</b>.</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setOrderStep('quantity')}
                                        disabled={selectionProduct.orderType === 'bulk'}
                                        className={`w-full py-3 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${selectionProduct.orderType === 'bulk' ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                        Buy Per {getUnit(selectionProduct.price)} (Retail)
                                    </button>
                                    
                                    {selectionProduct.orderType === 'bulk' && (
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter text-center -mt-1">
                                            This item is for Bulk Orders only ({selectionProduct.minOrder} min)
                                        </p>
                                    )}

                                    <button
                                        onClick={() => setOrderStep('bulk-quantity')}
                                        className="w-full py-3 bg-white border-2 border-green-600 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                        Place Bulk Inquiry
                                    </button>
                                </div>
                            </>
                        ) : orderStep === 'bulk-quantity' ? (
                            <>
                                <button onClick={() => setOrderStep('selection')} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    Back
                                </button>
                                <div className="mt-8 text-center text-sm">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Bulk Quantity</h3>
                                    <p className="text-sm text-gray-500 mb-6">Enter weight in {getUnit(selectionProduct.price)}</p>

                                    <div className="flex items-center justify-center gap-4 mb-8">
                                        <button
                                            onClick={() => setBulkQuantity(q => Math.max(parseInt(selectionProduct.minOrder?.replace(/[^\d]/g, '') || '10'), q - 10))}
                                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                        >
                                            -10
                                        </button>
                                        <input
                                            type="number"
                                            value={bulkQuantity}
                                            onChange={(e) => setBulkQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="w-24 text-center text-2xl font-bold text-gray-900 border-b-2 border-green-600 focus:outline-none bg-transparent"
                                        />
                                        <button
                                            onClick={() => setBulkQuantity(q => q + 10)}
                                            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 transition-colors"
                                        >
                                            +10
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        {[50, 100, 250, 500].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setBulkQuantity(val)}
                                                className={`py-2 rounded-lg border text-xs font-bold transition-all ${bulkQuantity === val ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}
                                            >
                                                {val} {getUnit(selectionProduct.price)}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => {
                                            const minQ = parseInt(selectionProduct.minOrder?.replace(/[^\d]/g, '') || '10');
                                            if (bulkQuantity < minQ) {
                                                toast.error(`Minimum bulk order for this item is ${minQ}${getUnit(selectionProduct.price)}`);
                                                return;
                                            }
                                            saveBulkInquiry(selectionProduct, bulkQuantity);
                                            setSelectionProduct(null);
                                        }}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                                    >
                                        Confirm Bulk Inquiry
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setOrderStep('selection')} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    Back
                                </button>
                                <div className="mt-8 text-center">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Select Quantity</h3>
                                    <p className="text-sm text-gray-500 mb-6">{selectionProduct.title}</p>

                                    <div className="flex items-center justify-center gap-6 mb-8">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                        </button>
                                        <div className="text-center w-20">
                                            <span className="text-3xl font-bold text-gray-900">{quantity}</span>
                                            <span className="text-sm text-gray-500 block">{getUnit(selectionProduct.price)}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const unit = getUnit(selectionProduct.price).toLowerCase();
                                                if (unit === 'kg' && quantity >= 5) {
                                                    toast.error("For orders over 5kg, please use the Bulk Order option");
                                                    return;
                                                }
                                                setQuantity(q => q + 1);
                                            }}
                                            className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Total Price</span>
                                        <span className="text-2xl font-bold text-green-700">
                                            ₹{(parseInt(selectionProduct.price.replace(/[^\d]/g, '')) * quantity).toLocaleString()}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const cartItem = {
                                                ...selectionProduct,
                                                quantity,
                                                cartId: Date.now()
                                            };
                                            const currentCart = JSON.parse(localStorage.getItem('user_cart') || '[]');
                                            localStorage.setItem('user_cart', JSON.stringify([...currentCart, cartItem]));
                                            toast.success(`Successfully added ${quantity} x ${selectionProduct.title} to your cart!`);
                                            setSelectionProduct(null);
                                        }}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* SELLER DETAILS MODAL (Restored for Bulk Order) */}
            {detailsProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailsProduct(null)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-green-600 p-6 text-center relative">
                            <button onClick={() => setDetailsProduct(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-green-400 overflow-hidden">
                                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mt-3">{detailsProduct.farmer}</h3>
                            <p className="text-green-100 text-sm flex items-center justify-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {detailsProduct.location}
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold mb-1">Selling Bulk</p>
                                <h4 className="text-2xl font-bold text-gray-900">{detailsProduct.title}</h4>
                                <p className="text-green-600 font-bold text-lg">{detailsProduct.price}</p>
                            </div>

                            <div className="space-y-3">
                                <a href={`tel:${detailsProduct.contact || '+919999999999'}`} className="block w-full py-4 bg-green-600 text-white font-bold rounded-xl text-center hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    Call Farmer Now
                                </a>
                                <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="block w-full py-4 bg-white border-2 border-green-100 text-green-700 font-bold rounded-xl text-center hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    Chat on WhatsApp
                                </button>
                            </div>
                            <div className="mt-6 text-center text-xs text-gray-400">
                                Verify product details before payment. <br />
                                GreenBond is not responsible for direct transactions.
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Marketplace;
