import { Search, Pencil, Package } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit } from "react-icons/fi";

import {
    TEAMS,
    deleteOrderFromLocalStorage,
    getOrdersFromLocalStorage as getTeamOrdersFromLocalStorage,
    hasOrdersInLocalStorage as hasTeamOrdersInLocalStorage,
    saveOrdersToLocalStorage as saveTeamOrdersToLocalStorage,
    updateOrderInLocalStorage
} from '../utils/localStorageUtils.jsx';

import { useSocket } from '../context/SocketContext.jsx';
import UpdateCapQty from '../updateQuanityComponents/updateCapQty.jsx';

const CapOrders = ({ orderType }) => {
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

    const hasAssemblyProcess = (process) => {
        return process && process.includes('Assembly');
    };

    const hasMetalProcess = (process) => {
        return process && process.includes('Metal');
    };

    const getRemainingQtyForProcess = (capItem, processType) => {
        const totalQty = capItem.quantity || 0;

        if (processType === 'metal' || processType === 'nonmetal') {
            const metalCompleted = capItem.metal_tracking?.total_completed_qty || 0;
            return Math.max(totalQty - metalCompleted, 0);
        } else if (processType === 'assembly') {
            const assemblyCompleted = capItem.assembly_tracking?.total_completed_qty || 0;
            return Math.max(totalQty - assemblyCompleted, 0);
        }

        return totalQty;
    };

    const getOverallRemainingQty = (capItem) => {
        const totalQty = capItem.quantity || 0;
        const hasAssembly = hasAssemblyProcess(capItem.process);
        const hasMetal = hasMetalProcess(capItem.process);

        let minCompleted = 0;

        if (hasAssembly) {
            const metalCompleted = capItem.metal_tracking?.total_completed_qty || 0;
            const assemblyCompleted = capItem.assembly_tracking?.total_completed_qty || 0;
            minCompleted = Math.min(metalCompleted, assemblyCompleted);
        } else {
            minCompleted = capItem.metal_tracking?.total_completed_qty || 0;
        }

        return Math.max(totalQty - minCompleted, 0);
    };

    const getOverallStatus = (capItem) => {
        const overallRemaining = getOverallRemainingQty(capItem);
        if (overallRemaining === 0) return 'Completed';

        const hasAssembly = hasAssemblyProcess(capItem.process);
        const metalCompleted = capItem.metal_tracking?.total_completed_qty || 0;
        const assemblyCompleted = capItem.assembly_tracking?.total_completed_qty || 0;

        if (hasAssembly) {
            return (metalCompleted > 0 || assemblyCompleted > 0) ? 'In Progress' : 'Pending';
        } else {
            return metalCompleted > 0 ? 'In Progress' : 'Pending';
        }
    };

    const filterOrdersByTeamStatus = (orders, teamKey) => {
        return orders.filter(order => {
            // Check if order has assignments for this team
            const hasTeamAssignments = order.item_ids?.some(item =>
                item.team_assignments?.[teamKey] && item.team_assignments[teamKey].length > 0
            );

            if (!hasTeamAssignments) return false;

            // Determine team-specific completion status
            const isTeamCompleted = isOrderCompletedForTeam(order, teamKey);

            // For pending tab: show if team work is not complete
            // For completed tab: show if team work is complete
            if (orderType.toLowerCase() === 'pending') {
                return !isTeamCompleted;
            } else {
                return isTeamCompleted;
            }
        });
    };

    const isOrderCompletedForTeam = (order, teamKey) => {
        const items = order.item_ids || [];
        if (items.length === 0) return false;

        return items.every(item => {
            const teamAssignments = item.team_assignments?.[teamKey] || [];
            if (teamAssignments.length === 0) return true; // No assignments = considered complete

            // For caps team, use the caps-specific completion logic
            if (teamKey === 'caps') {
                return teamAssignments.every(capItem => getOverallRemainingQty(capItem) === 0);
            }

            // Default logic for other teams
            return teamAssignments.every(assignment => {
                const completed = assignment.team_tracking?.total_completed_qty || 0;
                const total = assignment.quantity || 0;
                return completed >= total;
            });
        });
    };

    const isItemCompleted = (item) => {
        const capsAssignments = item.team_assignments?.caps || [];
        if (capsAssignments.length === 0) return false;
        return capsAssignments.every(capItem => getOverallRemainingQty(capItem) === 0);
    };

    const isOrderCompleted = (order) => {
        const items = order.item_ids || [];
        if (items.length === 0) return false;
        return items.every(item => isItemCompleted(item));
    };

    const determineCapOrderType = (order) => {
        const isCompleted = isOrderCompletedForTeam(order, 'caps');
        return isCompleted ? 'completed' : 'pending';
    };

    const updateOrderStatus = (updatedOrder) => {
        const isCompleted = isOrderCompletedForTeam(updatedOrder, 'caps');
        const newStatus = isCompleted ? 'Completed' : 'Pending';

        if (updatedOrder.order_status !== newStatus) {
            updatedOrder.order_status = newStatus;
        }

        updateOrderInLocalStorage(updatedOrder._id, updatedOrder, TEAMS.CAPS);
        return updatedOrder;
    };

    const hascapsAssignments = (order) => {
        return order.item_ids?.some(item =>
            item.team_assignments?.caps && item.team_assignments.caps.length > 0
        );
    };

    const updateBothCaches = (orderData) => {
        // Use team-specific completion status instead of global order status
        const teamOrderStatus = isOrderCompletedForTeam(orderData, 'caps') ? 'completed' : 'pending';

        ['pending', 'completed'].forEach(type => {
            if (hasTeamOrdersInLocalStorage(type, TEAMS.CAPS)) {
                let cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.CAPS);
                // Remove existing order from this cache
                cachedOrders = cachedOrders.filter(order => order._id !== orderData._id);
                
                // Add order to this cache if it should be here (using team status)
                if (teamOrderStatus === type) {
                    cachedOrders = [orderData, ...cachedOrders];
                }
                saveTeamOrdersToLocalStorage(cachedOrders, type, TEAMS.CAPS);
            } else {
                // No existing cache - create new one if order belongs here
                if (teamOrderStatus === type) {
                    saveTeamOrdersToLocalStorage([orderData], type, TEAMS.CAPS);
                }
            }
        });
    };

    const handleNewOrder = useCallback((orderData) => {
        if (!orderData.orderData) return;
        const newOrder = orderData.orderData;

        // Check if order has assignments for this team
        if (!hascapsAssignments(newOrder)) {
            return;
        }

        // Determine team-specific status instead of global status
        const isTeamCompleted = isOrderCompletedForTeam(newOrder, 'caps');
        const teamOrderStatus = isTeamCompleted ? 'completed' : 'pending';
        const currentViewType = orderType.toLowerCase();

        // Update both caches with team-specific logic
        updateBothCaches(newOrder);

        // Only update UI if order belongs to current team view
        if (teamOrderStatus !== currentViewType) {
            setOrders(prevOrders =>
                prevOrders.filter(order => order._id !== newOrder._id)
            );
            return;
        }

        // Update current view
        setOrders(prevOrders => {
            const existingOrderIndex = prevOrders.findIndex(order => order._id === newOrder._id);
            let updatedOrders;

            if (existingOrderIndex >= 0) {
                updatedOrders = [...prevOrders];
                updatedOrders[existingOrderIndex] = newOrder;
            } else {
                updatedOrders = [newOrder, ...prevOrders];
            }

            return updatedOrders;
        });
    }, [orderType]);

    const handleOrderUpdate = useCallback((updateData) => {
        if (!updateData.orderData) return;
        const updatedOrder = updateData.orderData;
        const { hasAssignments, wasRemoved } = updateData;

        // If order was removed or has no caps assignments, remove from caches
        if (wasRemoved || !hasAssignments || !hascapsAssignments(updatedOrder)) {
            ['pending', 'completed'].forEach(type => {
                if (hasTeamOrdersInLocalStorage(type, TEAMS.CAPS)) {
                    let cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.CAPS);
                    cachedOrders = cachedOrders.filter(order => order._id !== updatedOrder._id);
                    saveTeamOrdersToLocalStorage(cachedOrders, type, TEAMS.CAPS);
                }
            });

            setOrders(prevOrders => {
                return prevOrders.filter(order => order._id !== updatedOrder._id);
            });
            return;
        }

        // Update both caches with team-specific logic
        updateBothCaches(updatedOrder);

        // Determine team-specific status and current view
        const isTeamCompleted = isOrderCompletedForTeam(updatedOrder, 'caps');
        const teamOrderStatus = isTeamCompleted ? 'completed' : 'pending';
        const currentViewType = orderType.toLowerCase();

        // Update current view
        setOrders(prevOrders => {
            const existingOrderIndex = prevOrders.findIndex(order => order._id === updatedOrder._id);
            
            // If order doesn't belong to current view, remove it
            if (teamOrderStatus !== currentViewType) {
                if (existingOrderIndex >= 0) {
                    return prevOrders.filter(order => order._id !== updatedOrder._id);
                }
                return prevOrders;
            }

            // Order belongs to current view
            let updatedOrders;
            if (existingOrderIndex >= 0) {
                updatedOrders = [...prevOrders];
                updatedOrders[existingOrderIndex] = updatedOrder;
            } else {
                updatedOrders = [updatedOrder, ...prevOrders];
            }
            return updatedOrders;
        });
    }, [orderType]);

    const handleOrderDeleted = useCallback((deleteData) => {
        try {
            const { orderId, orderNumber } = deleteData;
            if (!orderId) {
                console.warn('No order ID in delete notification');
                return;
            }

            // Remove from both caches
            ['pending', 'completed'].forEach(type => {
                if (hasTeamOrdersInLocalStorage(type, TEAMS.CAPS)) {
                    let cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.CAPS);
                    cachedOrders = cachedOrders.filter(order => order._id !== orderId);
                    saveTeamOrdersToLocalStorage(cachedOrders, type, TEAMS.CAPS);
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

    const fetchcapsOrders = async (type = orderType) => {
        try {
            setLoading(true);

            // Check cache first
            if (hasTeamOrdersInLocalStorage(type, TEAMS.CAPS)) {
                const cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.CAPS);
                const filteredOrders = filterOrdersByTeamStatus(cachedOrders, 'caps');
                setOrders(filteredOrders);
                setFilteredOrders(filteredOrders);
                setLoading(false);
                return;
            }

            // Fetch both pending and completed orders to determine team-specific status
            const [pendingResponse, completedResponse] = await Promise.all([
                axios.get(`http://localhost:5000/api/caps?orderType=pending`),
                axios.get(`http://localhost:5000/api/caps?orderType=completed`)
            ]);

            const allOrders = [
                ...(pendingResponse.data.data || []),
                ...(completedResponse.data.data || [])
            ];

            // Filter orders based on team-specific status
            const teamFilteredOrders = filterOrdersByTeamStatus(allOrders, 'caps');

            // Cache the filtered results
            saveTeamOrdersToLocalStorage(teamFilteredOrders, type, TEAMS.CAPS);
            setOrders(teamFilteredOrders);
            setFilteredOrders(teamFilteredOrders);
            setLoading(false);

        } catch (err) {
            setError('Failed to fetch caps orders: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcapsOrders(orderType);
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
                    return item.team_assignments?.caps?.some(caps => {
                        return caps.cap_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            caps.process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            caps.neck_size?.toLowerCase().includes(searchTerm.toLowerCase());
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
        console.log('Handling local order update:', updatedOrder.order_number);
        const success = updateOrderInLocalStorage(updatedOrder._id, updatedOrder, TEAMS.CAPS);

        if (success) {
            console.log('Order updated successfully in localStorage');

            // Use team-specific completion logic
            const newOrderType = determineCapOrderType(updatedOrder);
            const currentViewType = orderType.toLowerCase();
            console.log(`Order ${updatedOrder.order_number}: newType=${newOrderType}, currentView=${currentViewType}`);
            
            if (newOrderType !== currentViewType) {
                console.log(`Removing order ${updatedOrder.order_number} from ${currentViewType} view`);
                setOrders(prevOrders => {
                    const filteredOrders = prevOrders.filter(order => order._id !== updatedOrder._id);
                    return filteredOrders;
                });
                setFilteredOrders(prevFiltered => {
                    const filteredOrders = prevFiltered.filter(order => order._id !== updatedOrder._id);
                    return filteredOrders;
                });
            } else {
                console.log(`Updating order ${updatedOrder.order_number} in ${currentViewType} view`);
                setOrders(prevOrders => {
                    const existingIndex = prevOrders.findIndex(order => order._id === updatedOrder._id);
                    if (existingIndex !== -1) {
                        const updatedOrders = [...prevOrders];
                        updatedOrders[existingIndex] = updatedOrder;
                        return updatedOrders;
                    } else {
                        return [updatedOrder, ...prevOrders];
                    }
                });

                setFilteredOrders(prevFiltered => {
                    const existingIndex = prevFiltered.findIndex(order => order._id === updatedOrder._id);
                    if (existingIndex !== -1) {
                        const updatedFiltered = [...prevFiltered];
                        updatedFiltered[existingIndex] = updatedOrder;
                        return updatedFiltered;
                    } else {
                        return [updatedOrder, ...prevFiltered];
                    }
                });
            }
        } else {
            console.error('Failed to update order in localStorage');
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No caps orders found</h3>
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
                            gridTemplateColumns: '1fr 1fr 3fr 1.5fr 1fr 1fr 1fr 1fr 1fr  0.8fr'
                        }}
                    >
                        <div className="text-left">Order #</div>
                        <div className="text-left">Item</div>
                        <div className="text-left px-2">Cap Name</div>
                        <div className="text-left">Process</div>
                        <div className="text-left">Quantity</div>
                        <div className="text-left">Metal Rem.</div>
                        <div className="text-left">Assy Rem.</div>
                        <div className="text-left">Overall Rem.</div>
                        <div className="text-left">Status</div>

                        <div className="text-center">Action</div>
                    </div>
                </div>

                {/* Data Rows */}
                {currentOrders.map((order, orderIndex) => {
                    let totalOrderRows = 0;
                    order.item_ids?.forEach(item => {
                        const capsAssignments = item.team_assignments?.caps || [];
                        totalOrderRows += Math.max(1, capsAssignments.length);
                    });

                    let currentRowInOrder = 0;

                    return (
                        <div key={`order-${order._id}`} className="bg-white rounded-lg shadow-sm border border-orange-200 mb-3 overflow-hidden">
                            {order.item_ids?.map((item, itemIndex) => {
                                const capsAssignments = item.team_assignments?.caps || [];
                                const assignments = capsAssignments.length === 0 ? [null] : capsAssignments;
                                const bgColor = colorClasses[itemIndex % colorClasses.length];

                                return assignments.map((capItem, assignmentIndex) => {
                                    const isFirstRowOfOrder = currentRowInOrder === 0;
                                    const isFirstRowOfItem = assignmentIndex === 0;
                                    const isLastRowOfOrder = currentRowInOrder === totalOrderRows - 1;
                                    currentRowInOrder++;

                                    // Calculate remaining quantities for different processes
                                    const hasAssembly = capItem ? hasAssemblyProcess(capItem.process) : false;
                                    const metalRemaining = capItem ? getRemainingQtyForProcess(capItem, 'metal') : 'N/A';
                                    const assemblyRemaining = capItem && hasAssembly ? getRemainingQtyForProcess(capItem, 'assembly') : 'N/A';
                                    const overallRemaining = capItem ? getOverallRemainingQty(capItem) : 'N/A';
                                    const status = capItem ? getOverallStatus(capItem) : 'N/A';

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
                                            key={`${order._id}-${item._id}-${capItem?._id || 'empty'}-${assignmentIndex}`}
                                            className={`grid gap-2 items-center py-2 px-3 text-xs ${bgColor} ${!isLastRowOfOrder ? 'border-b border-orange-100' : ''}`}
                                            style={{
                                                gridTemplateColumns: '1fr 1fr 3fr 1.5fr 1fr 1fr 1fr 1fr 1fr  0.8fr'
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
                                                {capItem ? (capItem.cap_name || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-orange-900 text-xs">
                                                {capItem ? (capItem.process || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-orange-900">
                                                {capItem ? (capItem.quantity || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left">
                                                <span className={`font-semibold ${metalRemaining === 0 ? 'text-green-600' : 'text-orange-700'}`}>
                                                    {metalRemaining}
                                                </span>
                                            </div>

                                            <div className="text-left">
                                                {hasAssembly ? (
                                                    <span className={`font-semibold ${assemblyRemaining === 0 ? 'text-green-600' : 'text-orange-700'}`}>
                                                        {assemblyRemaining}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>

                                            <div className="text-left">
                                                <span className={`font-semibold ${overallRemaining === 0 ? 'text-green-600' : 'text-orange-700'}`}>
                                                    {overallRemaining}
                                                </span>
                                            </div>

                                            <div className="text-left">
                                                <span className={getStatusStyle(status)}>
                                                    {status}
                                                </span>
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
                        Cap Team {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Orders
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
                <UpdateCapQty
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

export default CapOrders;