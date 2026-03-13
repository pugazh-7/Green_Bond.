import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

let DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationTracking = () => {
    // Mock data for farmer view
    const activeDelivery = {
        id: "ORD-9876",
        customer: "Ramesh Hotel",
        vehicle: "Tata Ace (TN-59-AB-1234)",
        driver: "Muthu Kumar",
        status: "Out for Delivery",
        eta: "Today, 5:30 PM"
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Live Delivery Tracking</h1>
                <p className="text-gray-500 mt-1">Vehicle {activeDelivery.vehicle} • Driver {activeDelivery.driver}</p>
            </header>

            {/* Main Tracking Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Google Maps Live View */}
<div className="h-80 w-full relative overflow-hidden rounded-t-3xl">
  <iframe
    title="Delivery Location"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    allowFullScreen
    referrerPolicy="no-referrer-when-downgrade"
    src={`https://www.google.com/maps?q=13.0827,80.2707&z=15&output=embed`}
  ></iframe>

  <div className="absolute top-4 right-4 z-10 bg-white/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    <span className="text-xs font-bold text-green-800">
      Delivery Partner Live
    </span>
  </div>
</div>


                <div className="p-8">
                    {/* ETA Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Estimated Arrival</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-1">{activeDelivery.eta}</h2>
                            <p className="text-green-600 font-medium mt-1">On Time</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                        <div className="space-y-8 relative">
                            {/* Step 1 */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Order Dispatched</h4>
                                    <p className="text-sm text-gray-500">10:00 AM</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">In Transit</h4>
                                    <p className="text-sm text-gray-500">Crossed Trichy Toll</p>
                                </div>
                            </div>
                            {/* Step 3 (Active) */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-xl ring-4 ring-blue-50">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-600">Reaching Destination</h4>
                                    <p className="text-sm text-gray-600">Technopark, Madurai</p>
                                    <p className="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block font-medium">Reaching in 15 mins</p>
                                </div>
                            </div>
                            {/* Step 4 */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-400">Delivered</h4>
                                    <p className="text-sm text-gray-300">Expected by 5:30 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                    <button className="text-gray-600 font-semibold hover:text-gray-900 text-sm">Download Manifest</button>
                    <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                        Call Driver
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationTracking;
