const STORAGE_KEYS = {
  PENDING_ORDERS: 'dispatcher_pendingOrders',
  COMPLETED_ORDERS: 'dispatcher_completedOrders',
  USER_LOGGED_IN: 'user_loggedIn'
};

const getStorageKeyByType = (orderType) => {
  switch (orderType?.toLowerCase()) {
    case 'pending':
      return STORAGE_KEYS.PENDING_ORDERS;
    case 'completed':
      return STORAGE_KEYS.COMPLETED_ORDERS;
    default:
      return STORAGE_KEYS.PENDING_ORDERS; // Default to pending if type not specified
  }
};


const saveOrdersToLocalStorage = (orders, orderType) => {
  try {
    if (!Array.isArray(orders)) {
      console.error('Invalid orders data format');
      return false;
    }
    const ordersCopy = JSON.parse(JSON.stringify(orders));
    const storageKey = getStorageKeyByType(orderType);
    localStorage.setItem(storageKey, JSON.stringify(ordersCopy));
    return true;
  } catch (error) {
    console.error('Error saving orders to localStorage:', error);
    return false;
  }
};

const getOrdersFromLocalStorage = (orderType) => {
  try {
    const storageKey = getStorageKeyByType(orderType);
    const ordersData = localStorage.getItem(storageKey);
    return ordersData ? JSON.parse(ordersData) : [];
  } catch (error) {
    console.error('Error getting orders from localStorage:', error);
    return [];
  }
};

const hasOrdersInLocalStorage = (orderType) => {
  const storageKey = getStorageKeyByType(orderType);
  return !!localStorage.getItem(storageKey);
};

const addOrderToLocalStorage = (newOrder) => {
  try {
    if (!newOrder || typeof newOrder !== 'object') {
      console.error('Invalid order data');
      return false;
    }

    const orderType = newOrder.order_status === 'Completed' ? 'completed' : 'pending';
    const newOrderCopy = JSON.parse(JSON.stringify(newOrder));
    const existingOrders = getOrdersFromLocalStorage(orderType);
    const existingOrderIndex = existingOrders.findIndex(order => order._id === newOrderCopy._id);
    if (existingOrderIndex !== -1) {

      const updatedOrders = [
        ...existingOrders.slice(0, existingOrderIndex),
        newOrderCopy,
        ...existingOrders.slice(existingOrderIndex + 1)
      ];
      return saveOrdersToLocalStorage(updatedOrders, orderType);
    } else {
      const updatedOrders = [...existingOrders, newOrderCopy];
      return saveOrdersToLocalStorage(updatedOrders, orderType);
    }
  } catch (error) {
    console.error('Error adding order to localStorage:', error);
    return false;
  }
};

const updateOrderInLocalStorage = (orderId, updatedOrder) => {
  try {
    if (!orderId || !updatedOrder) {
      console.error('Invalid order data for update');
      return false;
    }

    const updatedOrderCopy = JSON.parse(JSON.stringify(updatedOrder));
    const newStatus = updatedOrderCopy.order_status;
    
    const pendingOrders = getOrdersFromLocalStorage('pending');
    const completedOrders = getOrdersFromLocalStorage('completed');
    
    const newPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const newCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    if (newStatus === 'Completed') {
      newCompletedOrders.push(updatedOrderCopy);
    } else {
      newPendingOrders.push(updatedOrderCopy);
    }
    
    saveOrdersToLocalStorage(newPendingOrders, 'pending');
    saveOrdersToLocalStorage(newCompletedOrders, 'completed');
    
    return true;
  } catch (error) {
    console.error('Error updating order in localStorage:', error);
    return false;
  }
};

const deleteOrderFromLocalStorage = (orderId) => {
  try {
    if (!orderId) {
      console.error('Invalid order ID for deletion');
      return false;
    }
    const pendingOrders = getOrdersFromLocalStorage('pending');
    const completedOrders = getOrdersFromLocalStorage('completed');
    
    const filteredPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const filteredCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    saveOrdersToLocalStorage(filteredPendingOrders, 'pending');
    saveOrdersToLocalStorage(filteredCompletedOrders, 'completed');
    
    return true;
  } catch (error) {
    console.error('Error deleting order from localStorage:', error);
    return false;
  }
};

const clearOrdersFromLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.COMPLETED_ORDERS);
    return true;
  } catch (error) {
    console.error('Error clearing orders from localStorage:', error);
    return false;
  }
};

export {
  saveOrdersToLocalStorage,
  getOrdersFromLocalStorage,
  hasOrdersInLocalStorage,
  addOrderToLocalStorage,
  updateOrderInLocalStorage,
  deleteOrderFromLocalStorage,
  clearOrdersFromLocalStorage,
};