import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const BottleDataManager = () => {
  const [bottles, setBottles] = useState([]);
  const [filteredBottles, setFilteredBottles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBottle, setEditingBottle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    SUBGROUP1: '',
    SUBGROUP2: '',
    CO_ITEM_NO: '',
    FORMULA: '',
    ML: '',
    NECKTYPE: '',
    CAPACITY: '',
    SHAPE: '',
    NECK_DIAM: ''
  });

  const API_BASE = 'http://localhost:5000/api/bottledata'; 

  const fetchBottles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}`);
      if (!response.ok) throw new Error('Failed to fetch bottles');
      const data = await response.json();
      setBottles(data);
      setFilteredBottles(data);
    } catch (err) {
  

    } finally {
      setLoading(false);
    }
  };

  const createBottle = async (bottleData) => {
    try {
      const response = await fetch(`${API_BASE}/bottles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottleData)
      });
      if (!response.ok) throw new Error('Failed to create bottle');
      const newBottle = await response.json();
      
      const updatedBottles = [newBottle, ...bottles];
      setBottles(updatedBottles);
      setFilteredBottles(updatedBottles);
      return newBottle;
    } catch (err) {
      throw new Error('Failed to create bottle');
    }
  };

  const updateBottle = async (id, bottleData) => {
    try {
      const response = await fetch(`${API_BASE}/bottles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottleData)
      });
      if (!response.ok) throw new Error('Failed to update bottle');
      const updatedBottle = await response.json();
      
      const updatedBottles = bottles.map(bottle => 
        bottle._id === id ? updatedBottle : bottle
      );
      setBottles(updatedBottles);
      setFilteredBottles(updatedBottles);
      return updatedBottle;
    } catch (err) {
      throw new Error('Failed to update bottle');
    }
  };

  const deleteBottle = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/bottles/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete bottle');
      
      const updatedBottles = bottles.filter(bottle => bottle._id !== id);
      setBottles(updatedBottles);
      setFilteredBottles(updatedBottles);
    } catch (err) {
      throw new Error('Failed to delete bottle');
    }
  };

  const debounceSearch = useCallback(
    debounce((term) => {
      const filtered = bottles.filter(bottle =>
        Object.values(bottle).some(value =>
          value?.toString().toLowerCase().includes(term.toLowerCase())
        )
      );
      setFilteredBottles(filtered);
      setCurrentPage(1);
    }, 300),
    [bottles]
  );

  useEffect(() => {
    debounceSearch(searchTerm);
  }, [searchTerm, debounceSearch]);

  useEffect(() => {
    fetchBottles();
  }, []);


  const totalPages = Math.ceil(filteredBottles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBottles = filteredBottles.slice(startIndex, endIndex);


  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSubmit = async () => {
    if (!formData.FORMULA.trim()) {
      setError('Formula is required');
      return;
    }
    
    try {
      if (editingBottle) {
        await updateBottle(editingBottle._id, formData);
        setEditingBottle(null);
      } else {
        await createBottle(formData);
      }
      
      setFormData({
        SUBGROUP1: '',
        SUBGROUP2: '',
        CO_ITEM_NO: '',
        FORMULA: '',
        ML: '',
        NECKTYPE: '',
        CAPACITY: '',
        SHAPE: '',
        NECK_DIAM: ''
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (bottle) => {
    setFormData(bottle);
    setEditingBottle(bottle);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bottle?')) {
      try {
        await deleteBottle(id);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-sm">Loading bottles...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingBottle(null);
            setFormData({
              SUBGROUP1: '',
              SUBGROUP2: '',
              CO_ITEM_NO: '',
              FORMULA: '',
              ML: '',
              NECKTYPE: '',
              CAPACITY: '',
              SHAPE: '',
              NECK_DIAM: ''
            });
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <Plus size={16} />
          Create Order
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] text-center font-bold text-sm text-white">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-medium">Co Item No</th>
                <th className="px-2 py-3 text-left text-sm font-medium">Formula</th>
                <th className="px-2 py-3 text-left text-sm font-medium">ML</th>
                <th className="px-2 py-3 text-left text-sm font-medium">Neck Diam</th>
                <th className="px-2 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBottles.map((bottle, idx) => {
                const rowBgColor = idx % 2 === 0
                  ? 'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]'
                  : 'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]';
              
                return (
                  <tr key={bottle._id} className={rowBgColor}> 
                    <td className="px-2 py-3 text-sm text-[#703800]">{bottle.CO_ITEM_NO || '-'}</td>
                    <td className="px-2 py-3 text-sm text-[#703800] ">{bottle.FORMULA}</td>
                    <td className="px-2 py-3 text-sm text-[#703800]">{bottle.ML || '-'}</td>

                    <td className="px-2 py-3 text-sm text-[#703800]">{bottle.NECK_DIAM || '-'}</td>
                    <td className="px-2 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(bottle)}
                          className="bg-orange-600 hover:bg-orange-700 text-white p-1.5 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(bottle._id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentBottles.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No bottles found
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
          <span className="text-gray-600">Show</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value={5}>5</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-gray-600">entries</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 border border-gray-300 px-2 py-1 rounded transition-colors text-sm"
              title="First page"
            >
              «
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 border border-gray-300 p-1 rounded transition-colors"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="text-gray-700 px-2 text-sm">
              {currentPage}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 border border-gray-300 p-1 rounded transition-colors"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 border border-gray-300 px-2 py-1 rounded transition-colors text-sm"
              title="Last page"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingBottle ? 'Edit Bottle' : 'Add New Bottle'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subgroup 1
                </label>
                <input
                  type="text"
                  value={formData.SUBGROUP1}
                  onChange={(e) => setFormData({...formData, SUBGROUP1: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subgroup 2
                </label>
                <input
                  type="text"
                  value={formData.SUBGROUP2}
                  onChange={(e) => setFormData({...formData, SUBGROUP2: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  CO Item No
                </label>
                <input
                  type="number"
                  value={formData.CO_ITEM_NO}
                  onChange={(e) => setFormData({...formData, CO_ITEM_NO: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Formula *
                </label>
                <input
                  type="text"
                  value={formData.FORMULA}
                  onChange={(e) => setFormData({...formData, FORMULA: e.target.value})}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ML
                </label>
                <input
                  type="number"
                  value={formData.ML}
                  onChange={(e) => setFormData({...formData, ML: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Neck Type
                </label>
                <input
                  type="text"
                  value={formData.NECKTYPE}
                  onChange={(e) => setFormData({...formData, NECKTYPE: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.CAPACITY}
                  onChange={(e) => setFormData({...formData, CAPACITY: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shape
                </label>
                <input
                  type="text"
                  value={formData.SHAPE}
                  onChange={(e) => setFormData({...formData, SHAPE: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Neck Diameter
                </label>
                <input
                  type="number"
                  value={formData.NECK_DIAM}
                  onChange={(e) => setFormData({...formData, NECK_DIAM: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingBottle(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
                >
                  {editingBottle ? 'Update' : 'Create'} Bottle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default BottleDataManager;