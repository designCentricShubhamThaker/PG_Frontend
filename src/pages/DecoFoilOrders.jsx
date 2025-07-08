
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
import UpdatePrintQty from '../updateQuanityComponents/updatePrintQty.jsx';

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

    // 🔥 FIXED: Enhanced merge logic with better item preservation
const mergeOrUpdateOrder = (existingOrder, newOrderData) => {
  console.log('🔄 Merging order from backend:', {
    orderId: existingOrder._id,
    existingItems: existingOrder.item_ids?.length || 0,
    newItems: newOrderData.item_ids?.length || 0
  });

  const mergedOrder = {
    ...existingOrder,
    ...newOrderData,
    item_ids: []
  };

  // Create a map of existing items for quick lookup
  const existingItemsMap = new Map();
  (existingOrder.item_ids || []).forEach(item => {
    existingItemsMap.set(item._id.toString(), item);
  });

  // 🔥 FIX: Track all items that should be in the final order
  const finalItemsMap = new Map();

  // Process new items first
  (newOrderData.item_ids || []).forEach(newItem => {
    const existingItem = existingItemsMap.get(newItem._id.toString());

    if (existingItem) {
      // Merge existing item with new data
      const mergedItem = {
        ...existingItem,
        ...newItem,
        team_assignments: {
          ...existingItem.team_assignments,
          ...newItem.team_assignments
        }
      };

      // Specifically handle foiling assignments
      if (newItem.team_assignments?.foiling?.length > 0) {
        const existingfoilingAssignments = existingItem.team_assignments?.foiling || [];
        const newfoilingAssignments = newItem.team_assignments.foiling;

        const mergedfoilingAssignments = new Map();

        // Add existing assignments with their tracking data
        existingfoilingAssignments.forEach(existing => {
          const key = existing._id || existing.glass_item_id;
          mergedfoilingAssignments.set(key.toString(), {
            ...existing,
            // Preserve tracking data
            team_tracking: existing.team_tracking || {
              total_completed_qty: 0,
              completed_entries: []
            }
          });
        });

        // Merge new assignments, preserving tracking data
        newfoilingAssignments.forEach(newAssignment => {
          const key = newAssignment._id || newAssignment.glass_item_id;
          const existing = mergedfoilingAssignments.get(key.toString());

          mergedfoilingAssignments.set(key.toString(), {
            ...newAssignment,
            // Preserve existing tracking data if it exists
            team_tracking: existing?.team_tracking || newAssignment.team_tracking || {
              total_completed_qty: 0,
              completed_entries: []
            },
            // Mark new assignments appropriately
            isNewAssignment: existing ? false : (newAssignment.isNewAssignment ?? true)
          });
        });

        mergedItem.team_assignments.foiling = Array.from(mergedfoilingAssignments.values());
      }

      finalItemsMap.set(newItem._id.toString(), mergedItem);
    } else {
      // New item - add with proper assignment marking
      const newItemWithMarkedAssignments = {
        ...newItem,
        team_assignments: {
          ...newItem.team_assignments,
          foiling: (newItem.team_assignments?.foiling || []).map(assignment => ({
            ...assignment,
            isNewAssignment: assignment.isNewAssignment ?? true,
            team_tracking: assignment.team_tracking || {
              total_completed_qty: 0,
              completed_entries: []
            }
          }))
        }
      };
      finalItemsMap.set(newItem._id.toString(), newItemWithMarkedAssignments);
    }
  });

  // 🔥 FIX: Add remaining existing items that have foiling assignments
  existingItemsMap.forEach((remainingItem, itemId) => {
    if (!finalItemsMap.has(itemId) && remainingItem.team_assignments?.foiling?.length > 0) {
      finalItemsMap.set(itemId, remainingItem);
    }
  });

  // Convert map to array
  mergedOrder.item_ids = Array.from(finalItemsMap.values());

  console.log('✅ Order merged successfully:', {
    orderId: mergedOrder._id,
    finalItems: mergedOrder.item_ids?.length || 0,
    foilingAssignments: mergedOrder.item_ids?.reduce((sum, item) =>
      sum + (item.team_assignments?.foiling?.length || 0), 0)
  });

  return mergedOrder;
};

// 🔥 FIXED: Better decoration order handling
const handleDecorationOrderReady = useCallback((decorationData) => {
  console.log('🎨 Received decoration order from backend:', decorationData);

  if (!decorationData.orderData) {
    console.warn('No order data in decoration notification');
    return;
  }

  let { orderData, decorationType, sequencePosition, totalSequenceSteps } = decorationData;

  // 🔥 FIX: Filter only items with ready_for_decoration assignments
  if (orderData.item_ids?.length > 0) {
    orderData.item_ids = orderData.item_ids.filter(item => {
      const foilingAssignments = item.team_assignments?.foiling || [];
      const hasReadyAssignments = foilingAssignments.some(assign => assign.ready_for_decoration);
      console.log(`📋 Item ${item.name} has ready assignments:`, hasReadyAssignments);
      return hasReadyAssignments;
    });
  }

  if (orderData.item_ids?.length === 0) {
    console.log('⛔ No items with ready_for_decoration = true, skipping order');
    return;
  }

  // Check if order matches current view
  if (!orderMatchesCurrentView(orderData)) {
    console.log('Order does not match current view type');
    return;
  }

  setOrders(prevOrders => {
    const existingOrderIndex = prevOrders.findIndex(order => order._id === orderData._id);

    if (existingOrderIndex >= 0) {
      // Update existing order
      const existingOrder = prevOrders[existingOrderIndex];
      const mergedOrder = mergeOrUpdateOrder(existingOrder, orderData);

      // Update decoration sequence info
      mergedOrder.decorationSequence = {
        ...mergedOrder.decorationSequence,
        type: decorationType,
        position: sequencePosition,
        totalSteps: totalSequenceSteps,
        readyForDecoration: true
      };

      const updatedOrders = [...prevOrders];
      updatedOrders[existingOrderIndex] = mergedOrder;

      console.log('💾 Saving updated orders to localStorage:', updatedOrders.length);
      saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
      return updatedOrders;
    } else {
      // Add new order
      const newOrder = {
        ...orderData,
        decorationSequence: {
          type: decorationType,
          position: sequencePosition,
          totalSteps: totalSequenceSteps,
          readyForDecoration: true
        }
      };

      const updatedOrders = [newOrder, ...prevOrders];
      console.log('💾 Saving new orders to localStorage:', updatedOrders.length);
      saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
      return updatedOrders;
    }
  });

  toast.success(`🎨 Order #${orderData.order_number} ready for foiling! (${decorationType})`, {
    duration: 5000
  });
}, [orderType]);

// 🔥 FIXED: Better new order handling
const handleNewOrder = useCallback((orderData) => {
  console.log('📦 Received new order from backend:', orderData);

  if (!orderData.orderData) return;
  let newOrder = orderData.orderData;

  // ✅ Filter only items that have foiling assignments
  const filteredItems = newOrder.item_ids?.filter(item => {
    const hasfoilingAssignments = item.team_assignments?.foiling?.length > 0;
    console.log(`📋 Item ${item.name} has foiling assignments:`, hasfoilingAssignments);
    return hasfoilingAssignments;
  });

  if (!filteredItems || filteredItems.length === 0) {
    console.log('New order has no foiling assignments. Ignored.');
    return;
  }

  // ✅ Replace item_ids with only relevant ones
  newOrder = { ...newOrder, item_ids: filteredItems };

  // ✅ Check if it matches current view
  if (!orderMatchesCurrentView(newOrder)) {
    console.log('Filtered new order does not match current view type');
    return;
  }

  setOrders(prevOrders => {
    const existingOrderIndex = prevOrders.findIndex(order => order._id === newOrder._id);

    if (existingOrderIndex >= 0) {
      const existingOrder = prevOrders[existingOrderIndex];
      const mergedOrder = mergeOrUpdateOrder(existingOrder, newOrder);

      const updatedOrders = [...prevOrders];
      updatedOrders[existingOrderIndex] = mergedOrder;

      saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
      return updatedOrders;
    } else {
      const updatedOrders = [newOrder, ...prevOrders];
      saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
      return updatedOrders;
    }
  });

  toast.success(`📦 New order #${newOrder.order_number} received!`, { duration: 4000 });
}, [orderType]);

    const orderMatchesCurrentView = (order) => {
        const orderStatus = isOrderCompleted(order) ? 'completed' : 'pending';
        const currentViewType = orderType.toLowerCase();
        return orderStatus === currentViewType;
    };



    // Handle general order updates
    const handleOrderUpdate = useCallback((updateData) => {
        console.log('✏️ Received order update from backend:', updateData);

        if (!updateData.orderData) return;

        const { orderData, hasAssignments, wasRemoved } = updateData;

        setOrders(prevOrders => {
            const existingOrderIndex = prevOrders.findIndex(order => order._id === orderData._id);

            if (wasRemoved || !hasAssignments) {
                // Remove order
                if (existingOrderIndex >= 0) {
                    const filteredOrders = prevOrders.filter(order => order._id !== orderData._id);
                    saveTeamOrdersToLocalStorage(filteredOrders, orderType, TEAMS.FOILING);
                    return filteredOrders;
                }
                return prevOrders;
            }

            // Check if order matches current view
            if (!orderMatchesCurrentView(orderData)) {
                if (existingOrderIndex >= 0) {
                    const filteredOrders = prevOrders.filter(order => order._id !== orderData._id);
                    saveTeamOrdersToLocalStorage(filteredOrders, orderType, TEAMS.FOILING);
                    return filteredOrders;
                }
                return prevOrders;
            }

            if (existingOrderIndex >= 0) {
                // Update existing order
                const existingOrder = prevOrders[existingOrderIndex];
                const mergedOrder = mergeOrUpdateOrder(existingOrder, orderData);

                const updatedOrders = [...prevOrders];
                updatedOrders[existingOrderIndex] = mergedOrder;

                saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
                return updatedOrders;
            } else {
                // Add new order
                const updatedOrders = [orderData, ...prevOrders];
                saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
                return updatedOrders;
            }
        });
    }, [orderType]);

   
    ;

    // Handle order deletion
    const handleOrderDeleted = useCallback((deleteData) => {
        console.log('🗑️ Received order delete notification:', deleteData);

        const { orderId, orderNumber } = deleteData;
        if (!orderId) return;

        setOrders(prevOrders => {
            const updatedOrders = prevOrders.filter(order => order._id !== orderId);
            saveTeamOrdersToLocalStorage(updatedOrders, orderType, TEAMS.FOILING);
            return updatedOrders;
        });

        setFilteredOrders(prevFiltered => {
            return prevFiltered.filter(order => order._id !== orderId);
        });

        deleteOrderFromLocalStorage(orderId);
        toast.success(`Order #${orderNumber} has been deleted`);
    }, [orderType]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new-order', handleNewOrder);
        socket.on('order-updated', handleOrderUpdate);
        socket.on('order-deleted', handleOrderDeleted);
        socket.on('decoration-order-ready', handleDecorationOrderReady);

        return () => {
            socket.off('new-order', handleNewOrder);
            socket.off('order-updated', handleOrderUpdate);
            socket.off('order-deleted', handleOrderDeleted);
            socket.off('decoration-order-ready', handleDecorationOrderReady);
        };
    }, [socket, handleNewOrder, handleOrderUpdate, handleOrderDeleted, handleDecorationOrderReady]);

    // Fetch orders from backend
    const fetchPrintOrders = async (type = orderType) => {
        try {
            setLoading(true);

            // Check cache first
            if (hasTeamOrdersInLocalStorage(type, TEAMS.FOILING)) {
                const cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.FOILING);
                setOrders(cachedOrders);
                setFilteredOrders(cachedOrders);
                setLoading(false);
                return;
            }

            // Fetch from backend
            const response = await axios.get(`http://localhost:5000/api/print?orderType=${type}`);
            const fetchedOrders = response.data.data || [];

            // Backend already provides filtered and validated data
            saveTeamOrdersToLocalStorage(fetchedOrders, type, TEAMS.FOILING);
            setOrders(fetchedOrders);
            setFilteredOrders(fetchedOrders);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch foiling orders: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchPrintOrders(orderType);
    }, [orderType]);

    // Search functionality
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

    // Update order status helper
    const updateOrderStatus = (updatedOrder) => {
        const isCompleted = isOrderCompleted(updatedOrder);
        const newStatus = isCompleted ? 'Completed' : 'Pending';

        if (updatedOrder.order_status !== newStatus) {
            updatedOrder.order_status = newStatus;
        }

        updateOrderInLocalStorage(updatedOrder._id, updatedOrder, TEAMS.FOILING);
        return updatedOrder;
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

                {currentOrders.map((order, orderIndex) => {
                    let totalOrderRows = 0;
                    order.item_ids?.forEach(item => {
                        const pritningAssignments = item.team_assignments?.foiling || [];
                        totalOrderRows += Math.max(1, pritningAssignments.length);
                    });

                    let currentRowInOrder = 0;

                    return (
                        <div key={`order-${order._id}`} className="bg-white rounded-lg shadow-sm border border-orange-200 mb-3 overflow-hidden">
                            {order.item_ids?.map((item, itemIndex) => {
                                const pritningAssignments = item.team_assignments?.foiling || [];
                                const assignments = pritningAssignments.length === 0 ? [null] : pritningAssignments;
                                const bgColor = colorClasses[itemIndex % colorClasses.length];

                                return assignments.map((pritning, assignmentIndex) => {
                                    const isFirstRowOfOrder = currentRowInOrder === 0;
                                    const isFirstRowOfItem = assignmentIndex === 0;
                                    const isLastRowOfOrder = currentRowInOrder === totalOrderRows - 1;
                                    currentRowInOrder++;
                                    const remainingQty = pritning ? getRemainingQty(pritning) : 'N/A';
                                    const status = pritning ? getAssignmentStatus(pritning) : 'N/A';

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
                                            key={`${order._id}-${item._id}-${pritning?._id || 'empty'}-${assignmentIndex}`}
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
                                                {pritning ? (pritning.bottle || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-orange-900">
                                                {pritning ? (pritning.quantity || 'N/A') : 'N/A'}
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
                                                {pritning ? (pritning.neck_size || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-gray-800">
                                                {pritning ? (pritning.weight || 'N/A') : 'N/A'}
                                            </div>

                                            <div className="text-left text-gray-800">
                                                {pritning ? (pritning.decoration_no || 'N/A') : 'N/A'}
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
                <UpdatePrintQty
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

