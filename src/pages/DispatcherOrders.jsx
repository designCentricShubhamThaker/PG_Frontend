
import { Plus, Eye, CheckCircle, ChevronRight, Search } from 'lucide-react';
import { MdDeleteOutline } from "react-icons/md";
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import CreateOrderChild from '../child/CreateOrderChild.jsx';
import axios from 'axios';
import { FiEdit } from "react-icons/fi";
import ViewOrderComponent from '../components/viewDispatcherOrders.jsx';
import {
  getOrdersFromLocalStorage,
  hasOrdersInLocalStorage,
  saveOrdersToLocalStorage,
  deleteOrderFromLocalStorage,
  updateOrderInLocalStorage,
  updateDispatcherOrderInLocalStorage
} from '../utils/localStorageUtils';
import UpdateOrderChild from '../child/UpdateOrderChild';
import { useSocket } from '../context/SocketContext';

const DispatcherOrders = ({ orderType }) => {
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

  const fetchOrders = async (type = orderType) => {
    try {
      setLoading(true);
      if (hasOrdersInLocalStorage(type)) {
        const cachedOrders = getOrdersFromLocalStorage(type);
        setOrders(cachedOrders);
        setFilteredOrders(cachedOrders);
        setLoading(false);
        return;
      }

      // const response = await axios.get(`https://pg-backend-udfn.onrender.com/api/orders?orderType=${type}`);
      const response = await axios.get(`http://localhost:5000/api/orders?orderType=${type}`);
      const fetchedOrders = response.data.data || [];

      saveOrdersToLocalStorage(fetchedOrders, type);
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

  const handleProgressUpdate = useCallback((progressData) => {
    console.log('📈 Received progress update in dispatcher:', progressData);
    try {
      const orderNumber = progressData.orderNumber || progressData.order_number;

      if (!orderNumber) {
        console.warn('No order number in progress update');
        return;
      }
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order.order_number === orderNumber) {
            let updatedOrder;
            if (progressData.orderData && progressData.orderData._id) {
              updatedOrder = { ...order, ...progressData.orderData };
            } else {
              updatedOrder = { ...order };
            }
            
            if (updatedOrder.order_status === 'Completed' && order.order_status !== 'Completed') {
              console.log(`Order ${orderNumber} completed, updating localStorage`);
              updateDispatcherOrderInLocalStorage(updatedOrder);
              
              if (orderType === 'pending') {
                return null;
              }
            } else if (updatedOrder.order_status !== 'Completed' && updatedOrder !== order) {
              updateDispatcherOrderInLocalStorage(updatedOrder);
            }
            
            return updatedOrder;
          }
          return order;
        }).filter(Boolean); 
  
        const orderToUpdate = updatedOrders.find(o => o.order_number === orderNumber);
        if (orderToUpdate && orderToUpdate.order_status !== 'Completed') {
          saveOrdersToLocalStorage(updatedOrders, orderType);
        }     
        return updatedOrders;
      });

      setFilteredOrders(prevFiltered => {
        return prevFiltered.map(order => {
          if (order.order_number === orderNumber) {
            let updatedOrder;
            if (progressData.orderData && progressData.orderData._id) {
              updatedOrder = { ...order, ...progressData.orderData };
            } else {
              updatedOrder = { ...order };
            }
            if (orderType === 'pending' && updatedOrder.order_status === 'Completed') {
              return null;
            }
            return updatedOrder;
          }
          return order;
        }).filter(Boolean)
      });

      console.log(`✅ Order #${orderNumber} progress updated in real-time`);
      
    } catch (error) {
      console.error('Error handling progress update:', error);
    }
  }, [orderType, updateDispatcherOrderInLocalStorage]);

  const handleOrderDeleted = useCallback((deleteData) => {
    console.log('🗑️ Dispatcher received order delete notification:', deleteData);
    try {
      const { orderId, orderNumber } = deleteData;
      if (!orderId) {
        console.warn('No order ID in delete notification');
        return;
      }
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(order => order._id !== orderId);
        saveOrdersToLocalStorage(updatedOrders, orderType);
        return updatedOrders;
      });

      setFilteredOrders(prevFiltered => {
        return prevFiltered.filter(order => order._id !== orderId);
      });
      deleteOrderFromLocalStorage(orderId);

      toast.success(`Order #${orderNumber} has been deleted successfully`);
      console.log(`✅ Order #${orderNumber} removed from dispatcher view`);
      
    } catch (error) {
      console.error('Error handling order delete notification:', error);
    }
  }, [orderType]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    console.log('🔌 Setting up socket listeners for dispatcher orders');
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
  }, [orderType]);

  useEffect(() => {
    if (orders.length > 0) {
      const filtered = orders.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, orders]);

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

    // API call (uncomment the appropriate one)
    // const response = await axios.delete(`https://pg-backend-udfn.onrender.com/api/orders/${orderId}`);
    const response = await axios.delete(`http://localhost:5000/api/orders/${orderId}`);

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
      deleteOrderFromLocalStorage(orderId);

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
    const updatedOrders = getOrdersFromLocalStorage(type);
    setOrders(updatedOrders);
    setFilteredOrders(updatedOrders);
  };

  const calculateTotalItems = (order) => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) return 0;
    return order.item_ids.length;
  };

  const calculateCompletedItems = (order) => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) return 0;
    let completedItems = 0;

    order.item_ids.forEach(item => {
      let allCompleted = true;
      let hasAssignments = false;

      const teamAssignments = item.team_assignments || {};

      if (teamAssignments.glass && teamAssignments.glass.length > 0) {
        hasAssignments = true;
        for (const glass of teamAssignments.glass) {
          if (glass.status !== 'Completed') {
            allCompleted = false;
            break;
          }
        }
      }
      if (allCompleted && teamAssignments.caps && teamAssignments.caps.length > 0) {
        hasAssignments = true;
        for (const cap of teamAssignments.caps) {
          if (cap.status !== 'Completed') {
            allCompleted = false;
            break;
          }
        }
      }

      if (allCompleted && teamAssignments.boxes && teamAssignments.boxes.length > 0) {
        hasAssignments = true;
        for (const box of teamAssignments.boxes) {
          if (box.status !== 'Completed') {
            allCompleted = false;
            break;
          }
        }
      }

      if (allCompleted && teamAssignments.pumps && teamAssignments.pumps.length > 0) {
        hasAssignments = true;
        for (const pump of teamAssignments.pumps) {
          if (pump.status !== 'Completed') {
            allCompleted = false;
            break;
          }
        }
      }

      if (hasAssignments && allCompleted) {
        completedItems++;
      }
    });

    return completedItems;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateCompletionPercentage = (order) => {
    if (!order || !order.item_ids || order.item_ids.length === 0) return 0;

    const totalItems = order.item_ids.length;
    let completedItems = 0;

    order.item_ids.forEach(item => {
      let totalAssignments = 0;
      let completedAssignments = 0;

      Object.values(item.team_assignments).forEach(assignments => {
        totalAssignments += assignments.length;
        completedAssignments += assignments.filter(a => a.status === 'Completed').length;
      });
      if (totalAssignments > 0 && completedAssignments === totalAssignments) {
        completedItems += 1;
      }
    });

    const percent = (completedItems / totalItems) * 100;
    return Number(percent.toFixed(2));
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
        <CreateOrderChild
          onClose={handleClose}
          onCreateOrder={handleCreateOrder}
        />
      )}
      {showModal && (
        <ViewOrderComponent
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

export default DispatcherOrders;