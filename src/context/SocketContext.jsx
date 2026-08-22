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
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            idToJoin = user._id || user.id;
        } else {
            // Fallbacks for legacy if needed
            const userStr = localStorage.getItem('user');
            const farmerStr = localStorage.getItem('farmer');
            const deliveryStr = localStorage.getItem('deliveryPartner');
            if (userStr) idToJoin = JSON.parse(userStr).id;
            else if (farmerStr) idToJoin = JSON.parse(farmerStr)._id || JSON.parse(farmerStr).id;
            else if (deliveryStr) idToJoin = JSON.parse(deliveryStr)._id || JSON.parse(deliveryStr).id;
        }

        const newSocket = io(import.meta.env.VITE_API_URL || '');
        
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
