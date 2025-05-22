// import { Search, Pencil } from 'lucide-react';
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// import {
//     TEAMS,
//     getOrdersFromLocalStorage as getTeamOrdersFromLocalStorage,
//     hasOrdersInLocalStorage as hasTeamOrdersInLocalStorage,
//     saveOrdersToLocalStorage as saveTeamOrdersToLocalStorage
// } from '../utils/localStorageUtils';

// const GlassOrders = ({ orderType }) => {
//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [ordersPerPage, setOrdersPerPage] = useState(5);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filteredOrders, setFilteredOrders] = useState([]);

//     const fetchGlassOrders = async (type = orderType) => {
//         try {
//             setLoading(true);
//             if (hasTeamOrdersInLocalStorage(type, TEAMS.GLASS)) {
//                 const cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.GLASS);
//                 setOrders(cachedOrders);
//                 setFilteredOrders(cachedOrders);
//                 setLoading(false);
//                 return;
//             }

//             // Fetch from API if not in localStorage
//             const response = await axios.get(`http://localhost:5000/api/glass?orderType=${type}`);
//             const fetchedOrders = response.data.data || [];

//             // Save to team-specific localStorage
//             saveTeamOrdersToLocalStorage(fetchedOrders, type, TEAMS.GLASS);
//             setOrders(fetchedOrders);
//             setFilteredOrders(fetchedOrders);
//             setLoading(false);
//         } catch (err) {
//             setError('Failed to fetch glass orders: ' + (err.response?.data?.message || err.message));
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchGlassOrders(orderType);
//     }, [orderType]);

//     useEffect(() => {
//         if (orders.length > 0) {
//             const filtered = orders.filter(order => {
//                 // Check if order details match search
//                 const orderMatches =
//                     order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                     order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                     order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

//                 if (orderMatches) return true;

//                 // Check if any item or glass assignment matches search
//                 return order.item_ids?.some(item => {
//                     // Check if item name matches
//                     if (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//                         return true;
//                     }

//                     // Check if any glass assignment matches
//                     return item.team_assignments?.glass?.some(glass => {
//                         return glass.glass_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                             glass.decoration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                             glass.decoration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                             glass.weight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                             glass.neck_size?.toLowerCase().includes(searchTerm.toLowerCase());
//                     });
//                 });
//             });

//             setFilteredOrders(filtered);
//             setCurrentPage(1);
//         }
//     }, [searchTerm, orders]);

//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-US', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric'
//         });
//     };

//     const handleUpdateStatus = async (orderId, itemId, glassId, newStatus) => {
//         try {
//             // This would be your actual API call to update the status
//             // const response = await axios.patch(`http://localhost:5000/api/glass/${glassId}`, {
//             //   status: newStatus
//             // });

//             // For now, just update the UI
//             const updatedOrders = orders.map(order => {
//                 if (order._id === orderId) {
//                     const updatedItems = order.item_ids.map(item => {
//                         if (item._id === itemId && item.team_assignments?.glass) {
//                             const updatedGlassAssignments = item.team_assignments.glass.map(glass => {
//                                 if (glass._id === glassId) {
//                                     return { ...glass, status: newStatus };
//                                 }
//                                 return glass;
//                             });

//                             return {
//                                 ...item,
//                                 team_assignments: {
//                                     ...item.team_assignments,
//                                     glass: updatedGlassAssignments
//                                 }
//                             };
//                         }
//                         return item;
//                     });

//                     return {
//                         ...order,
//                         item_ids: updatedItems
//                     };
//                 }
//                 return order;
//             });

//             setOrders(updatedOrders);
//             setFilteredOrders(updatedOrders);

//             // Here you would update the localStorage data as well
//         } catch (err) {
//             setError('Failed to update status: ' + (err.response?.data?.message || err.message));
//         }
//     };

//     // Calculate pagination
//     const indexOfLastOrder = currentPage * ordersPerPage;
//     const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
//     const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
//     const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

//     const handlePageChange = (pageNumber) => {
//         setCurrentPage(pageNumber);
//     };

//     const handleOrdersPerPageChange = (e) => {
//         setOrdersPerPage(Number(e.target.value));
//         setCurrentPage(1);
//     };

// const renderOrderRows = () => {
//     if (currentOrders.length === 0) {
//         return (
//             <tr>
//                 <td colSpan="8" className="text-center py-4 text-gray-500">
//                     No glass orders found
//                 </td>
//             </tr>
//         );
//     }

//     let rows = [];

//     currentOrders.forEach((order, orderIndex) => {
//         let totalGlassCount = 0;
//         order.item_ids?.forEach(item => {
//             totalGlassCount += Math.max(1, item.team_assignments?.glass?.length || 0);
//         });

//         const bgColor = orderIndex % 2 === 0
//             ? 'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]'
//             : 'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]';

//         order.item_ids?.forEach((item, itemIndex) => {
//             const glassAssignments = item.team_assignments?.glass || [];
//             const glassCount = Math.max(1, glassAssignments.length);

//             if (glassAssignments.length === 0) {
//                 rows.push(
//                     <tr key={`${order._id}-${item._id}-empty`} className={`${bgColor} border-t border-[#703800]`}>
//                         {itemIndex === 0 && (
//                             <td
//                                 className="px-3 py-2 align-middle text-left font-medium text-orange-800"
//                                 rowSpan={totalGlassCount}
//                             >
//                                 {order.order_number}
//                             </td>
//                         )}
//                         <td
//                             className="px-3 py-2 align-middle font-semibold text-left text-sm text-[#703800]"
//                             rowSpan={1}
//                         >
//                             {item.name}
//                         </td>
//                         <td colSpan="5" className="px-3 py-2 text-left text-gray-500 italic">
//                             No glass assignments
//                         </td>
//                         {/* Edit button column */}
//                         <td className="px-3 py-2 text-center align-middle">
//                             <button
//                                 className="flex items-center justify-center p-1.5 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm mx-auto"
//                                 onClick={() =>
//                                     handleUpdateStatus(order._id, item._id, null, null)
//                                 }
//                             >
//                                 <Pencil size={16} />
//                             </button>
//                         </td>
//                     </tr>
//                 );
//             } else {
//                 glassAssignments.forEach((glass, glassIndex) => {
//                     rows.push(
//                         <tr key={`${order._id}-${item._id}-${glass._id}`} className={`${bgColor} border-t border-[#703800]`}>
//                             {/* Order number (once per order) */}
//                             {itemIndex === 0 && glassIndex === 0 && (
//                                 <td
//                                     className="px-3 py-2 text-sm align-middle text-orange-600"
//                                     rowSpan={totalGlassCount}
//                                 >
//                                     {order.order_number}
//                                 </td>
//                             )}

//                             {/* Item name (once per item) */}
//                             {glassIndex === 0 && (
//                                 <td
//                                     className="px-3 py-2 text-left text-sm text-[#703800]"
//                                     rowSpan={glassCount}
//                                 >
//                                     {item.name}
//                                 </td>
//                             )}

//                             {/* Glass data */}
//                             <td className="px-3 py-2 text-left text-sm text-[#703800]">{glass.glass_name}</td>
//                             <td className="px-3 py-2 text-left text-sm text-[#703800]">{glass.quantity}</td>
//                             <td className="px-3 py-2 text-left text-sm text-gray-800">{glass.neck_size}</td>
//                             <td className="px-3 py-2 text-left text-sm text-gray-800">{glass.weight}</td>
//                             <td className="px-3 py-2 text-left text-sm text-gray-800">{glass.decoration_no}</td>

//                             {/* Edit button: shown only once per item */}
//                             {glassIndex === 0 && (
//                                 <td
//                                     className="px-3 py-2 align-middle text-center"
//                                     rowSpan={glassCount}
//                                 >
//                                     <button
//                                         className="flex items-center justify-center p-1.5 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm mx-auto"
//                                         onClick={() =>
//                                             handleUpdateStatus(
//                                                 order._id,
//                                                 item._id,
//                                                 glass._id,
//                                                 glass.status === "Pending" ? "Completed" : "Pending"
//                                             )
//                                         }
//                                     >
//                                         <Pencil size={16} />
//                                     </button>
//                                 </td>
//                             )}
//                         </tr>
//                     );
//                 });
//             }
//         });
//     });

//     return rows;
// };


//     return (
//         <div className="flex flex-col h-full">
//             <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-semibold text-orange-700">
//                     Glass Team {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Orders
//                 </h2>

//                 <div className="relative">
//                     <input
//                         type="text"
//                         placeholder="Search..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                         <Search size={16} className="text-gray-400" />
//                     </div>
//                 </div>
//             </div>

//             {error && (
//                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//                     {error}
//                 </div>
//             )}

//             <div className="flex-grow overflow-hidden flex flex-col">
//                 {loading ? (
//                     <div className="flex justify-center items-center flex-grow">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-700"></div>
//                     </div>
//                 ) : (
//                     <div className="overflow-auto rounded-lg shadow flex-grow">
//                         <table className="min-w-full border-collapse">
//                             <thead className="sticky top-0 z-10">
//                                 <tr className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D]  font-bold text-sm text-white">
//                                     <th className="px-3 py-3 text-left">Order #</th>
//                                     <th className="px-3 py-3 text-left">Item</th>
//                                     <th className="px-3 py-3 text-left">Glass Type</th>
//                                     <th className="px-3 py-3 text-left">Quantity</th>
//                                     <th className="px-3 py-3 text-left">Neck Size</th>
//                                     <th className="px-3 py-3 text-left">Weight</th>
//                                     <th className="px-3 py-3 text-left">Decoration #</th>
//                                     <th className="px-3 py-3 text-left">Status</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {renderOrderRows()}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>

//             <div className="mt-4 flex justify-between items-center">
//                 <div className="flex items-center">
//                     <span className="mr-2 text-sm text-gray-600">Rows per page:</span>
//                     <select
//                         value={ordersPerPage}
//                         onChange={handleOrdersPerPageChange}
//                         className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
//                     >
//                         <option value={5}>5</option>
//                         <option value={10}>10</option>
//                         <option value={20}>20</option>
//                         <option value={50}>50</option>
//                     </select>

//                     <span className="ml-4 text-sm text-gray-600">
//                         Showing {filteredOrders.length > 0 ? indexOfFirstOrder + 1 : 0} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
//                     </span>
//                 </div>

//                 <div className="flex">
//                     <button
//                         onClick={() => handlePageChange(currentPage - 1)}
//                         disabled={currentPage === 1}
//                         className={`px-3 py-1 rounded-l-md ${currentPage === 1
//                             ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                             : 'bg-orange-600 text-white hover:bg-orange-700'
//                             }`}
//                     >
//                         Previous
//                     </button>

//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                         let pageNum;
//                         if (totalPages <= 5) {
//                             pageNum = i + 1;
//                         } else if (currentPage <= 3) {
//                             pageNum = i + 1;
//                         } else if (currentPage >= totalPages - 2) {
//                             pageNum = totalPages - 4 + i;
//                         } else {
//                             pageNum = currentPage - 2 + i;
//                         }

//                         return (
//                             <button
//                                 key={pageNum}
//                                 onClick={() => handlePageChange(pageNum)}
//                                 className={`px-3 py-1 ${currentPage === pageNum
//                                     ? 'bg-orange-700 text-white'
//                                     : 'bg-orange-600 text-white hover:bg-orange-700'
//                                     }`}
//                             >
//                                 {pageNum}
//                             </button>
//                         );
//                     })}

//                     <button
//                         onClick={() => handlePageChange(currentPage + 1)}
//                         disabled={currentPage === totalPages}
//                         className={`px-3 py-1 rounded-r-md ${currentPage === totalPages
//                             ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                             : 'bg-orange-600 text-white hover:bg-orange-700'
//                             }`}
//                     >
//                         Next
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default GlassOrders;

import { Search, Pencil, Package,  AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
    TEAMS,
    getOrdersFromLocalStorage as getTeamOrdersFromLocalStorage,
    hasOrdersInLocalStorage as hasTeamOrdersInLocalStorage,
    saveOrdersToLocalStorage as saveTeamOrdersToLocalStorage
} from '../utils/localStorageUtils';

const GlassOrders = ({ orderType }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);

    const fetchGlassOrders = async (type = orderType) => {
        try {
            setLoading(true);
            if (hasTeamOrdersInLocalStorage(type, TEAMS.GLASS)) {
                const cachedOrders = getTeamOrdersFromLocalStorage(type, TEAMS.GLASS);
                setOrders(cachedOrders);
                setFilteredOrders(cachedOrders);
                setLoading(false);
                return;
            }

            // Fetch from API if not in localStorage
            const response = await axios.get(`http://localhost:5000/api/glass?orderType=${type}`);
            const fetchedOrders = response.data.data || [];

            // Save to team-specific localStorage
            saveTeamOrdersToLocalStorage(fetchedOrders, type, TEAMS.GLASS);
            setOrders(fetchedOrders);
            setFilteredOrders(fetchedOrders);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch glass orders: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlassOrders(orderType);
    }, [orderType]);

    useEffect(() => {
        if (orders.length > 0) {
            const filtered = orders.filter(order => {
                // Check if order details match search
                const orderMatches =
                    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.dispatcher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

                if (orderMatches) return true;

                // Check if any item or glass assignment matches search
                return order.item_ids?.some(item => {
                    // Check if item name matches
                    if (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return true;
                    }

                    // Check if any glass assignment matches
                    return item.team_assignments?.glass?.some(glass => {
                        return glass.glass_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            glass.decoration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            glass.decoration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            glass.weight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            glass.neck_size?.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                });
            });

            setFilteredOrders(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, orders]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleUpdateStatus = async (orderId, itemId, glassId, newStatus) => {
        try {
            // This would be your actual API call to update the status
            // const response = await axios.patch(`http://localhost:5000/api/glass/${glassId}`, {
            //   status: newStatus
            // });

            // For now, just update the UI
            const updatedOrders = orders.map(order => {
                if (order._id === orderId) {
                    const updatedItems = order.item_ids.map(item => {
                        if (item._id === itemId && item.team_assignments?.glass) {
                            const updatedGlassAssignments = item.team_assignments.glass.map(glass => {
                                if (glass._id === glassId) {
                                    return { ...glass, status: newStatus };
                                }
                                return glass;
                            });

                            return {
                                ...item,
                                team_assignments: {
                                    ...item.team_assignments,
                                    glass: updatedGlassAssignments
                                }
                            };
                        }
                        return item;
                    });

                    return {
                        ...order,
                        item_ids: updatedItems
                    };
                }
                return order;
            });

            setOrders(updatedOrders);
            setFilteredOrders(updatedOrders);

            // Here you would update the localStorage data as well
        } catch (err) {
            setError('Failed to update status: ' + (err.response?.data?.message || err.message));
        }
    };

    // Calculate pagination
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

    const renderOrderCards = () => {
        if (currentOrders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-8 bg-white rounded-lg shadow text-gray-500">
                    <AlertCircle size={40} className="mb-2 text-orange-500" />
                    <p>No glass orders found</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-6">
                {currentOrders.map((order, orderIndex) => {
                    const bgGradient = orderIndex % 2 === 0
                        ? 'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]'
                        : 'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]';
                    
                    return (
                        <div 
                            key={order._id} 
                            className={`${bgGradient} rounded-lg shadow-md overflow-hidden border border-orange-200`}
                        >
                            {/* Order Header */}
                            <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] px-4 py-3 flex justify-between items-center">
                                <div className="flex items-center">
                                    <span className="text-white font-bold mr-2">Order No :</span>
                                    <span className="text-white font-semibold">{order.order_number}</span>
                                </div>
                            </div>
                            
                            {/* Items Container */}
                            <div className="p-2">
                                {order.item_ids?.map((item, itemIndex) => {
                                    const glassAssignments = item.team_assignments?.glass || [];
                                    
                                    return (
                                        <div 
                                            key={`${order._id}-${item._id}`} 
                                            className="mb-3 last:mb-0 rounded-md bg-white bg-opacity-70 overflow-hidden"
                                        >
                                            {/* Item Header */}
                                            <div className="bg-orange-100 px-4 py-2 flex items-center border-l-4 border-orange-600">
                                                <Package size={16} className="text-orange-700 mr-2" />
                                                <span className="font-medium text-[#703800]">{item.name}</span>
                                            </div>
                                            
                                            {/* Glass Assignments */}
                                            <div className="px-3 py-2">
                                                {glassAssignments.length === 0 ? (
                                                    <div className="text-gray-500 italic text-sm p-2">
                                                        No glass assignments
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 divide-y divide-orange-100">
                                                        {glassAssignments.map((glass, glassIndex) => (
                                                            <div 
                                                                key={`${order._id}-${item._id}-${glass._id}`}
                                                                className="py-2 flex flex-wrap items-center"
                                                            >
                                                                <div className="flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                                                                    {/* <Glass size={14} className="text-orange-600 mr-2" /> */}
                                                                    <span className="text-sm font-medium text-[#703800]">
                                                                        {glass.glass_name}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap w-full sm:w-2/3">
                                                                    <div className="flex items-center mr-4 mb-1 sm:mb-0">
                                                                        <span className="text-xs font-medium text-gray-500 mr-1">QTY:</span>
                                                                        <span className="text-xs text-gray-800">{glass.quantity}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center mr-4 mb-1 sm:mb-0">
                                                                        <span className="text-xs font-medium text-gray-500 mr-1">Neck:</span>
                                                                        <span className="text-xs text-gray-800">{glass.neck_size}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center mr-4 mb-1 sm:mb-0">
                                                                        <span className="text-xs font-medium text-gray-500 mr-1">Weight:</span>
                                                                        <span className="text-xs text-gray-800">{glass.weight}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center mr-4 mb-1 sm:mb-0">
                                                                        <span className="text-xs font-medium text-gray-500 mr-1">Decoration #:</span>
                                                                        <span className="text-xs text-gray-800">{glass.decoration_no}</span>
                                                                    </div>
                                                                    
                                                                    <div className="ml-auto">
                                                                        <button
                                                                            className="flex items-center justify-center p-1 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm"
                                                                            onClick={() => handleUpdateStatus(
                                                                                order._id,
                                                                                item._id,
                                                                                glass._id,
                                                                                glass.status === "Pending" ? "Completed" : "Pending"
                                                                            )}
                                                                        >
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-orange-700">
                    Glass Team {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Orders
                </h2>

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
                    <div className="overflow-auto pr-2 flex-grow">
                        {renderOrderCards()}
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-between items-center">
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
        </div>
    );
};

export default GlassOrders;
