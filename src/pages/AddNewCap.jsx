import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import AddNewCapChild from '../child/AddNewCapChild.jsx';
import { useSocket } from '../context/SocketContext.jsx'; // Updated import

const AddNewCap = () => {
  const [filteredBottles, setFilteredBottles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBottle, setEditingBottle] = useState(null);
  const [error, setError] = useState('');

  // Get everything from context
  const {
    loading,
    createItem,
    updateItem,
    deleteItem,
    loadItems,
    getItemsByType
  } = useSocket();

  const ITEM_TYPE = 'caps'; // Note: using plural as per your dataStore
  const rawBottles = getItemsByType(ITEM_TYPE);
  
  // Ensure bottles is always an array
  const bottles = Array.isArray(rawBottles) ? rawBottles : [];

  // Filter bottles based on search term
  const debounceSearch = useCallback(
    debounce((term) => {
      if (!Array.isArray(bottles)) {
        console.warn('bottles is not an array:', bottles);
        setFilteredBottles([]);
        return;
      }
      
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

  // Load pump data on component mount only if not already loaded
  useEffect(() => {
    if (bottles.length === 0) {
      loadItems(ITEM_TYPE);
    }
  }, []);

  // Update filtered bottles when bottles change
  useEffect(() => {
    if (Array.isArray(bottles)) {
      setFilteredBottles(bottles);
    } else {
      console.warn('bottles is not an array, setting empty array:', bottles);
      setFilteredBottles([]);
    }
  }, [bottles]);

  // Ensure filteredBottles is always an array before using array methods
  const safeFilteredBottles = Array.isArray(filteredBottles) ? filteredBottles : [];
  
  const totalPages = Math.ceil(safeFilteredBottles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBottles = safeFilteredBottles.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSubmit = async (formData) => {
    if (!formData.FORMULA.trim()) {
      throw new Error('Name is required');
    }

    try {
      if (editingBottle) {
        await updateItem(ITEM_TYPE, editingBottle._id, formData);
        setEditingBottle(null);
      } else {
        await createItem(ITEM_TYPE, formData);
      }
      setShowAddForm(false);
      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleEdit = (bottle) => {
    setEditingBottle(bottle);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pump?')) {
      try {
        await deleteItem(ITEM_TYPE, id);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-sm">Loading caps...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingBottle(null);
          }}
          className="cursor-pointer bg-orange-700 text-white flex items-center gap-2 px-3 py-1.5 rounded-sm shadow-md transition-colors duration-200 font-medium hover:bg-red-900 hover:text-white"
        >
          <Plus size={16} />
          New cap
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      <div className="bg-white rounded-full shadow-lg flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto rounded-lg">
          <table className="w-full min-w-full rounded-full">
            <thead className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] text-center font-bold text-sm text-white sticky top-0 z-10">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-medium">Cap Name</th>
                <th className="px-2 py-3 text-center text-sm font-medium">Edit</th>
                <th className="px-2 py-3 text-center text-sm font-medium">Delete</th>
              </tr>
            </thead>
            <tbody>
              {currentBottles.map((bottle, idx) => {
                const rowBgColor = idx % 2 === 0
                  ? 'bg-gradient-to-r from-[#FFFFFF] via-[#FFF5EC] to-[#FFEEE0]'
                  : 'bg-gradient-to-r from-[#FFF0E6] via-[#FFDAB3] to-[#FFE6CC]';

                return (
                  <tr key={bottle._id} className={rowBgColor}>
                    <td className="px-2 py-3 text-xs text-left text-[#703800]">{bottle.FORMULA || '-'}</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => handleEdit(bottle)}
                        className="flex items-center justify-center cursor-pointer p-1.5 bg-orange-600 rounded-sm text-white hover:bg-orange-500 transition-colors duration-200 shadow-sm mx-auto"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => handleDelete(bottle._id)}
                        className="flex items-center cursor-pointer justify-center p-1.5 bg-red-600 rounded-sm text-white hover:bg-red-700 transition-colors duration-200 shadow-sm mx-auto"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {currentBottles.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No pumps found
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 mt-18 border-t border-orange-400 bg-white text-sm flex-shrink-0">
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
      </div>

      <AddNewCapChild
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingBottle(null);
        }}
        editingBottle={editingBottle}
        onSubmit={handleSubmit}
        loading={loading}
      />
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

export default AddNewCap;