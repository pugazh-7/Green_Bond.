import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, authStatus } = useAuth();
    const joinedRoomRef = useRef(null);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL || undefined;
        const newSocket = io(socketUrl, {
            autoConnect: true,
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            if (user && (user._id || user.id)) {
                const room = (user._id || user.id).toString();
                newSocket.emit('join', room);
                joinedRoomRef.current = room;
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Handle user authentication change or logout (Rule 20)
    useEffect(() => {
        if (!socket) return;

        if (authStatus === 'AUTHENTICATED' && user && (user._id || user.id)) {
            const room = (user._id || user.id).toString();
            if (joinedRoomRef.current !== room) {
                if (joinedRoomRef.current) {
                    socket.emit('leave', joinedRoomRef.current);
                }
                socket.emit('join', room);
                joinedRoomRef.current = room;
            }
        } else if (authStatus === 'UNAUTHENTICATED' || !user) {
            // Disconnect authenticated session room on logout
            if (joinedRoomRef.current) {
                socket.emit('leave', joinedRoomRef.current);
                joinedRoomRef.current = null;
            }
        }
    }, [user, authStatus, socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};


