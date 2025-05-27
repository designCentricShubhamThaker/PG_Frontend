const STORAGE_KEYS = {
  PENDING_ORDERS: '_pendingOrders',
  COMPLETED_ORDERS: '_completedOrders',
  USER_LOGGED_IN: 'user_loggedIn'
};

const TEAMS = {
  DISPATCHER: 'dispatcher',
  GLASS: 'glass',
  BOX: 'box',
  PUMP: 'pump',
  CAP: 'cap',
  LINER: 'liner',
  STICKER: 'sticker'
};

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

const hasOrdersInLocalStorage = (orderType, team = TEAMS.DISPATCHER) => {
  const storageKey = getStorageKey(orderType, team);
  return !!localStorage.getItem(storageKey);
};

// Enhanced function specifically for dispatcher order updates
const updateDispatcherOrderInLocalStorage = (updatedOrder) => {
  try {
    if (!updatedOrder || typeof updatedOrder !== 'object' || !updatedOrder._id) {
      console.error('Invalid order data for dispatcher update');
      return false;
    }

    const updatedOrderCopy = JSON.parse(JSON.stringify(updatedOrder));
    const orderId = updatedOrderCopy._id;
    
    // For dispatcher, determine order type based on order_status
    const newOrderType = updatedOrderCopy.order_status === 'Completed' ? 'completed' : 'pending';
    
    // Get both pending and completed orders for dispatcher
    const pendingOrders = getOrdersFromLocalStorage('pending', TEAMS.DISPATCHER);
    const completedOrders = getOrdersFromLocalStorage('completed', TEAMS.DISPATCHER);
    
    // Remove the order from both categories
    const newPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const newCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    // Add the updated order to the correct category
    if (newOrderType === 'completed') {
      newCompletedOrders.push(updatedOrderCopy);
    } else {
      newPendingOrders.push(updatedOrderCopy);
    }
    
    // Save both categories
    const pendingSaved = saveOrdersToLocalStorage(newPendingOrders, 'pending', TEAMS.DISPATCHER);
    const completedSaved = saveOrdersToLocalStorage(newCompletedOrders, 'completed', TEAMS.DISPATCHER);
    
    if (pendingSaved && completedSaved) {
      console.log(`Dispatcher order ${orderId} updated and moved to ${newOrderType}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating dispatcher order in localStorage:', error);
    return false;
  }
};

const addOrderToLocalStorage = (newOrder, team = TEAMS.DISPATCHER) => {
  try {
    if (!newOrder || typeof newOrder !== 'object') {
      console.error('Invalid order data');
      return false;
    }

    // For dispatcher team, use the enhanced update function
    if (team === TEAMS.DISPATCHER) {
      return updateDispatcherOrderInLocalStorage(newOrder);
    }

    const orderType = determineOrderType(newOrder, team);
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

const areAllTeamAssignmentsCompleted = (order, team) => {
  const items = order.item_ids || [];
  if (items.length === 0) return false;

  return items.every(item => {
    const teamAssignments = item.team_assignments?.[team] || [];
    if (teamAssignments.length === 0) return false;

    return teamAssignments.every(assignment => {
      const completed = assignment.team_tracking?.total_completed_qty || 0;
      const total = assignment.quantity || 0;
      return completed >= total;
    });
  });
};

const determineOrderType = (order, team = TEAMS.DISPATCHER) => {
  // For dispatcher team, use the order status
  if (team === TEAMS.DISPATCHER) {
    return order.order_status === 'Completed' ? 'completed' : 'pending';
  }

  const isCompleted = areAllTeamAssignmentsCompleted(order, team);
  return isCompleted ? 'completed' : 'pending';
};

const updateOrderInLocalStorage = (orderId, updatedOrder, team = TEAMS.DISPATCHER) => {
  try {
    if (!orderId || !updatedOrder) {
      console.error('Invalid order data for update');
      return false;
    }

    // For dispatcher team, use the enhanced update function
    if (team === TEAMS.DISPATCHER) {
      return updateDispatcherOrderInLocalStorage(updatedOrder);
    }

    const updatedOrderCopy = JSON.parse(JSON.stringify(updatedOrder));
    const newOrderType = determineOrderType(updatedOrderCopy, team);
    
    const pendingOrders = getOrdersFromLocalStorage('pending', team);
    const completedOrders = getOrdersFromLocalStorage('completed', team);
    
    const newPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const newCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    if (newOrderType === 'completed') {
      newCompletedOrders.push(updatedOrderCopy);
    } else {
      newPendingOrders.push(updatedOrderCopy);
    }
    
    // Save both categories
    saveOrdersToLocalStorage(newPendingOrders, 'pending', team);
    saveOrdersToLocalStorage(newCompletedOrders, 'completed', team);
    
    console.log(`Order ${orderId} moved to ${newOrderType} for team ${team}`);
    return true;
  } catch (error) {
    console.error('Error updating order in localStorage:', error);
    return false;
  }
};

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

// Helper function to check and move orders between categories for a specific team
const revalidateOrderStatusForTeam = (team = TEAMS.DISPATCHER) => {
  try {
    const pendingOrders = getOrdersFromLocalStorage('pending', team);
    const completedOrders = getOrdersFromLocalStorage('completed', team);
    
    const newPendingOrders = [];
    const newCompletedOrders = [];
    
    // Process pending orders
    pendingOrders.forEach(order => {
      const correctType = determineOrderType(order, team);
      if (correctType === 'completed') {
        newCompletedOrders.push(order);
      } else {
        newPendingOrders.push(order);
      }
    });
    
    // Process completed orders
    completedOrders.forEach(order => {
      const correctType = determineOrderType(order, team);
      if (correctType === 'pending') {
        newPendingOrders.push(order);
      } else {
        newCompletedOrders.push(order);
      }
    });
    
    // Save the revalidated orders
    saveOrdersToLocalStorage(newPendingOrders, 'pending', team);
    saveOrdersToLocalStorage(newCompletedOrders, 'completed', team);
    
    return true;
  } catch (error) {
    console.error('Error revalidating order status for team:', error);
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
  updateDispatcherOrderInLocalStorage,
  deleteOrderFromLocalStorage,
  clearOrdersFromLocalStorage,
  clearAllTeamOrdersFromLocalStorage,
  revalidateOrderStatusForTeam,
  areAllTeamAssignmentsCompleted,
  determineOrderType
};