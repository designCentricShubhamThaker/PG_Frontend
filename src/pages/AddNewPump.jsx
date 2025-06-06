import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import AddNewProductChild from '../child/AddNewProductChild.jsx';
import AddNewPumpChild from '../child/AddNewPumpChild.jsx';

const AddNewPump = () => {
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
    name: "",
    neck: ""
  });



  const API_BASE = 'http://localhost:5000/api/pumpdata';

  const fetchBottles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}`);
      if (!response.ok) throw new Error('Failed to fetch bottles');
      const data = await response.json();
      setBottles(data);
      setFilteredBottles(data);
    } catch (err) {
      setError('Failed to fetch bottles');
    } finally {
      setLoading(false);
    }
  };

  const createBottle = async (bottleData) => {
    try {
      const response = await fetch(`${API_BASE}`, {
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
      const response = await fetch(`${API_BASE}/${id}`, {
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
      const response = await fetch(`${API_BASE}/${id}`, {
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

  const handleSubmit = async (formData) => {
    if (!formData.FORMULA.trim()) {
      throw new Error('Formula is required');
    }

    try {
      if (editingBottle) {
        await updateBottle(editingBottle._id, formData);
        setEditingBottle(null);
      } else {
        await createBottle(formData);
      }
      setShowAddForm(false);
      return true; // Success
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleEdit = (bottle) => {
    setEditingBottle(bottle);
    setShowAddForm(true);
  }

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
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingBottle(null);
            setFormData({
              name: "",
              neck: ""
            });
          }}
          className="cursor-pointer bg-orange-700 text-white flex items-center gap-2 px-3 py-1.5 rounded-sm shadow-md transition-colors duration-200 font-medium hover:bg-red-900 hover:text-white"
        >
          <Plus size={16} onClick={() => {
            setShowAddForm(true);
            setEditingBottle(null);
          }} />
          New Pump
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
                <th className="px-2 py-3 text-left text-sm font-medium">Name </th>
                <th className="px-2 py-3 text-left text-sm font-medium">Neck</th>

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
                    <td className="px-2 py-3 text-xs text-left text-[#703800]">{bottle.name || '-'}</td>
                    <td className="px-2 py-3 text-xs text-left text-[#703800]">{bottle.neck}</td>

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
              No bottles found
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 mt-18 border-t border-orange-400  bg-white text-sm flex-shrink-0">
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

      <AddNewPumpChild
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

export default AddNewPump;