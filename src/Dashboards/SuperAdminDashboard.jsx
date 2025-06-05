import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, X, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { FaPowerOff } from "react-icons/fa";
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/useAuth.jsx';
import DispatcherInventoryDashboard from './DispatcherIneventoryDashboard.jsx';
import AddNewBottle from '../pages/AddNewBottle.jsx';


const DispatcherDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', type: 'single' },
    { 
      id: 'customers', 
      label: 'ADD CUSTOMERS', 
      type: 'single' 
    },
    {
      id: 'products',
      label: 'ADD PRODUCTS',
      type: 'parent',
      children: [
        { id: 'bottle', label: 'BOTTLES' },
        { id: 'caps', label: 'CAPS' },
        { id: 'pumps', label: 'PUMPS' },
        { id: 'boxes', label: 'BOXES' },
        { id: 'accessories', label: 'ACCESSORIES' },
      ]
    }
  ];

  const renderMenuItem = (item, isMobileView = false) => {
    if (item.type === 'parent') {
      const isExpanded = expandedMenus[item.id];
      
      return (
        <li key={item.id} className="mb-1">
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={`flex items-center justify-between py-3 px-4 w-full rounded-lg transition-all
              text-black font-bold hover:bg-orange-400 hover:text-white`}
          >
            <span>{item.label}</span>
            {isExpanded ? 
              <ChevronDown size={16} className="ml-2" /> : 
              <ChevronRight size={16} className="ml-2" />
            }
          </button>
          
          {isExpanded && (
            <ul className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => (
                <li key={child.id}>
                  <button
                    onClick={() => {
                      setActiveTab(child.id);
                      if (isMobileView) setMobileMenuOpen(false);
                    }}
                    className={`flex items-center py-2 px-4 w-full rounded-lg transition-all text-sm
                      ${activeTab === child.id
                        ? 'bg-white text-orange-600 font-bold shadow-sm'
                        : 'text-black font-medium hover:bg-orange-300 hover:text-white'
                      }`}
                  >
                    <span>• {child.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }
    
    return (
      <li key={item.id} className="mb-1">
        <button
          onClick={() => {
            setActiveTab(item.id);
            if (isMobileView) setMobileMenuOpen(false);
          }}
          className={`flex items-center py-3 px-4 w-full rounded-lg transition-all
            ${activeTab === item.id
              ? 'bg-white text-orange-600 font-bold shadow-sm'
              : 'text-black font-bold hover:bg-orange-400 hover:text-white'
            }`}
        >
          <span>{item.label}</span>
        </button>
      </li>
    );
  };

  const MobileSidebar = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex md:hidden">
      <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white w-64 h-full flex flex-col shadow-lg">
        <div className="flex items-center p-4 border-b border-orange-400">
          <img src="./logo.png" alt="logo" className="w-32" />
          <button onClick={toggleSidebar} className="ml-auto p-1 rounded-full bg-[#F36821] hover:bg-orange-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => renderMenuItem(item, true))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DispatcherInventoryDashboard />;
      case 'customers':
        return <div className="text-center text-gray-500 mt-8">Add Customers Component</div>;
      case 'bottle':
        return <div>
          <AddNewBottle />
        </div>;
      case 'caps':
        return <div className="text-center text-gray-500 mt-8">Add Caps Component</div>;
      case 'pumps':
        return <div className="text-center text-gray-500 mt-8">Add Pumps Component</div>;
      case 'boxes':
        return <div className="text-center text-gray-500 mt-8">Add Boxes Component</div>;
      case 'accessories':
        return <div className="text-center text-gray-500 mt-8">Add Accessories Component</div>;
      
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} className="mt-6" />
      <ToastContainer />
      {!isMobile && (
        <div
          className={`bg-[url('/bg2.jpg')] bg-cover bg-center text-white flex flex-col transition-all duration-300 
          ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-64'}`}
        >
          <div className="flex items-center p-4 border-b border-orange-400">
            <img src="./logo.png" alt="logo" className="w-[170px] mx-auto" />
            <button
              onClick={toggleSidebar}
              className="ml-auto p-1 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => renderMenuItem(item))}
            </ul>
          </div>
        </div>
      )}

      {isMobile && mobileMenuOpen && <MobileSidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center">
            {isMobile || collapsed ? (
              <button onClick={toggleSidebar} className="p-2 mr-2 rounded-lg hover:bg-gray-100">
                <Menu size={24} className="text-orange-500" />
              </button>
            ) : null}
            <div className="text-xl font-bold">
              <span className="text-black">Welcome</span> <span className="text-orange-500">Master Admin !</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-red-700 text-white rounded-sm px-4 py-3 gap-2 hover:bg-red-800 hover:text-white shadow-md">
              <button onClick={handleLogout} className="font-medium cursor-pointer"><FaPowerOff /></button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DispatcherDashboard;