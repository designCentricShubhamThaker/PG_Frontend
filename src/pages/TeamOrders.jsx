


import { Plus, Eye, CheckCircle, ChevronRight, Search } from 'lucide-react';
import { MdDeleteOutline } from "react-icons/md";
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FiEdit } from "react-icons/fi";

import {
  getOrdersFromLocalStorage,
  hasOrdersInLocalStorage,
  saveOrdersToLocalStorage,
  deleteOrderFromLocalStorage,
  updateOrderInLocalStorage,
  updateDispatcherOrderInLocalStorage,
} from '../utils/localStorageUtils';
import UpdateOrderChild from '../child/UpdateOrderChild';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/useAuth.jsx';
import CreateTeamOrderChild from '../child/CreateTeamOrderChild.jsx';
import ViewTeamOrderChild from '../components/viewTeamOrderChild.jsx';

const TeamOrders = ({ orderType }) => {
  const [createOrder, setCreateOrder] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updateOrderDetails, setUpdateOrderDetails] = useState(false);

  const { socket, isConnected, notifyOrderDelete } = useSocket();
  const { user } = useAuth()

  const fetchOrders = async (type = orderType) => {
    try {
      setLoading(true);

      // Use localStorage cache if available
      if (hasOrdersInLocalStorage(type, user.team)) {
        const cachedOrders = getOrdersFromLocalStorage(type, user.team);
        setOrders(cachedOrders);
        setFilteredOrders(cachedOrders);
        setLoading(false);
        return;
      }

      // Make GET request with correct query params: created_by & team
      // const response = await axios.get(
      //   `http://localhost:5000/api/team-orders?orderType=${type}&created_by=${user.username}&team=${encodeURIComponent(user.team)}`
      // );
      const response = await axios.get(
        `https://pg-backend-o05l.onrender.com/api/team-orders?orderType=${type}&created_by=${user.username}&team=${encodeURIComponent(user.team)}`
      );

      const fetchedOrders = response.data.data || [];

      // Save to localStorage with team-specific key
      saveOrdersToLocalStorage(fetchedOrders, type, user.team);

      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch orders: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const getAssignedTeams = (order) => {
    const teams = new Set();
    if (!order.item_ids || !Array.isArray(order.item_ids)) {
      return [];
    }
    order.item_ids.forEach(item => {
      if (item.team_assignments) {
        Object.keys(item.team_assignments).forEach(teamName => {
          if (item.team_assignments[teamName] && item.team_assignments[teamName].length > 0) {
            teams.add(teamName);
          }
        });
      }
    });

    return Array.from(teams);
  };

  // Updated calculateCompletedItems with improved logic similar to DispatcherOrders
  const calculateCompletedItems = (order) => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) {
      console.log(`Order ${order.order_number}: No item_ids found`);
      return 0;
    }

    let completedItemsCount = 0;
    const totalItems = order.item_ids.length;

    console.log(`🔍 Checking completion for Order #${order.order_number} with ${totalItems} items`);

    order.item_ids.forEach((item, itemIndex) => {
      const assignments = item.team_assignments;

      if (!assignments || typeof assignments !== 'object') {
        console.log(`  Item ${itemIndex + 1}: No team_assignments - NOT COMPLETED`);
        return;
      }

      // Get teams that have actual assignments (non-empty arrays)
      const teamsWithAssignments = Object.keys(assignments).filter(teamName => {
        const teamAssignments = assignments[teamName];
        return Array.isArray(teamAssignments) && teamAssignments.length > 0;
      });

      if (teamsWithAssignments.length === 0) {
        console.log(`  Item ${itemIndex + 1}: No valid team assignments - NOT COMPLETED`);
        return;
      }

      let itemFullyCompleted = true;

      // Check each team that has assignments
      for (let teamName of teamsWithAssignments) {
        const teamAssignments = assignments[teamName];
        let teamCompleted = true;

        // Use the improved completion logic
        for (let assignment of teamAssignments) {
          // Check if total_completed_qty meets or exceeds the required quantity
          const isCompleted = assignment.team_tracking?.total_completed_qty >= assignment.quantity;

          if (!isCompleted) {
            teamCompleted = false;
            console.log(`    ❌ ${teamName} - Assignment ${assignment._id || 'N/A'} qty: ${assignment.team_tracking?.total_completed_qty || 0}/${assignment.quantity}`);
            break;
          } else {
            console.log(`    ✅ ${teamName} - Assignment ${assignment._id || 'N/A'} qty: ${assignment.team_tracking?.total_completed_qty}/${assignment.quantity}`);
          }
        }

        if (!teamCompleted) {
          itemFullyCompleted = false;
          console.log(`  ❌ Item ${itemIndex + 1}: ${teamName} has incomplete assignments`);
          break;
        }
      }

      if (itemFullyCompleted) {
        completedItemsCount++;
        console.log(`  ✅ Item ${itemIndex + 1} (${item.name || 'Unknown'}): FULLY COMPLETED`);
      } else {
        console.log(`  ❌ Item ${itemIndex + 1} (${item.name || 'Unknown'}): NOT FULLY COMPLETED`);
      }
    });

    console.log(`📦 Order #${order.order_number}: ${completedItemsCount}/${totalItems} items fully completed`);
    return completedItemsCount;
  };

  // Helper function to move orders between categories
  const moveOrderBetweenCategories = (order, fromCategory, toCategory) => {
    try {
      // Remove from source category
      const sourceOrders = getOrdersFromLocalStorage(fromCategory, user.team) || [];
      const updatedSourceOrders = sourceOrders.filter(o => o._id !== order._id);
      saveOrdersToLocalStorage(updatedSourceOrders, fromCategory, user.team);

      // Add to destination category
      const destOrders = getOrdersFromLocalStorage(toCategory, user.team) || [];
      const existingIndex = destOrders.findIndex(o => o._id === order._id);

      if (existingIndex !== -1) {
        // Update existing order in destination
        destOrders[existingIndex] = order;
      } else {
        // Add new order to destination
        destOrders.unshift(order);
      }

      saveOrdersToLocalStorage(destOrders, toCategory, user.team);

      console.log(`🔄 Moved Order #${order.order_number} from ${fromCategory} to ${toCategory}`);
    } catch (error) {
      console.error('Error moving order between categories:', error);
    }
  };

  const calculateTotalItems = (order) => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) return 0;
    return order.item_ids.length;
  };



  // Updated calculateCompletionPercentage with improved logic
  const calculateCompletionPercentage = (order) => {
    if (!order || !order.item_ids || order.item_ids.length === 0) {
      console.log(`Order ${order.order_number || 'Unknown'}: No items found - 0% complete`);
      return 0;
    }

    const totalItems = order.item_ids.length;
    const completedItems = calculateCompletedItems(order);

    // Simple percentage: (completed items / total items) * 100
    const percentage = Math.round((completedItems / totalItems) * 100);

    console.log(`📊 Order #${order.order_number}: ${completedItems}/${totalItems} items = ${percentage}% complete`);

    // Additional safety check - if percentage is 100%, double-check order status
    if (percentage === 100) {
      console.log(`🎉 Order #${order.order_number}: All items completed for team ${user.team}`);
    }

    return percentage;
  };

  // Updated handleProgressUpdate with improved logic
  const handleProgressUpdate = useCallback((progressData) => {
    console.log('📈 Received progress update:', progressData);

    const orderNumber = progressData.orderNumber || progressData.order_number;
    if (!orderNumber) {
      console.warn('No order number in progress update');
      return;
    }

    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order => {
        if (order.order_number === orderNumber) {
          const updatedOrder = progressData.orderData || progressData.updatedOrder || order;

          const teamType = progressData.team?.toLowerCase().includes('glass') ? 'glass' :
            progressData.team?.toLowerCase().includes('box') ? 'boxes' :
              progressData.team?.toLowerCase().includes('cap') ? 'caps' :
                progressData.team?.toLowerCase().includes('pump') ? 'pumps' : null;

          const mergedOrder = {
            ...order,
            ...updatedOrder,
            item_ids: order.item_ids.map(existingItem => {
              const updatedItem = updatedOrder.item_ids?.find(ui => ui._id === existingItem._id);
              if (updatedItem) {
                const mergedTeamAssignments = {
                  ...existingItem.team_assignments
                };

                if (teamType && updatedItem.team_assignments?.[teamType]) {
                  mergedTeamAssignments[teamType] = updatedItem.team_assignments[teamType];
                }

                return {
                  ...existingItem,
                  ...updatedItem,
                  team_assignments: mergedTeamAssignments
                };
              }
              return existingItem;
            })
          };
          const completedItems = calculateCompletedItems(mergedOrder);
          const totalItems = calculateTotalItems(mergedOrder);
          const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

          const previousStatus = order.order_status;
          const newStatus = completionPercentage === 100 ? 'Completed' : 'Pending';

          const finalOrder = {
            ...mergedOrder,
            order_status: newStatus
          };

          console.log(`🔄 Order #${orderNumber} - Status: ${previousStatus} → ${newStatus}, Completion: ${completionPercentage}%`);

          if (previousStatus !== newStatus) {
            if (newStatus === 'Completed') {
              moveOrderBetweenCategories(finalOrder, 'pending', 'completed');
              console.log(`✅ Order #${orderNumber} moved to completed category`);
            } else if (newStatus === 'Pending' && previousStatus === 'Completed') {
              moveOrderBetweenCategories(finalOrder, 'completed', 'pending');
              console.log(`⏪ Order #${orderNumber} moved back to pending category`);
            }
          } else {
            updateDispatcherOrderInLocalStorage(finalOrder, user.team);
          }

          return finalOrder;
        }
        return order;
      });
      saveOrdersToLocalStorage(updatedOrders, orderType, user.team);
      return updatedOrders;
    });

  }, [orderType, moveOrderBetweenCategories, calculateCompletedItems, calculateTotalItems]);



  const handleOrderDeleted = useCallback((deleteData) => {
    console.log('🗑️ Team orders received order delete notification:', deleteData);
    try {
      const { orderId, orderNumber } = deleteData;
      if (!orderId) {
        console.warn('No order ID in delete notification');
        return;
      }
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(order => order._id !== orderId);
        saveOrdersToLocalStorage(updatedOrders, orderType, user.team);
        return updatedOrders;
      });

      setFilteredOrders(prevFiltered => {
        return prevFiltered.filter(order => order._id !== orderId);
      });
      deleteOrderFromLocalStorage(orderId, user.team);

      toast.success(`Order #${orderNumber} has been deleted successfully`);
      console.log(`✅ Order #${orderNumber} removed from team view`);

    } catch (error) {
      console.error('Error handling order delete notification:', error);
    }
  }, [orderType, user.team]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    console.log('🔌 Setting up socket listeners for team orders');
    socket.on('team-progress-updated', handleProgressUpdate);
    socket.on('order-deleted', handleOrderDeleted);

    return () => {
      socket.off('team-progress-updated', handleProgressUpdate);
      socket.off('order-deleted', handleOrderDeleted);
      console.log('🔌 Cleaned up socket listeners');
    };
  }, [socket, isConnected, handleProgressUpdate, handleOrderDeleted]);

  useEffect(() => {
    fetchOrders(orderType);
  }, [orderType, user.team, user.username]);

  // Updated filtering logic similar to DispatcherOrders
  useEffect(() => {
    if (orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    console.log(`🔍 Filtering orders for ${orderType} view. Total orders:`, orders.length);

    // Filter orders based on orderType
    let filteredByType = orders.filter(order => {
      const isCompleted = order.order_status === 'Completed';

      if (orderType === 'pending') {
        const shouldShow = !isCompleted;
        console.log(`  Order #${order.order_number}: status=${order.order_status}, show in pending=${shouldShow}`);
        return shouldShow;
      }
      if (orderType === 'completed') {
        const shouldShow = isCompleted;
        console.log(`  Order #${order.order_number}: status=${order.order_status}, show in completed=${shouldShow}`);
        return shouldShow;
      }
      return true; // For 'all' view
    });

    // Apply search filter if exists
    if (searchTerm) {
      filteredByType = filteredByType.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log(`📊 Setting filtered orders for ${orderType} view:`, filteredByType.length);
    setFilteredOrders(filteredByType);

  }, [orders, orderType, user.team,user.username, searchTerm]);


  const handleCreateOrder = async () => {
    await fetchOrders(orderType);
    toast.success("Order created successfully!");
  };

  const handleDelete = async (orderId) => {
    try {
      const orderToDelete = orders.find(order => order._id === orderId);

      if (!orderToDelete) {
        toast.error('Order not found');
        return;
      }

      const result = await Swal.fire({
        title: 'Delete Order',
        html: `
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; text-align: center;">
            <div>
              <div style="font-weight: 600; color: #666; font-size: 12px; margin-bottom: 4px;">ORDER</div>
              <div style="font-weight: 700; color: #000;">#${orderToDelete.order_number}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #666; font-size: 12px; margin-bottom: 4px;">CUSTOMER</div>
              <div style="font-weight: 700; color: #000;">${orderToDelete.customer_name}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #666; font-size: 12px; margin-bottom: 4px;">DISPATCHER</div>
              <div style="font-weight: 700; color: #000;">${orderToDelete.dispatcher_name}</div>
            </div>
          </div>
          <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 16px;">
            <strong style="color: #856404;">⚠️ This action cannot be undone</strong>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        width: '600px',
        allowOutsideClick: false
      });

      if (!result.isConfirmed) {
        return;
      }

      Swal.fire({
        title: 'Deleting...',
        html: '<div style="padding: 20px;">Please wait...</div>',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      const assignedTeams = getAssignedTeams(orderToDelete);

      // Updated API call with user parameter
      // const response = await axios.delete(`http://localhost:5000/api/orders/${orderId}?user=${user.username}`);
      const response = await axios.delete(`https://pg-backend-o05l.onrender.com/api/orders/${orderId}?user=${user.username}`);

      if (response.data.success) {
        const deleteNotificationData = {
          orderId: orderToDelete._id,
          orderNumber: orderToDelete.order_number,
          customerName: orderToDelete.customer_name,
          dispatcherName: orderToDelete.dispatcher_name,
          assignedTeams: assignedTeams
        };

        const notificationSent = notifyOrderDelete(deleteNotificationData);

        if (!notificationSent) {
          console.warn('Failed to send delete notification via socket');
        }

        // Update state
        const updatedOrders = orders.filter(order => order._id !== orderId);
        setOrders(updatedOrders);
        setFilteredOrders(filteredOrders.filter(order => order._id !== orderId));
        deleteOrderFromLocalStorage(orderId, user.team);

        Swal.close();

        await Swal.fire({
          title: 'Order Deleted',
          html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 20px 0;">
              <div style="color: #28a745; font-size: 48px;">✓</div>
              <div>
                <div style="font-weight: 600; margin-bottom: 8px;">
                  Order #${orderToDelete.order_number} deleted successfully
                </div>
                ${assignedTeams.length > 0 ?
              `<div style="color: #666; font-size: 14px;">
                    Notifications sent to: <strong>${assignedTeams.join(', ').toUpperCase()}</strong>
                  </div>` : ''
            }
              </div>
            </div>
          `,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          width: '500px'
        });

      } else {
        Swal.close();
        setError('Error deleting order: ' + (response.data.message || 'Unknown error'));
        toast.error('Failed to delete order');
      }
    } catch (err) {
      Swal.close();
      const errorMessage = err.response?.data?.message || err.message;
      setError('Error deleting order: ' + errorMessage);

      await Swal.fire({
        title: 'Delete Failed',
        html: `
          <div style="display: flex; align-items: center; gap: 15px; margin: 20px 0;">
            <div style="color: #dc3545; font-size: 48px;">✗</div>
            <div>
              <div style="font-weight: 600; margin-bottom: 8px;">Unable to delete order</div>
              <div style="color: #666; font-size: 14px; font-family: monospace;">${errorMessage}</div>
            </div>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'OK',
        width: '500px'
      });
    }
  };

  const handleView = (rowData) => {
    setSelectedOrder(rowData);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCreateOrder(false);
    setUpdateOrderDetails(false);
  };

  const handleEdit = (rowData) => {
    setSelectedOrder(rowData);
    setUpdateOrderDetails(true);
  };

  const handleUpdateOrder = (type = orderType) => {
    const updatedOrders = getOrdersFromLocalStorage(type, user.team);
    setOrders(updatedOrders);
    setFilteredOrders(updatedOrders);
  };



  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
      {/* Socket connection indicator */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreateOrder(true)}
            className="cursor-pointer bg-orange-700 text-white flex items-center gap-2 px-3 py-1.5 rounded-sm shadow-md transition-colors duration-200 font-medium hover:bg-red-900 hover:text-white"
          >
            <Plus size={16} /> Create Order
          </button>

          {/* Socket status indicator */}
          {/* <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">
              {isConnected ? 'Real-time updates active' : 'Offline'}
            </span>
          </div> */}
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
          <div className="overflow-auto rounded-lg shadow flex-grow">
            <table className="min-w-full table-auto">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] text-center font-bold text-sm text-white">
                  <th className="px-2 py-3 text-center font-medium w-16">Order #</th>
                  <th className="px-2 py-3 text-center font-medium w-24">Dispatcher</th>
                  <th className="px-2 py-3 text-center font-medium w-24">Customer</th>
                  <th className="px-2 py-3 text-center font-medium w-24">Created At</th>
                  <th className="px-2 py-3 text-center font-medium w-40">Progress</th>
                  <th className="px-2 py-3 text-center font-medium w-16">Status</th>
                  <th className="px-2 py-3 text-center font-medium w-16">Items</th>
                  <th className="px-2 py-3 text-center font-medium w-16">Completed</th>
                  <th className="px-2 py-3 text-center font-medium w-12">View</th>
                  <th className="px-2 py-3 text-center font-medium w-12">Edit</th>
                  <th className="px-2 py-3 text-center font-medium w-12">Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  currentOrders.map((order, idx) => {
                    const rowBgColor = idx % 2 === 0
                      ? 'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]'
                      : 'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]';
                    const completionPercentage = calculateCompletionPercentage(order);
                    const totalItems = calculateTotalItems(order);
                    const completedItems = calculateCompletedItems(order);

                    return (
                      <tr key={order._id} className={`${rowBgColor} transition-all duration-300`}>
                        <td className="px-2 py-3 text-center text-sm font-medium text-[#FF6900]">{order.order_number}</td>
                        <td className="px-2 py-3 text-center text-sm text-[#703800]">{order.dispatcher_name}</td>
                        <td className="px-2 py-3 text-center text-sm text-[#703800]">{order.customer_name}</td>
                        <td className="px-2 py-3 text-center text-sm text-gray-700">{formatDate(order.createdAt)}</td>
                        <td className="px-2 py-3 text-center text-sm">
                          <div className="w-full flex items-center space-x-2">
                            <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                              <div className="bg-white rounded-full h-4 px-1 flex items-center overflow-hidden">
                                <div
                                  className="bg-[#FF6900] h-2.5 rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-red-800 whitespace-nowrap transition-all duration-300">
                              {completionPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          {order.order_status === "Pending" && (
                            <div className="flex justify-center">
                              <img src="./download.svg" alt="" className='w-5 filter drop-shadow-md' />
                            </div>
                          )}
                          {order.order_status === "Completed" && (
                            <div className="flex justify-center">
                              <CheckCircle className="text-orange-500 w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center text-sm">{totalItems}</td>
                        <td className="px-2 py-3 text-center text-sm transition-all duration-300">{completedItems}</td>
                        <td className="px-2 py-3 text-center">
                          <button
                            className="flex items-center justify-center cursor-pointer p-1.5 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm mx-auto"
                            onClick={() => handleView(order)}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            className="flex items-center cursor-pointer justify-center p-1.5 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm mx-auto"
                            onClick={() => handleEdit(order)}
                          >
                            <FiEdit size={16} />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            className="flex items-center cursor-pointer justify-center p-1.5 bg-red-600 rounded-sm text-white hover:bg-red-700 transition-colors duration-200 shadow-sm mx-auto"
                            aria-label="Delete order"
                            onClick={() => handleDelete(order._id)}
                          >
                            <MdDeleteOutline size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="mt-4 mb-2">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                <div className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={ordersPerPage}
                    onChange={handleOrdersPerPageChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-700 hover:bg-orange-100'
                    }`}
                  title="First Page"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-700 hover:bg-orange-100'
                    }`}
                  title="Previous Page"
                >
                  &lt;
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-700 hover:bg-orange-100'
                    }`}
                  title="Next Page"
                >
                  &gt;
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-700 hover:bg-orange-100'
                    }`}
                  title="Last Page"
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {createOrder && (
        <CreateTeamOrderChild
          onClose={handleClose}
          onCreateOrder={handleCreateOrder}
          user={user}
        />
      )}
      {showModal && (
        <ViewTeamOrderChild
          onClose={handleClose}
          order={selectedOrder}
        />
      )}
      {updateOrderDetails && (
        <UpdateOrderChild
          onClose={handleClose}
          order={selectedOrder}
          onUpdateOrder={handleUpdateOrder}
        />
      )}
    </div>
  );
};

export default TeamOrders;