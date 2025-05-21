import React from 'react'
import { useState, useEffect } from "react";
import { Eye,  X } from "lucide-react";

export default function GlassDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/glass');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setOrders(result.data);
        } else {
          throw new Error("Invalid data format received from API");
        }
      } catch (err) {
        console.error("Error fetching glass team data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);


  const getOrderGlassStatus = (order) => {
    let completed = 0;
    let total = 0;
    
    order.item_ids.forEach(item => {
      if (item.team_assignments && item.team_assignments.glass) {
        item.team_assignments.glass.forEach(glass => {
          total++;
          if (glass.status === "Completed") {
            completed++;
          }
        });
      }
    });
    
    if (total === 0) return "No Glass Items";
    if (completed === 0) return "Pending";
    if (completed === total) return "Completed";
    return `In Progress (${completed}/${total})`;
  };

  const handleView = (order) => {
    setViewOrder(order);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-lg font-semibold">Loading glass team data...</div>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-lg font-semibold text-red-500">Error: {error}</div>
    </div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Glass Team Dashboard</h1>
      
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Order Number</th>
              <th className="py-3 px-4 text-left">Dispatcher</th>
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-left">Created At</th>
              <th className="py-3 px-4 text-left">Glass Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center">
                  No glass team orders found
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {order.order_number}
                  </td>
                  <td className="py-3 px-4">
                    {order.dispatcher_name}
                  </td>
                  <td className="py-3 px-4">
                    {order.customer_name}
                  </td>
                  <td className="py-3 px-4">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getOrderGlassStatus(order).includes("Completed") 
                        ? "bg-green-100 text-green-800" 
                        : getOrderGlassStatus(order).includes("In Progress") 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-gray-100 text-gray-800"
                    }`}>
                      {getOrderGlassStatus(order)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleView(order)}
                      className="mr-2 p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={18} />
                    </button>
                    
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing order details */}
      {isModalOpen && viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Order Details: {viewOrder.order_number}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer:</p>
                      <p className="mt-1">{viewOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dispatcher:</p>
                      <p className="mt-1">{viewOrder.dispatcher_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created Date:</p>
                      <p className="mt-1">{formatDate(viewOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order Status:</p>
                      <p className="mt-1">{viewOrder.order_status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Glass Team Items</h3>
                
                {viewOrder.item_ids.map((item, itemIndex) => (
                  <div key={item._id} className="mb-8">
                    <h4 className="text-md font-medium bg-gray-100 p-2 rounded mb-3">
                      {item.name}
                    </h4>
                    
                    {item.team_assignments && item.team_assignments.glass && item.team_assignments.glass.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Glass Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neck Size</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decoration</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.team_assignments.glass.map((glass, glassIndex) => (
                              <tr key={glass._id} className={glassIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{glass.glass_name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{glass.quantity}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{glass.weight}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{glass.neck_size}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {glass.decoration} ({glass.decoration_no})
                                  <div className="text-xs text-gray-500">
                                    {glass.decoration_details.type} - {glass.decoration_details.decoration_number}
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    glass.status === "Completed" ? "bg-green-100 text-green-800" : 
                                    glass.status === "In Progress" ? "bg-yellow-100 text-yellow-800" : 
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {glass.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No glass assignments for this item.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}