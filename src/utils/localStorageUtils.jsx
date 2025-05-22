const STORAGE_KEYS = {
  PENDING_ORDERS: '_pendingOrders',
  COMPLETED_ORDERS: '_completedOrders',
  USER_LOGGED_IN: 'user_loggedIn'
};

// Valid team types
const TEAMS = {
  DISPATCHER: 'dispatcher',
  GLASS: 'glass',
  BOX: 'box',
  PUMP: 'pump',
  CAP: 'cap',
  LINER: 'liner',
  STICKER: 'sticker'
};

/**
 * Get the appropriate storage key based on team and order type
 * @param {string} orderType - 'pending' or 'completed'
 * @param {string} team - The team type (dispatcher, glass, box, etc.)
 * @returns {string} The storage key
 */
const getStorageKey = (orderType, team = TEAMS.DISPATCHER) => {
  // Validate team type
  const validTeam = Object.values(TEAMS).includes(team) ? team : TEAMS.DISPATCHER;
  
  // Create the key using the team prefix
  switch (orderType?.toLowerCase()) {
    case 'pending':
      return validTeam + STORAGE_KEYS.PENDING_ORDERS;
    case 'completed':
      return validTeam + STORAGE_KEYS.COMPLETED_ORDERS;
    default:
      return validTeam + STORAGE_KEYS.PENDING_ORDERS; 
  }
};

/**
 * Save orders to localStorage for a specific team
 * @param {Array} orders - Array of orders to save
 * @param {string} orderType - 'pending' or 'completed'
 * @param {string} team - The team type
 * @returns {boolean} Success status
 */
const saveOrdersToLocalStorage = (orders, orderType, team = TEAMS.DISPATCHER) => {
  try {
    if (!Array.isArray(orders)) {
      console.error('Invalid orders data format');
      return false;
    }
    const ordersCopy = JSON.parse(JSON.stringify(orders));
    const storageKey = getStorageKey(orderType, team);
    localStorage.setItem(storageKey, JSON.stringify(ordersCopy));
    return true;
  } catch (error) {
    console.error('Error saving orders to localStorage:', error);
    return false;
  }
};

/**
 * Get orders from localStorage for a specific team
 * @param {string} orderType - 'pending' or 'completed'
 * @param {string} team - The team type
 * @returns {Array} Array of orders
 */
const getOrdersFromLocalStorage = (orderType, team = TEAMS.DISPATCHER) => {
  try {
    const storageKey = getStorageKey(orderType, team);
    const ordersData = localStorage.getItem(storageKey);
    return ordersData ? JSON.parse(ordersData) : [];
  } catch (error) {
    console.error('Error getting orders from localStorage:', error);
    return [];
  }
};

/**
 * Check if orders exist in localStorage for a specific team
 * @param {string} orderType - 'pending' or 'completed'
 * @param {string} team - The team type
 * @returns {boolean} Whether orders exist
 */
const hasOrdersInLocalStorage = (orderType, team = TEAMS.DISPATCHER) => {
  const storageKey = getStorageKey(orderType, team);
  return !!localStorage.getItem(storageKey);
};

/**
 * Add an order to localStorage for the appropriate team
 * @param {Object} newOrder - The order to add
 * @param {string} team - The team type
 * @returns {boolean} Success status
 */
const addOrderToLocalStorage = (newOrder, team = TEAMS.DISPATCHER) => {
  try {
    if (!newOrder || typeof newOrder !== 'object') {
      console.error('Invalid order data');
      return false;
    }

    const orderType = newOrder.order_status === 'Completed' ? 'completed' : 'pending';
    const newOrderCopy = JSON.parse(JSON.stringify(newOrder));
    const existingOrders = getOrdersFromLocalStorage(orderType, team);
    const existingOrderIndex = existingOrders.findIndex(order => order._id === newOrderCopy._id);
    
    if (existingOrderIndex !== -1) {
      const updatedOrders = [
        ...existingOrders.slice(0, existingOrderIndex),
        newOrderCopy,
        ...existingOrders.slice(existingOrderIndex + 1)
      ];
      return saveOrdersToLocalStorage(updatedOrders, orderType, team);
    } else {
      const updatedOrders = [...existingOrders, newOrderCopy];
      return saveOrdersToLocalStorage(updatedOrders, orderType, team);
    }
  } catch (error) {
    console.error('Error adding order to localStorage:', error);
    return false;
  }
};

/**
 * Update an order in localStorage for a specific team
 * @param {string} orderId - The ID of the order to update
 * @param {Object} updatedOrder - The updated order data
 * @param {string} team - The team type
 * @returns {boolean} Success status
 */
const updateOrderInLocalStorage = (orderId, updatedOrder, team = TEAMS.DISPATCHER) => {
  try {
    if (!orderId || !updatedOrder) {
      console.error('Invalid order data for update');
      return false;
    }

    const updatedOrderCopy = JSON.parse(JSON.stringify(updatedOrder));
    const newStatus = updatedOrderCopy.order_status;
    
    const pendingOrders = getOrdersFromLocalStorage('pending', team);
    const completedOrders = getOrdersFromLocalStorage('completed', team);
    
    const newPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const newCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    if (newStatus === 'Completed') {
      newCompletedOrders.push(updatedOrderCopy);
    } else {
      newPendingOrders.push(updatedOrderCopy);
    }
    
    saveOrdersToLocalStorage(newPendingOrders, 'pending', team);
    saveOrdersToLocalStorage(newCompletedOrders, 'completed', team);
    
    return true;
  } catch (error) {
    console.error('Error updating order in localStorage:', error);
    return false;
  }
};

/**
 * Delete an order from localStorage for a specific team
 * @param {string} orderId - The ID of the order to delete
 * @param {string} team - The team type
 * @returns {boolean} Success status
 */
const deleteOrderFromLocalStorage = (orderId, team = TEAMS.DISPATCHER) => {
  try {
    if (!orderId) {
      console.error('Invalid order ID for deletion');
      return false;
    }
    const pendingOrders = getOrdersFromLocalStorage('pending', team);
    const completedOrders = getOrdersFromLocalStorage('completed', team);
    
    const filteredPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const filteredCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    saveOrdersToLocalStorage(filteredPendingOrders, 'pending', team);
    saveOrdersToLocalStorage(filteredCompletedOrders, 'completed', team);
    
    return true;
  } catch (error) {
    console.error('Error deleting order from localStorage:', error);
    return false;
  }
};

/**
 * Clear orders from localStorage for a specific team
 * @param {string} team - The team type
 * @returns {boolean} Success status
 */
const clearOrdersFromLocalStorage = (team = TEAMS.DISPATCHER) => {
  try {
    localStorage.removeItem(getStorageKey('pending', team));
    localStorage.removeItem(getStorageKey('completed', team));
    return true;
  } catch (error) {
    console.error('Error clearing orders from localStorage:', error);
    return false;
  }
};

/**
 * Clear orders from localStorage for all teams
 * @returns {boolean} Success status
 */
const clearAllTeamOrdersFromLocalStorage = () => {
  try {
    Object.values(TEAMS).forEach(team => {
      localStorage.removeItem(getStorageKey('pending', team));
      localStorage.removeItem(getStorageKey('completed', team));
    });
    return true;
  } catch (error) {
    console.error('Error clearing all team orders from localStorage:', error);
    return false;
  }
};

export {
  TEAMS,
  saveOrdersToLocalStorage,
  getOrdersFromLocalStorage,
  hasOrdersInLocalStorage,
  addOrderToLocalStorage,
  updateOrderInLocalStorage,
  deleteOrderFromLocalStorage,
  clearOrdersFromLocalStorage,
  clearAllTeamOrdersFromLocalStorage,
};