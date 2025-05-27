import { Plus, Eye, CheckCircle, ChevronRight, Search } from 'lucide-react';
import { MdDeleteOutline } from "react-icons/md";
import React, { useState, useEffect } from 'react';
import CreateOrderChild from '../child/CreateOrderChild';
import axios from 'axios';
import { FiEdit } from "react-icons/fi";
import ViewOrderComponent from '../components/viewDispatcherOrders';
import {
  getOrdersFromLocalStorage,
  hasOrdersInLocalStorage,
  saveOrdersToLocalStorage,
  deleteOrderFromLocalStorage
} from '../utils/localStorageUtils';
import UpdateOrderChild from '../child/UpdateOrderChild';

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
  const [updateOrderDetails, setUpdateOrderDetails] = useState(false)

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
  };

  const handleDelete = async (orderId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/orders/${orderId}`);

      if (response.data.success) {
        deleteOrderFromLocalStorage(orderId);
        const updatedOrders = orders.filter(order => order._id !== orderId);
        setOrders(updatedOrders);
        setFilteredOrders(filteredOrders.filter(order => order._id !== orderId));
      } else {
        setError('Error deleting order: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Error deleting order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleView = (rowData) => {
    setSelectedOrder(rowData);
    setShowModal(true);

  };

  const handleClose = () => {
    setShowModal(false);
    setCreateOrder(false);
    setUpdateOrderDetails(false)
  };

  const handleEdit = (rowData) => {
    setSelectedOrder(rowData);
    setUpdateOrderDetails(true)
  };

  const handleUpdateOrder = (type = orderType) => {
    const updatedOrders = getOrdersFromLocalStorage(type); 
    setOrders(updatedOrders);
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
  }

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
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCreateOrder(true)}
          className="cursor-pointer bg-orange-700 text-white flex items-center gap-2 px-3 py-1.5 rounded-sm shadow-md transition-colors duration-200 font-medium hover:bg-red-900 hover:text-white"
        >
          <Plus size={16} /> Create Order
        </button>

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
                  <th className="px-2 py-3 text-center font-medium w-16">Order No</th>
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
                      <tr key={order._id} className={rowBgColor}>
                        <td className="px-2 py-3 text-center text-sm font-medium text-[#FF6900]">{order.order_number}</td>
                        <td className="px-2 py-3 text-center text-sm text-[#703800]">{order.dispatcher_name}</td>
                        <td className="px-2 py-3 text-center text-sm text-[#703800]">{order.customer_name}</td>
                        <td className="px-2 py-3 text-center text-sm text-gray-700">{formatDate(order.createdAt)}</td>
                        <td className="px-2 py-3 text-center text-sm">
                          <div className="w-full flex items-center space-x-2">
                            <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                              <div className="bg-white rounded-full h-4 px-1 flex items-center overflow-hidden">
                                <div
                                  className="bg-[#FF6900] h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
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
                        <td className="px-2 py-3 text-center text-sm">{completedItems}</td>
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
                            className="flex items-center cursor-pointer justify-center p-1.5 bg-orange-700 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm mx-auto"
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