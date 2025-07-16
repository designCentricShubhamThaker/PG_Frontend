

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, X, Menu } from 'lucide-react';
import { FaPowerOff } from "react-icons/fa";
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/useAuth.jsx';
import DispatcherInventoryDashboard from './DispatcherIneventoryDashboard.jsx';
import CapOrders from '../pages/CapOrders.jsx';
import { useSocket } from '../context/SocketContext.jsx';


const CapDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('liveOrders');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { pendingOrderBuffer, clearTeamBuffer } = useSocket();

  useEffect(() => {
    if (activeTab === 'liveOrders') {
      if (pendingOrderBuffer.caps.length > 0) {
        console.log('🔁 Replaying buffered GLASS orders:', pendingOrderBuffer.caps.length);
        pendingOrderBuffer.caps.forEach(order =>
          window.dispatchEvent(new CustomEvent('socket-new-order', { detail: order }))
        );
        clearTeamBuffer('caps');
      }
    }
  }, [activeTab]);

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

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'liveOrders', label: 'LIVE ORDERS' },
    { id: 'pastOrders', label: 'PAST ORDERS' },
  ];

  const MobileSidebar = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex md:hidden">
      <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white w-64 h-full flex flex-col shadow-lg">
        <div className="flex items-center p-4 border-b border-orange-400">
          <img src="./logo.png" alt="logo" className="w-32" />
          <button onClick={toggleSidebar} className="ml-auto p-1 rounded-full bg-[#F36821] hover:bg-orange-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 py-6">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  style={{ color: "black !important", fontWeight: "500" }}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center py-3 px-4 w-full rounded-lg transition-all ${activeTab === item.id
                    ? 'bg-white text-orange-600 font-bold shadow-sm'
                    : 'text-black !important hover:bg-orange-400 hover:text-white'
                    }`}
                >
                  <span className="text-black !important">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

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

          <div className="flex-1 py-6">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center py-3 px-4 w-full rounded-lg transition-all ${activeTab === item.id
                      ? 'bg-white text-orange-600 font-bold shadow-sm'
                      : 'text-black font-bold hover:bg-orange-400'
                      }`}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
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
              <span className="text-black">Welcome</span> <span className="text-orange-500">Cap Team !</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* <ConnectionStatus /> */}
            <div className="flex items-center bg-red-700 text-white rounded-sm px-4 py-3 gap-2 hover:bg-red-800 hover:text-white shadow-md">
              <button onClick={handleLogout} className="font-medium cursor-pointer"><FaPowerOff /></button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
            {activeTab === 'dashboard' ? (
              <DispatcherInventoryDashboard />
            ) : activeTab === 'liveOrders' ? (
              <CapOrders orderType="pending" />
            ) : (
              <CapOrders orderType="completed" />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CapDashboard;