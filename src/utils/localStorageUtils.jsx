
const STORAGE_KEYS = {
  PENDING_ORDERS: '_pendingOrders',
  COMPLETED_ORDERS: '_completedOrders',
  USER_LOGGED_IN: 'user_loggedIn'
};

const TEAMS = {
  DISPATCHER: 'dispatcher',
  GLASS: 'glass',
  BOXES: 'boxes',
  PUMPS: 'pumps',
  CAPS: 'caps',
  ACCESSORIES: "accessories",
  MARKETING: 'marketing',
  PRINTING: "printing",
  FOILING: "foiling",
  COATING: "coating",
  FROSTING: "frosting",
};


const DISPATCHER_LIKE_TEAMS = [TEAMS.DISPATCHER, TEAMS.MARKETING];

const getStorageKey = (orderType, team, username = null) => {
  const validTeam = Object.values(TEAMS).includes(team) ? team : TEAMS.DISPATCHER;
  
  let baseKey;
  switch (orderType?.toLowerCase()) {
    case 'pending':
      baseKey = validTeam + STORAGE_KEYS.PENDING_ORDERS;
      break;
    case 'completed':
      baseKey = validTeam + STORAGE_KEYS.COMPLETED_ORDERS;
      break;
   
  }
  
  if (username && DISPATCHER_LIKE_TEAMS.includes(team)) {
    baseKey += `_${username}`;
  }
  
  return baseKey;
};

const saveOrdersToLocalStorage = (orders, orderType, team, username = null) => {
  try {
    if (!Array.isArray(orders)) {
      console.error('Invalid orders data format');
      return false;
    }
    const ordersCopy = JSON.parse(JSON.stringify(orders));
    const storageKey = getStorageKey(orderType, team, username);
    localStorage.setItem(storageKey, JSON.stringify(ordersCopy));
    return true;
  } catch (error) {
    console.error('Error saving orders to localStorage:', error);
    return false;
  }
};

const getOrdersFromLocalStorage = (orderType, team, username = null) => {
  try {
    const storageKey = getStorageKey(orderType, team, username);
    const ordersData = localStorage.getItem(storageKey);
    return ordersData ? JSON.parse(ordersData) : [];
  } catch (error) {
    console.error('Error getting orders from localStorage:', error);
    return [];
  }
};

const hasOrdersInLocalStorage = (orderType, team, username = null) => {
  const storageKey = getStorageKey(orderType, team, username);
  return !!localStorage.getItem(storageKey);
};

const updateDispatcherOrderInLocalStorage = (updatedOrder, team, username = null) => {
  try {
    if (!updatedOrder || typeof updatedOrder !== 'object' || !updatedOrder._id) {
      console.error('Invalid order data for dispatcher-like team update');
      return false;
    }

    const updatedOrderCopy = JSON.parse(JSON.stringify(updatedOrder));
    const orderId = updatedOrderCopy._id;
    
    const newOrderType = updatedOrderCopy.order_status === 'Completed' ? 'completed' : 'pending';
    
    const pendingOrders = getOrdersFromLocalStorage('pending', team, username);
    const completedOrders = getOrdersFromLocalStorage('completed', team, username);
    
    const newPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const newCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    if (newOrderType === 'completed') {
      newCompletedOrders.push(updatedOrderCopy);
    } else {
      newPendingOrders.push(updatedOrderCopy);
    }
    
    const pendingSaved = saveOrdersToLocalStorage(newPendingOrders, 'pending', team, username);
    const completedSaved = saveOrdersToLocalStorage(newCompletedOrders, 'completed', team, username);
    
    return pendingSaved && completedSaved;
  } catch (error) {
    console.error(`Error updating ${team} order in localStorage:`, error);
    return false;
  }
};

const areAllTeamAssignmentsCompleted = (order, team) => {
  const items = order.item_ids || [];
  if (items.length === 0) return false;

  if (team === TEAMS.CAPS) {
    return items.every(item => {
      const capsAssignments = item.team_assignments?.caps || [];
      if (capsAssignments.length === 0) return false;
      
      return capsAssignments.every(capItem => {
        const totalQty = capItem.quantity || 0;
        const hasAssembly = capItem.process && capItem.process.includes('Assembly');
        
        if (hasAssembly) {
          const metalCompleted = capItem.metal_tracking?.total_completed_qty || 0;
          const assemblyCompleted = capItem.assembly_tracking?.total_completed_qty || 0;
          const minCompleted = Math.min(metalCompleted, assemblyCompleted);
          return minCompleted >= totalQty;
        } else {
          const metalCompleted = capItem.metal_tracking?.total_completed_qty || 0;
          return metalCompleted >= totalQty;
        }
      });
    });
  }

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

const determineOrderType = (order, team) => {
  if (DISPATCHER_LIKE_TEAMS.includes(team)) {
    return order.order_status === 'Completed' ? 'completed' : 'pending';
  }

  const isCompleted = areAllTeamAssignmentsCompleted(order, team);
  return isCompleted ? 'completed' : 'pending';
};

const updateOrderInLocalStorage = (orderId, updatedOrder, team, username = null) => {
  try {
    if (!orderId || !updatedOrder) {
      console.error('Invalid order data for update');
      return false;
    }

    if (DISPATCHER_LIKE_TEAMS.includes(team)) {
      return updateDispatcherOrderInLocalStorage(updatedOrder, team, username);
    }

    const updatedOrderCopy = JSON.parse(JSON.stringify(updatedOrder));
    const newOrderType = determineOrderType(updatedOrderCopy, team);
    
    console.log(`Updating order ${orderId} for team ${team}. New type: ${newOrderType}`);
    
    // Get current orders from both pending and completed
    const pendingOrders = getOrdersFromLocalStorage('pending', team, username);
    const completedOrders = getOrdersFromLocalStorage('completed', team, username);
    
    // Remove the order from both lists
    const newPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const newCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    // Add the updated order to the correct list
    if (newOrderType === 'completed') {
      newCompletedOrders.push(updatedOrderCopy);
      console.log(`Added order ${orderId} to completed orders`);
    } else {
      newPendingOrders.push(updatedOrderCopy);
      console.log(`Added order ${orderId} to pending orders`);
    }
    
    // Save both lists
    const pendingSaved = saveOrdersToLocalStorage(newPendingOrders, 'pending', team, username);
    const completedSaved = saveOrdersToLocalStorage(newCompletedOrders, 'completed', team, username);
    
    if (pendingSaved && completedSaved) {
      console.log(`Order ${orderId} successfully moved to ${newOrderType} for team ${team}`);
      return true;
    } else {
      console.error(`Failed to save orders for team ${team}`);
      return false;
    }
  } catch (error) {
    console.error('Error updating order in localStorage:', error);
    return false;
  }
};

const addOrderToLocalStorage = (newOrder, team, username = null) => {
  try {
    if (!newOrder || typeof newOrder !== 'object') {
      console.error('Invalid order data');
      return false;
    }
    
    // Handle dispatcher-like teams (dispatcher and marketing)
    if (DISPATCHER_LIKE_TEAMS.includes(team)) {
      return updateDispatcherOrderInLocalStorage(newOrder, team, username);
    }

    const orderType = determineOrderType(newOrder, team);
    const newOrderCopy = JSON.parse(JSON.stringify(newOrder));
    const existingOrders = getOrdersFromLocalStorage(orderType, team, username);
    const existingOrderIndex = existingOrders.findIndex(order => order._id === newOrderCopy._id);
    
    if (existingOrderIndex !== -1) {
      const updatedOrders = [
        ...existingOrders.slice(0, existingOrderIndex),
        newOrderCopy,
        ...existingOrders.slice(existingOrderIndex + 1)
      ];
      return saveOrdersToLocalStorage(updatedOrders, orderType, team, username);
    } else {
      const updatedOrders = [...existingOrders, newOrderCopy];
      return saveOrdersToLocalStorage(updatedOrders, orderType, team, username);
    }
  } catch (error) {
    console.error('Error adding order to localStorage:', error);
    return false;
  }
};

const deleteOrderFromLocalStorage = (orderId, team, username = null) => {
  try {
    if (!orderId) {
      console.error('Invalid order ID for deletion');
      return false;
    }
    
    const pendingOrders = getOrdersFromLocalStorage('pending', team, username);
    const completedOrders = getOrdersFromLocalStorage('completed', team, username);
    
    const filteredPendingOrders = pendingOrders.filter(order => order._id !== orderId);
    const filteredCompletedOrders = completedOrders.filter(order => order._id !== orderId);
    
    saveOrdersToLocalStorage(filteredPendingOrders, 'pending', team, username);
    saveOrdersToLocalStorage(filteredCompletedOrders, 'completed', team, username);
    
    return true;
  } catch (error) {
    console.error('Error deleting order from localStorage:', error);
    return false;
  }
};

const clearOrdersFromLocalStorage = (team, username = null) => {
  try {
    localStorage.removeItem(getStorageKey('pending', team, username));
    localStorage.removeItem(getStorageKey('completed', team, username));
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

const revalidateOrderStatusForTeam = (team, username = null) => {
  try {
    const pendingOrders = getOrdersFromLocalStorage('pending', team, username);
    const completedOrders = getOrdersFromLocalStorage('completed', team, username);
    
    const newPendingOrders = [];
    const newCompletedOrders = [];
    
    pendingOrders.forEach(order => {
      const correctType = determineOrderType(order, team);
      if (correctType === 'completed') {
        newCompletedOrders.push(order);
      } else {
        newPendingOrders.push(order);
      }
    });

    completedOrders.forEach(order => {
      const correctType = determineOrderType(order, team);
      if (correctType === 'pending') {
        newPendingOrders.push(order);
      } else {
        newCompletedOrders.push(order);
      }
    });
    
    saveOrdersToLocalStorage(newPendingOrders, 'pending', team, username);
    saveOrdersToLocalStorage(newCompletedOrders, 'completed', team, username);
    
    return true;
  } catch (error) {
    console.error('Error revalidating order status for team:', error);
    return false;
  }
};

export {
  TEAMS,
  DISPATCHER_LIKE_TEAMS,
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