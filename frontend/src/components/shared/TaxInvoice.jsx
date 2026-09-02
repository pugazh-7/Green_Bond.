import React from 'react';

const TaxInvoice = ({ invoiceData }) => {
    if (!invoiceData || !invoiceData.order || !invoiceData.config) {
        return <div className="p-4 text-center text-gray-500">Loading invoice data...</div>;
    }

    const { order, config, invoiceNumber } = invoiceData;

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm border border-gray-200 text-sm font-sans">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-green-700 font-heading mb-1">GreenBond</h1>
                    <p className="font-bold text-gray-800">{config.legalName}</p>
                    <p className="text-gray-600 max-w-xs mt-1">{config.registeredAddress}</p>
                    <p className="text-gray-600 mt-1"><span className="font-semibold">GSTIN:</span> {config.gstin}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-2">Tax Invoice</h2>
                    <p className="text-gray-600"><span className="font-semibold">Invoice #:</span> {invoiceNumber}</p>
                    <p className="text-gray-600 mt-1"><span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    <p className="text-gray-600 mt-1"><span className="font-semibold">Order ID:</span> {order.id}</p>
                </div>
            </div>

            {/* Billing & Shipping Details */}
            <div className="grid grid-cols-2 gap-8 mb-8 border-b border-gray-200 pb-6">
                <div>
                    <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wider text-xs">Billed To</h3>
                    <p className="font-bold text-gray-800">{order.customerName}</p>
                    <p className="text-gray-600 mt-1">{order.customerEmail}</p>
                    <p className="text-gray-600 mt-1">{order.deliveryAddress}</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wider text-xs">Payment & Shipping</h3>
                    <p className="text-gray-600"><span className="font-semibold">Method:</span> {order.paymentMethod}</p>
                    <p className="text-gray-600 mt-1"><span className="font-semibold">Status:</span> {order.paymentStatus}</p>
                    <p className="text-gray-600 mt-1"><span className="font-semibold">Delivery Type:</span> {order.sourceType}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-200 text-xs uppercase tracking-wider text-gray-600">
                            <th className="py-3 px-4 font-bold">Item Description</th>
                            <th className="py-3 px-4 font-bold text-center">HSN/SAC</th>
                            <th className="py-3 px-4 font-bold text-right">Qty</th>
                            <th className="py-3 px-4 font-bold text-right">Unit Price</th>
                            <th className="py-3 px-4 font-bold text-right">Taxable</th>
                            <th className="py-3 px-4 font-bold text-center">GST %</th>
                            <th className="py-3 px-4 font-bold text-right">GST Amt</th>
                            <th className="py-3 px-4 font-bold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item, index) => {
                            // Find GST breakdown for this item
                            const gstInfo = order.gstBreakdown?.find(g => g.productId === item.productId?._id) || {
                                rate: 0, taxableValue: item.price * item.quantity, totalGst: 0
                            };
                            
                            const hsnSac = item.productId?.hsnSac || '-';
                            const taxable = gstInfo.taxableValue || (item.price * item.quantity);
                            const itemTotal = taxable + (gstInfo.totalGst || 0);

                            return (
                                <tr key={index} className="text-gray-800">
                                    <td className="py-4 px-4 font-medium">
                                        {item.title}
                                        {item.farmer && <div className="text-xs text-gray-500 font-normal mt-0.5">Sold by: {item.farmer}</div>}
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-600">{hsnSac}</td>
                                    <td className="py-4 px-4 text-right">{item.quantity}</td>
                                    <td className="py-4 px-4 text-right">₹{item.price}</td>
                                    <td className="py-4 px-4 text-right">₹{taxable.toFixed(2)}</td>
                                    <td className="py-4 px-4 text-center">{gstInfo.rate}%</td>
                                    <td className="py-4 px-4 text-right">₹{(gstInfo.totalGst || 0).toFixed(2)}</td>
                                    <td className="py-4 px-4 text-right font-semibold">₹{itemTotal.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
                <div className="w-80">
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                        <span>Total Taxable Value</span>
                        <span className="font-semibold text-gray-800">₹{(order.taxableAmount || 0).toFixed(2)}</span>
                    </div>
                    
                    {/* GST Breakdown Summary */}
                    {order.gstBreakdown && order.gstBreakdown.length > 0 && (
                        <div className="py-2 border-b border-gray-100 bg-gray-50 px-3 rounded-lg my-2">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Tax Breakdown</p>
                            {order.gstBreakdown.map((tax, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>GST @ {tax.rate}% (CGST {tax.cgst} + SGST {tax.sgst})</span>
                                    <span>₹{tax.totalGst.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                        <span>Total GST</span>
                        <span className="font-semibold text-gray-800">₹{(order.gstAmount || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-gray-800">₹{(order.deliveryFee || 0).toFixed(2)}</span>
                    </div>
                    
                    {order.discount > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-100 text-green-600">
                            <span>Discount</span>
                            <span className="font-semibold">-₹{(order.discount || 0).toFixed(2)}</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between py-4 text-xl font-bold text-gray-900 border-t-2 border-gray-800 mt-2">
                        <span>Grand Total</span>
                        <span>₹{(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-12 pt-6 border-t border-gray-200">
                <p className="font-bold text-gray-600 mb-1">Thank you for your business!</p>
                <p>This is a computer generated invoice and does not require a physical signature.</p>
                <p className="mt-1">Whether you act as a direct seller or marketplace facilitator, all respective taxes are remitted as per Indian GST regulations.</p>
            </div>
            
            {/* Print Button (Hidden when printing) */}
            <div className="mt-8 text-center print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
                >
                    Print Invoice
                </button>
            </div>
        </div>
    );
};

export default TaxInvoice;
