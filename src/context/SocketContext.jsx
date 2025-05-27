import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState({ dispatchers: [], teamMembers: [] });

    useEffect(() => {
        if (!user || !user.role) return;

        const socketInstance = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            query: {
                userId: user.id || 'anonymous',
                role: user.role,
                team: user.team || 'unknown',
            }
        });

        socketInstance.on('connect', () => {
            console.log('🔌 Socket connected');
            setIsConnected(true);
            registerUser(socketInstance);
        });

        socketInstance.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        socketInstance.on('connected-users', setConnectedUsers);
        
        socketInstance.on('new-order', (orderData) => {
            console.log('📦 New order received:', orderData);
        });

        socketInstance.on('order-updated', (updateData) => {
            console.log('✏️ Order updated received:', updateData);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    const registerUser = useCallback((socketInstance) => {
        if (!user || !socketInstance) return;

        socketInstance.emit('register', {
            userId: user.id || socketInstance.id,
            role: user.role,
            team: user.team?.toLowerCase().trim(),
        });
    }, [user]);


    const notifyTeam = useCallback((orderData) => {
        if (!socket || !socket.connected || !orderData) {
            console.warn('Cannot send notification - socket not connected or no data');
            return false;
        }

        try {
            const assignedTeams = [];
            
            orderData.item_ids?.forEach(item => {
                if (item.team_assignments) {
                    Object.keys(item.team_assignments).forEach(team => {
                        if (item.team_assignments[team].length > 0 && !assignedTeams.includes(team)) {
                            assignedTeams.push(team);
                        }
                    });
                }
            });

            const notificationData = {
                order: orderData,
                assignedTeams,
                timestamp: new Date().toISOString(),
                orderNumber: orderData.order_number,
                customerName: orderData.customer_name,
                dispatcherName: orderData.dispatcher_name
            };

            socket.emit('new-order-created', notificationData);
            console.log('📤 Order notification sent to teams:', assignedTeams);
            return true;
        } catch (error) {
            console.error('Error sending order notification:', error);
            return false;
        }
    }, [socket]);


    const notifyOrderEdit = useCallback((editData) => {
        if (!socket || !socket.connected || !editData) {
            console.warn('Cannot send edit notification - socket not connected or no data');
            return false;
        }

        try {
            const { 
                updatedOrder, 
                previousOrder, 
                editedFields = [] 
            } = editData;

            const currentAssignedTeams = [];
            updatedOrder.item_ids?.forEach(item => {
                if (item.team_assignments) {
                    Object.keys(item.team_assignments).forEach(team => {
                        if (item.team_assignments[team].length > 0 && !currentAssignedTeams.includes(team)) {
                            currentAssignedTeams.push(team);
                        }
                    });
                }
            });

            const previousAssignedTeams = [];
            if (previousOrder) {
                previousOrder.item_ids?.forEach(item => {
                    if (item.team_assignments) {
                        Object.keys(item.team_assignments).forEach(team => {
                            if (item.team_assignments[team].length > 0 && !previousAssignedTeams.includes(team)) {
                                previousAssignedTeams.push(team);
                            }
                        });
                    }
                });
            }

            const notificationData = {
                order: updatedOrder,
                assignedTeams: currentAssignedTeams,
                previousAssignedTeams,
                timestamp: new Date().toISOString(),
                orderNumber: updatedOrder.order_number,
                customerName: updatedOrder.customer_name,
                dispatcherName: updatedOrder.dispatcher_name,
                editedFields
            };

            socket.emit('order-edited', notificationData);
            console.log('📤 Order edit notification sent to teams:', {
                current: currentAssignedTeams,
                previous: previousAssignedTeams,
                edited: editedFields
            });
            return true;
        } catch (error) {
            console.error('Error sending order edit notification:', error);
            return false;
        }
    }, [socket]);

    const contextValue = {
        socket,
        isConnected,
        connectedUsers,
        notifyTeam,
        notifyOrderEdit, 
    };

    return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};