import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Save, CloudHail } from 'lucide-react';
import axios from 'axios';
import {
    TEAMS,
    saveOrdersToLocalStorage,
    getOrdersFromLocalStorage
} from '../utils/localStorageUtils';
import { useAuth } from '../context/useAuth.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const UpdateCapQty = ({ isOpen, onClose, orderData, itemData, onUpdate }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const { user } = useAuth()
    const { notifyProgressUpdate } = useSocket()

    const hasAssemblyProcess = (process) => {
        return process && process.includes('Assembly');
    };

    const hasMetalProcess = (process) => {
        return process && process.includes('Metal');
    };

    useEffect(() => {
        if (isOpen && itemData?.team_assignments?.caps) {
            setAssignments(itemData.team_assignments.caps.map(assignment => ({
                ...assignment,
                todayMetalQty: 0,
                todayAssemblyQty: 0,
                metalNotes: '',
                assemblyNotes: ''
            })));
            setError(null);
            setSuccessMessage('');
        }
    }, [isOpen, itemData]);

    const handleQuantityChange = (assignmentIndex, processType, value) => {
        const newAssignments = [...assignments];
        const fieldName = processType === 'metal' ? 'todayMetalQty' : 'todayAssemblyQty';

        if (value === '') {
            newAssignments[assignmentIndex][fieldName] = null;
        } else {
            const parsed = parseInt(value, 10);
            newAssignments[assignmentIndex][fieldName] = isNaN(parsed) ? null : Math.max(0, parsed);
        }

        setAssignments(newAssignments);
    };

    const handleNotesChange = (assignmentIndex, processType, value) => {
        const newAssignments = [...assignments];
        const fieldName = processType === 'metal' ? 'metalNotes' : 'assemblyNotes';
        newAssignments[assignmentIndex][fieldName] = value;
        setAssignments(newAssignments);
    };

    const getRemainingQtyForProcess = (assignment, processType) => {
        const totalQty = assignment.quantity || 0;
        
        if (processType === 'metal') {
            const metalCompleted = assignment.metal_tracking?.total_completed_qty || 0;
            return Math.max(totalQty - metalCompleted, 0);
        } else if (processType === 'assembly') {
            const assemblyCompleted = assignment.assembly_tracking?.total_completed_qty || 0;
            return Math.max(totalQty - assemblyCompleted, 0);
        }
        
        return totalQty;
    };

    const getOverallRemainingQty = (assignment) => {
        const totalQty = assignment.quantity || 0;
        const hasAssembly = hasAssemblyProcess(assignment.process);
        
        if (hasAssembly) {
            const metalCompleted = assignment.metal_tracking?.total_completed_qty || 0;
            const assemblyCompleted = assignment.assembly_tracking?.total_completed_qty || 0;
            const minCompleted = Math.min(metalCompleted, assemblyCompleted);
            return Math.max(totalQty - minCompleted, 0);
        } else {

            const metalCompleted = assignment.metal_tracking?.total_completed_qty || 0;
            return Math.max(totalQty - metalCompleted, 0);
        }
    };

    const calculateProgress = (assignment, processType) => {
        const completed = processType === 'metal' 
            ? (assignment.metal_tracking?.total_completed_qty || 0)
            : (assignment.assembly_tracking?.total_completed_qty || 0);
        const total = assignment.quantity || 0;
        return total > 0 ? Math.min((completed / total) * 100, 100) : 0;
    };

    const calculateNewProgress = (assignment, processType, todayQty) => {
        const currentCompleted = processType === 'metal' 
            ? (assignment.metal_tracking?.total_completed_qty || 0)
            : (assignment.assembly_tracking?.total_completed_qty || 0);
        const newCompleted = currentCompleted + (todayQty || 0);
        const total = assignment.quantity || 0;
        return total > 0 ? Math.min((newCompleted / total) * 100, 100) : 0;
    };

    const updateLocalStorageWithOrder = (updatedOrder) => {
        try {
            const orderType = updatedOrder.order_status === 'Completed' ? 'completed' : 'pending'
            const existingOrders = getOrdersFromLocalStorage(orderType, TEAMS.CAPS);
            const orderIndex = existingOrders.findIndex(order => order._id === updatedOrder._id);

            if (orderIndex !== -1) {
                existingOrders[orderIndex] = updatedOrder;
            } else {
                existingOrders.push(updatedOrder);
            }

            saveOrdersToLocalStorage(existingOrders, orderType, TEAMS.CAPS);

            console.log('LocalStorage updated successfully');
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            const updates = [];

            assignments.forEach(assignment => {
                const hasAssembly = hasAssemblyProcess(assignment.process);
                
                // Metal/Non-Metal process update
                if (assignment.todayMetalQty > 0) {
                    const currentCompleted = assignment.metal_tracking?.total_completed_qty || 0;
                    const newCompleted = currentCompleted + assignment.todayMetalQty;

                    const newEntry = {
                        date: new Date().toISOString(),
                        quantity: assignment.todayMetalQty,
                        notes: assignment.metalNotes || '',
                        operator: user?.name || 'Current User'
                    };

                    updates.push({
                        assignmentId: assignment._id,
                        processType: 'metal',
                        newEntry,
                        newTotalCompleted: newCompleted,
                        newStatus: newCompleted >= assignment.quantity ? 'Completed' : 'In Progress',
                        cap_name: assignment.cap_name,
                        quantity: assignment.quantity,
                        capItemId: assignment._id
                    });
                }

                // Assembly process update (only if process includes Assembly)
                if (hasAssembly && assignment.todayAssemblyQty > 0) {
                    const currentCompleted = assignment.assembly_tracking?.total_completed_qty || 0;
                    const newCompleted = currentCompleted + assignment.todayAssemblyQty;

                    const newEntry = {
                        date: new Date().toISOString(),
                        quantity: assignment.todayAssemblyQty,
                        notes: assignment.assemblyNotes || '',
                        operator: user?.name || 'Current User'
                    };

                    updates.push({
                        assignmentId: assignment._id,
                        processType: 'assembly',
                        newEntry,
                        newTotalCompleted: newCompleted,
                        newStatus: newCompleted >= assignment.quantity ? 'Completed' : 'In Progress',
                        cap_name: assignment.cap_name,
                        quantity: assignment.quantity,
                        capItemId: assignment._id
                    });
                }
            });

            if (updates.length === 0) {
                setError('Please enter quantity for at least one process');
                setLoading(false);
                return;
            }

            // Validate quantities don't exceed remaining amounts
            for (let assignment of assignments) {
                const hasAssembly = hasAssemblyProcess(assignment.process);
                
                if (assignment.todayMetalQty > 0) {
                    const metalRemaining = getRemainingQtyForProcess(assignment, 'metal');
                    if (assignment.todayMetalQty > metalRemaining) {
                        setError(`Metal quantity for ${assignment.cap_name} exceeds remaining amount (${metalRemaining})`);
                        setLoading(false);
                        return;
                    }
                }

                if (hasAssembly && assignment.todayAssemblyQty > 0) {
                    const assemblyRemaining = getRemainingQtyForProcess(assignment, 'assembly');
                    if (assignment.todayAssemblyQty > assemblyRemaining) {
                        setError(`Assembly quantity for ${assignment.cap_name} exceeds remaining amount (${assemblyRemaining})`);
                        setLoading(false);
                        return;
                    }
                }
            }

            const response = await axios.patch('http://localhost:5000/api/caps', {
                orderNumber: orderData.order_number,
                itemId: itemData._id,
                updates
            });

            if (response.data.success) {
                const updatedOrder = response.data.data.order;
                updateLocalStorageWithOrder(updatedOrder);

                if (notifyProgressUpdate) {
                    notifyProgressUpdate({
                        orderNumber: orderData.order_number,
                        itemName: itemData.name,
                        team: user.team,
                        updates: updates.map(update => ({
                            assignmentId: update.assignmentId,
                            processType: update.processType,
                            quantity: update.newEntry.quantity,
                            notes: update.newEntry.notes,
                            newTotalCompleted: update.newTotalCompleted,
                            newStatus: update.newStatus
                        })),
                        updatedOrder: updatedOrder,
                        customerName: orderData.customer_name,
                        dispatcherName: orderData.dispatcher_name,
                        timestamp: new Date().toISOString()
                    });
                }

                setSuccessMessage('Quantities updated successfully!');

                setTimeout(() => {
                    onUpdate?.(updatedOrder);
                    onClose();
                }, 1500);
            } else {
                throw new Error(response.data.message || 'Update failed');
            }
        } catch (err) {
            console.error('Error updating quantities:', err);

            let errorMessage = 'Failed to update quantities';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const ProgressBar = ({ assignment, processType, todayQty }) => {
        const currentProgress = calculateProgress(assignment, processType);
        const newProgress = calculateNewProgress(assignment, processType, todayQty);
        const addedProgress = newProgress - currentProgress;

        return (
            <div className="w-full flex items-center space-x-2">
                <div className="flex-1 p-[1px] rounded-full bg-gradient-to-r from-orange-800 via-orange-600 to-orange-500">
                    <div className="bg-white rounded-full h-4 px-1 flex items-center overflow-hidden">
                        <div
                            className="bg-orange-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${currentProgress}%` }}
                        />
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
        <Dialog open={isOpen} onClose={onClose}>
            <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-7xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all p-4">

                        <div className="bg-orange-600 text-white px-4 py-3 flex justify-between gap-4 rounded-md">
                            <div>
                                <DialogTitle as="h2" className="text-xl font-bold">
                                    Update Cap Production
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

                        <div className="max-h-96 overflow-y-auto mt-4">
                            {assignments.map((assignment, index) => {
                                const hasAssembly = hasAssemblyProcess(assignment.process);
                                const metalRemaining = getRemainingQtyForProcess(assignment, 'metal');
                                const assemblyRemaining = hasAssembly ? getRemainingQtyForProcess(assignment, 'assembly') : 0;
                                const overallRemaining = getOverallRemainingQty(assignment);
                                const colorClasses = ['bg-orange-50', 'bg-orange-100', 'bg-yellow-50', 'bg-yellow-100'];
                                const bgColor = colorClasses[index % colorClasses.length];

                                return (
                                    <div key={assignment._id} className={`border border-orange-200 rounded-lg p-4 ${bgColor} mb-4`}>
                                        {/* Assignment Header */}
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-orange-900">{assignment.cap_name}</h3>
                                            <div className="text-sm text-gray-600">
                                                Process: {assignment.process} | Neck Size: {assignment.neck_size}mm | Total Qty: {assignment.quantity}
                                            </div>
                                            <div className="text-sm font-medium text-orange-700 mt-1">
                                                Overall Remaining: {overallRemaining}
                                            </div>
                                        </div>

                                        {/* Process Steps */}
                                        <div className="space-y-4">
                                            {/* Metal/Non-Metal Process */}
                                            <div className="bg-white rounded-lg p-4 border border-orange-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-orange-800">
                                                        {hasMetalProcess(assignment.process) ? 'Metal Process' : 'Non-Metal Process'}
                                                    </h4>
                                                    <span className="text-sm text-gray-600">
                                                        Remaining: {metalRemaining}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 items-center">
                                                    <div>
                                                        <ProgressBar
                                                            assignment={assignment}
                                                            processType="metal"
                                                            todayQty={assignment.todayMetalQty || 0}
                                                        />
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {assignment.metal_tracking?.total_completed_qty || 0} / {assignment.quantity}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <input
                                                            type="number"
                                                            max={metalRemaining}
                                                            value={assignment.todayMetalQty === null ? '' : assignment.todayMetalQty}
                                                            onChange={(e) => handleQuantityChange(index, 'metal', e.target.value)}
                                                            disabled={metalRemaining === 0}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                                                            placeholder="Today's Qty"
                                                        />
                                                    </div>

                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={assignment.metalNotes}
                                                            onChange={(e) => handleNotesChange(index, 'metal', e.target.value)}
                                                            disabled={metalRemaining === 0}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                                                            placeholder="Notes (optional)"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Assembly Process (only if process includes Assembly) */}
                                            {hasAssembly && (
                                                <div className="bg-white rounded-lg p-4 border border-orange-100">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-orange-800">Assembly Process</h4>
                                                        <span className="text-sm text-gray-600">
                                                            Remaining: {assemblyRemaining}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 items-center">
                                                        <div>
                                                            <ProgressBar
                                                                assignment={assignment}
                                                                processType="assembly"
                                                                todayQty={assignment.todayAssemblyQty || 0}
                                                            />
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {assignment.assembly_tracking?.total_completed_qty || 0} / {assignment.quantity}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <input
                                                                type="number"
                                                                max={assemblyRemaining}
                                                                value={assignment.todayAssemblyQty === null ? '' : assignment.todayAssemblyQty}
                                                                onChange={(e) => handleQuantityChange(index, 'assembly', e.target.value)}
                                                                disabled={assemblyRemaining === 0}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                                                                placeholder="Today's Qty"
                                                            />
                                                        </div>

                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={assignment.assemblyNotes}
                                                                onChange={(e) => handleNotesChange(index, 'assembly', e.target.value)}
                                                                disabled={assemblyRemaining === 0}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                                                                placeholder="Notes (optional)"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 ">
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

export default UpdateCapQty;