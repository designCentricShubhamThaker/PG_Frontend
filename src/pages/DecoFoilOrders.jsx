import { Search, Package } from 'lucide-react';
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
import { useSocket } from '../context/SocketContext.jsx';
import UpdateFoilQty from '../updateQuanityComponents/updateFoilQty.jsx';

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

    // Utility functions for status calculation
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

    const orderMatchesCurrentView = (order) => {
        const orderStatus = isOrderCompleted(order) ? 'completed' : 'pending';
        const currentViewType = orderType.toLowerCase();
        return orderStatus === currentViewType;
    };

    // Function to check if an item is valid for foiling team
    const isValidFoilingItem = (item) => {
        const foilingAssignments = item.team_assignments?.foiling || [];
        const printingAssignments = item.team_assignments?.printing || [];

        // Must have foiling assignments
        if (foilingAssignments.length === 0) {
            return false;
        }

        // Check if all foiling assignments have their corresponding printing completed
        return foilingAssignments.every(foilingAssignment => {
            const correspondingPrinting = printingAssignments.find(printing =>
                printing._id?.toString() === foilingAssignment.printing_item_id?.toString()
            );

            if (!correspondingPrinting) {
                console.log(`❌ No corresponding printing found for foiling assignment: ${foilingAssignment.printing_item_id}`);
                return false;
            }

            const isPrintingCompleted = correspondingPrinting.team_tracking?.total_completed_qty >= correspondingPrinting.quantity;
            console.log(`🔍 Printing ${correspondingPrinting.glass_name} completion check:`, {
                completed: correspondingPrinting.team_tracking?.total_completed_qty || 0,
                required: correspondingPrinting.quantity,
                isCompleted: isPrintingCompleted
            });

            return isPrintingCompleted;
        });
    };

    // Function to filter order items for foiling team
    const filterOrderForFoilingTeam = (order) => {
        const validItems = order.item_ids?.filter(item => {
            const isValid = isValidFoilingItem(item);
            console.log(`🔍 Item ${item.name} validation for foiling team: ${isValid ? 'VALID' : 'INVALID'}`);
            return isValid;
        }) || [];

        return {
            ...order,
            item_ids: validItems
        };
    };

    const updateOrAddOrder = (newOrderData) => {
        console.log('📦 Processing:', newOrderData.order_number);

        // FIRST: Filter the order to only include valid items for foiling team
        const filteredOrderData = filterOrderForFoilingTeam(newOrderData);

        console.log(`📊 Filtered order - Original items: ${newOrderData.item_ids?.length || 0}, Valid items: ${filteredOrderData.item_ids?.length || 0}`);

        const hasFoiling = filteredOrderData.item_ids?.some(
            item => item.team_assignments?.foiling?.length > 0
        );

        if (!hasFoiling) {
            console.log('❌ No valid foiling assignments found after filtering');
            return;
        }

        if (!orderMatchesCurrentView(filteredOrderData)) {
            console.log('❌ Order does not match current view after filtering');
            return;
        }

        setOrders(prev => {
            const idx = prev.findIndex(o => o._id === filteredOrderData._id);

            if (idx >= 0) {
                const merged = mergeOrderData(prev[idx], filteredOrderData);

                // IMPORTANT: Re-filter after merging to ensure no invalid items slip through
                const finalFiltered = filterOrderForFoilingTeam(merged);

                if (!finalFiltered.item_ids?.length) {
                    console.log('🗑️ No valid items after merge and filter - removing order');
                    const filtered = prev.filter(o => o._id !== merged._id);
                    saveTeamOrdersToLocalStorage(filtered, orderType, TEAMS.FOILING);
                    setFilteredOrders(filtered);
                    return filtered;
                }

                const updated = [...prev];
                updated[idx] = finalFiltered;
                saveTeamOrdersToLocalStorage(updated, orderType, TEAMS.FOILING);
                setFilteredOrders(updated);
                return updated;
            } else {
                const updated = [filteredOrderData, ...prev];
                saveTeamOrdersToLocalStorage(updated, orderType, TEAMS.FOILING);
                setFilteredOrders(updated);
                return updated;
            }
        });
    };

    const mergeOrderData = (existingOrder, newOrderData) => {
        const mergedOrder = { ...existingOrder };
        mergedOrder.updated_at = newOrderData.updated_at || existingOrder.updated_at;

        const itemMap = new Map();

        // Step 1: Add all existing items first
        existingOrder.item_ids?.forEach(item => {
            if (!item || !item._id) return;
            itemMap.set(item._id, item);
        });

        // Step 2: Merge new items
        newOrderData.item_ids?.forEach(newItem => {
            if (!newItem || !newItem._id) return;

            const existingItem = itemMap.get(newItem._id) || {};

            const mergedFoilingAssignments = mergeFoilingAssignments(
                existingItem.team_assignments?.foiling || [],
                newItem.team_assignments?.foiling || []
            );

            // IMPORTANT: Also merge printing assignments for validation
            const mergedPrintingAssignments = mergePrintingAssignments(
                existingItem.team_assignments?.printing || [],
                newItem.team_assignments?.printing || []
            );

            const mergedItem = {
                ...existingItem,
                ...newItem,
                team_assignments: {
                    ...(existingItem.team_assignments || {}),
                    ...(newItem.team_assignments || {}),
                    foiling: mergedFoilingAssignments,
                    printing: mergedPrintingAssignments
                }
            };

            itemMap.set(newItem._id, mergedItem);
        });

        // Step 3: Only include items that are valid for foiling team
        const validItems = Array.from(itemMap.values()).filter(item => {
            const hasValidFoilingAssignments = item.team_assignments?.foiling?.length > 0;
            const isValidForFoiling = isValidFoilingItem(item);

            console.log(`🔍 Merge validation for item ${item.name}:`, {
                hasFoilingAssignments: hasValidFoilingAssignments,
                isValidForFoiling: isValidForFoiling,
                included: hasValidFoilingAssignments && isValidForFoiling
            });

            return hasValidFoilingAssignments && isValidForFoiling;
        });

        mergedOrder.item_ids = validItems;
        return mergedOrder;
    };

    const mergeFoilingAssignments = (existingAssignments, newAssignments) => {
        console.log('🔄 Merging foiling assignments');

        const assignmentMap = new Map();

        // Add existing assignments first
        existingAssignments.forEach(assignment => {
            if (assignment && assignment._id) {
                assignmentMap.set(assignment._id, assignment);
            }
        });

        // Override or add with new assignments
        newAssignments.forEach(assignment => {
            if (assignment && assignment._id) {
                assignmentMap.set(assignment._id, assignment);  // Replace if exists
            }
        });

        const mergedAssignments = Array.from(assignmentMap.values());
        console.log(`✅ Merged ${mergedAssignments.length} foiling assignments`);

        return mergedAssignments;
    };

    // Function to merge printing assignments
    const mergePrintingAssignments = (existingAssignments, newAssignments) => {
        console.log('🔄 Merging printing assignments');

        const assignmentMap = new Map();

        // Add existing assignments first
        existingAssignments.forEach(assignment => {
            if (assignment && assignment._id) {
                assignmentMap.set(assignment._id, assignment);
            }
        });

        // Override or add with new assignments
        newAssignments.forEach(assignment => {
            if (assignment && assignment._id) {
                assignmentMap.set(assignment._id, assignment);  // Replace if exists
            }
        });

        const mergedAssignments = Array.from(assignmentMap.values());
        console.log(`✅ Merged ${mergedAssignments.length} printing assignments`);

        return mergedAssignments;
    };

    const handleNewOrder = useCallback((orderData) => {
        console.log('📦 New order received:', orderData);

        if (!orderData.orderData) {
            console.log('❌ No order data provided');
            return;
        }

        updateOrAddOrder(orderData.orderData);
        toast.success(`📦 New order #${orderData.orderData.order_number} received!`, { duration: 4000 });
    }, [orderType]);

    const handleOrderUpdate = useCallback(({ orderData, wasRemoved, hasAssignments }) => {
        if (!orderData) return;

        if (wasRemoved || !hasAssignments) {
            setOrders(prev => {
                const filtered = prev.filter(o => o._id !== orderData._id);
                saveTeamOrdersToLocalStorage(filtered, orderType, TEAMS.FOILING);
                setFilteredOrders(filtered);
                return filtered;
            });
            deleteOrderFromLocalStorage(orderData._id);
            toast.success(`🗑️ Order #${orderData.order_number} removed`);
            return;
        }

        updateOrAddOrder(orderData);
        toast.success(`✏️ Order #${orderData.order_number} updated`);
    }, [orderType]);

    const handleOrderDeleted = useCallback(({ orderId, orderNumber }) => {
        if (!orderId) return;
        setOrders(prev => {
            const filtered = prev.filter(o => o._id !== orderId);
            saveTeamOrdersToLocalStorage(filtered, orderType, TEAMS.FOILING);
            setFilteredOrders(filtered);
            return filtered;
        });
        deleteOrderFromLocalStorage(orderId);
        toast.success(`🗑️ Order #${orderNumber} deleted`);
    }, [orderType]);

    const handleTeamProgressUpdate = useCallback((progressData) => {
        console.log('📈 Team progress update received:', progressData);

        if (!progressData.orderData) return;

        updateOrAddOrder(progressData.orderData);
    }, [orderType]);

    // Register socket listeners
    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Registering socket listeners for foiling team');

        // Listen for all relevant events
        socket.on('new-order', handleNewOrder);
        socket.on('order-updated', handleOrderUpdate);
        socket.on('order-deleted', handleOrderDeleted);
        socket.on('team-progress-updated', handleTeamProgressUpdate);

        return () => {
            console.log('🔌 Cleaning up socket listeners');
            socket.off('new-order', handleNewOrder);
            socket.off('order-updated', handleOrderUpdate);
            socket.off('order-deleted', handleOrderDeleted);
            socket.off('team-progress-updated', handleTeamProgressUpdate);
        };
    }, [socket, handleNewOrder, handleOrderUpdate, handleOrderDeleted, handleTeamProgressUpdate]);

    const fetchFoilOrders = async (type = orderType) => {
        try {
            setLoading(true);
            if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                const cached = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                // IMPORTANT: Filter cached orders as well
                const filteredCached = cached.map(order => filterOrderForFoilingTeam(order))
                    .filter(order => order.item_ids?.length > 0);
                setOrders(filteredCached);
                setFilteredOrders(filteredCached);
                setLoading(false);
                return;
            }

            const res = await axios.get(`http://localhost:5000/api/foil?orderType=${type}`);
            const fetched = res.data.data || [];
            // IMPORTANT: Filter fetched orders as well
            const filteredFetched = fetched.map(order => filterOrderForFoilingTeam(order))
                .filter(order => order.item_ids?.length > 0);
            saveTeamOrdersToLocalStorage(filteredFetched, type, TEAMS.FOILING);
            setOrders(filteredFetched);
            setFilteredOrders(filteredFetched);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch foiling orders: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFoilOrders(orderType);
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
                        return foiling.glass_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.decoration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.weight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.neck_size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            foiling.foil_type?.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                });
            });

            setFilteredOrders(filtered);
            setCurrentPage(1);
        } else {
            setFilteredOrders([]);
        }
    }, [searchTerm, orders]);

    // Update order status and save to localStorage
    const updateOrderStatus = (updatedOrder) => {
        const isCompleted = isOrderCompleted(updatedOrder);
        const newStatus = isCompleted ? 'Completed' : 'Pending';

        if (updatedOrder.order_status !== newStatus) {
            updatedOrder.order_status = newStatus;
        }

        updateOrderInLocalStorage(updatedOrder._id, updatedOrder, TEAMS.FOILING);
        return updatedOrder;
    };

    // Handle local order updates from quantity update modal
    const handleLocalOrderUpdate = (updatedOrder) => {
        const processedOrder = updateOrderStatus(updatedOrder);
        const updatedOrders = orders.map(order =>
            order._id === processedOrder._id ? processedOrder : order
        );

        const currentOrderType = orderType.toLowerCase();
        const newOrderStatus = processedOrder.order_status?.toLowerCase();

        // Remove order from current view if status changed
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

    // Modal handlers
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

    // Pagination
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

    // Render order table
    const renderOrderTable = () => {
        if (currentOrders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No foiling orders found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-sm">
                        When you receive new orders, they will appear here for easy management and tracking.
                    </p>
                </div>
            );
        }

        const colorClasses = ['bg-purple-50', 'bg-purple-100', 'bg-indigo-50', 'bg-indigo-100'];

        return (
            <>
                <div className="bg-gradient-to-r from-purple-800 via-purple-600 to-purple-400 rounded-lg shadow-md py-3 px-4 mb-3">
                    <div
                        className="grid gap-2 text-white font-semibold text-xs items-center"
                        style={{
                            gridTemplateColumns: '1fr 1.5fr 3fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr'
                        }}
                    >
                        <div className="text-left">Order #</div>
                        <div className="text-left">Item</div>
                        <div className="text-left px-2">Glass Name</div>
                        <div className="text-left">Quantity</div>
                        <div className="text-left">Remaining</div>
                        <div className="text-left">Status</div>
                        <div className="text-left">Neck Size</div>
                        <div className="text-left">Weight</div>
                        <div className="text-left">Foil Type</div>
                        <div className="text-left">Decoration #</div>
                        <div className="text-center">Action</div>
                    </div>
                </div>

                {currentOrders.map((order, orderIndex) => {
                    let totalOrderRows = 0;
                    order.item_ids?.forEach(item => {
                        const foilingAssignments = item.team_assignments?.foiling || [];
                        totalOrderRows += Math.max(1, foilingAssignments.length);
                    });

                    let currentRowInOrder = 0;

                    return (
                        <div key={`order-${order._id}`} className="bg-white rounded-lg shadow-sm border border-purple-200 mb-3 overflow-hidden">
                            {order.item_ids?.map((item, itemIndex) => {
                                const foilingAssignments = item.team_assignments?.foiling || [];
                                const assignments = foilingAssignments.length === 0 ? [null] : foilingAssignments;
                                const bgColor = colorClasses[itemIndex % colorClasses.length];

                                return assignments.map((foiling, assignmentIndex) => {
                                    const isFirstRowOfOrder = currentRowInOrder === 0;
                                    const isFirstRowOfItem = assignmentIndex === 0;
                                    const isLastRowOfOrder = currentRowInOrder === totalOrderRows - 1;
                                    currentRowInOrder++;

                                    const remainingQty = foiling ? getRemainingQty(foiling) : 'N/A';
                                    const status = foiling ? getAssignmentStatus(foiling) : 'N/A';

                                    const getStatusStyle = (status) => {
                                        switch (status) {
                                            case 'Completed':
                                                return 'text-green-600 font-semibold';
                                            case 'In Progress':
                                                return 'text-purple-600 font-semibold';
                                            case 'Pending':
                                                return 'text-gray-600 font-semibold';
                                            default:
                                                return 'text-gray-500';
                                        }
                                    };

                                    return (
                                        <div
                                            key={`${order._id}-${item._id}-${foiling?._id || 'empty'}-${assignmentIndex}`}
                                            className={`grid gap-2 items-center py-2 px-3 text-xs ${bgColor} ${!isLastRowOfOrder ? 'border-b border-purple-100' : ''}`}
                                            style={{
                                                gridTemplateColumns: '1fr 1.5fr 3fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr'
                                            }}
                                        >
                                            <div className="text-left">
                                                {isFirstRowOfOrder ? (
                                                    <span className="font-bold text-purple-800">{order.order_number}</span>
                                                ) : (
                                                    <span className="text-transparent">{order.order_number}</span>
                                                )}
                                            </div>

                                            <div className="text-left">
                                                {isFirstRowOfItem ? (
                                                    <span className="text-purple-800 font-medium">{item.name || 'N/A'}</span>
                                                ) : (
                                                    <span className="text-transparent">{item.name || 'N/A'}</span>
                                                )}
                                            </div>

                                            <div className="text-left text-purple-900 px-2">
                                                {foiling ? (foiling.glass_name || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-purple-900">
                                                {foiling ? (foiling.quantity || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left">
                                                <span className={`font-semibold ${remainingQty === 0 ? 'text-green-600' : 'text-purple-700'}`}>
                                                    {remainingQty}
                                                </span>
                                            </div>

                                            <div className="text-left">
                                                <span className={getStatusStyle(status)}>
                                                    {status}
                                                </span>
                                            </div>

                                            <div className="text-left text-purple-900">
                                                {foiling ? (foiling.neck_size || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-gray-800">
                                                {foiling ? (foiling.weight || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-purple-900">
                                                {foiling ? (foiling.foil_type || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-gray-800">
                                                {foiling ? (foiling.decoration_no || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-center">
                                                {isFirstRowOfItem ? (
                                                    <button
                                                        onClick={() => handleEditClick(order, item)}
                                                        className="inline-flex items-center justify-center p-1.5 bg-purple-600 rounded text-white hover:bg-purple-500 transition-colors duration-200 shadow-sm"
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
                        Printing Team {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Orders
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">Connected</span>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search orders..."
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