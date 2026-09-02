import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TaxInvoice from '../../../components/shared/TaxInvoice';

const InvoiceView = () => {
    const { id } = useParams();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${id}/invoice`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    throw new Error('Failed to load invoice');
                }
                const data = await res.json();
                setInvoiceData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInvoice();
        }
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading Invoice...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <TaxInvoice invoiceData={invoiceData} />
        </div>
    );
};

export default InvoiceView;
