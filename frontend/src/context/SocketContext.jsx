import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const currentUserStr = localStorage.getItem('green_bond_current_user');
        
        let idToJoin = null;
        if (currentUserStr && currentUserStr !== 'undefined') {
            try {
                const user = JSON.parse(currentUserStr);
                idToJoin = user._id || user.id;
            } catch(e) {}
        } else {
            // Fallbacks for legacy if needed
            try {
                const userStr = localStorage.getItem('user');
                const farmerStr = localStorage.getItem('farmer');
                const deliveryStr = localStorage.getItem('deliveryPartner');
                if (userStr && userStr !== 'undefined') idToJoin = JSON.parse(userStr).id;
                else if (farmerStr && farmerStr !== 'undefined') idToJoin = JSON.parse(farmerStr)._id || JSON.parse(farmerStr).id;
                else if (deliveryStr && deliveryStr !== 'undefined') idToJoin = JSON.parse(deliveryStr)._id || JSON.parse(deliveryStr).id;
            } catch(e) {}
        }

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        
        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            if (idToJoin) {
                newSocket.emit('join', idToJoin.toString());
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
