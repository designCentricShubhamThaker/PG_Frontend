import { X, ArrowLeft, CheckCircle, Search } from 'lucide-react';
import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

const ViewOrderComponent = ({ order, onClose }) => {
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
      // Search in item name
      if (item.name && item.name.toLowerCase().includes(query)) return true;

      if (item.team_assignments) {
        // Glass assignments
        if (item.team_assignments.glass && Array.isArray(item.team_assignments.glass)) {
          if (item.team_assignments.glass.some(glass =>
            glass.glass_name && glass.glass_name.toLowerCase().includes(query)
          )) return true;
        }

        // Printing assignments
        if (item.team_assignments.printing && Array.isArray(item.team_assignments.printing)) {
          if (item.team_assignments.printing.some(printing =>
            printing.glass_item_id?.glass_name && printing.glass_item_id.glass_name.toLowerCase().includes(query)
          )) return true;
        }

        // Coating assignments
        if (item.team_assignments.coating && Array.isArray(item.team_assignments.coating)) {
          if (item.team_assignments.coating.some(coating =>
            coating.glass_item_id?.glass_name && coating.glass_item_id.glass_name.toLowerCase().includes(query)
          )) return true;
        }

        // Foiling assignments
        if (item.team_assignments.foiling && Array.isArray(item.team_assignments.foiling)) {
          if (item.team_assignments.foiling.some(foiling =>
            foiling.glass_item_id?.glass_name && foiling.glass_item_id.glass_name.toLowerCase().includes(query)
          )) return true;
        }

        // Frosting assignments
        if (item.team_assignments.frosting && Array.isArray(item.team_assignments.frosting)) {
          if (item.team_assignments.frosting.some(frosting =>
            frosting.glass_item_id?.glass_name && frosting.glass_item_id.glass_name.toLowerCase().includes(query)
          )) return true;
        }

        // Cap assignments
        if (item.team_assignments.caps && Array.isArray(item.team_assignments.caps)) {
          if (item.team_assignments.caps.some(cap =>
            cap.cap_name && cap.cap_name.toLowerCase().includes(query)
          )) return true;
        }

        // Box assignments
        if (item.team_assignments.boxes && Array.isArray(item.team_assignments.boxes)) {
          if (item.team_assignments.boxes.some(box =>
            box.box_name && box.box_name.toLowerCase().includes(query)
          )) return true;
        }

        // Pump assignments
        if (item.team_assignments.pumps && Array.isArray(item.team_assignments.pumps)) {
          if (item.team_assignments.pumps.some(pump =>
            pump.pump_name && pump.pump_name.toLowerCase().includes(query)
          )) return true;
        }

        // Accessory assignments
        if (item.team_assignments.accessories && Array.isArray(item.team_assignments.accessories)) {
          if (item.team_assignments.accessories.some(accessory =>
            accessory.accessories_name && accessory.accessories_name.toLowerCase().includes(query)
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

      // Glass assignments
      if (item.team_assignments.glass && Array.isArray(item.team_assignments.glass)) {
        totalAssignments += item.team_assignments.glass.length;
        item.team_assignments.glass.forEach(glass => {
          if (glass.status === 'Completed') completedAssignments++;
        });
      }

      // Printing assignments
      if (item.team_assignments.printing && Array.isArray(item.team_assignments.printing)) {
        totalAssignments += item.team_assignments.printing.length;
        item.team_assignments.printing.forEach(printing => {
          if (printing.status === 'Completed') completedAssignments++;
        });
      }

      // Coating assignments
      if (item.team_assignments.coating && Array.isArray(item.team_assignments.coating)) {
        totalAssignments += item.team_assignments.coating.length;
        item.team_assignments.coating.forEach(coating => {
          if (coating.status === 'Completed') completedAssignments++;
        });
      }

      // Foiling assignments
      if (item.team_assignments.foiling && Array.isArray(item.team_assignments.foiling)) {
        totalAssignments += item.team_assignments.foiling.length;
        item.team_assignments.foiling.forEach(foiling => {
          if (foiling.status === 'Completed') completedAssignments++;
        });
      }

      // Frosting assignments
      if (item.team_assignments.frosting && Array.isArray(item.team_assignments.frosting)) {
        totalAssignments += item.team_assignments.frosting.length;
        item.team_assignments.frosting.forEach(frosting => {
          if (frosting.status === 'Completed') completedAssignments++;
        });
      }

      // Cap assignments
      if (item.team_assignments.caps && Array.isArray(item.team_assignments.caps)) {
        totalAssignments += item.team_assignments.caps.length;
        item.team_assignments.caps.forEach(cap => {
          if (cap.status === 'Completed') completedAssignments++;
        });
      }

      // Box assignments
      if (item.team_assignments.boxes && Array.isArray(item.team_assignments.boxes)) {
        totalAssignments += item.team_assignments.boxes.length;
        item.team_assignments.boxes.forEach(box => {
          if (box.status === 'Completed') completedAssignments++;
        });
      }

      // Pump assignments
      if (item.team_assignments.pumps && Array.isArray(item.team_assignments.pumps)) {
        totalAssignments += item.team_assignments.pumps.length;
        item.team_assignments.pumps.forEach(pump => {
          if (pump.status === 'Completed') completedAssignments++;
        });
      }

      // Accessory assignments
      if (item.team_assignments.accessories && Array.isArray(item.team_assignments.accessories)) {
        totalAssignments += item.team_assignments.accessories.length;
        item.team_assignments.accessories.forEach(accessory => {
          if (accessory.status === 'Completed') completedAssignments++;
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

    const renderPrintingAssignments = () => {
      if (!item.team_assignments.printing || !Array.isArray(item.team_assignments.printing) || item.team_assignments.printing.length === 0) {
        return null;
      }

      return item.team_assignments.printing.map((glass, idx) => {
        const completedQty = glass.team_tracking?.total_completed_qty || 0;
        const completionPercentage = glass.quantity > 0
          ? Math.round((completedQty / glass.quantity) * 100)
          : 0;

        return (
          <div
            key={glass._id}
            className={`${idx > 0 || (item.team_assignments.glass && item.team_assignments.glass.length > 0)
              ? 'mt-4 pt-4 border-t ' + itemBorderColor
              : ''
              }`}
          >

            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Printing
                </span>
                <h4 className="font-medium text-gray-800">{glass.glass_item_id.glass_name}</h4>
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
                <p className="text-sm font-medium">{glass.glass_item_id.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                <p className="text-sm font-medium">{glass.glass_item_id.neck_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Decoration</p>
                <p className="text-sm font-medium">{glass.glass_item_id.decoration || 'None'}</p>
              </div>
              {glass.decoration_no && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Decoration #</p>
                  <p className="text-sm font-medium">{glass.glass_item_id.decoration_no}</p>
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
                  {console.log("Printing progress:", completedQty, "/", glass.quantity)}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };
    const renderFoilingAssignments = () => {
      if (!item.team_assignments.foiling || !Array.isArray(item.team_assignments.foiling) || item.team_assignments.foiling.length === 0) {
        return null;
      }

      return item.team_assignments.foiling.map((glass, idx) => {
        const completedQty = glass.team_tracking?.total_completed_qty || 0;
        const completionPercentage = glass.quantity > 0
          ? Math.round((completedQty / glass.quantity) * 100)
          : 0;

        return (
          <div
            key={glass._id}
            className={`${idx > 0 || (item.team_assignments.glass && item.team_assignments.glass.length > 0)
              ? 'mt-4 pt-4 border-t ' + itemBorderColor
              : ''
              }`}
          >

            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Foiling
                </span>
                <h4 className="font-medium text-gray-800">{glass.glass_item_id.glass_name}</h4>
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
                <p className="text-sm font-medium">{glass.glass_item_id.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                <p className="text-sm font-medium">{glass.glass_item_id.neck_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Decoration</p>
                <p className="text-sm font-medium">{glass.glass_item_id.decoration || 'None'}</p>
              </div>
              {glass.decoration_no && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Decoration #</p>
                  <p className="text-sm font-medium">{glass.glass_item_id.decoration_no}</p>
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
                  {console.log("Printing progress:", completedQty, "/", glass.quantity)}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };
    const renderCoatingAssignments = () => {
      if (!item.team_assignments.coating || !Array.isArray(item.team_assignments.coating) || item.team_assignments.coating.length === 0) {
        return null;
      }

      return item.team_assignments.coating.map((glass, idx) => {
        const completedQty = glass.team_tracking?.total_completed_qty || 0;
        const completionPercentage = glass.quantity > 0
          ? Math.round((completedQty / glass.quantity) * 100)
          : 0;

        return (
          <div
            key={glass._id}
            className={`${idx > 0 || (item.team_assignments.glass && item.team_assignments.glass.length > 0)
              ? 'mt-4 pt-4 border-t ' + itemBorderColor
              : ''
              }`}
          >

            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Coating
                </span>
                <h4 className="font-medium text-gray-800">{glass.glass_item_id.glass_name}</h4>
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
                <p className="text-sm font-medium">{glass.glass_item_id.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                <p className="text-sm font-medium">{glass.glass_item_id.neck_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Decoration</p>
                <p className="text-sm font-medium">{glass.glass_item_id.decoration || 'None'}</p>
              </div>
              {glass.decoration_no && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Decoration #</p>
                  <p className="text-sm font-medium">{glass.glass_item_id.decoration_no}</p>
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
                  {console.log("Printing progress:", completedQty, "/", glass.quantity)}
                </span>
              </div>
            </div>
          </div>
        );
      });
    };
    const renderFrostingAssignments = () => {
      if (!item.team_assignments.frosting || !Array.isArray(item.team_assignments.frosting) || item.team_assignments.frosting.length === 0) {
        return null;
      }

      return item.team_assignments.frosting.map((glass, idx) => {
        const completedQty = glass.team_tracking?.total_completed_qty || 0;
        const completionPercentage = glass.quantity > 0
          ? Math.round((completedQty / glass.quantity) * 100)
          : 0;

        return (
          <div
            key={glass._id}
            className={`${idx > 0 || (item.team_assignments.glass && item.team_assignments.glass.length > 0)
              ? 'mt-4 pt-4 border-t ' + itemBorderColor
              : ''
              }`}
          >

            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className={`px-2 py-1 ${index % 2 === 0 ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'} rounded-md text-sm font-medium`}>
                  Frosting
                </span>
                <h4 className="font-medium text-gray-800">{glass.glass_item_id.glass_name}</h4>
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
                <p className="text-sm font-medium">{glass.glass_item_id.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                <p className="text-sm font-medium">{glass.glass_item_id.neck_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Decoration</p>
                <p className="text-sm font-medium">{glass.glass_item_id.decoration || 'None'}</p>
              </div>
              {glass.decoration_no && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Decoration #</p>
                  <p className="text-sm font-medium">{glass.glass_item_id.decoration_no}</p>
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
                  {console.log("Printing progress:", completedQty, "/", glass.quantity)}
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
        const process = cap.process || '';
        const isAssembly = process.includes('Assembly');
        const isUnassembly = process.includes('Unassembly'); // just for clarity
        const isMetal = process.includes('Metal');

        const renderProcessBlock = (type, index) => {
          const tracking = type === 'assembly' ? cap.assembly_tracking : cap.metal_tracking;
          const completedQty = tracking?.total_completed_qty || 0;
          const completionPercentage = cap.quantity > 0
            ? Math.round((completedQty / cap.quantity) * 100)
            : 0;

          return (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quantity</p>
                  <p className="text-sm font-medium">{cap.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Process</p>
                  <p className="text-sm font-medium">
                    {type === 'assembly' ? 'Assembly' : isMetal ? 'Metal' : 'Non-Metal'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Neck Size</p>
                  <p className="text-sm font-medium">{cap.neck_size}</p>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">
                  Completion ({type === 'assembly' ? 'Assembly' : isMetal ? 'Metal' : 'Non-Metal'})
                </p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                    <div className="bg-white rounded-full h-4 flex items-center overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${idx % 2 === 0 ? 'bg-[#FF6900]' : 'bg-orange-600'}`}
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
        };

        return (
          <div
            key={cap._id}
            className={`${idx > 0 || renderGlassAssignments() ? 'mt-4 pt-4 border-t ' + itemBorderColor : ''}`}
          >
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium">
                  Cap
                </span>
                <h4 className="font-medium text-gray-800">{cap.cap_name} ({cap.process})</h4>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${cap.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
                  }`}>
                  {cap.status}
                </span>
              </div>
            </div>

            {/* Always render 1st process (metal or non-metal) */}
            {renderProcessBlock('metal', idx)}

            {/* Only render assembly bar if process includes "Assembly" */}
            {isAssembly && renderProcessBlock('assembly', idx)}
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
      console.log('rendered')

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

    const renderAccessoryAssignments = () => {
      if (
        !item.team_assignments.accessories ||
        !Array.isArray(item.team_assignments.accessories) ||
        item.team_assignments.accessories.length === 0
      ) {
        return null;
      }

      return item.team_assignments.accessories.map((accessory, idx) => {
        const completedQty = accessory.team_tracking?.total_completed_qty || 0;
        const completionPercentage = accessory.quantity > 0
          ? Math.round((completedQty / accessory.quantity) * 100)
          : 0;

        return (
          <div
            key={accessory._id}
            className={`${idx > 0 || renderGlassAssignments() || renderCapAssignments() || renderBoxAssignments() || renderPumpAssignments()
              ? 'mt-4 pt-4 border-t ' + itemBorderColor
              : ''
              }`}
          >
            <div className="flex flex-wrap justify-between items-center mb-3">
              <div className="w-full md:w-auto flex items-center space-x-2 mb-2 md:mb-0">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium">
                  Accessory
                </span>
                <h4 className="font-medium text-gray-800">{accessory.accessories_name}</h4>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${accessory.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}
                >
                  {accessory.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="text-sm font-medium">{accessory.quantity}</p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Completion</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#cc5500]">
                  <div className="bg-white rounded-full h-4 flex items-center overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${idx % 2 === 0 ? 'bg-[#FF6900]' : 'bg-orange-600'}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
                  {completedQty}/{accessory.quantity}
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
      (item.team_assignments.pumps && item.team_assignments.pumps.length > 0) ||
      (item.team_assignments.printing && item.team_assignments.printing.length > 0) ||
      (item.team_assignments.coating && item.team_assignments.coating.length > 0) ||
      (item.team_assignments.foiling && item.team_assignments.foiling.length > 0) ||
      (item.team_assignments.frosting && item.team_assignments.frosting.length > 0) ||
      (item.team_assignments.accessories && item.team_assignments.accessories.length > 0)

    if (!hasAssignments) return null;

    return (
      <div key={item._id} className={`mb-8 ${itemBgColor} p-4 rounded-lg shadow-sm`}>
        <div>

        </div>
        <h3 className={`${itemTextColor} font-semibold mb-4 pb-2 border-b ${itemBorderColor}`}>
          {item.name}
        </h3>

        {renderGlassAssignments()}
        {renderPrintingAssignments()}
        {renderCoatingAssignments()}
        {renderFoilingAssignments()}
        {renderFrostingAssignments()}
        {renderCapAssignments()}
        {renderBoxAssignments()}
        {renderPumpAssignments()}
        {renderAccessoryAssignments()}
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
                : activeTab === 'items' ?
                  renderItems() : ""

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

export default ViewOrderComponent;