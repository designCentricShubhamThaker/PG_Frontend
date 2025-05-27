import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash } from 'lucide-react';
import axios from 'axios';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { GoTrash } from "react-icons/go";
import { CapData } from '../data/CapData';
import { glassData } from '../data/glassData';
import { boxData } from "../data/boxData"
import { pumpData } from "../data/pumpData"
import { updateDispatcherOrderInLocalStorage } from '../utils/localStorageUtils';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';


const UpdateOrderChild = ({ onClose, order, onUpdateOrder }) => {
  const [orderNumber, setOrderNumber] = useState("");
  const [dispatcherName, setDispatcherName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");
  const dispatchers = ["Rajesh Kumar", "Anita Sharma"];

  const [filteredGlassData, setFilteredGlassData] = useState(glassData);
  const [filteredCapData, setFilteredCapData] = useState(CapData);
  const [filteredBoxData, setFilteredBoxData] = useState(boxData);
  const [filteredPumpData, setFilteredPumpData] = useState(pumpData);

  const [glassSearches, setGlassSearches] = useState({});
  const [capSearches, setCapSearches] = useState({});
  const [boxSearches, setBoxSearches] = useState({});
  const [pumpSearches, setPumpSearches] = useState({});

  const [isDropdownVisible, setIsDropdownVisible] = useState(null);

  const customers = [
    "Amit Verma",
    "Priya Patel",
    "Rohan Singh",
    "Neha Gupta",
    "Vikram Iyer",
    "Sunita Nair",
    "Arjun Malhotra",
    "Deepa Joshi"
  ];

  const decorationOptions = ["Printing", "Coating", "Frosting", "None"];
  const capProcessOptions = ["Spraying", "Assembly", "Polishing", "None"];
  const capMaterialOptions = ["Plastic", "Metal", "Wood", "Ceramic"];
  const pumpNeckTypeOptions = ["Standard", "Wide", "Narrow", "Custom"];

  const [orderItems, setOrderItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log(order);

  const { notifyOrderEdit } = useSocket()


  const createDefaultTeamAssignment = (team) => {
    const defaults = {
      glass: {
        glass_name: "N/A",
        quantity: "",
        weight: "",
        neck_size: "",
        decoration: "N/A",
        decoration_no: "",
        team: "Glass Manufacturing - Mumbai",
        status: "Pending",
        team_tracking: {
          total_completed_qty: 0,
          completed_entries: [],
          status: "Pending"
        }
      },
      caps: {
        cap_name: "N/A",
        neck_size: "",
        quantity: "",
        process: "N/A",
        material: "N/A",
        team: "Cap Manufacturing - Delhi",
        status: "Pending",
        team_tracking: {
          total_completed_qty: 0,
          completed_entries: [],
          status: "Pending"
        }
      },
      boxes: {
        box_name: "N/A",
        quantity: "",
        approval_code: "",
        team: "Box Manufacturing - Pune",
        status: "Pending",
        team_tracking: {
          total_completed_qty: 0,
          completed_entries: [],
          status: "Pending"
        }
      },
      pumps: {
        pump_name: "N/A",
        neck_type: "N/A",
        quantity: "",
        team: "Pump Manufacturing - Chennai",
        status: "Pending",
        team_tracking: {
          total_completed_qty: 0,
          completed_entries: [],
          status: "Pending"
        }
      }
    };
    return defaults[team];
  };

  useEffect(() => {
    if (order) {
      setOrderNumber(order.order_number || "");
      setDispatcherName(order.dispatcher_name || "");
      setCustomerName(order.customer_name || "");

      const transformedItems = [];

      const itemsToProcess = order.item_ids || [];

      if (Array.isArray(itemsToProcess) && itemsToProcess.length > 0) {
        itemsToProcess.forEach((item, index) => {
          const transformedItem = {
            name: item.name || `Item ${index + 1}`,
            teamAssignments: {
              glass: [],
              caps: [],
              boxes: [],
              pumps: []
            }
          };

          if (item.team_assignments) {
            // Handle Glass assignments
            if (item.team_assignments.glass && Array.isArray(item.team_assignments.glass) && item.team_assignments.glass.length > 0) {
              transformedItem.teamAssignments.glass = item.team_assignments.glass.map(glass => ({
                glass_name: glass.glass_name || "N/A",
                quantity: glass.quantity?.toString() || "",
                weight: glass.weight || "",
                neck_size: glass.neck_size || "",
                decoration: glass.decoration || glass.decoration_details?.type || "N/A",
                decoration_no: glass.decoration_no || glass.decoration_details?.decoration_number || "",
                team: glass.team || "Glass Manufacturing - Mumbai",
                status: glass.status || "Pending",
                team_tracking: glass.team_tracking || {
                  total_completed_qty: 0,
                  completed_entries: [],
                  status: "Pending"
                }
              }));
            } else {
              transformedItem.teamAssignments.glass = [createDefaultTeamAssignment('glass')];
            }

            if (item.team_assignments.caps && Array.isArray(item.team_assignments.caps) && item.team_assignments.caps.length > 0) {
              transformedItem.teamAssignments.caps = item.team_assignments.caps.map(cap => ({
                cap_name: cap.cap_name || "N/A",
                neck_size: cap.neck_size || "",
                quantity: cap.quantity?.toString() || "",
                process: cap.process || "N/A",
                material: cap.material || "N/A",
                team: cap.team || "Cap Manufacturing - Delhi",
                status: cap.status || "Pending",
                team_tracking: cap.team_tracking || {
                  total_completed_qty: 0,
                  completed_entries: [],
                  status: "Pending"
                }
              }));
            } else {
              transformedItem.teamAssignments.caps = [createDefaultTeamAssignment('caps')];
            }

            if (item.team_assignments.boxes && Array.isArray(item.team_assignments.boxes) && item.team_assignments.boxes.length > 0) {
              transformedItem.teamAssignments.boxes = item.team_assignments.boxes.map(box => ({
                box_name: box.box_name || "N/A",
                quantity: box.quantity?.toString() || "",
                approval_code: box.approval_code || "",
                team: box.team || "Box Manufacturing - Pune",
                status: box.status || "Pending",
                team_tracking: box.team_tracking || {
                  total_completed_qty: 0,
                  completed_entries: [],
                  status: "Pending"
                }
              }));
            } else {
              transformedItem.teamAssignments.boxes = [createDefaultTeamAssignment('boxes')];
            }

            if (item.team_assignments.pumps && Array.isArray(item.team_assignments.pumps) && item.team_assignments.pumps.length > 0) {
              transformedItem.teamAssignments.pumps = item.team_assignments.pumps.map(pump => ({
                pump_name: pump.pump_name || "N/A",
                neck_type: pump.neck_type || "N/A",
                quantity: pump.quantity?.toString() || "",
                team: pump.team || "Pump Manufacturing - Chennai",
                status: pump.status || "Pending",
                team_tracking: pump.team_tracking || {
                  total_completed_qty: 0,
                  completed_entries: [],
                  status: "Pending"
                }
              }));
            } else {
              transformedItem.teamAssignments.pumps = [createDefaultTeamAssignment('pumps')];
            }
          }

          transformedItems.push(transformedItem);
        });
      } else {

        transformedItems.push({
          name: "Item 1",
          teamAssignments: {
            glass: [createDefaultTeamAssignment('glass')],
            caps: [createDefaultTeamAssignment('caps')],
            boxes: [createDefaultTeamAssignment('boxes')],
            pumps: [createDefaultTeamAssignment('pumps')]
          }
        });
      }

      setOrderItems(transformedItems);

      const initialGlassSearches = {};
      const initialCapSearches = {};
      const initialBoxSearches = {};
      const initialPumpSearches = {};

      transformedItems.forEach((item, itemIndex) => {
        item.teamAssignments.glass.forEach((glass, glassIndex) => {
          if (glass.glass_name && glass.glass_name !== "N/A") {
            initialGlassSearches[`${itemIndex}-${glassIndex}`] = glass.glass_name;
          }
        });
        item.teamAssignments.caps.forEach((cap, capIndex) => {
          if (cap.cap_name && cap.cap_name !== "N/A") {
            initialCapSearches[`${itemIndex}-${capIndex}`] = cap.cap_name;
          }
        });
        item.teamAssignments.boxes.forEach((box, boxIndex) => {
          if (box.box_name && box.box_name !== "N/A") {
            initialBoxSearches[`${itemIndex}-${boxIndex}`] = box.box_name;
          }
        });
        item.teamAssignments.pumps.forEach((pump, pumpIndex) => {
          if (pump.pump_name && pump.pump_name !== "N/A") {
            initialPumpSearches[`${itemIndex}-${pumpIndex}`] = pump.pump_name;
          }
        });
      });

      setGlassSearches(initialGlassSearches);
      setCapSearches(initialCapSearches);
      setBoxSearches(initialBoxSearches);
      setPumpSearches(initialPumpSearches);
    }
  }, [order]);

  const addOrderItem = () => {
    const newItemNumber = orderItems.length + 1;
    setOrderItems([
      ...orderItems,
      {
        name: `Item ${newItemNumber}`,
        teamAssignments: {
          glass: [createDefaultTeamAssignment('glass')],
          caps: [createDefaultTeamAssignment('caps')],
          boxes: [createDefaultTeamAssignment('boxes')],
          pumps: [createDefaultTeamAssignment('pumps')]
        }
      }
    ]);
  };

  const removeOrderItem = (index) => {
    if (orderItems.length === 1) return;
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const addTeamAssignment = (itemIndex, team) => {
    const updatedItems = [...orderItems];
    updatedItems[itemIndex].teamAssignments[team].push(createDefaultTeamAssignment(team));
    setOrderItems(updatedItems);
  };

  const removeTeamAssignment = (itemIndex, assignmentIndex, team) => {
    const assignments = orderItems[itemIndex].teamAssignments[team];
    if (assignments.length === 1) return;

    const updatedItems = [...orderItems];
    updatedItems[itemIndex].teamAssignments[team].splice(assignmentIndex, 1);
    setOrderItems(updatedItems);
  };

  const handleTeamDetailChange = (itemIndex, assignmentIndex, team, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[itemIndex].teamAssignments[team][assignmentIndex][field] = value;
    setOrderItems(updatedItems);
  };

  const handleOrderItemNameChange = (index, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index].name = value;
    setOrderItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!orderNumber || !dispatcherName || !customerName) {
        setError('Please fill in all required fields: order number, dispatcher name, and customer name');
        setIsSubmitting(false);
        return;
      }

      let hasValidItems = false;
      const formattedItems = [];

      for (const item of orderItems) {
        const validGlassItems = item.teamAssignments.glass.filter(glass =>
          glass.glass_name !== "N/A" && glass.glass_name !== "" && glass.quantity);

        const validCapItems = item.teamAssignments.caps.filter(cap =>
          cap.cap_name !== "N/A" && cap.cap_name !== "" && cap.quantity);

        const validBoxItems = item.teamAssignments.boxes.filter(box =>
          box.box_name !== "N/A" && box.box_name !== "" && box.quantity);

        const validPumpItems = item.teamAssignments.pumps.filter(pump =>
          pump.pump_name !== "N/A" && pump.pump_name !== "" && pump.quantity);

        if (validGlassItems.length > 0 || validCapItems.length > 0 ||
          validBoxItems.length > 0 || validPumpItems.length > 0) {
          hasValidItems = true;

          formattedItems.push({
            name: item.name,
            glass: validGlassItems.map(glass => ({
              glass_name: glass.glass_name,
              quantity: parseInt(glass.quantity, 10) || 0,
              weight: glass.weight || '',
              neck_size: glass.neck_size || '',
              decoration: glass.decoration || '',
              decoration_no: glass.decoration_no || '',
              decoration_details: {
                type: glass.decoration || '',
                decoration_number: glass.decoration_no || ''
              },
              team: glass.team || 'Glass Manufacturing - Mumbai',
              status: glass.status || 'Pending',
              team_tracking: glass.team_tracking || {
                total_completed_qty: 0,
                completed_entries: [],
                status: 'Pending'
              }
            })),
            caps: validCapItems.map(cap => ({
              cap_name: cap.cap_name,
              neck_size: cap.neck_size || '',
              quantity: parseInt(cap.quantity, 10) || 0,
              process: cap.process || '',
              material: cap.material || '',
              team: cap.team || 'Cap Manufacturing - Delhi',
              status: cap.status || 'Pending',
              team_tracking: cap.team_tracking || {
                total_completed_qty: 0,
                completed_entries: [],
                status: 'Pending'
              }
            })),
            boxes: validBoxItems.map(box => ({
              box_name: box.box_name,
              quantity: parseInt(box.quantity, 10) || 0,
              approval_code: box.approval_code || '',
              team: box.team || 'Box Manufacturing - Pune',
              status: box.status || 'Pending',
              team_tracking: box.team_tracking || {
                total_completed_qty: 0,
                completed_entries: [],
                status: 'Pending'
              }
            })),
            pumps: validPumpItems.map(pump => ({
              pump_name: pump.pump_name,
              neck_type: pump.neck_type || '',
              quantity: parseInt(pump.quantity, 10) || 0,
              team: pump.team || 'Pump Manufacturing - Chennai',
              status: pump.status || 'Pending',
              team_tracking: pump.team_tracking || {
                total_completed_qty: 0,
                completed_entries: [],
                status: 'Pending'
              }
            }))
          });
        }
      }

      if (!hasValidItems) {
        setError('Please add at least one valid item with name and quantity in any team');
        setIsSubmitting(false);
        return;
      }

      // Store the original order for comparison
      const previousOrder = { ...order };

      const orderData = {
        order_number: orderNumber.trim(),
        dispatcher_name: dispatcherName.trim(),
        customer_name: customerName.trim(),
        order_status: order.order_status || 'Pending',
        items: formattedItems
      };

      const response = await axios.put(`http://localhost:5000/api/orders/${order._id}`, orderData);

      if (response.data.success) {
        const updatedOrder = response.data.data;

        const updateSuccess = updateDispatcherOrderInLocalStorage(updatedOrder);

        if (!updateSuccess) {
          console.warn('Order updated in database but localStorage update failed');
        }

        // Determine what fields were edited
        const editedFields = [];
        if (previousOrder.order_number !== updatedOrder.order_number) editedFields.push('order_number');
        if (previousOrder.dispatcher_name !== updatedOrder.dispatcher_name) editedFields.push('dispatcher_name');
        if (previousOrder.customer_name !== updatedOrder.customer_name) editedFields.push('customer_name');
        if (JSON.stringify(previousOrder.items) !== JSON.stringify(updatedOrder.items)) editedFields.push('items');


        if (notifyOrderEdit) {
          const editData = {
            updatedOrder,
            previousOrder,
            editedFields
          };

          const notificationSent = notifyOrderEdit(editData);
          if (!notificationSent) {
            console.warn('Failed to send socket notification to teams');
          }
        } else {
          console.warn('notifyOrderEdit function not available');
        }

        if (onUpdateOrder) {
          onUpdateOrder();
        }

        onClose();

        console.log('Order updated successfully and teams notified');
        toast.success("order details updated successfully !")

      } else {
        setError('Error updating order: ' + (response.data.message || 'Unknown error'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Error updating order: ' + (error.response?.data?.message || error.message));
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-screen-xl"
          >
            <div className="bg-white px-1 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[90vh] overflow-y-auto">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <DialogTitle as="h3">
                    <div className="bg-[#FF6701] p-4 rounded-t-md border-b border-orange-200 shadow-sm text-center">
                      <h3 className="text-white text-xl font-bold flex tracking-wide gap-2">
                        Update Order
                      </h3>
                    </div>
                  </DialogTitle>

                  <form onSubmit={handleSubmit} className='mt-4'>
                    <div className="grid grid-cols-1 md:grid-cols-3 bg-[#FFF0E7] gap-6 mb-8">
                      <div className="p-5">
                        <label className="block text-sm font-medium text-orange-600 mb-1">
                          Order Number
                        </label>
                        <input
                          type="text"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        />
                      </div>

                      <div className="rounded-md p-5">
                        <label className="block text-sm font-medium text-orange-600 mb-1">
                          Dispatcher Name
                        </label>
                        <select
                          value={dispatcherName}
                          onChange={(e) => setDispatcherName(e.target.value)}
                          className="w-full px-3 bg-white py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        >
                          <option value="">Select Dispatcher</option>
                          {dispatchers.map((dispatcher, idx) => (
                            <option key={idx} value={dispatcher}>
                              {dispatcher}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-md p-5">
                        <label className="block text-sm font-medium text-orange-600 mb-1">
                          Customer Name
                        </label>
                        <select
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 bg-white py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        >
                          <option value="">Select Customer</option>
                          {customers.map((customer, idx) => (
                            <option key={idx} value={customer}>
                              {customer}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                      </div>
                    )}

                    {orderItems.map((item, itemIndex) => (
                      <div key={`item-${itemIndex}`} className="mb-8 rounded-xl shadow-lg overflow-visible border border-orange-200 relative">
                        <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] p-4 flex justify-between items-center">
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-white">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleOrderItemNameChange(itemIndex, e.target.value)}
                                className="bg-transparent border-b border-white/50 text-white px-2 py-1 focus:outline-none focus:border-white w-32"
                              />
                            </h3>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => addOrderItem()}
                              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition"
                              title="Add New Item"
                            >
                              <Plus size={16} strokeWidth={2.5} />
                            </button>
                            {orderItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOrderItem(itemIndex)}
                                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition"
                                title="Remove Item"
                              >
                                <GoTrash size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-6 bg-[#FFF8F3]">
                          <div className="flex items-center mb-4">
                            <h4 className="text-md font-medium text-orange-800">Team - Glass</h4>
                          </div>

                          <div className="space-y-6">
                            {item.teamAssignments.glass.map((glass, glassIndex) => (
                              <div
                                key={`glass-${itemIndex}-${glassIndex}`}
                                className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
                              >
                                <div className="grid grid-cols-12 gap-4">
                                  <div className="col-span-12 md:col-span-4">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Glass Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={glassSearches[`${itemIndex}-${glassIndex}`] || ""}
                                        placeholder={glass.glass_name !== "N/A" ? glass.glass_name : "Please Select"}
                                        onFocus={() => {
                                          setIsDropdownVisible(`glass-${itemIndex}-${glassIndex}`);
                                          setFilteredGlassData(
                                            glassData.filter(g => g.FORMULA !== "N/A")
                                          );
                                        }}
                                        onChange={(e) => {
                                          const searchValue = e.target.value;
                                          const newSearches = { ...glassSearches };
                                          newSearches[`${itemIndex}-${glassIndex}`] = searchValue;
                                          setGlassSearches(newSearches);

                                          const searchTerm = searchValue.toLowerCase();
                                          const filtered = glassData.filter(g =>
                                            (g.FORMULA !== "N/A" || searchTerm === "n/a") &&
                                            g.FORMULA.toLowerCase().includes(searchTerm)
                                          );
                                          setFilteredGlassData(filtered);
                                        }}
                                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                            focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
                                                            placeholder:text-gray-400 z-50"
                                      />
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>

                                      {isDropdownVisible === `glass-${itemIndex}-${glassIndex}` && (
                                        <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                                          {filteredGlassData.length > 0 ? (
                                            filteredGlassData.map((glassItem, idx) => (
                                              <div
                                                key={idx}
                                                className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                                                onClick={() => {
                                                  const newSearches = { ...glassSearches };
                                                  newSearches[`${itemIndex}-${glassIndex}`] = glassItem.FORMULA;
                                                  setGlassSearches(newSearches);

                                                  handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'glass_name', glassItem.FORMULA);
                                                  handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'neck_size', glassItem.NECK_DIAM);
                                                  handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'weight', glassItem.ML);
                                                  setIsDropdownVisible(null);
                                                }}
                                              >
                                                <span className="text-orange-700 font-medium">
                                                  {glassItem.FORMULA === "N/A" ? "Please Select" : glassItem.FORMULA}
                                                </span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="col-span-12 md:col-span-8">
                                    <div className="grid grid-cols-12 gap-4">
                                      <div className="col-span-6 md:col-span-2">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Weight</label>
                                        <input
                                          type="text"
                                          value={glass.weight || ""}
                                          className="w-full px-4 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
                                          readOnly
                                        />
                                      </div>

                                      <div className="col-span-6 md:col-span-2">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                                        <input
                                          type="text"
                                          value={glass.neck_size || ""}
                                          className="w-full px-4 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
                                          readOnly
                                        />
                                      </div>

                                      <div className="col-span-12 md:col-span-3">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Decoration</label>
                                        <div className="relative">
                                          <select
                                            value={glass.decoration || "N/A"}
                                            onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'decoration', e.target.value)}
                                            className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                                focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                          >
                                            <option value="N/A">Please Select</option>
                                            {decorationOptions
                                              .filter(name => name !== "N/A")
                                              .map((name, idx) => (
                                                <option key={idx} value={name}>
                                                  {name}
                                                </option>
                                              ))}
                                          </select>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>

                                      <div className="col-span-6 md:col-span-2">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Deco No</label>
                                        <input
                                          type="text"
                                          value={glass.decoration_no || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'decoration_no', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                      </div>


                                      <div className="col-span-6 md:col-span-3">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                        <input
                                          type="number"
                                          value={glass.quantity || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'quantity', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="1"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                                  <button
                                    type="button"
                                    onClick={() => addTeamAssignment(itemIndex, 'glass')}
                                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                    title="Add Glass Item"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                  {item.teamAssignments.glass.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeTeamAssignment(itemIndex, glassIndex, 'glass')}
                                      className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                      title="Remove Glass Item"
                                    >
                                      <Trash size={16} strokeWidth={2.5} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 bg-[#FFF8F3] border-t border-orange-200">
                          <div className="flex items-center mb-4">
                            <h4 className="text-md font-medium text-orange-800">Team - Caps</h4>
                          </div>

                          <div className="space-y-6">
                            {item.teamAssignments.caps.map((cap, capIndex) => (
                              <div
                                key={`cap-${itemIndex}-${capIndex}`}
                                className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
                              >
                                <div className="grid grid-cols-12 gap-4">
                                  <div className="col-span-12 md:col-span-4">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Cap Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={capSearches[`${itemIndex}-${capIndex}`] || ""}
                                        placeholder={cap.cap_name !== "N/A" ? cap.cap_name : "Please Select"}
                                        onFocus={() => {
                                          setIsDropdownVisible(`cap-${itemIndex}-${capIndex}`);
                                          setFilteredCapData(
                                            CapData.filter(c => c.FORMULA !== "N/A")
                                          );
                                        }}
                                        onChange={(e) => {
                                          const searchValue = e.target.value;
                                          const newSearches = { ...capSearches };
                                          newSearches[`${itemIndex}-${capIndex}`] = searchValue;
                                          setCapSearches(newSearches);

                                          const searchTerm = searchValue.toLowerCase();
                                          const filtered = CapData.filter(c =>
                                            (c.FORMULA !== "N/A" || searchTerm === "n/a") &&
                                            c.FORMULA.toLowerCase().includes(searchTerm)
                                          );
                                          setFilteredCapData(filtered);
                                        }}
                                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                            focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
                                                            placeholder:text-gray-400 z-50"
                                      />
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>

                                      {isDropdownVisible === `cap-${itemIndex}-${capIndex}` && (
                                        <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                                          {filteredCapData.length > 0 ? (
                                            filteredCapData.map((capItem, idx) => (
                                              <div
                                                key={idx}
                                                className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                                                onClick={() => {
                                                  const newSearches = { ...capSearches };
                                                  newSearches[`${itemIndex}-${capIndex}`] = capItem.FORMULA;
                                                  setCapSearches(newSearches);

                                                  handleTeamDetailChange(itemIndex, capIndex, 'caps', 'cap_name', capItem.FORMULA);
                                                  handleTeamDetailChange(itemIndex, capIndex, 'caps', 'neck_size', capItem.NECK_DIAM); // Fixed to use NECK_DIAM
                                                  setIsDropdownVisible(null);
                                                }}
                                              >
                                                <span className="text-orange-700 font-medium">
                                                  {capItem.FORMULA === "N/A" ? "Please Select" : capItem.FORMULA}
                                                </span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="col-span-12 md:col-span-8">
                                    <div className="grid grid-cols-12 gap-4">
                                      <div className="col-span-6 md:col-span-3">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                                        <input
                                          type="text"
                                          value={cap.neck_size || ""}
                                          className="w-full px-4 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
                                          readOnly
                                        />
                                      </div>

                                      <div className="col-span-6 md:col-span-3">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Process</label>
                                        <div className="relative">
                                          <select
                                            value={cap.process || "N/A"}
                                            onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'process', e.target.value)}
                                            className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                                focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                          >
                                            <option value="N/A">Please Select</option>
                                            {capProcessOptions
                                              .filter(name => name !== "N/A")
                                              .map((name, idx) => (
                                                <option key={idx} value={name}>
                                                  {name}
                                                </option>
                                              ))}
                                          </select>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>

                                      <div className="col-span-6 md:col-span-3">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Material</label>
                                        <div className="relative">
                                          <select
                                            value={cap.material || "N/A"}
                                            onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'material', e.target.value)}
                                            className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                                focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                          >
                                            <option value="N/A">Please Select</option>
                                            {capMaterialOptions
                                              .filter(name => name !== "N/A")
                                              .map((name, idx) => (
                                                <option key={idx} value={name}>
                                                  {name}
                                                </option>
                                              ))}
                                          </select>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>

                                      <div className="col-span-6 md:col-span-3">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                        <input
                                          type="number"
                                          value={cap.quantity || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'quantity', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="1"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                                  <button
                                    type="button"
                                    onClick={() => addTeamAssignment(itemIndex, 'caps')}
                                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                    title="Add Cap Item"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                  {item.teamAssignments.caps.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeTeamAssignment(itemIndex, capIndex, 'caps')}
                                      className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                      title="Remove Cap Item"
                                    >
                                      <Trash size={16} strokeWidth={2.5} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 bg-[#FFF8F3] border-t border-orange-200">
                          <div className="flex items-center mb-4">
                            <h4 className="text-md font-medium text-orange-800">Team - Boxes</h4>
                          </div>

                          <div className="space-y-6">
                            {item.teamAssignments.boxes.map((box, boxIndex) => (
                              <div
                                key={`box-${itemIndex}-${boxIndex}`}
                                className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
                              >
                                <div className="grid grid-cols-12 gap-4">
                                  <div className="col-span-12 md:col-span-4">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Box Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={boxSearches[`${itemIndex}-${boxIndex}`] || ""}
                                        placeholder={box.box_name !== "N/A" ? box.box_name : "Please Select"}
                                        onFocus={() => {
                                          setIsDropdownVisible(`box-${itemIndex}-${boxIndex}`);
                                          setFilteredBoxData(
                                            boxData.filter(b => b.box_name !== "N/A")
                                          );
                                        }}
                                        onChange={(e) => {
                                          const searchValue = e.target.value;
                                          const newSearches = { ...boxSearches };
                                          newSearches[`${itemIndex}-${boxIndex}`] = searchValue;
                                          setBoxSearches(newSearches);

                                          const searchTerm = searchValue.toLowerCase();
                                          const filtered = boxData.filter(b =>
                                            (b.box_name !== "N/A" || searchTerm === "n/a") &&
                                            b.box_name.toLowerCase().includes(searchTerm)
                                          );
                                          setFilteredBoxData(filtered);
                                        }}
                                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                            focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
                                                            placeholder:text-gray-400 z-50"
                                      />
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>

                                      {isDropdownVisible === `box-${itemIndex}-${boxIndex}` && (
                                        <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                                          {filteredBoxData.length > 0 ? (
                                            filteredBoxData.map((boxItem, idx) => (
                                              <div
                                                key={idx}
                                                className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                                                onClick={() => {
                                                  const newSearches = { ...boxSearches };
                                                  newSearches[`${itemIndex}-${boxIndex}`] = boxItem.box_name;
                                                  setBoxSearches(newSearches);

                                                  handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'box_name', boxItem.box_name);
                                                  setIsDropdownVisible(null);
                                                }}
                                              >
                                                <span className="text-orange-700 font-medium">
                                                  {boxItem.box_name === "N/A" ? "Please Select" : boxItem.box_name}
                                                </span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="col-span-12 md:col-span-8">
                                    <div className="grid grid-cols-12 gap-4">
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Approval Code</label>
                                        <input
                                          type="text"
                                          value={box.approval_code || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'approval_code', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                      </div>

                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                        <input
                                          type="number"
                                          value={box.quantity || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'quantity', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="1"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                                  <button
                                    type="button"
                                    onClick={() => addTeamAssignment(itemIndex, 'boxes')}
                                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                    title="Add Box Item"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                  {item.teamAssignments.boxes.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeTeamAssignment(itemIndex, boxIndex, 'boxes')}
                                      className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                      title="Remove Box Item"
                                    >
                                      <Trash size={16} strokeWidth={2.5} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 bg-[#FFF8F3] border-t border-orange-200 rounded-b-xl">
                          <div className="flex items-center mb-4">
                            <h4 className="text-md font-medium text-orange-800">Team - Pumps</h4>
                          </div>

                          <div className="space-y-6">
                            {item.teamAssignments.pumps.map((pump, pumpIndex) => (
                              <div
                                key={`pump-${itemIndex}-${pumpIndex}`}
                                className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
                              >
                                <div className="grid grid-cols-12 gap-4">
                                  <div className="col-span-12 md:col-span-4">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Pump Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={pumpSearches[`${itemIndex}-${pumpIndex}`] || ""}
                                        placeholder={pump.pump_name !== "N/A" ? pump.pump_name : "Please Select"}
                                        onFocus={() => {
                                          setIsDropdownVisible(`pump-${itemIndex}-${pumpIndex}`);
                                          setFilteredPumpData(
                                            pumpData.filter(p => p.pump_name !== "N/A")
                                          );
                                        }}
                                        onChange={(e) => {
                                          const searchValue = e.target.value;
                                          const newSearches = { ...pumpSearches };
                                          newSearches[`${itemIndex}-${pumpIndex}`] = searchValue;
                                          setPumpSearches(newSearches);

                                          const searchTerm = searchValue.toLowerCase();
                                          const filtered = pumpData.filter(p =>
                                            (p.pump_name !== "N/A" || searchTerm === "n/a") &&
                                            p.pump_name.toLowerCase().includes(searchTerm)
                                          );
                                          setFilteredPumpData(filtered);
                                        }}
                                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                            focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
                                                            placeholder:text-gray-400 z-50"
                                      />
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>

                                      {isDropdownVisible === `pump-${itemIndex}-${pumpIndex}` && (
                                        <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                                          {filteredPumpData.length > 0 ? (
                                            filteredPumpData.map((pumpItem, idx) => (
                                              <div
                                                key={idx}
                                                className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                                                onClick={() => {
                                                  const newSearches = { ...pumpSearches };
                                                  newSearches[`${itemIndex}-${pumpIndex}`] = pumpItem.pump_name;
                                                  setPumpSearches(newSearches);

                                                  handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'pump_name', pumpItem.pump_name);
                                                  setIsDropdownVisible(null);
                                                }}
                                              >
                                                <span className="text-orange-700 font-medium">
                                                  {pumpItem.pump_name === "N/A" ? "Please Select" : pumpItem.pump_name}
                                                </span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="col-span-12 md:col-span-8">
                                    <div className="grid grid-cols-12 gap-4">
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Neck Type</label>
                                        <div className="relative">
                                          <select
                                            value={pump.neck_type || "N/A"}
                                            onChange={(e) => handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'neck_type', e.target.value)}
                                            className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                                focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                          >
                                            <option value="N/A">Please Select</option>
                                            {pumpNeckTypeOptions
                                              .filter(name => name !== "N/A")
                                              .map((name, idx) => (
                                                <option key={idx} value={name}>
                                                  {name}
                                                </option>
                                              ))}
                                          </select>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>

                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                        <input
                                          type="number"
                                          value={pump.quantity || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'quantity', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="1"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                                  <button
                                    type="button"
                                    onClick={() => addTeamAssignment(itemIndex, 'pumps')}
                                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                    title="Add Pump Item"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                  {item.teamAssignments.pumps.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeTeamAssignment(itemIndex, pumpIndex, 'pumps')}
                                      className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                                      title="Remove Pump Item"
                                    >
                                      <Trash size={16} strokeWidth={2.5} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Order'}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default UpdateOrderChild;