import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Clock, Activity, CheckCircle, AlertCircle, Users } from 'lucide-react';

export default function InventoryDashboard() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    try {
      const localData = localStorage.getItem('dispatcher_pendingOrders');
      if (!localData) {
        throw new Error('No data found in localStorage');
      }
      const ordersArray = JSON.parse(localData);
      const formattedData = {
        data: ordersArray
      };
      setOrderData(formattedData);
      if (ordersArray && ordersArray.length > 0) {
        setSelectedOrder(ordersArray[0].order_number);
      }
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }, []);


  const processOrderData = (orderNumber) => {
    if (!orderData || !orderData.data) return null;
    const orderDetails = orderData.data.find(order => order.order_number === orderNumber);
    if (!orderDetails) return null;
    const teamStatusData = {};
    const itemCompletionData = [];
    
    orderDetails.item_ids.forEach(item => {
      const itemName = item.name;
      let totalAssignments = 0;
      let completedAssignments = 0;
      
      Object.keys(item.team_assignments).forEach(teamName => {
        const teamAssignments = item.team_assignments[teamName];
        if (!teamStatusData[teamName]) {
          teamStatusData[teamName] = { 
            name: teamName, 
            Completed: 0, 
            'In Progress': 0, 
            Pending: 0,
            total: 0 
          };
        }
        teamAssignments.forEach(assignment => {
          totalAssignments++;
          teamStatusData[teamName].total += 1;
          
          if (assignment.status === 'Completed') {
            completedAssignments++;
            teamStatusData[teamName].Completed += 1;
          } else if (assignment.status === 'In Progress') {
            teamStatusData[teamName]['In Progress'] += 1;
          } else {
            teamStatusData[teamName].Pending += 1;
          }
        });
      });
      const completionPercentage = totalAssignments > 0 
        ? (completedAssignments / totalAssignments) * 100 
        : 0;
        
      itemCompletionData.push({
        name: itemName.replace('Item ', ''),
        completion: completionPercentage,
        total: totalAssignments,
        completed: completedAssignments
      });
    });
    
    const teamStatusArray = Object.values(teamStatusData);
    const allAssignments = teamStatusArray.reduce((sum, team) => sum + team.total, 0);
    const completedAssignments = teamStatusArray.reduce((sum, team) => sum + team.Completed, 0);
    const inProgressAssignments = teamStatusArray.reduce((sum, team) => sum + team['In Progress'], 0);
    const pendingAssignments = teamStatusArray.reduce((sum, team) => sum + team.Pending, 0);
    const overallCompletionPercentage = allAssignments > 0 
      ? (completedAssignments / allAssignments) * 100 
      : 0;
    
    return {
      orderDetails,
      teamStatusArray,
      itemCompletionData,
      overallCompletionPercentage,
      stats: {
        total: allAssignments,
        completed: completedAssignments,
        inProgress: inProgressAssignments,
        pending: pendingAssignments
      }
    };
  };

  const getOrderStatusCounts = () => {
    if (!orderData || !orderData.data) return { live: 0, pending: 0 };
    
    const statusCounts = {
      live: orderData.data.filter(order => order.order_status === 'In Progress').length,
      pending: orderData.data.filter(order => order.order_status === 'Pending').length
    };
    
    return statusCounts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-lg flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-r-2 border-orange-500 mr-3"></div>
          Loading inventory data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-red-50 p-4 rounded-lg text-center shadow-sm">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
          <div className="text-lg font-medium text-red-800">Error loading data</div>
          <div className="mt-1 text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  const processedData = processOrderData(selectedOrder);
  const statusCounts = getOrderStatusCounts();

  if (!processedData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-lg">No order data available</div>
      </div>
    );
  }

  const COLORS = {
    completed: '#22C55E', 
    inProgress: '#F97316', 
    pending: '#EF4444', 
    backgroundLight: '#FFFAF0', 
    backgroundMedium: '#FFF3E0', 
    highlight: '#FF7E1F', 
    text: '#334155', 
    lightText: '#64748B' 
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 overflow-y-auto">
      {/* Summary Cards */}
      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="text-orange-500 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-500">Completed Orders</p>
                <p className="text-2xl font-bold text-slate-800">{statusCounts.live}</p>
              </div>
            </div>
            <div className="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">{statusCounts.live}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="text-orange-300 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Orders</p>
                <p className="text-2xl font-bold text-slate-800">{statusCounts.pending}</p>
              </div>
            </div>
            <div className="bg-orange-50 h-10 w-10 rounded-full flex items-center justify-center">
              <span className="text-orange-400 font-bold">{statusCounts.pending}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="text-orange-400 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-500">Current Order</p>
                <p className="text-xl font-bold text-slate-800 truncate max-w-xs">{selectedOrder}</p>
              </div>
            </div>
            <div className="bg-orange-50 h-10 w-10 rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-bold">{processedData.orderDetails.item_ids.length}</span>
            </div>
          </div>
        </div>
      </div>

    
      <div className="grid grid-cols-12 gap-4 p-4 pb-16">

        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          {/* Order Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-sm text-slate-700 border-b border-gray-100 pb-2 mb-3 flex items-center">
              <span className="bg-orange-100 p-1 rounded-md mr-2">
                <Package className="text-orange-500" size={14} />
              </span>
              Order Selection
            </h3>
            
            <div className="space-y-2 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-gray-100">
              {orderData.data.map(order => (
                <button
                  key={order.order_number}
                  className={`w-full text-left rounded-md transition-all duration-200 ${
                    selectedOrder === order.order_number
                      ? 'bg-orange-50 border-l-4 border-orange-500 pl-2 py-2 pr-3'
                      : 'bg-white hover:bg-gray-50 border border-gray-100 p-2'
                  }`}
                  onClick={() => setSelectedOrder(order.order_number)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-slate-700">{order.order_number}</div>
                      <div className="text-xs text-slate-500">{order.customer_name}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.order_status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.order_status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.order_status}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Overall Completion */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-sm text-slate-700 border-b border-gray-100 pb-2 mb-3 flex items-center">
              <span className="bg-orange-100 p-1 rounded-md mr-2">
                <CheckCircle className="text-orange-500" size={14} />
              </span>
              Overall Completion
            </h3>
            
            <div className="flex justify-center my-4">
              <div className="w-46 h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: processedData.stats.completed || 0 },
                        { name: 'In Progress', value: processedData.stats.inProgress || 0 },
                        { name: 'Pending', value: processedData.stats.pending || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell key="completed" fill={COLORS.completed} />
                      <Cell key="inProgress" fill={COLORS.inProgress} />
                      <Cell key="pending" fill={COLORS.pending} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-slate-800">
                    {processedData.overallCompletionPercentage.toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-500">Completed</span>
                </div>
              </div>
            </div> 
          </div>
        </div>
        

        <div className="col-span-12 md:col-span-9 flex flex-col gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-sm text-slate-700 border-b border-gray-100 pb-2 mb-3 flex items-center">
              <span className="bg-orange-100 p-1 rounded-md mr-2">
                <Activity className="text-orange-500" size={14} />
              </span>
              Item Completion Progress
            </h3>
            
            <div className="h-66">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedData.itemCompletionData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `Item ${value}`}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`} 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(1)}%`, 'Completion']}
                    labelFormatter={(label) => `Item ${label}`}
                    contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    dataKey="completion" 
                    fill="#FF7E1F" 
                    name="Completion %" 
                    radius={[4, 4, 0, 0]}
                    label={{ 
                      position: 'top', 
                      formatter: (value) => `${value.toFixed(0)}%`,
                      fontSize: 11,
                      fill: '#666'
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
         
        </div>
      </div>
    </div>
  );
}