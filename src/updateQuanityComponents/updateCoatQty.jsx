
import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Save, CloudHail } from 'lucide-react';
import axios from 'axios';
import {
  TEAMS,
  saveOrdersToLocalStorage,
  getOrdersFromLocalStorage,
} from '../utils/localStorageUtils';
import { useAuth } from '../context/useAuth.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { isPreviousTeamsCompleted } from '../utils/isPreviousTeamCompleteted.jsx';

const UpdateCoatQty = ({ isOpen, onClose, orderData, itemData, onUpdate }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth()
  const { notifyProgressUpdate } = useSocket()


  useEffect(() => {
      console.log('data nai hai ')
    console.log("🟡 isOpen:", isOpen);
    console.log("🟡 itemData:", itemData);

    const coatingAssignments = itemData?.team_assignments?.coating;
    console.log("🟡 coatingAssignments:", coatingAssignments);

    if (isOpen && Array.isArray(coatingAssignments) && coatingAssignments.length > 0) {
      const withFields = coatingAssignments.map(assignment => ({
        ...assignment,
        todayQty: 0,
        notes: ''
      }));
      console.log("✅ Setting assignments:", withFields);
      setAssignments(withFields);
      setError(null);
      setSuccessMessage('');
    } else {
      console.warn("⚠️ No coating assignments found, or modal not open.");
      setAssignments([]);
    }
  }, [isOpen, itemData]);


  const handleQuantityChange = (assignmentIndex, value) => {
    const newAssignments = [...assignments];

    if (value === '') {
      newAssignments[assignmentIndex].todayQty = null;
    } else {
      const parsed = parseInt(value, 10);
      newAssignments[assignmentIndex].todayQty = isNaN(parsed) ? null : Math.max(0, parsed);
    }

    setAssignments(newAssignments);
  };

  const handleNotesChange = (assignmentIndex, value) => {
    const newAssignments = [...assignments];
    newAssignments[assignmentIndex].notes = value;
    setAssignments(newAssignments);
  };

  const calculateProgress = (assignment) => {
    const completed = assignment.team_tracking?.total_completed_qty || 0;
    const total = assignment.quantity || 0;
    return total > 0 ? Math.min((completed / total) * 100, 100) : 0;
  };

  const calculateNewProgress = (assignment, todayQty) => {
    const currentCompleted = assignment.team_tracking?.total_completed_qty || 0;
    const newCompleted = currentCompleted + (todayQty || 0);
    const total = assignment.quantity || 0;
    return total > 0 ? Math.min((newCompleted / total) * 100, 100) : 0;
  };

  const getRemainingQty = (assignment) => {
    const completed = assignment.team_tracking?.total_completed_qty || 0;
    const total = assignment.quantity || 0;
    return Math.max(total - completed, 0);
  };

  const updateTeamOrderLocal = (updatedOrder, team) => {
    try {
      const orderType = updatedOrder.order_status === 'Completed' ? 'completed' : 'pending';
      const existingOrders = getOrdersFromLocalStorage(orderType, team);
      const orderIndex = existingOrders.findIndex(order => order._id === updatedOrder._id);

      if (orderIndex !== -1) {
        existingOrders[orderIndex] = updatedOrder;
      } else {
        existingOrders.push(updatedOrder);
      }

      saveOrdersToLocalStorage(existingOrders, orderType, team);
      console.log(`✅ LocalStorage updated for ${team}`);
    } catch (err) {
      console.error(`❌ Failed to update localStorage for ${team}:`, err);
    }
  }


  const preserveGlassItemDetails = (coatingAssignment, allGlassAssignments) => {
    const glassItemId = coatingAssignment.glass_item_id?._id || coatingAssignment.glass_item_id;
    const fullGlassItem = allGlassAssignments.find(glassAssignment => {
      const glassId = glassAssignment._id;
      return glassId?.toString() === glassItemId?.toString();
    });

    if (fullGlassItem) {
      return {
        ...coatingAssignment,
        glass_item_id: fullGlassItem,
        glass_name: fullGlassItem.glass_name,
        weight: fullGlassItem.weight,
        neck_size: fullGlassItem.neck_size,
        decoration: fullGlassItem.decoration,
        decoration_details: fullGlassItem.decoration_details
      };
    }
    return coatingAssignment;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updates = assignments
        .filter(a => a.todayQty > 0)
        .map(a => {
          const currentCompleted = a.team_tracking?.total_completed_qty || 0;
          const newCompleted = currentCompleted + a.todayQty;
          const newEntry = {
            date: new Date().toISOString(),
            quantity: a.todayQty,
            notes: a.notes || '',
            operator: user.name || 'Current User'
          };

          return {
            assignmentId: a._id,
            newEntry,
            newTotalCompleted: newCompleted,
            newStatus: newCompleted >= a.quantity ? 'Completed' : 'In Progress',
            glass_item_id: a.glass_item_id,
            coating_name: a.coating_name,
            quantity: a.quantity
          };
        });

      if (updates.length === 0) {
        setError('Please enter quantity for at least one assignment');
        setLoading(false);
        return;
      }

      for (const assignment of assignments) {
        const remaining = getRemainingQty(assignment);
        if (assignment.todayQty > remaining) {
          setError(`Quantity for ${assignment.coating_name} exceeds remaining amount (${remaining})`);
          setLoading(false);
          return;
        }
      }

      const response = await axios.patch('http://localhost:5000/api/coat', {
        orderNumber: orderData.order_number,
        itemId: itemData._id,
        updates
      });

      if (!response.data.success) throw new Error(response.data.message || 'Update failed');

      const updatedOrder = response.data.data.order;
      const completedUpdates = updates.filter(u => u.newStatus === 'Completed');
      const hasCompletedWork = completedUpdates.length > 0;
      const targetAssignment = hasCompletedWork ? completedUpdates[0] : updates[0];
      const targetGlassItem = targetAssignment?.glass_item_id;

      const filteredUpdatedOrder = {
        ...updatedOrder,
        item_ids: updatedOrder.item_ids.map(item => {
          const glassAssignments = item.team_assignments?.glass || [];

          const completedGlass = glassAssignments.filter(g =>
            g.team_tracking?.total_completed_qty >= g.quantity
          );

          const validFoiling = (item.team_assignments?.coating || [])
            .filter(coating => {
              const glassId = coating.glass_item_id?._id || coating.glass_item_id;

              const isGlassDone = glassAssignments.some(g =>
                g._id?.toString() === glassId?.toString() &&
                g.team_tracking?.total_completed_qty >= g.quantity
              );

              const prevDone = isPreviousTeamsCompleted(item, 'coating', glassId);

              return isGlassDone && prevDone;
            })
            .map(coating => preserveGlassItemDetails(coating, glassAssignments));

          return {
            ...item,
            team_assignments: {
              ...item.team_assignments,
              glass: completedGlass,
              coating: validFoiling
            }
          };
        }).filter(item => item.team_assignments?.coating?.length > 0)
      };

      updateTeamOrderLocal(filteredUpdatedOrder, TEAMS.COATING);

      if (notifyProgressUpdate && hasCompletedWork && targetGlassItem) {
        const glassItemId = targetGlassItem?._id || targetGlassItem;
        notifyProgressUpdate({
          orderNumber: orderData.order_number,
          itemName: itemData.name,
          team: user.team,
          updateSource: 'coating_update',
          targetGlassItem: glassItemId,
          hasCompletedWork,
          updates: updates.map(u => ({
            assignmentId: u.assignmentId,
            quantity: u.newEntry.quantity,
            notes: u.newEntry.notes,
            newTotalCompleted: u.newTotalCompleted,
            newStatus: u.newStatus,
            glass_item_id: u.glass_item_id,
            coating_name: u.glass_name
          })),
          updatedOrder: filteredUpdatedOrder,
          customerName: orderData.customer_name,
          dispatcherName: orderData.dispatcher_name,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Foiling update successful:', {
        orderNumber: orderData.order_number,
        team: user.team,
        completedCount: completedUpdates.length,
        targetGlassItem,
        hasCompletedWork,
        totalFoilingAssignments: filteredUpdatedOrder.item_ids.reduce(
          (count, item) => count + (item.team_assignments?.coating?.length || 0),
          0
        )
      });

      setSuccessMessage('Foiling quantities updated!');
      setTimeout(() => {
        onUpdate?.(filteredUpdatedOrder);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('❌ Error updating coating:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to update coating');
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = ({ assignment, todayQty }) => {
    const currentProgress = calculateProgress(assignment);
    const newProgress = calculateNewProgress(assignment, todayQty);
    const addedProgress = newProgress - currentProgress;

    return (
      <div className="w-full flex items-center space-x-2">
        <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-orange-800 via-orange-600 to-orange-500">
          <div className="bg-white rounded-full h-4 px-1 flex items-center overflow-hidden">
            {/* Existing progress */}
            <div
              className="bg-orange-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
            {/* New progress overlay */}
            {addedProgress > 0 && (
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300 -ml-1"
                style={{ width: `${addedProgress}%` }}
              />
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-orange-800 whitespace-nowrap">
          {newProgress.toFixed(0)}%
        </span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} >
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 ">
          <DialogPanel className="w-full max-w-7xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all p-4">

            <div className="bg-orange-600 text-white px-4 py-3 flex justify-between gap-4 rounded-md">
              <div>
                <DialogTitle as="h2" className="text-xl font-bold">
                  Update Foil Production
                  <p className="text-orange-100 text-sm">
                    Order #{orderData?.order_number} - {itemData?.name}
                  </p>
                </DialogTitle>

              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {(error || successMessage) && (
              <div className="px-6 py-4 border-b">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-r from-orange-800 via-orange-600 to-orange-400 px-4 py-3 mt-6 rounded-md">
              <div className="grid gap-4 text-white font-semibold text-sm items-center"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr 1.5fr'
                }}>
                <div className="text-left">Bottle Name</div>
                <div className="text-center">Neck Size</div>
                <div className="text-center">Weight</div>
                <div className="text-center">Total Qty</div>
                <div className="text-center">Remaining</div>
                <div className="text-center">Progress</div>
                <div className="text-center">Today's Input</div>
              </div>
            </div>


            <div className="max-h-96 overflow-y-auto p-6">
              {assignments.map((assignment, index) => {
                const remaining = getRemainingQty(assignment);
                const isCompleted = remaining === 0;
                const colorClasses = ['bg-orange-50', 'bg-orange-100', 'bg-yellow-50', 'bg-yellow-100'];
                const bgColor = colorClasses[index % colorClasses.length];

                return (
                  <div key={assignment._id}
                    className={`border-b border-orange-100 px-6 py-4 ${bgColor} -mx-6 mb-4 last:mb-0`}>
                    <div className="grid gap-4 text-sm items-center"
                      style={{
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr 1.5fr'
                      }}>

                      <div className="text-left">
                        <div className="font-medium text-orange-900">{assignment.glass_name}</div>
                        <div className="text-xs text-gray-600">
                          {assignment.decoration} #{assignment.decoration_no}
                        </div>
                      </div>

                      <div className="text-center text-orange-900">
                        {assignment.neck_size}mm
                      </div>


                      <div className="text-center text-orange-900">
                        {assignment.weight}ml
                      </div>

                      <div className="text-center text-orange-900 font-medium">
                        {assignment.quantity}
                      </div>

                      <div className="text-center">
                        <span className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-orange-700'}`}>
                          {remaining}
                        </span>
                      </div>
                      <div className="px-2">
                        <ProgressBar
                          assignment={assignment}
                          todayQty={assignment.todayQty || 0}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {assignment.team_tracking?.total_completed_qty || 0} / {assignment.quantity}
                        </div>
                      </div>


                      <div className="px-2">
                        {!isCompleted ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              max={remaining}
                              value={assignment.todayQty === null ? '' : assignment.todayQty}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Qty"
                            />
                            <input
                              type="text"
                              value={assignment.notes}
                              onChange={(e) => handleNotesChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Notes (optional)"
                            />
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Progress
                  </>
                )}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default UpdateCoatQty;
