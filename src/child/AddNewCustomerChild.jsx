import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Save } from 'lucide-react';

const AddNewCustomerChild = ({
  isOpen,
  onClose,
  editingBottle,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    shortAddress: "",
    phoneNumber: ""
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingBottle) {
        setFormData({
          name: editingBottle.name || '',
          email: editingBottle.email || '',
          shortAddress: editingBottle.shortAddress || '',
          phoneNumber: editingBottle.phoneNumber || ''
        });
      } else {
        setFormData({
          name: "",
    email: "",
    shortAddress: "",
    phoneNumber: ""
        });
      }
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, editingBottle]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError('');

     

      await onSubmit(formData);
      setSuccessMessage('Bottle saved successfully!');

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to save bottle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10" >
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 ">
          <DialogPanel className="w-full max-w-7xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all p-4">


            <DialogTitle as="h3">
              <div className="bg-[#FF6701] p-4 rounded-t-md border-b border-orange-200 shadow-sm text-center">
                <h3 className="text-white text-xl font-bold flex tracking-wide gap-2">
                  Create New Customer
                </h3>
              </div>
            </DialogTitle>

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

        
            <div className="bg-[#FFF0E7] p-6 shadow-none mt-5 border-0 border-none">
              <div className="grid grid-cols-12 gap-4">

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-orange-900 mb-2">
               Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter Name"
                  />
                </div>

                {/* Formula */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-orange-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium text-orange-900 mb-2">
                   Address
                  </label>
                  <input
                    type="text"
                    value={formData.shortAddress}
                    onChange={(e) => handleInputChange('shortAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                </div>

                {/* Neck Diameter */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-orange-900 mb-2">
                    Phone No.
                  </label>
                  <input
                    type="number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Emter phone No"
                  />
                </div>
              </div>
            </div>



            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3  mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {editingBottle ? 'Update' : 'Create'} Customer
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

export default AddNewCustomerChild;

