import { Search, Pencil, Package } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit } from "react-icons/fi";
import { toast } from 'react-hot-toast';

import {
    TEAMS,
    deleteOrderFromLocalStorage,
    getOrdersFromLocalStorage as getTeamOrdersFromLocalStorage,
    hasOrdersInLocalStorage as hasTeamOrdersInLocalStorage,
    saveOrdersToLocalStorage as saveTeamOrdersToLocalStorage,
    updateOrderInLocalStorage
} from '../utils/localStorageUtils.jsx';
import UpdateFoilQty from '../updateQuanityComponents/updateFoilQty.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { mergeItemAssignmentsSafe } from '../utils/mergeItemsSafe.jsx';

const DecoFoilOrders = ({ orderType }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const { socket, isConnected } = useSocket();

    const getRemainingQty = (assignment) => {
        const completed = assignment.team_tracking?.total_completed_qty || 0;
        const total = assignment.quantity || 0;
        return Math.max(total - completed, 0);
    };

    const getAssignmentStatus = (assignment) => {
        const remaining = getRemainingQty(assignment);
        if (remaining === 0) return 'Completed';
        const completed = assignment.team_tracking?.total_completed_qty || 0;
        return completed > 0 ? 'In Progress' : 'Pending';
    };

    const isItemCompleted = (item) => {
        const foilingAssignments = item.team_assignments?.foiling || [];
        if (foilingAssignments.length === 0) return false;
        return foilingAssignments.every(assignment => getRemainingQty(assignment) === 0);
    };

    const isOrderCompleted = (order) => {
        const items = order.item_ids || [];
        if (items.length === 0) return false;
        return items.every(item => isItemCompleted(item));
    };

    const updateOrderStatus = (updatedOrder) => {
        const isCompleted = isOrderCompleted(updatedOrder);
        const newStatus = isCompleted ? 'Completed' : 'Pending';

        if (updatedOrder.order_status !== newStatus) {
            updatedOrder.order_status = newStatus;
        }

        updateOrderInLocalStorage(updatedOrder._id, updatedOrder, TEAMS.FOILING);

        return updatedOrder;
    };

    const hasfoilingAssignments = (order) => {
        return order.item_ids?.some(item =>
            item.team_assignments?.foiling && item.team_assignments.foiling.length > 0
        );
    };

    const mergeItemAssignments = (existingItem, newItem, targetGlassItem = null) => {
        const result = mergeItemAssignmentsSafe(existingItem, newItem, 'foiling', targetGlassItem);
        return result;
    };

    const updateBothCaches = (orderData, targetGlassItem = null) => {
        const orderStatus = isOrderCompleted(orderData) ? 'completed' : 'pending';

        let existingOrder = null;
        let existingOrderType = null;

        ['pending', 'completed'].forEach(type => {
            if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                const cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                const found = cachedOrders.find(order => order._id === orderData._id);
                if (found) {
                    existingOrder = found;
                    existingOrderType = type;
                }
            }
        });

        ['pending', 'completed'].forEach(type => {
            if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                let cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                cachedOrders = cachedOrders.filter(order => order._id !== orderData._id);
                if (orderStatus === type) {
                    if (existingOrder) {
                        // Merge with existing order
                        const mergedOrder = mergeOrders(existingOrder, orderData, targetGlassItem);
                        cachedOrders = [mergedOrder, ...cachedOrders];
                        console.log('✅ Merged order into', type, 'cache');
                    } else {
                        cachedOrders = [orderData, ...cachedOrders];
                        console.log('✅ Added new order to', type, 'cache');
                    }
                }

                saveTeamOrdersToLocalStorage(cachedOrders, type, TEAMS.FOILING);
            } else {

                if (orderStatus === type) {
                    saveTeamOrdersToLocalStorage([orderData], type, TEAMS.FOILING);
                    console.log('✅ Created new', type, 'cache with order');
                }
            }
        });
    };

    const handleNewOrder = useCallback((orderData) => {
        if (!orderData.orderData) return;
        const newOrder = orderData.orderData;
        const targetGlassItem = orderData.targetGlassItem;

        console.log('🔍 New order received:', {
            orderNumber: newOrder.order_number,
            targetGlassItem,
            hasTargetGlass: !!targetGlassItem,
            currentTab: orderType
        });

        if (!hasfoilingAssignments(newOrder)) {
            console.log('❌ Order has no foiling assignments, ignoring');
            return;
        }

        // Update both caches first - this is crucial
        updateBothCaches(newOrder, targetGlassItem);

        const orderStatus = isOrderCompleted(newOrder) ? 'completed' : 'pending';
        const currentViewType = orderType.toLowerCase();

        console.log('📊 Order status check:', {
            orderStatus,
            currentViewType,
            shouldShowInCurrentTab: orderStatus === currentViewType
        });

        // SINGLE setOrders call that handles all cases
        setOrders(prevOrders => {
            // First, always remove any existing instance of this order
            const filteredOrders = prevOrders.filter(order => order._id !== newOrder._id);

            // Only add the order if it belongs to the current view
            if (orderStatus === currentViewType) {
                const existingOrderIndex = prevOrders.findIndex(order => order._id === newOrder._id);

                if (existingOrderIndex >= 0) {
                    // Merge with existing order
                    const existingOrder = prevOrders[existingOrderIndex];
                    const mergedOrder = mergeOrders(existingOrder, newOrder, targetGlassItem);
                    console.log('✅ Merged order in current view:', newOrder.order_number);
                    return [mergedOrder, ...filteredOrders];
                } else {
                    // Add new order
                    console.log('✅ Added order to current view:', newOrder.order_number);
                    return [newOrder, ...filteredOrders];
                }
            } else {
                // Order doesn't belong to current view, just return filtered list
                console.log('⚠️ Order belongs to different tab, removed from current view');
                return filteredOrders;
            }
        });
    }, [orderType, hasfoilingAssignments, isOrderCompleted]);


    const handleOrderUpdate = useCallback((updateData) => {
        if (!updateData.orderData) return;
        const updatedOrder = updateData.orderData;
        const targetGlassItem = updateData.targetGlassItem;

        if (updateData.wasRemoved || !hasfoilingAssignments(updatedOrder)) {
            console.log('🗑️ Removing order from printing:', updatedOrder.order_number);

            ['pending', 'completed'].forEach(type => {
                if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                    let cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                    cachedOrders = cachedOrders.filter(order => order._id !== updatedOrder._id);
                    saveTeamOrdersToLocalStorage(cachedOrders, type, TEAMS.FOILING);
                }
            });

            setOrders(prevOrders => {
                return prevOrders.filter(order => order._id !== updatedOrder._id);
            });
            return;
        }

        updateBothCaches(updatedOrder, targetGlassItem);

        const orderStatus = isOrderCompleted(updatedOrder) ? 'completed' : 'pending';
        const currentViewType = orderType.toLowerCase();

        if (orderStatus !== currentViewType) {
            console.log('⚠️ Order moved to different tab, removing from current view');
            setOrders(prevOrders => {
                return prevOrders.filter(order => order._id !== updatedOrder._id);
            });
            return;
        }

        setOrders(prevOrders => {
            const existingOrderIndex = prevOrders.findIndex(order => order._id !== updatedOrder._id);
            let updatedOrders;

            if (existingOrderIndex >= 0) {
                const existingOrder = prevOrders[existingOrderIndex];
                const mergedOrder = mergeOrders(existingOrder, updatedOrder, targetGlassItem);
                updatedOrders = [...prevOrders];
                updatedOrders[existingOrderIndex] = mergedOrder;
                console.log('✅ Updated order in current view:', updatedOrder.order_number);
            } else {
                updatedOrders = [updatedOrder, ...prevOrders];
                console.log('✅ Added order to current view:', updatedOrder.order_number);
            }

            return updatedOrders;
        });
    }, [orderType, hasfoilingAssignments, isOrderCompleted]);

    const handleOrderDeleted = useCallback((deleteData) => {
        try {
            const { orderId, orderNumber } = deleteData;
            if (!orderId) {
                console.warn('No order ID in delete notification');
                return;
            }

            // Remove from both caches
            ['pending', 'completed'].forEach(type => {
                if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                    let cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                    cachedOrders = cachedOrders.filter(order => order._id !== orderId);
                    saveTeamOrdersToLocalStorage(cachedOrders, type, TEAMS.FOILING);
                }
            });

            setOrders(prevOrders => {
                const updatedOrders = prevOrders.filter(order => order._id !== orderId);
                return updatedOrders;
            });

            setFilteredOrders(prevFiltered => {
                return prevFiltered.filter(order => order._id !== orderId);
            });

            deleteOrderFromLocalStorage(orderId);
        } catch (error) {
            console.error('Error handling order delete notification:', error);
        }
    }, [orderType]);



    const mergeOrders = (existingOrder, newOrder, targetGlassItem = null) => {

        const existingItemsMap = {};
        const newItemsMap = {};

        (existingOrder.item_ids || []).forEach(item => {
            existingItemsMap[item._id] = item;
        });

        (newOrder.item_ids || []).forEach(item => {
            newItemsMap[item._id] = item;
        });

        const mergedItems = [];

        if (targetGlassItem) {
            // For filtered orders (from decoration sequence), add new assignments precisely
            console.log('🎯 Processing filtered order for glass:', targetGlassItem);

            // First, process items from the new (filtered) order
            Object.values(newItemsMap).forEach(newItem => {
                if (existingItemsMap[newItem._id]) {
                    // Merge existing item with new assignments for the target glass
                    const existingItem = existingItemsMap[newItem._id];
                    const mergedItem = mergeItemAssignments(existingItem, newItem, targetGlassItem);
                    mergedItems.push(mergedItem);
                    console.log('✅ Merged item:', newItem.name, 'for glass:', targetGlassItem);
                } else {
                    // New item, add as is
                    mergedItems.push(newItem);
                    console.log('✅ Added new item:', newItem.name);
                }
            });

            // Then, preserve existing items that have assignments for OTHER glasses
            Object.values(existingItemsMap).forEach(existingItem => {
                if (!newItemsMap[existingItem._id]) {
                    // Keep assignments for glasses OTHER than the target glass
                    const otherGlassAssignments = (existingItem.team_assignments?.foiling || [])
                        .filter(assignment => {
                            const assignmentGlassId = assignment.glass_item_id?._id || assignment.glass_item_id;
                            return assignmentGlassId?.toString() !== targetGlassItem?.toString();
                        });

                    if (otherGlassAssignments.length > 0) {
                        mergedItems.push({
                            ...existingItem,
                            team_assignments: {
                                ...existingItem.team_assignments,
                                foiling: otherGlassAssignments
                            }
                        });
                        console.log('✅ Preserved item with other glass assignments:', existingItem.name);
                    }
                }
            });
        } else {
            // For full order updates, use standard merge logic
            console.log('🔄 Processing full order update');

            // Process all existing items
            Object.values(existingItemsMap).forEach(existingItem => {
                if (newItemsMap[existingItem._id]) {
                    const newItem = newItemsMap[existingItem._id];
                    const mergedItem = mergeItemAssignments(existingItem, newItem, targetGlassItem);
                    mergedItems.push(mergedItem);
                } else {
                    mergedItems.push(existingItem);
                }
            });

            // Add any completely new items
            Object.values(newItemsMap).forEach(newItem => {
                if (!existingItemsMap[newItem._id]) {
                    mergedItems.push(newItem);
                }
            });
        }
        return {
            ...existingOrder,
            ...newOrder,
            item_ids: mergedItems
        };
    };

    useEffect(() => {
        if (!socket) return;
        socket.on('new-order', handleNewOrder);
        socket.on('order-updated', handleOrderUpdate);
        socket.on('order-deleted', handleOrderDeleted);

        return () => {
            socket.off('new-order', handleNewOrder);
            socket.off('order-updated', handleOrderUpdate);
            socket.off('order-deleted', handleOrderDeleted);
        };
    }, [socket, handleNewOrder, handleOrderUpdate, handleOrderDeleted]);

    useEffect(() => {
        const handleBufferedOrder = (e) => {
            console.log('📥 Accessories got NEW ORDER event from buffer', e.detail);
            handleNewOrder(e.detail);
        };

        window.addEventListener('socket-new-order', handleBufferedOrder);

        return () => {
            window.removeEventListener('socket-new-order', handleBufferedOrder);
        };
    }, [handleNewOrder]);

    const fetchfoilingOrders = async (type = orderType) => {
        try {
            setLoading(true);
            if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                const cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                setOrders(cachedOrders);
                setFilteredOrders(cachedOrders);
                setLoading(false);
                return;
            }

            const response = await axios.get(`http://localhost:5000/api/foil?orderType=${type}`);
            const fetchedOrders = response.data.data || [];

            saveTeamOrdersToLocalStorage(fetchedOrders, type, TEAMS.FOILING);
            setOrders(fetchedOrders);
            setFilteredOrders(fetchedOrders);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch foiling orders: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchfoilingOrders(orderType);
    }, [orderType]);

    useEffect(() => {
        if (orders.length > 0) {
            const filtered = orders.filter(order => {
                const orderMatches =
                    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

                if (orderMatches) return true;

                return order.item_ids?.some(item => {
                    if (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return true;
                    }
                    return item.team_assignments?.foiling?.some(foiling => {
                        return foiling.foiling_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.decoration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.decoration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.weight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.neck_size?.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                });
            });

            setFilteredOrders(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, orders]);

    const handleClose = () => {
        setShowModal(false);
        setSelectedOrder(null);
        setSelectedItem(null);
    };

    const handleEditClick = (order, item) => {
        setSelectedOrder(order);
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleLocalOrderUpdate = (updatedOrder) => {
        const processedOrder = updateOrderStatus(updatedOrder);
        const updatedOrders = orders.map(order =>
            order._id === processedOrder._id ? processedOrder : order
        );

        const currentOrderType = orderType.toLowerCase();
        const newOrderStatus = processedOrder.order_status?.toLowerCase();

        if ((currentOrderType === 'pending' && newOrderStatus === 'completed') ||
            (currentOrderType === 'completed' && newOrderStatus !== 'completed')) {

            const filteredUpdatedOrders = updatedOrders.filter(order => order._id !== processedOrder._id);
            setOrders(filteredUpdatedOrders);
            setFilteredOrders(filteredUpdatedOrders);
        } else {
            setOrders(updatedOrders);
            setFilteredOrders(updatedOrders);
        }

        handleClose();
    };

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleOrdersPerPageChange = (e) => {
        setOrdersPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const renderOrderTable = () => {
        if (currentOrders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No foiling orders found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-sm">
                        When you receive new orders, they will appear here for easy management and tracking.
                    </p>
                </div>
            );
        }

        const colorClasses = ['bg-orange-50', 'bg-orange-100', 'bg-yellow-50', 'bg-yellow-100'];

        return (
            <>
                <div className="bg-gradient-to-r from-orange-800 via-orange-600 to-orange-400 rounded-lg shadow-md py-3 px-4 mb-3">
                    <div
                        className="grid gap-2 text-white font-semibold text-xs items-center"
                        style={{
                            gridTemplateColumns: '1fr 1.5fr 3fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr'
                        }}
                    >
                        <div className="text-left">Order #</div>
                        <div className="text-left">Item</div>
                        <div className="text-left px-2">Bottle Name</div>
                        <div className="text-left">Quantity</div>
                        <div className="text-left">Remaining</div>
                        <div className="text-left">Status</div>
                        <div className="text-left">Neck Size</div>
                        <div className="text-left">Weight</div>
                        <div className="text-left">Decoration #</div>
                        <div className="text-center">Action</div>
                    </div>
                </div>

                {/* Data Rows */}
                {currentOrders.map((order, orderIndex) => {
                    let totalOrderRows = 0;
                    order.item_ids?.forEach(item => {
                        const foilingAssignments = item.team_assignments?.foiling || [];
                        totalOrderRows += Math.max(1, foilingAssignments.length);
                    });

                    let currentRowInOrder = 0;

                    return (
                        <div key={`order-${order._id}`} className="bg-white rounded-lg shadow-sm border border-orange-200 mb-3 overflow-hidden">
                            {order.item_ids?.map((item, itemIndex) => {
                                const foilingAssignments = item.team_assignments?.foiling || [];
                                const assignments = foilingAssignments.length === 0 ? [null] : foilingAssignments;
                                const bgColor = colorClasses[itemIndex % colorClasses.length];

                                return assignments.map((foiling, assignmentIndex) => {
                                    const isFirstRowOfOrder = currentRowInOrder === 0;
                                    const isFirstRowOfItem = assignmentIndex === 0;
                                    const isLastRowOfOrder = currentRowInOrder === totalOrderRows - 1;
                                    currentRowInOrder++;

                                    // Calculate remaining qty and status for this assignment
                                    const remainingQty = foiling ? getRemainingQty(foiling) : 'N/A';
                                    const status = foiling ? getAssignmentStatus(foiling) : 'N/A';

                                    // Status styling
                                    const getStatusStyle = (status) => {
                                        switch (status) {
                                            case 'Completed':
                                                return 'text-green-600 font-semibold';
                                            case 'In Progress':
                                                return 'text-orange-600 font-semibold';
                                            case 'Pending':
                                                return 'text-gray-600 font-semibold';
                                            default:
                                                return 'text-gray-500';
                                        }
                                    };

                                    return (
                                        <div
                                            key={`${order._id}-${item._id}-${foiling?._id || 'empty'}-${assignmentIndex}`}
                                            className={`grid gap-2 items-center py-2 px-3 text-xs ${bgColor} ${!isLastRowOfOrder ? 'border-b border-orange-100' : ''}`}
                                            style={{
                                                gridTemplateColumns: '1fr 1.5fr 3fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr'
                                            }}
                                        >
                                            <div className="text-left">
                                                {isFirstRowOfOrder ? (
                                                    <span className="font-bold text-orange-800">{order.order_number}</span>
                                                ) : (
                                                    <span className="text-transparent">{order.order_number}</span>
                                                )}
                                            </div>

                                            <div className="text-left">
                                                {isFirstRowOfItem ? (
                                                    <span className="text-orange-800 font-medium">{item.name || 'N/A'}</span>
                                                ) : (
                                                    <span className="text-transparent">{item.name || 'N/A'}</span>
                                                )}
                                            </div>

                                            <div className="text-left text-orange-900 px-2">
                                                {foiling ? (foiling.glass_name || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-orange-900">
                                                {foiling ? (foiling.quantity || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left">
                                                <span className={`font-semibold ${remainingQty === 0 ? 'text-green-600' : 'text-orange-700'}`}>
                                                    {remainingQty}
                                                </span>
                                            </div>

                                            <div className="text-left">
                                                <span className={getStatusStyle(status)}>
                                                    {status}
                                                </span>
                                            </div>

                                            <div className="text-left text-orange-900">
                                                {foiling ? (foiling.neck_size || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-gray-800">
                                                {foiling ? (foiling.weight || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-gray-800">
                                                {foiling ? (foiling.decoration_no || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-center">
                                                {isFirstRowOfItem ? (
                                                    <button
                                                        onClick={() => handleEditClick(order, item)}
                                                        className="inline-flex items-center justify-center p-1.5 bg-orange-600 rounded text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm"
                                                        title="Edit quantities"
                                                    >
                                                        <FiEdit size={14} />
                                                    </button>
                                                ) : (
                                                    <div className="p-1.5">
                                                        <FiEdit size={12} className="text-transparent" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-orange-700">
                        foiling Team {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Orders
                    </h2>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="flex-grow overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center flex-grow">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-700"></div>
                    </div>
                ) : (
                    <div className="overflow-auto flex-grow">
                        {renderOrderTable()}
                    </div>
                )}
            </div>

            <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-600">Rows per page:</span>
                    <select
                        value={ordersPerPage}
                        onChange={handleOrdersPerPageChange}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>

                    <span className="ml-4 text-sm text-gray-600">
                        Showing {filteredOrders.length > 0 ? indexOfFirstOrder + 1 : 0} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                    </span>
                </div>

                <div className="flex">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-l-md ${currentPage === 1
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                    >
                        Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 ${currentPage === pageNum
                                    ? 'bg-orange-700 text-white'
                                    : 'bg-orange-600 text-white hover:bg-orange-700'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-r-md ${currentPage === totalPages
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {showModal && selectedOrder && selectedItem && (
                <UpdateFoilQty
                    isOpen={showModal}
                    onClose={handleClose}
                    orderData={selectedOrder}
                    itemData={selectedItem}
                    onUpdate={handleLocalOrderUpdate}
                />
            )}
        </div>
    );
};

export default DecoFoilOrders;