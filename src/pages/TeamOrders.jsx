import { Plus, Eye, CheckCircle, ChevronRight, Search } from 'lucide-react';
import { MdDeleteOutline } from "react-icons/md";
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FiEdit } from "react-icons/fi";

import {
  TEAMS,
  getOrdersFromLocalStorage,
  hasOrdersInLocalStorage,
  saveOrdersToLocalStorage,
  deleteOrderFromLocalStorage,
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
  const { user } = useAuth();

  const fetchOrders = async (type = orderType) => {
    try {
      setLoading(true);
      setError(null); // Reset error state

      // Check user-specific localStorage cache
      if (hasOrdersInLocalStorage(type, TEAMS.MARKETING, user.username)) {
        const cachedOrders = getOrdersFromLocalStorage(type, TEAMS.MARKETING, user.username);
        console.log(`📦 Loaded ${cachedOrders.length} cached orders for user ${user.username}`);
        setOrders(cachedOrders);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/team-orders?orderType=${type}&created_by=${user.username}&team=${encodeURIComponent(TEAMS.MARKETING)}`
      );

      const fetchedOrders = response.data.data || [];
      console.log(`📡 Fetched ${fetchedOrders.length} orders from API for user ${user.username}`);

      // Save to user-specific localStorage
      saveOrdersToLocalStorage(fetchedOrders, type, TEAMS.MARKETING, user.username);
      setOrders(fetchedOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  // Fix 2: Update the filtering logic to ensure proper display
  useEffect(() => {
    console.log(`🔍 Filtering ${orders.length} orders for type: ${orderType}`);

    if (orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    let filteredByType = orders.filter(order => {
      // Ensure order belongs to current user
      if (order.created_by !== user.username) {
        return false;
      }

      const completionPercentage = calculateCompletionPercentage(order);
      const isCompleted = completionPercentage === 100 || order.order_status === 'Completed';

      if (orderType === 'pending') {
        return !isCompleted;
      }
      if (orderType === 'completed') {
        return isCompleted;
      }
      return true;
    });

    if (searchTerm) {
      filteredByType = filteredByType.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log(`✅ Filtered to ${filteredByType.length} orders for display`);
    setFilteredOrders(filteredByType);
  }, [orders, orderType, searchTerm, user.username]);

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

  const calculateCompletedItems = (order) => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) {
      return 0;
    }

    let completedItemsCount = 0;

    order.item_ids.forEach((item) => {
      const assignments = item.team_assignments;
      if (!assignments || typeof assignments !== 'object') {
        return;
      }

      let allAssignmentsForThisItem = [];
      let isThisItemCompleted = true;

      Object.keys(assignments).forEach(teamName => {
        const teamAssignments = assignments[teamName];
        if (Array.isArray(teamAssignments) && teamAssignments.length > 0) {
          allAssignmentsForThisItem.push(...teamAssignments);
          const teamCompleted = teamAssignments.every(assignment => {
            if (teamName === 'caps') {
              const requiredQty = assignment.quantity || 0;
              const hasAssembly = assignment.process && assignment.process.includes('Assembly');

              if (hasAssembly) {
                const metalCompleted = assignment.metal_tracking?.total_completed_qty || 0;
                const assemblyCompleted = assignment.assembly_tracking?.total_completed_qty || 0;
                return metalCompleted >= requiredQty && assemblyCompleted >= requiredQty;
              } else {
                const metalCompleted = assignment.metal_tracking?.total_completed_qty || 0;
                return metalCompleted >= requiredQty;
              }
            } else {
              const completedQty = assignment.team_tracking?.total_completed_qty || 0;
              const requiredQty = assignment.quantity || 0;
              return completedQty >= requiredQty;
            }
          });

          if (!teamCompleted) {
            isThisItemCompleted = false;
          }
        }
      });

      if (allAssignmentsForThisItem.length === 0) {
        isThisItemCompleted = false;
      }

      if (isThisItemCompleted) {
        completedItemsCount++;
      }
    });

    return completedItemsCount;
  };

  const calculateTotalItems = (order) => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) return 0;
    return order.item_ids.length;
  };

  const calculateCompletionPercentage = (order) => {
    if (!order || !order.item_ids || !Array.isArray(order.item_ids) || order.item_ids.length === 0) {
      return 0;
    }

    const totalItems = order.item_ids.length;
    const completedItems = calculateCompletedItems(order);

    if (totalItems === 0) return 0;

    const percentage = Math.round((completedItems / totalItems) * 100);
    return Math.min(percentage, 100);
  };

  const moveOrderBetweenUserCategories = (order, fromCategory, toCategory) => {
    try {
      console.log(`Moving order ${order.order_number} from ${fromCategory} to ${toCategory} for user ${user.username}`);

      // Remove from source category
      const sourceOrders = getOrdersFromLocalStorage(fromCategory, TEAMS.MARKETING, user.username);
      const updatedSourceOrders = sourceOrders.filter(o => o._id !== order._id);
      saveOrdersToLocalStorage(updatedSourceOrders, fromCategory, TEAMS.MARKETING, user.username);

      // Add to destination category
      const destOrders = getOrdersFromLocalStorage(toCategory, TEAMS.MARKETING, user.username);
      const existingIndex = destOrders.findIndex(o => o._id === order._id);

      if (existingIndex !== -1) {
        destOrders[existingIndex] = order;
      } else {
        destOrders.unshift(order);
      }

      saveOrdersToLocalStorage(destOrders, toCategory, TEAMS.MARKETING, user.username);
      console.log(`Successfully moved order ${order.order_number} for user ${user.username}`);
    } catch (error) {
      console.error('Error moving order between categories:', error);
    }
  };

  const handleProgressUpdate = useCallback((progressData) => {
    console.log('📈 Team received progress update:', progressData);
    const orderNumber = progressData.orderNumber || progressData.order_number;
    if (!orderNumber) {
      console.warn('No order number in progress update');
      return;
    }

    setOrders(prevOrders => {
      const orderIndex = prevOrders.findIndex(order => order.order_number === orderNumber);

      if (orderIndex === -1) {
        console.warn(`Order ${orderNumber} not found in current orders list`);
        return prevOrders;
      }

      const order = prevOrders[orderIndex];

      // Ensure order belongs to current user
      if (order.created_by !== user.username) {
        console.log(`⏭️ Progress update for order ${orderNumber} not for current user, skipping`);
        return prevOrders;
      }

      // Get the updated order data
      const updatedOrder = progressData.orderData || progressData.updatedOrder || order;

      // Merge the order data
      const mergedOrder = {
        ...order,
        ...updatedOrder,
        item_ids: order.item_ids.map(existingItem => {
          const updatedItem = updatedOrder.item_ids?.find(ui => ui._id === existingItem._id);
          if (!updatedItem) return existingItem;

          // Merge team assignments deeply
          const mergedAssignments = {};
          const allTeams = new Set([
            ...Object.keys(existingItem.team_assignments || {}),
            ...Object.keys(updatedItem.team_assignments || {})
          ]);

          allTeams.forEach(team => {
            const existingTeamAssignments = existingItem.team_assignments?.[team] || [];
            const updatedTeamAssignments = updatedItem.team_assignments?.[team] || [];

            const mergedTeamAssignments = existingTeamAssignments.map(assign => {
              const updated = updatedTeamAssignments.find(u => u._id === assign._id);
              return updated ? { ...assign, ...updated } : assign;
            });

            updatedTeamAssignments.forEach(updated => {
              if (!mergedTeamAssignments.find(assign => assign._id === updated._id)) {
                mergedTeamAssignments.push(updated);
              }
            });

            mergedAssignments[team] = mergedTeamAssignments;
          });

          return {
            ...existingItem,
            ...updatedItem,
            team_assignments: mergedAssignments
          };
        })
      };

      const completionPercentage = calculateCompletionPercentage(mergedOrder);
      const previousStatus = order.order_status;
      const newStatus = completionPercentage === 100 ? 'Completed' : 'Pending';

      const finalOrder = {
        ...mergedOrder,
        order_status: newStatus
      };

      console.log(`📊 Order ${orderNumber} Progress: ${completionPercentage}% - Status: ${newStatus}`);

      // Handle status changes
      if (previousStatus !== newStatus) {
        if (newStatus === 'Completed' && orderType === 'pending') {
          moveOrderBetweenUserCategories(finalOrder, 'pending', 'completed');
          toast.success(`Order #${orderNumber} has been completed!`);
        } else if (newStatus === 'Pending' && previousStatus === 'Completed' && orderType === 'completed') {
          moveOrderBetweenUserCategories(finalOrder, 'completed', 'pending');
          toast.info(`Order #${orderNumber} moved back to pending`);
        }
      }

      // Update localStorage
      updateDispatcherOrderInLocalStorage(finalOrder, TEAMS.MARKETING, user.username);

      // Update the orders array
      const updatedOrders = [...prevOrders];
      updatedOrders[orderIndex] = finalOrder;

      // Save updated orders to localStorage
      saveOrdersToLocalStorage(updatedOrders, orderType, TEAMS.MARKETING, user.username);

      return updatedOrders;
    });
  }, [orderType, user.username]);

  const handleNewOrder = useCallback((orderData) => {
    try {
      const { orderData: newOrder, orderNumber } = orderData;
      console.log(`🆕 Received new order: ${orderNumber}`, newOrder);

      if (!newOrder || !newOrder._id) {
        console.warn('Invalid new order data received');
        return;
      }
      if (newOrder.created_by !== user.username) {
        console.log(`⏭️ Order ${orderNumber} not created by current user (${user.username}), skipping`);
        return;
      }
      console.log(`✅ Order ${orderNumber} created by marketing team member ${user.username}`);

      if (orderType === 'pending') {
        setOrders(prevOrders => {
          const existingOrderIndex = prevOrders.findIndex(order => order._id === newOrder._id);
          let updatedOrders;
          if (existingOrderIndex !== -1) {
            updatedOrders = [...prevOrders];
            updatedOrders[existingOrderIndex] = newOrder;
            console.log(`🔄 Updated existing order ${orderNumber} in pending list`);
          } else {
            updatedOrders = [newOrder, ...prevOrders];
            console.log(`➕ Added new order ${orderNumber} to pending list`);
          }

          saveOrdersToLocalStorage(updatedOrders, 'pending', TEAMS.MARKETING, user.username);
          return updatedOrders;
        });

        toast.success(`New order #${orderNumber} created`);
      }
    } catch (error) {
      console.error('Error handling new order:', error);
    }
  }, [orderType, user.username]);

  const handleOrderUpdated = useCallback((updateData) => {
    try {
      const { orderData: updatedOrder, orderNumber } = updateData;
      if (!updatedOrder || !updatedOrder._id) {
        return;
      }

  
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
        saveOrdersToLocalStorage(updatedOrders, orderType, TEAMS.MARKETING, user.username);
        return updatedOrders;
      });

      toast.info(`Order #${orderNumber} has been updated`);
    } catch (error) {
      console.error('Error handling order update:', error);
    }
  }, [orderType, user.username]);

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
        saveOrdersToLocalStorage(updatedOrders, orderType, TEAMS.MARKETING, user.username);
        return updatedOrders;
      });

      // Also remove from other category
      const otherType = orderType === 'pending' ? 'completed' : 'pending';
      const otherOrders = getOrdersFromLocalStorage(otherType, TEAMS.MARKETING, user.username);
      const filteredOtherOrders = otherOrders.filter(order => order._id !== orderId);
      saveOrdersToLocalStorage(filteredOtherOrders, otherType, TEAMS.MARKETING, user.username);

      toast.success(`Order #${orderNumber} has been deleted successfully`);
      console.log(`✅ Order #${orderNumber} removed from team view`);
    } catch (error) {
      console.error('Error handling order delete notification:', error);
    }
  }, [orderType, user.username]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    console.log('🔌 Setting up socket listeners for team orders');

    socket.on('new-order', handleNewOrder);
    socket.on('order-updated', handleOrderUpdated);
    socket.on('team-progress-updated', handleProgressUpdate);
    socket.on('order-deleted', handleOrderDeleted);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-updated', handleOrderUpdated);
      socket.off('team-progress-updated', handleProgressUpdate);
      socket.off('order-deleted', handleOrderDeleted);
      console.log('🔌 Cleaned up socket listeners');
    };
  }, [socket, isConnected, handleNewOrder, handleOrderUpdated, handleProgressUpdate, handleOrderDeleted]);

  useEffect(() => {
    if (user?.username) {
      fetchOrders(orderType);
    }
  }, [orderType, user?.username]);

  useEffect(() => {
    if (orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    let filteredByType = orders.filter(order => {
      const completionPercentage = calculateCompletionPercentage(order);
      const isCompleted = completionPercentage === 100 || order.order_status === 'Completed';

      if (orderType === 'pending') {
        return !isCompleted;
      }
      if (orderType === 'completed') {
        return isCompleted;
      }
      return true;
    });

    if (searchTerm) {
      filteredByType = filteredByType.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filteredByType);
  }, [orders, orderType, searchTerm]);

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
      const response = await axios.delete(`http://localhost:5000/api/orders/${orderId}?user=${user.username}`);
      // const response = await axios.delete(`https://pg-backend-o05l.onrender.com/api/orders/${orderId}?user=${user.username}`);

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
        deleteOrderFromLocalStorage(orderId, TEAMS.MARKETING);

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
    const updatedOrders = getOrdersFromLocalStorage(type, TEAMS.MARKETING);
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