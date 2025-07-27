import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './useAuth.jsx';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState({ dispatchers: [], teamMembers: [] });
    const [loading, setLoading] = useState(false);
    const [dataStore, setDataStore] = useState({
        pumps: [],
        caps: [],
        glass: [],
        accessories: [],
    });


    useEffect(() => {
        const loadDataFromStorage = () => {
            const typeMapping = {
                pumps: 'pumpdata',
                caps: 'capdata',
                glass: 'bottledata',
                accessories: 'accessoriesData'
            };

            const cachedData = {};
            Object.entries(typeMapping).forEach(([key, storageKey]) => {
                const stored = localStorage.getItem(`${storageKey}`);
                if (stored) {
                    try {
                        cachedData[key] = JSON.parse(stored);
                        console.log(`📦 Loaded ${key} from localStorage:`, cachedData[key].length, 'items');
                    } catch (error) {
                        console.error(`❌ Error parsing ${key} from localStorage:`, error);
                        cachedData[key] = [];
                    }
                } else {
                    cachedData[key] = [];
                }
            });

            setDataStore(cachedData);
        };

        loadDataFromStorage();
    }, []);


    const fetchInitialData = async () => {
        const typeMapping = {
            pumps: 'pumpdata',
            caps: 'capdata',
            glass: 'bottledata',
            accessories: 'accessoriesData'
        };

        try {
            const fetchPromises = Object.entries(typeMapping).map(async ([key, endpoint]) => {
                // Skip if we already have data
                if (dataStore[key] && dataStore[key].length > 0) {
                    console.log(`⏭️ Skipping ${key} - already loaded (${dataStore[key].length} items)`);
                    return { key, data: dataStore[key] };
                }

                console.log(`🔄 Fetching ${key} from API...`);
                const response = await axios.get(`http://localhost:5000/api/${endpoint}`);
                const data = response.data;

                // Save to localStorage
                localStorage.setItem(`${endpoint}`, JSON.stringify(data));
                console.log(`✅ Fetched and saved ${key}:`, data.length, 'items');

                return { key, data };
            });

            const results = await Promise.all(fetchPromises);

            // Update dataStore with new data
            const newDataStore = { ...dataStore };
            results.forEach(({ key, data }) => {
                newDataStore[key] = data;
            });

            setDataStore(newDataStore);
            console.log('✅ All data synchronized');

        } catch (err) {
            console.error('❌ Failed to fetch initial data:', err);
        }
    };

    const updateItemInStore = (type, item, action) => {
        const typeMapping = {
            pumps: 'pumpdata',
            caps: 'capdata',
            glass: 'bottledata',
            accessories: 'accessoriesData'
        };

        const storageKey = typeMapping[type];
        if (!storageKey) {
            console.error(`❌ Unknown type: ${type}`);
            return;
        }

        setDataStore(prev => {
            const existing = prev[type] || [];
            let updated = [];

            if (action === 'create') {
                updated = existing.some(i => i._id === item._id) ? existing : [item, ...existing];
            } else if (action === 'update') {
                updated = existing.map(i => (i._id === item._id ? item : i));
            } else if (action === 'delete') {
                updated = existing.filter(i => i._id !== item._id);
            }

            localStorage.setItem(`${storageKey}`, JSON.stringify(updated));
            console.log(`🔄 Updated ${type} in store and localStorage`);
            return { ...prev, [type]: updated };
        });
    };

    const createItem = useCallback(async (type, data) => {
        if (!socket || !socket.connected) {
            throw new Error('Socket not connected');
        }

        const typeMapping = {
            pumps: 'pumpdata',
            caps: 'capdata',
            glass: 'bottledata',
            accessories: 'accessoriesData'
        };

        const endpoint = typeMapping[type];
        if (!endpoint) {
            throw new Error(`Unknown type: ${type}`);
        }

        try {
            setLoading(true);
            const response = await axios.post(`http://localhost:5000/api/${endpoint}`, data);
            const newItem = response.data;
            updateItemInStore(type, newItem, 'create');
            socket.emit('item-created', { type, item: newItem });
            console.log(`✅ Created ${type}:`, newItem.name || newItem._id);
            return newItem;
        } catch (error) {
            console.error(`❌ Error creating ${type}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [socket]);

    const updateItem = useCallback(async (type, id, data) => {
        if (!socket || !socket.connected) {
            throw new Error('Socket not connected');
        }

        const typeMapping = {
            pumps: 'pumpdata',
            caps: 'capdata',
            glass: 'bottledata',
            accessories: 'accessoriesData'
        };

        const endpoint = typeMapping[type];
        if (!endpoint) {
            throw new Error(`Unknown type: ${type}`);
        }

        try {
            setLoading(true);
            const response = await axios.put(`http://localhost:5000/api/${endpoint}/${id}`, data);
            const updatedItem = response.data;

            // Update local store immediately
            updateItemInStore(type, updatedItem, 'update');

            // Emit socket event
            socket.emit('item-updated', { type, item: updatedItem });

            console.log(`✅ Updated ${type}:`, updatedItem.name || updatedItem._id);
            return updatedItem;
        } catch (error) {
            console.error(`❌ Error updating ${type}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [socket]);

    const deleteItem = useCallback(async (type, id) => {
        if (!socket || !socket.connected) {
            throw new Error('Socket not connected');
        }

        const typeMapping = {
            pumps: 'pumpdata',
            caps: 'capdata',
            glass: 'bottledata',
            accessories: 'accessoriesData'
        };

        const endpoint = typeMapping[type];
        if (!endpoint) {
            throw new Error(`Unknown type: ${type}`);
        }

        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/${endpoint}/${id}`);

            // Update local store immediately
            updateItemInStore(type, { _id: id }, 'delete');

            // Emit socket event
            socket.emit('item-deleted', { type, item: { _id: id } });

            console.log(`✅ Deleted ${type}:`, id);
            return true;
        } catch (error) {
            console.error(`❌ Error deleting ${type}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [socket]);

    const loadItems = useCallback(async (type) => {
        try {
            // Check if we already have data in store
            if (dataStore[type] && dataStore[type].length > 0) {
                console.log(`📦 Using cached ${type} data (${dataStore[type].length} items)`);
                return dataStore[type];
            }

            setLoading(true);

            const typeMapping = {
                pumps: 'pumpdata',
                caps: 'capdata',
                glass: 'bottledata',
                accessories: 'accessoriesData'
            };

            const endpoint = typeMapping[type];
            if (!endpoint) {
                throw new Error(`Unknown type: ${type}`);
            }

            // Fetch from API
            console.log(`🔄 Loading ${type} from API...`);
            const response = await axios.get(`http://localhost:5000/api/${endpoint}`);
            const items = response.data;

            // Update store and localStorage
            setDataStore(prev => ({ ...prev, [type]: items }));
            localStorage.setItem(`${endpoint}`, JSON.stringify(items));

            console.log(`✅ Loaded ${type} from API (${items.length} items)`);
            return items;
        } catch (error) {
            console.error(`❌ Error loading ${type}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [dataStore]);

    const getItemsByType = useCallback((type) => {
        return dataStore[type] || [];
    }, [dataStore]);

    const clearCache = useCallback(() => {
        const typeMapping = {
            pumps: 'pumpdata',
            caps: 'capdata',
            glass: 'bottledata',
            accessories: 'accessoriesData'
        };

        Object.values(typeMapping).forEach(key => {
            localStorage.removeItem(`${key}`);
        });

        setDataStore({
            pumps: [],
            caps: [],
            glass: [],
            accessories: [],
        });

        console.log('🧹 Cache cleared');
    }, []);

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
            // Only fetch data that's not already cached
            fetchInitialData();
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


        socketInstance.on('order-deleted', (deleteData) => {
            console.log('order deleted yayyya')
        });


        socketInstance.on('team-progress-updated', (progressData) => {
            // console.log('📈 Progress update received in SocketProvider:', progressData);
            window.dispatchEvent(new CustomEvent('socket-team-progress-updated', { detail: progressData }));
        });

        socketInstance.on('decoration-order-ready', (decorationData) => {
            console.log('🎨 Decoration order ready received:', decorationData);
            window.dispatchEvent(new CustomEvent('socket-decoration-order-ready', { detail: decorationData }));
        });


        socketInstance.on('item-data-updated', ({ type, item, action }) => {
            console.log(`📦 [${type}] - ${action.toUpperCase()}:`, item.name || item._id);
            updateItemInStore(type, item, action);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    const registerUser = useCallback((socketInstance) => {
        if (!user || !socketInstance) return;

        const registrationData = {
            userId: user.id || socketInstance.id,
            role: user.role,
            team: user.team?.toLowerCase().trim(),
        };

        console.log('🔄 Registering user:', registrationData);
        socketInstance.emit('register', registrationData);
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
                            console.log(`✅ Added team: ${team}`);
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

    const notifyProgressUpdate = useCallback((progressData) => {
        if (!socket || !socket.connected || !progressData) {
            console.warn('⚠️ Cannot send progress notification - socket not connected or no data');
            return false;
        }

        try {
            console.log('📤 Preparing to send progress update:', {
                orderNumber: progressData.orderNumber,
                team: progressData.team,
                targetGlassItem: progressData.targetGlassItem,
                hasCompletedWork: progressData.hasCompletedWork,
                updatesCount: progressData.updates?.length || 0
            });

            const notificationData = {
                orderNumber: progressData.orderNumber,
                itemName: progressData.itemName,
                team: progressData.team,
                targetGlassItem: progressData.targetGlassItem,
                hasCompletedWork: progressData.hasCompletedWork,
                updates: progressData.updates,
                updatedOrder: progressData.updatedOrder,
                timestamp: new Date().toISOString(),
                customerName: progressData.customerName,
                dispatcherName: progressData.dispatcherName,
                updateSource: progressData.updateSource
            };

            socket.emit('team-progress-updated', notificationData);
            console.log('✅ Progress update notification sent successfully');
            return true;
        } catch (error) {
            console.error('❌ Error sending progress notification:', error);
            return false;
        }
    }, [socket]);

    const notifyOrderDelete = useCallback((deleteData) => {
        if (!socket || !socket.connected || !deleteData) {
            console.warn('Cannot send delete notification - socket not connected or no data');
            return false;
        }

        try {
            const {
                orderId,
                orderNumber,
                customerName,
                dispatcherName,
                assignedTeams = []
            } = deleteData;

            const notificationData = {
                orderId,
                orderNumber,
                customerName,
                dispatcherName,
                assignedTeams,
                timestamp: new Date().toISOString()
            };

            socket.emit('order-deleted', notificationData);
            console.log('📤 Order delete notification sent:', {
                orderId,
                orderNumber,
                teams: assignedTeams
            });
            return true;
        } catch (error) {
            console.error('Error sending delete notification:', error);
            return false;
        }
    }, [socket]);

    const contextValue = {
        socket,
        isConnected,
        connectedUsers,
        loading,
        dataStore,
        // CRUD methods
        createItem,
        updateItem,
        deleteItem,
        loadItems,
        getItemsByType,
        clearCache,

        notifyTeam,
        notifyOrderEdit,
        notifyProgressUpdate,
        notifyOrderDelete,

        
    };

    return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};