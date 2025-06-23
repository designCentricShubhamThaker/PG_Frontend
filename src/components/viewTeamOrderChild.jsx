import { X, ArrowLeft, CheckCircle, Search } from 'lucide-react';
import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

const ViewTeamOrderChild = ({ order, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    if (order?.item_ids && Array.isArray(order.item_ids)) {
      setFilteredItems(order.item_ids);
    }
  }, [order]);

  useEffect(() => {
    if (!order?.item_ids || !Array.isArray(order.item_ids)) return;

    if (!searchQuery.trim()) {
      setFilteredItems(order.item_ids);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = order.item_ids.filter(item => {

      if (item.name && item.name.toLowerCase().includes(query)) return true;
      if (item.team_assignments) {
        if (item.team_assignments.glass && Array.isArray(item.team_assignments.glass)) {
          if (item.team_assignments.glass.some(glass =>
            glass.glass_name && glass.glass_name.toLowerCase().includes(query)
          )) return true;
        }

        if (item.team_assignments.caps && Array.isArray(item.team_assignments.caps)) {
          if (item.team_assignments.caps.some(cap =>
            cap.cap_name && cap.cap_name.toLowerCase().includes(query)
          )) return true;
        }

        if (item.team_assignments.boxes && Array.isArray(item.team_assignments.boxes)) {
          if (item.team_assignments.boxes.some(box =>
            box.box_name && box.box_name.toLowerCase().includes(query)
          )) return true;
        }

        if (item.team_assignments.pumps && Array.isArray(item.team_assignments.pumps)) {
          if (item.team_assignments.pumps.some(pump =>
            pump.pump_name && pump.pump_name.toLowerCase().includes(query)
          )) return true;
        }
      }

      return false;
    });

    setFilteredItems(filtered);
  }, [searchQuery, order]);

  if (!order) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateItemStats = () => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) return { total: 0, completed: 0 };

    let totalAssignments = 0;
    let completedAssignments = 0;

    order.item_ids.forEach(item => {
      if (!item.team_assignments) return;

      if (item.team_assignments.glass && Array.isArray(item.team_assignments.glass)) {
        totalAssignments += item.team_assignments.glass.length;
        item.team_assignments.glass.forEach(glass => {
          if (glass.status === 'Completed') completedAssignments++;
        });
      }

      if (item.team_assignments.caps && Array.isArray(item.team_assignments.caps)) {
        totalAssignments += item.team_assignments.caps.length;
        item.team_assignments.caps.forEach(cap => {
          if (cap.status === 'Completed') completedAssignments++;
        });
      }

      if (item.team_assignments.boxes && Array.isArray(item.team_assignments.boxes)) {
        totalAssignments += item.team_assignments.boxes.length;
        item.team_assignments.boxes.forEach(box => {
          if (box.status === 'Completed') completedAssignments++;
        });
      }

      if (item.team_assignments.pumps && Array.isArray(item.team_assignments.pumps)) {
        totalAssignments += item.team_assignments.pumps.length;
        item.team_assignments.pumps.forEach(pump => {
          if (pump.status === 'Completed') completedAssignments++;
        });
      }
    });

    return {
      total: totalAssignments,
      completed: completedAssignments,
      percentage: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
    };
  };

  const { total, completed, percentage } = calculateItemStats();

  const renderTabs = () => (
    <div className="flex border-b border-orange-200 mb-6">
      <button
        className={`px-6 py-3 font-medium ${activeTab === 'overview'
          ? 'text-orange-700 border-b-2 border-orange-700'
          : 'text-gray-600 hover:text-orange-600'
          }`}
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </button>
      <button
        className={`px-6 py-3 font-medium ${activeTab === 'items'
          ? 'text-orange-700 border-b-2 border-orange-700'
          : 'text-gray-600 hover:text-orange-600'
          }`}
        onClick={() => setActiveTab('items')}
      >
        Items
      </button>
      <button
        className={`px-6 py-3 font-medium ${activeTab === 'Status'
          ? 'text-orange-700 border-b-2 border-orange-700'
          : 'text-gray-600 hover:text-orange-600'
          }`}
        onClick={() => setActiveTab('Status')}
      >
        Status
      </button>
    </div>
  );

  const renderSearchBar = () => {
    if (activeTab !== 'items') return null;

    return (
      <div className="relative mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or component..."
            className="w-full py-2.5 pl-10 pr-10 bg-orange-50 border border-orange-300 text-gray-800 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-orange-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && filteredItems.length > 0 && (
          <p className="mt-2 text-sm text-orange-700">
            Found {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </p>
        )}
        {searchQuery && filteredItems.length === 0 && (
          <p className="mt-2 text-sm text-orange-700">
            No items found matching "{searchQuery}"
          </p>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg shadow-sm">
        <h3 className="text-orange-800 font-medium mb-3">Order Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-medium text-orange-700">{order.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dispatcher</p>
            <p className="font-medium">{order.dispatcher_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created On</p>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium flex items-center">
              {order.order_status === "Completed" ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle size={16} className="mr-1" /> Completed
                </span>
              ) : (
                <span className="text-orange-600">Pending</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="font-medium">{order.item_ids?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Assignments</p>
            <p className="font-medium">{total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="font-medium">{completed} ({percentage}%)</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-orange-800 font-medium mb-3">Progress</h3>
        <div className="w-full flex items-center space-x-2">
          <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
            <div className="bg-white rounded-full h-6 px-1 flex items-center overflow-hidden">
              <div
                className="bg-[#FF6900] h-4 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
          <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );

  const renderItemCard = (item, index) => {
    if (!item.team_assignments) return null;

    const itemBgColor = index % 2 === 0 ? "bg-orange-50" : "bg-orange-50";
    const itemBorderColor = index % 2 === 0 ? "border-orange-200" : "border-orange-200";
    const itemTextColor = index % 2 === 0 ? "text-orange-800" : "text-orange-800";


    const renderGlassAssignments = () => {
      if (!item.team_assignments.glass || !Array.isArray(item.team_assignments.glass) || item.team_assignments.glass.length === 0) {
        return null;
      }

      return item.team_assignments.glass.map((glass, idx) => {
        const completedQty = glass.team_tracking?.total_completed_qty || 0;
        const completionPercentage = glass.quantity > 0
          ? Math.round((completedQty / glass.quantity) * 100)
          : 0;

        return (
          <div key={glass._id} className={`${idx > 0 ? 'mt-4 pt-4 border-t ' + itemBorderColor : ''}`}>
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Glass
                </span>
                <h4 className="font-medium text-gray-800">{glass.glass_name}</h4>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${glass.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : index % 2 === 0 ? 'bg-orange-100 text-orange-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {glass.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="text-sm font-medium">{glass.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Weight</p>
                <p className="text-sm font-medium">{glass.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                <p className="text-sm font-medium">{glass.neck_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Decoration</p>
                <p className="text-sm font-medium">{glass.decoration || 'None'}</p>
              </div>
              {glass.decoration_no && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Decoration #</p>
                  <p className="text-sm font-medium">{glass.decoration_no}</p>
                </div>
              )}
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Completion</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                  <div className="bg-white rounded-full h-4 flex items-center overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${index % 2 === 0 ? 'bg-[#FF6900]' : 'bg-orange-600'}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
                  {completedQty}/{glass.quantity}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };

    const renderCapAssignments = () => {
      if (!item.team_assignments.caps || !Array.isArray(item.team_assignments.caps) || item.team_assignments.caps.length === 0) {
        return null;
      }

      return item.team_assignments.caps.map((cap, idx) => {
        const completedQty = cap.team_tracking?.total_completed_qty || 0;
        const completionPercentage = cap.quantity > 0
          ? Math.round((completedQty / cap.quantity) * 100)
          : 0;

        return (
          <div key={cap._id} className={`${idx > 0 || renderGlassAssignments() ? 'mt-4 pt-4 border-t ' + itemBorderColor : ''}`}>
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Cap
                </span>
                <h4 className="font-medium text-gray-800">{cap.cap_name}</h4>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${cap.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : index % 2 === 0 ? 'bg-orange-100 text-orange-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {cap.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="text-sm font-medium">{cap.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                <p className="text-sm font-medium">{cap.neck_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Process</p>
                <p className="text-sm font-medium">{cap.process}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Material</p>
                <p className="text-sm font-medium">{cap.material}</p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Completion</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                  <div className="bg-white rounded-full h-4 flex items-center overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${index % 2 === 0 ? 'bg-[#FF6900]' : 'bg-orange-600'}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
                  {completedQty}/{cap.quantity}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };

    const renderBoxAssignments = () => {
      if (!item.team_assignments.boxes || !Array.isArray(item.team_assignments.boxes) || item.team_assignments.boxes.length === 0) {
        return null;
      }

      return item.team_assignments.boxes.map((box, idx) => {
        const completedQty = box.team_tracking?.total_completed_qty || 0;
        const completionPercentage = box.quantity > 0
          ? Math.round((completedQty / box.quantity) * 100)
          : 0;

        return (
          <div key={box._id} className={`${(idx > 0 || renderGlassAssignments() || renderCapAssignments()) ? 'mt-4 pt-4 border-t ' + itemBorderColor : ''}`}>
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Box
                </span>
                <h4 className="font-medium text-gray-800">{box.box_name}</h4>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${box.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : index % 2 === 0 ? 'bg-orange-100 text-orange-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {box.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="text-sm font-medium">{box.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Approval Code</p>
                <p className="text-sm font-medium">{box.approval_code}</p>
              </div>

            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Completion</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                  <div className="bg-white rounded-full h-4 flex items-center overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${index % 2 === 0 ? 'bg-[#FF6900]' : 'bg-orange-600'}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
                  {completedQty}/{box.quantity}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };

    const renderPumpAssignments = () => {
      if (!item.team_assignments.pumps || !Array.isArray(item.team_assignments.pumps) || item.team_assignments.pumps.length === 0) {
        return null;
      }

      return item.team_assignments.pumps.map((pump, idx) => {
        const completedQty = pump.team_tracking?.total_completed_qty || 0;
        const completionPercentage = pump.quantity > 0
          ? Math.round((completedQty / pump.quantity) * 100)
          : 0;

        return (
          <div key={pump._id} className={`${(idx > 0 || renderGlassAssignments() || renderCapAssignments() || renderBoxAssignments()) ? 'mt-4 pt-4 border-t ' + itemBorderColor : ''}`}>
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Pump
                </span>
                <h4 className="font-medium text-gray-800">{pump.pump_name}</h4>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pump.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : index % 2 === 0 ? 'bg-orange-100 text-orange-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {pump.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="text-sm font-medium">{pump.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Type</p>
                <p className="text-sm font-medium">{pump.neck_type}</p>
              </div>

            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Completion</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                  <div className="bg-white rounded-full h-4 flex items-center overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${index % 2 === 0 ? 'bg-[#FF6900]' : 'bg-orange-600'}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
                  {completedQty}/{pump.quantity}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };

    const hasAssignments =
      (item.team_assignments.glass && item.team_assignments.glass.length > 0) ||
      (item.team_assignments.caps && item.team_assignments.caps.length > 0) ||
      (item.team_assignments.boxes && item.team_assignments.boxes.length > 0) ||
      (item.team_assignments.pumps && item.team_assignments.pumps.length > 0);

    if (!hasAssignments) return null;

    return (
      <div key={item._id} className={`mb-8 ${itemBgColor} p-4 rounded-lg shadow-sm`}>
        <div>

        </div>
        <h3 className={`${itemTextColor} font-semibold mb-4 pb-2 border-b ${itemBorderColor}`}>
          {item.name}
        </h3>

        {renderGlassAssignments()}
        {renderCapAssignments()}
        {renderBoxAssignments()}
        {renderPumpAssignments()}
      </div>
    );
  };


  const renderItems = () => (
    <div className="space-y-6">
      {renderSearchBar()}

      {filteredItems && filteredItems.length > 0 ? (
        filteredItems.map((item, index) => renderItemCard(item, index))
      ) : (
        <div className="text-center py-8 text-gray-500 bg-orange-50 rounded-lg">
          {searchQuery ? 'No matching items found' : 'No items found in this order'}
        </div>
      )}
    </div>
  );

  const renderStatusTab = () => {
    if (!order.item_ids || !Array.isArray(order.item_ids)) {
      return (
        <div className="text-center py-8 text-gray-500 bg-orange-50 rounded-lg">
          No items found in this order
        </div>
      );
    }

    // Calculate completion statistics for all items
    const itemStats = order.item_ids.map(item => {
      if (!item.team_assignments) return null;

      const stats = {
        itemName: item.name,
        glass: { total: 0, completed: 0 },
        caps: { total: 0, completed: 0 },
        boxes: { total: 0, completed: 0 },
        pumps: { total: 0, completed: 0 },
        totalAssignments: 0,
        totalCompleted: 0
      };

      // Calculate Glass stats
      if (item.team_assignments.glass && Array.isArray(item.team_assignments.glass)) {
        item.team_assignments.glass.forEach(glass => {
          const qty = glass.quantity || 0;
          const completedQty = glass.team_tracking?.total_completed_qty || 0;
          stats.glass.total += qty;
          stats.glass.completed += completedQty;
          stats.totalAssignments += qty;
          stats.totalCompleted += completedQty;
        });
      }

      // Calculate Caps stats
      if (item.team_assignments.caps && Array.isArray(item.team_assignments.caps)) {
        item.team_assignments.caps.forEach(cap => {
          const qty = cap.quantity || 0;
          const completedQty = cap.team_tracking?.total_completed_qty || 0;
          stats.caps.total += qty;
          stats.caps.completed += completedQty;
          stats.totalAssignments += qty;
          stats.totalCompleted += completedQty;
        });
      }

      // Calculate Boxes stats
      if (item.team_assignments.boxes && Array.isArray(item.team_assignments.boxes)) {
        item.team_assignments.boxes.forEach(box => {
          const qty = box.quantity || 0;
          const completedQty = box.team_tracking?.total_completed_qty || 0;
          stats.boxes.total += qty;
          stats.boxes.completed += completedQty;
          stats.totalAssignments += qty;
          stats.totalCompleted += completedQty;
        });
      }

      // Calculate Pumps stats
      if (item.team_assignments.pumps && Array.isArray(item.team_assignments.pumps)) {
        item.team_assignments.pumps.forEach(pump => {
          const qty = pump.quantity || 0;
          const completedQty = pump.team_tracking?.total_completed_qty || 0;
          stats.pumps.total += qty;
          stats.pumps.completed += completedQty;
          stats.totalAssignments += qty;
          stats.totalCompleted += completedQty;
        });
      }

      stats.percentage = stats.totalAssignments > 0
        ? Math.round((stats.totalCompleted / stats.totalAssignments) * 100)
        : 0;

      return stats;
    }).filter(Boolean);

    // Calculate overall totals for the summary row
    const overallTotals = {
      glass: { total: 0, completed: 0 },
      caps: { total: 0, completed: 0 },
      boxes: { total: 0, completed: 0 },
      pumps: { total: 0, completed: 0 },
      totalAssignments: 0,
      totalCompleted: 0
    };

    itemStats.forEach(stat => {
      overallTotals.glass.total += stat.glass.total;
      overallTotals.glass.completed += stat.glass.completed;
      overallTotals.caps.total += stat.caps.total;
      overallTotals.caps.completed += stat.caps.completed;
      overallTotals.boxes.total += stat.boxes.total;
      overallTotals.boxes.completed += stat.boxes.completed;
      overallTotals.pumps.total += stat.pumps.total;
      overallTotals.pumps.completed += stat.pumps.completed;
      overallTotals.totalAssignments += stat.totalAssignments;
      overallTotals.totalCompleted += stat.totalCompleted;
    });

    overallTotals.percentage = overallTotals.totalAssignments > 0
      ? Math.round((overallTotals.totalCompleted / overallTotals.totalAssignments) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <div className="bg-orange-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-orange-800 font-medium mb-4">Item Completion Status</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-200 border border-orange-200 rounded-lg">
              <thead>
                <tr className="bg-gradient-to-r from-[#FF6900] via-[#FF8333] to-[#FF9966] text-white">
                  <th className="px-4 py-3 text-left text-sm font-medium">Item Name</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Glass<br />(Completed/Total)</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Caps<br />(Completed/Total)</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Boxes<br />(Completed/Total)</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Pumps<br />(Completed/Total)</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Total<br />(Completed/Total)</th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-200">
                {itemStats.map((stat, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-orange-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{stat.itemName}</td>

                    <td className="px-4 py-3 text-center text-sm">
                      <span className={stat.glass.completed === stat.glass.total && stat.glass.total > 0 ? 'text-green-600 font-medium' : ''}>
                        {stat.glass.completed}/{stat.glass.total}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-sm">
                      <span className={stat.caps.completed === stat.caps.total && stat.caps.total > 0 ? 'text-green-600 font-medium' : ''}>
                        {stat.caps.completed}/{stat.caps.total}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-sm">
                      <span className={stat.boxes.completed === stat.boxes.total && stat.boxes.total > 0 ? 'text-green-600 font-medium' : ''}>
                        {stat.boxes.completed}/{stat.boxes.total}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-sm">
                      <span className={stat.pumps.completed === stat.pumps.total && stat.pumps.total > 0 ? 'text-green-600 font-medium' : ''}>
                        {stat.pumps.completed}/{stat.pumps.total}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-sm font-medium">
                      <span className={stat.totalCompleted === stat.totalAssignments && stat.totalAssignments > 0 ? 'text-green-600' : 'text-orange-700'}>
                        {stat.totalCompleted}/{stat.totalAssignments}
                      </span>
                    </td>

                    
                  </tr>
                ))}

                {/* Summary Row */}
                <tr className="bg-orange-100 font-medium border-t-2 border-orange-300">
                  <td className="px-4 py-3 text-sm text-orange-800">TOTAL</td>

                  <td className="px-4 py-3 text-center text-sm text-orange-800">
                    {overallTotals.glass.completed}/{overallTotals.glass.total}
                  </td>

                  <td className="px-4 py-3 text-center text-sm text-orange-800">
                    {overallTotals.caps.completed}/{overallTotals.caps.total}
                  </td>

                  <td className="px-4 py-3 text-center text-sm text-orange-800">
                    {overallTotals.boxes.completed}/{overallTotals.boxes.total}
                  </td>

                  <td className="px-4 py-3 text-center text-sm text-orange-800">
                    {overallTotals.pumps.completed}/{overallTotals.pumps.total}
                  </td>

                  <td className="px-4 py-3 text-center text-sm font-bold text-orange-800">
                    {overallTotals.totalCompleted}/{overallTotals.totalAssignments}
                  </td>

                  
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] rounded-t-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="text-white hover:text-orange-100 p-1 rounded transition-colors duration-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <DialogTitle as="h2" className="text-white font-medium text-lg">
                  Order #{order.order_number} Details
                </DialogTitle>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-100 p-1 rounded transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {renderTabs()}
              {activeTab === 'overview'
                ? renderOverview()
                : activeTab === 'items'
                  ? renderItems()
                  : renderStatusTab()
              }
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default ViewTeamOrderChild;