import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

let DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const UserDashboard = () => {
    const [latestOrder, setLatestOrder] = React.useState(null);

    useEffect(() => {
        const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        if (savedOrders.length > 0) {
            setLatestOrder(savedOrders[0]);
        }
    }, []);

    const [trackingLoc, setTrackingLoc] = React.useState(null);

    React.useEffect(() => {
        if (!latestOrder) return;

        const updateLocation = () => {
            const trackingData = JSON.parse(localStorage.getItem(`tracking_${latestOrder.id}`) || 'null');
            if (trackingData) {
                setTrackingLoc({ lat: trackingData.lat, lng: trackingData.lng });
            }
        };

        updateLocation();
        const interval = setInterval(updateLocation, 3000);
        return () => clearInterval(interval);
    }, [latestOrder]);

    const handleCancelOrder = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[250px]">
                <p className="font-semibold text-gray-900">Cancel this order?</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        No, keep it
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmCancelOrder();
                        }}
                        className="px-3 py-1.5 text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        Yes, cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                borderRadius: '16px',
                padding: '16px',
                background: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #f3f4f6'
            },
        });
    };

    const confirmCancelOrder = () => {
        const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        const updatedOrders = savedOrders.map(order =>
            order.id === latestOrder.id ? { ...order, status: 'Cancelled' } : order
        );

        localStorage.setItem('green_bond_orders', JSON.stringify(updatedOrders));
        setLatestOrder({ ...latestOrder, status: 'Cancelled' });
        toast.success("Order cancelled successfully.");
    };

    const orderId = latestOrder ? latestOrder.id : null;
    const orderDate = latestOrder ? `${latestOrder.date} ${latestOrder.time}` : null;
    const items = latestOrder?.items || [];

    if (!latestOrder) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto text-center py-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Orders</h2>
                    <p className="text-gray-500 mb-8">You haven't placed any orders yet. Visit the marketplace to get fresh produce.</p>
                    <a href="/user/marketplace" className="inline-block px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                        Go to Marketplace
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
                <p className="text-gray-500 mt-1">Order {orderId} • Placed on {orderDate}</p>
            </header>

            {/* Main Tracking Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Map Section */}
                <div className="h-80 w-full relative z-0">
                    <MapContainer
                        center={[13.0827, 80.2707]}
                        zoom={13}
                        scrollWheelZoom={false}
                        style={{ height: "100%", width: "100%" }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[trackingLoc?.lat || 13.0827, trackingLoc?.lng || 80.2707]}>
                            <Popup>
                                <div className="font-bold text-green-700">Vehicle Location</div>
                                Near Anna Nagar, Chennai
                            </Popup>
                        </Marker>
                    </MapContainer>
                    <div className="absolute top-4 right-4 z-[400]">
                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-green-800">Live Tracking</span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* ETA Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Estimated Delivery</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-1">Today, 5:30 PM</h2>
                            <p className="text-green-600 font-medium mt-1">On Time</p>
                        </div>
                        <div className="flex -space-x-4">
                            {items.map((item, i) => (
                                <img key={i} className="w-12 h-12 rounded-full border-4 border-white shadow-sm object-cover" src={item.image} alt={item.title} title={item.title} />
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                        <div className="space-y-8 relative">
                            {/* Step 1: Order Placed */}
                            <div className="flex gap-6 relative">
                                <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${['Placed', 'Pending', 'Accepted', 'Shipped', 'Delivered'].includes(latestOrder?.status)
                                    ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                    <svg className={`w-4 h-4 ${['Placed', 'Pending', 'Accepted', 'Shipped', 'Delivered'].includes(latestOrder?.status) ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Order Placed</h4>
                                    <p className="text-sm text-gray-500">{orderDate}</p>
                                </div>
                            </div>

                            {/* Step 2: Packed by Farmer (Accepted) */}
                            <div className="flex gap-6 relative">
                                {['Accepted'].includes(latestOrder?.status) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-xl ring-4 ring-blue-50">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : ['Shipped', 'Delivered'].includes(latestOrder?.status) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : (
                                    <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-bold ${['Accepted'].includes(latestOrder?.status) ? 'text-blue-600' : ['Shipped', 'Delivered'].includes(latestOrder?.status) ? 'text-gray-900' : 'text-gray-400'}`}>
                                        Packed by Farmer
                                    </h4>
                                    <p className={`text-sm ${['Accepted'].includes(latestOrder?.status) ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                                        {latestOrder?.status === 'Accepted' ? 'Order is being packed' : ['Shipped', 'Delivered'].includes(latestOrder?.status) ? 'Completed' : 'Pending'}
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Out for Delivery */}
                            <div className="flex gap-6 relative">
                                {['Shipped'].includes(latestOrder?.status) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-xl ring-4 ring-blue-50">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </div>
                                ) : ['Delivered'].includes(latestOrder?.status) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : (
                                    <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-bold ${['Shipped'].includes(latestOrder?.status) ? 'text-blue-600' : ['Delivered'].includes(latestOrder?.status) ? 'text-gray-900' : 'text-gray-400'}`}>
                                        Out for Delivery
                                    </h4>
                                    <p className={`text-sm ${['Shipped'].includes(latestOrder?.status) ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                                        {latestOrder?.status === 'Shipped' ? 'Arriving Soon' : ['Delivered'].includes(latestOrder?.status) ? 'Completed' : 'Estimated'}
                                    </p>
                                </div>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="flex gap-6 relative">
                                {['Delivered'].includes(latestOrder?.status) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center border-4 border-green-100 shadow-xl ring-4 ring-green-50">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : (
                                    <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-bold ${['Delivered'].includes(latestOrder?.status) ? 'text-green-600' : 'text-gray-400'}`}>Delivered</h4>
                                    <p className="text-sm text-gray-500">Expected by 5:30 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                    <button className="text-gray-600 font-semibold hover:text-gray-900 text-sm">Need Help?</button>
                    <div className="flex gap-4">
                        {['Placed', 'Pending'].includes(latestOrder?.status) && (
                            <button
                                onClick={handleCancelOrder}
                                className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                            >
                                Cancel Order
                            </button>
                        )}
                        <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                            Call Delivery Partner
                        </button>
                    </div>
                </div>
            </div>

            {/* Previous Orders History */}
            {JSON.parse(localStorage.getItem('green_bond_orders') || '[]').length > 1 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Orders</h2>
                    <div className="space-y-4">
                        {JSON.parse(localStorage.getItem('green_bond_orders') || '[]').slice(1).map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-900">Order #{order.id}</p>
                                    <p className="text-sm text-gray-500">{order.date} • {order.items.length} Items</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full mb-1 ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Cancelled' ? 'bg-gray-200 text-gray-500' :
                                            'bg-blue-50 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                    <p className="text-sm font-semibold text-gray-900">{order.total}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
