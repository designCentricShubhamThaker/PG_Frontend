import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash } from 'lucide-react';
import axios from 'axios';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { GoTrash } from "react-icons/go";
import { CapData } from '../data/CapData.js';
import { glassData } from '../data/GlassData.js';
import { boxData } from "../data/boxData.js"
import { pumpData } from "../data/pumpData.js"
import { addOrderToLocalStorage } from '../utils/localStorageUtils.jsx';
import { resetForm } from '../utils/resetForm.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { handleDuplicateOrder } from '../utils/orderHelpers.jsx';
import { handleSubmitOrder } from '../utils/orderSubmit.jsx';

const CreateOrderChild = ({ onClose, onCreateOrder }) => {
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
  const [showDuplicateSection, setShowDuplicateSection] = useState(false);
  const [duplicateOrderNumber, setDuplicateOrderNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const customers = ["Amit Verma", "Priya Patel", "Rohan Singh", "Neha Gupta", "Vikram Iyer", "Sunita Nair", "Arjun Malhotra", "Deepa Joshi"];
  const DECORATION_COMBINATIONS = [
    { key: 'coating', label: 'COATING' },
    { key: 'coating_printing', label: 'COATING + PRINTING' },
    { key: 'coating_printing_foiling', label: 'COATING + PRINTING + FOILING' },
    { key: 'printing', label: 'PRINTING' },
    { key: 'printing_foiling', label: 'PRINTING + FOILING' },
    { key: 'foiling', label: 'FOILING' },
    { key: 'coating_foiling', label: 'COATING + FOILING' },
    { key: 'frosting', label: 'FROSTING' },
    { key: 'frosting_printing', label: 'FROSTING + PRINTING' },
    { key: 'frosting_printing_foiling', label: 'FROSTING + PRINTING + FOILING' }
  ];

  const capProcessOptions = ["Spraying", "Assembly", "Polishing", "None"];
  const capMaterialOptions = ["Plastic", "Metal", "Wood", "Ceramic"];
  const pumpNeckTypeOptions = ["Standard", "Wide", "Narrow", "Custom"];
  const [exchangeRates, setExchangeRates] = useState({
    USD: 0,
    EUR: 0,
    GBP: 0
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const onDuplicate = () => handleDuplicateOrder({ duplicateOrderNumber, setDuplicateError, setIsSearching, setDispatcherName, setCustomerName, setOrderItems, setGlassSearches, setCapSearches, setBoxSearches, setPumpSearches, setShowDuplicateSection, setDuplicateOrderNumberValue: setDuplicateOrderNumber });

  const [orderItems, setOrderItems] = useState([
    {
      name: "Item 1",
      teamAssignments: {
        glass: [
          {
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
          }
        ],
        caps: [
          {
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
          }
        ],
        boxes: [
          {
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
          }
        ],
        pumps: [
          {
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
        ]
      }
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { notifyTeam, isConnected } = useSocket();

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      const data = await response.json();
      setExchangeRates({
        USD: data.rates.USD || 0,
        EUR: data.rates.EUR || 0,
        GBP: data.rates.GBP || 0
      });
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Fallback rates (approximate)
      setExchangeRates({
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095
      });
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const calculateItemPrice = (item) => {
    let totalPrice = 0;

    item.teamAssignments.glass.forEach(glass => {
      const qty = parseFloat(glass.quantity) || 0;
      const rate = parseFloat(glass.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });


    item.teamAssignments.caps.forEach(cap => {
      const qty = parseFloat(cap.quantity) || 0;
      const rate = parseFloat(cap.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    item.teamAssignments.boxes.forEach(box => {
      const qty = parseFloat(box.quantity) || 0;
      const rate = parseFloat(box.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    item.teamAssignments.pumps.forEach(pump => {
      const qty = parseFloat(pump.quantity) || 0;
      const rate = parseFloat(pump.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    return totalPrice;
  };

  const calculateTotalOrderPrice = () => {
    return orderItems.reduce((total, item) => total + calculateItemPrice(item), 0);
  };


  const PriceDisplay = ({ priceINR, label = "Price" }) => {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <h5 className="text-sm font-medium text-green-800 mb-2">{label}</h5>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">₹ INR:</span>
            <span className="font-semibold text-green-800">
              {priceINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">$ USD:</span>
            <span className="font-medium text-green-800">
              {isLoadingRates ? '...' : (priceINR * exchangeRates.USD).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">€ EUR:</span>
            <span className="font-medium text-green-800">
              {isLoadingRates ? '...' : (priceINR * exchangeRates.EUR).toLocaleString('en-DE', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">£ GBP:</span>
            <span className="font-medium text-green-800">
              {isLoadingRates ? '...' : (priceINR * exchangeRates.GBP).toLocaleString('en-GB', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    );
  };


  const addOrderItem = () => {
    const newItemNumber = orderItems.length + 1;
    setOrderItems([
      ...orderItems,
      {
        name: `Item ${newItemNumber}`,
        teamAssignments: {
          glass: [
            {
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
            }
          ],
          caps: [
            {
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
            }
          ],
          boxes: [
            {
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
            }
          ],
          pumps: [
            {
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
          ]
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

    if (team === 'glass') {
      updatedItems[itemIndex].teamAssignments.glass.push({
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
      });
    } else if (team === 'caps') {
      updatedItems[itemIndex].teamAssignments.caps.push({
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
      });
    } else if (team === 'boxes') {
      updatedItems[itemIndex].teamAssignments.boxes.push({
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
      });
    } else if (team === 'pumps') {
      updatedItems[itemIndex].teamAssignments.pumps.push({
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
      });
    }

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
    if (team === 'glass' && field === 'decoration') {
      updatedItems[itemIndex].teamAssignments[team][assignmentIndex].printingSelected = value !== 'N/A' && value.trim() !== '';
    }

    setOrderItems(updatedItems);
  };


  const handleOrderItemNameChange = (index, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index].name = value;
    setOrderItems(updatedItems);
  };

  const handleSubmit = (e) => handleSubmitOrder({ e, orderNumber, dispatcherName, customerName, orderItems, setIsSubmitting, setError, addOrderToLocalStorage, isConnected, notifyTeam, onCreateOrder, resetForm: () => resetForm(setOrderNumber, setDispatcherName, setCustomerName, setOrderItems), onClose });

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
                        Create New Order
                      </h3>
                    </div>
                  </DialogTitle>

                  <div className="mt-5">
                    <div className="bg-[#FFF0E7] p-3 rounded-md">
                      <div className="flex items-center justify-between ">
                        <h4 className=" text-orange-800 font-medium">Do you want to duplicate an existing order?</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDuplicateSection(!showDuplicateSection);
                            setDuplicateError("");
                            setDuplicateOrderNumber("");
                          }}
                          className={`cursor-pointer flex items-center gap-2 px-2 py-1 rounded-sm transition-colors duration-200 font-medium ${showDuplicateSection
                            ? "bg-transparent"
                            : "bg-orange-700 text-white hover:bg-red-900 hover:text-white shadow-md"
                            }`}
                        >
                          {showDuplicateSection ? (
                            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          ) : (
                            "Yes, duplicate order"
                          )}
                        </button>
                      </div>

                      {showDuplicateSection && (
                        <div className="space-y-4 mt-4">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={duplicateOrderNumber}
                                onChange={(e) => setDuplicateOrderNumber(e.target.value)}
                                placeholder="Enter order number to duplicate"
                                className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                      focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
                      placeholder:text-gray-400 z-50"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onDuplicate();
                                  }
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={onDuplicate}
                              disabled={isSearching}
                              className="px-3 py-2 cursor-pointer bg-orange-700 rounded-sm shadow-md transition-colors duration-200  hover:bg-red-900 text-white font-medium to-[#FFB84D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isSearching ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  Search
                                </>
                              )}
                            </button>
                          </div>

                          {duplicateError && (
                            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                              {duplicateError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className='mt-6'>
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
                          <div className="flex items-center space-x-4">
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
                        <div>

                        </div>


                        {calculateItemPrice(item) > 0 && (
                          <div className="bg-[#FFF0E7]  border-b  border-orange-200 p-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                              <h5 className="text-orange-800 font-medium mr-5">
                                Your Item Total is : ₹ {calculateItemPrice(item).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </h5>
                              <div className="flex items-center space-x-3 text-orange-800 text-sm font-medium">
                                <span className="transition-all duration-300 hover:text-orange-800 hover:scale-105">
                                  $ {isLoadingRates ? '...' : (calculateItemPrice(item) * exchangeRates.USD).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-orange-300">|</span>
                                <span className="transition-all duration-300 hover:text-orange-800 hover:scale-105">
                                  € {isLoadingRates ? '...' : (calculateItemPrice(item) * exchangeRates.EUR).toLocaleString('en-DE', { maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-orange-300">|</span>
                                <span className="transition-all duration-300 hover:text-orange-800 hover:scale-105">
                                  £ {isLoadingRates ? '...' : (calculateItemPrice(item) * exchangeRates.GBP).toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

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
                                <div className="grid grid-cols-12 gap-4 items-end">
                                  {/* Glass Name - Reduced space */}
                                  <div className="col-span-4">
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

                                  {/* Weight */}
                                  <div className="col-span-1">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Weight</label>
                                    <input
                                      type="text"
                                      value={glass.weight || ""}
                                      className="w-full px-3 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium text-center"
                                      readOnly
                                    />
                                  </div>

                                  {/* Neck Size */}
                                  <div className="col-span-1">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                                    <input
                                      type="text"
                                      value={glass.neck_size || ""}
                                      className="w-full px-3 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium text-center"
                                      readOnly
                                    />
                                  </div>

                                  {/* Decoration - Reduced space */}
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Decoration</label>
                                    <div className="relative">
                                      <select
                                        value={glass.decoration || "N/A"}
                                        onChange={(e) =>
                                          handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'decoration', e.target.value)
                                        }
                                        className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
  focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                      >
                                        <option value="N/A">Please Select</option>
                                        {DECORATION_COMBINATIONS.map((combo) => (
                                          <option key={combo.key} value={combo.key}>
                                            {combo.label}
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
                                  <div className="col-span-1">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Deco No</label>
                                    <input
                                      type="text"
                                      value={glass.decoration_no || ""}
                                      onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'decoration_no', e.target.value)}
                                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                    <input
                                      type="number"
                                      value={glass.quantity || ""}
                                      onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'quantity', e.target.value)}
                                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
              focus:ring-2 focus:ring-orange-500 focus:border-transparent "
                                      min="1"
                                    />
                                  </div>


                                  <div className="col-span-1.5">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                                    <input
                                      type="number"
                                      value={glass.rate || ""}
                                      onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'rate', e.target.value)}
                                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
              focus:ring-2 focus:ring-orange-500 focus:border-transparent "
                                      min="0"
                                      step="0.01"
                                    />
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
                                                  handleTeamDetailChange(itemIndex, capIndex, 'caps', 'neck_size', capItem.NECK_DIAM);
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
                                      <div className="col-span-6 md:col-span-2">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                                        <input
                                          type="text"
                                          value={cap.neck_size || ""}
                                          className="w-full px-3 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
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

                                      <div className="col-span-3 md:col-span-2">
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

                                      <div className="col-span-3 md:col-span-2">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                                        <input
                                          type="number"
                                          value={cap.rate || ""}
                                          onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'rate', e.target.value)}
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                                          focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="0"
                                          step="0.01"
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
                                  {/* Box Name Input */}
                                  <div className="col-span-12 md:col-span-4">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Box Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={boxSearches[`${itemIndex}-${boxIndex}`] || ""}
                                        placeholder={box.box_name !== "N/A" ? box.box_name : "Please Select"}
                                        onFocus={() => {
                                          setIsDropdownVisible(`box-${itemIndex}-${boxIndex}`);
                                          setFilteredBoxData(boxData.filter(b => b.box_name !== "N/A"));
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
                  focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 z-50"
                                      />
                                      <svg className="h-5 w-5 absolute right-3 top-3 text-orange-500" fill="none" stroke="currentColor">
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

                                  {/* Approval, Quantity & Rate */}
                                  <div className="col-span-12 md:col-span-8">
                                    <div className="grid grid-cols-12 gap-4">
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Approval Code</label>
                                        <input
                                          type="text"
                                          value={box.approval_code || ""}
                                          onChange={(e) =>
                                            handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'approval_code', e.target.value)
                                          }
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                        <input
                                          type="number"
                                          value={box.quantity || ""}
                                          onChange={(e) =>
                                            handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'quantity', e.target.value)
                                          }
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="1"
                                        />
                                      </div>
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                                        <input
                                          type="number"
                                          value={box.rate || ""}
                                          onChange={(e) =>
                                            handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'rate', e.target.value)
                                          }
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="0"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Buttons */}
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
                                  {/* Pump Name */}
                                  <div className="col-span-12 md:col-span-4">
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Pump Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={pumpSearches[`${itemIndex}-${pumpIndex}`] || ""}
                                        placeholder={pump.pump_name !== "N/A" ? pump.pump_name : "Please Select"}
                                        onFocus={() => {
                                          setIsDropdownVisible(`pump-${itemIndex}-${pumpIndex}`);
                                          setFilteredPumpData(pumpData.filter(p => p.pump_name !== "N/A"));
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
                  focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 z-50"
                                      />
                                      <svg className="h-5 w-5 absolute right-3 top-3 text-orange-500" fill="none" stroke="currentColor">
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

                                  {/* Neck, Quantity, Rate */}
                                  <div className="col-span-12 md:col-span-8">
                                    <div className="grid grid-cols-12 gap-4">
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Neck Type</label>
                                        <select
                                          value={pump.neck_type || "N/A"}
                                          onChange={(e) =>
                                            handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'neck_type', e.target.value)
                                          }
                                          className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                        >
                                          <option value="N/A">Please Select</option>
                                          {pumpNeckTypeOptions.filter(name => name !== "N/A").map((name, idx) => (
                                            <option key={idx} value={name}>
                                              {name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                                        <input
                                          type="number"
                                          value={pump.quantity || ""}
                                          onChange={(e) =>
                                            handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'quantity', e.target.value)
                                          }
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="1"
                                        />
                                      </div>
                                      <div className="col-span-6 md:col-span-4">
                                        <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                                        <input
                                          type="number"
                                          value={pump.rate || ""}
                                          onChange={(e) =>
                                            handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'rate', e.target.value)
                                          }
                                          className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                          min="0"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Buttons */}
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

                    <div className="mt-8 mb-6">
                      <PriceDisplay
                        priceINR={calculateTotalOrderPrice()}
                        label="Total Order Price"
                      />
                      {isLoadingRates && (
                        <div className="mt-2 text-center">
                          <span className="text-sm text-orange-600 flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                            Updating exchange rates...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                      <button
                        type="button"
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-orange-900 bg-white border border-orange-300 rounded-md shadow-sm hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        onClick={onClose}
                      >
                        Cancel
                      </button>


                      <button
                        type="submit"
                        className={`inline-flex justify-center px-6 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSubmitting
                          ? "bg-orange-300 cursor-not-allowed"
                          : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                          }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating Order..." : "Create Order"}
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
  )
}
export default CreateOrderChild

