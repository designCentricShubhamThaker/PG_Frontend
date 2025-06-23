{
  orderItems.map((item, itemIndex) => (
    <div key={`item-${itemIndex}`} className="mb-8 rounded-xl shadow-lg overflow-visible border border-orange-200 relative">
      <div className="bg-gradient-to-r from-[#993300] via-[#FF6600] to-[#FFB84D] p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleOrderItemNameChange(itemIndex, e.target.value)}
              className="bg-transparent border-b border-white/50 text-white px-2 py-1 focus:outline-none focus:border-white w-32"
            />
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => addOrderItem()}
            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition"
            title="Add New Item"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          {orderItems.length > 1 && (
            <button
              type="button"
              onClick={() => removeOrderItem(itemIndex)}
              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition"
              title="Remove Item"
            >
              <GoTrash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Item Total Display - Only show if rates are entered */}
      {calculateItemPrice(item) > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
          <div className="text-orange-800 font-medium">
            Your item total is: ₹{calculateItemPrice(item).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="text-orange-600 text-sm mt-1">
            ${isLoadingRates ? '...' : (calculateItemPrice(item) * exchangeRates.USD).toLocaleString('en-US', { maximumFractionDigits: 2 })} |
            €{isLoadingRates ? '...' : (calculateItemPrice(item) * exchangeRates.EUR).toLocaleString('en-DE', { maximumFractionDigits: 2 })} |
            £{isLoadingRates ? '...' : (calculateItemPrice(item) * exchangeRates.GBP).toLocaleString('en-GB', { maximumFractionDigits: 2 })}
          </div>
        </div>
      )}

      <div className="p-6 bg-[#FFF8F3]">
        <div className="flex items-center mb-4">
          <h4 className="text-md font-medium text-orange-800">Team - Glass</h4>
        </div>

        <div className="space-y-6">
          {item.teamAssignments.glass.map((glass, glassIndex) => (
            <div
              key={`glass-${itemIndex}-${glassIndex}`}
              className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
            >
              <div className="grid grid-cols-12 gap-4 items-end">
                {/* Glass Name - Reduced space */}
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Glass Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={glassSearches[`${itemIndex}-${glassIndex}`] || ""}
                      placeholder={glass.glass_name !== "N/A" ? glass.glass_name : "Please Select"}
                      onFocus={() => {
                        setIsDropdownVisible(`glass-${itemIndex}-${glassIndex}`);
                        setFilteredGlassData(
                          glassData.filter(g => g.FORMULA !== "N/A")
                        );
                      }}
                      onChange={(e) => {
                        const searchValue = e.target.value;
                        const newSearches = { ...glassSearches };
                        newSearches[`${itemIndex}-${glassIndex}`] = searchValue;
                        setGlassSearches(newSearches);

                        const searchTerm = searchValue.toLowerCase();
                        const filtered = glassData.filter(g =>
                          (g.FORMULA !== "N/A" || searchTerm === "n/a") &&
                          g.FORMULA.toLowerCase().includes(searchTerm)
                        );
                        setFilteredGlassData(filtered);
                      }}
                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
      focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
      placeholder:text-gray-400 z-50"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    {isDropdownVisible === `glass-${itemIndex}-${glassIndex}` && (
                      <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                        {filteredGlassData.length > 0 ? (
                          filteredGlassData.map((glassItem, idx) => (
                            <div
                              key={idx}
                              className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                              onClick={() => {
                                const newSearches = { ...glassSearches };
                                newSearches[`${itemIndex}-${glassIndex}`] = glassItem.FORMULA;
                                setGlassSearches(newSearches);

                                handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'glass_name', glassItem.FORMULA);
                                handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'neck_size', glassItem.NECK_DIAM);
                                handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'weight', glassItem.ML);
                                setIsDropdownVisible(null);
                              }}
                            >
                              <span className="text-orange-700 font-medium">
                                {glassItem.FORMULA === "N/A" ? "Please Select" : glassItem.FORMULA}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Weight</label>
                  <input
                    type="text"
                    value={glass.weight || ""}
                    className="w-full px-3 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium text-center"
                    readOnly
                  />
                </div>

                {/* Neck Size */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                  <input
                    type="text"
                    value={glass.neck_size || ""}
                    className="w-full px-3 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium text-center"
                    readOnly
                  />
                </div>

                {/* Decoration - Reduced space */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Decoration</label>
                  <div className="relative">
                    <select
                      value={glass.decoration || "N/A"}
                      onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'decoration', e.target.value)}
                      className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
      focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="N/A">Please Select</option>
                      {decorationOptions
                        .filter(name => name !== "N/A")
                        .map((name, idx) => (
                          <option key={idx} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Deco No</label>
                  <input
                    type="text"
                    value={glass.decoration_no || ""}
                    onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'decoration_no', e.target.value)}
                    className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={glass.quantity || ""}
                    onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'quantity', e.target.value)}
                    className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
    focus:ring-2 focus:ring-orange-500 focus:border-transparent "
                    min="1"
                  />
                </div>

                <div className="col-span-1.5">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                  <input
                    type="number"
                    value={glass.rate || ""}
                    onChange={(e) => handleTeamDetailChange(itemIndex, glassIndex, 'glass', 'rate', e.target.value)}
                    className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
    focus:ring-2 focus:ring-orange-500 focus:border-transparent "
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                <button
                  type="button"
                  onClick={() => addTeamAssignment(itemIndex, 'glass')}
                  className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                  title="Add Glass Item"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
                {item.teamAssignments.glass.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeamAssignment(itemIndex, glassIndex, 'glass')}
                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                    title="Remove Glass Item"
                  >
                    <Trash size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-[#FFF8F3] border-t border-orange-200">
        <div className="flex items-center mb-4">
          <h4 className="text-md font-medium text-orange-800">Team - Caps</h4>
        </div>

        <div className="space-y-6">
          {item.teamAssignments.caps.map((cap, capIndex) => (
            <div
              key={`cap-${itemIndex}-${capIndex}`}
              className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
            >
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Cap Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={capSearches[`${itemIndex}-${capIndex}`] || ""}
                      placeholder={cap.cap_name !== "N/A" ? cap.cap_name : "Please Select"}
                      onFocus={() => {
                        setIsDropdownVisible(`cap-${itemIndex}-${capIndex}`);
                        setFilteredCapData(
                          CapData.filter(c => c.FORMULA !== "N/A")
                        );
                      }}
                      onChange={(e) => {
                        const searchValue = e.target.value;
                        const newSearches = { ...capSearches };
                        newSearches[`${itemIndex}-${capIndex}`] = searchValue;
                        setCapSearches(newSearches);

                        const searchTerm = searchValue.toLowerCase();
                        const filtered = CapData.filter(c =>
                          (c.FORMULA !== "N/A" || searchTerm === "n/a") &&
                          c.FORMULA.toLowerCase().includes(searchTerm)
                        );
                        setFilteredCapData(filtered);
                      }}
                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors
                    placeholder:text-gray-400 z-50"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute right-3 top-3 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    {isDropdownVisible === `cap-${itemIndex}-${capIndex}` && (
                      <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                        {filteredCapData.length > 0 ? (
                          filteredCapData.map((capItem, idx) => (
                            <div
                              key={idx}
                              className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                              onClick={() => {
                                const newSearches = { ...capSearches };
                                newSearches[`${itemIndex}-${capIndex}`] = capItem.FORMULA;
                                setCapSearches(newSearches);

                                handleTeamDetailChange(itemIndex, capIndex, 'caps', 'cap_name', capItem.FORMULA);
                                handleTeamDetailChange(itemIndex, capIndex, 'caps', 'neck_size', capItem.NECK_DIAM);
                                setIsDropdownVisible(null);
                              }}
                            >
                              <span className="text-orange-700 font-medium">
                                {capItem.FORMULA === "N/A" ? "Please Select" : capItem.FORMULA}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-8">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Neck Size</label>
                      <input
                        type="text"
                        value={cap.neck_size || ""}
                        className="w-full px-3 py-3 border bg-gray-50 border-orange-200 rounded-md text-sm text-orange-800 font-medium"
                        readOnly
                      />
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Process</label>
                      <div className="relative">
                        <select
                          value={cap.process || "N/A"}
                          onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'process', e.target.value)}
                          className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="N/A">Please Select</option>
                          {capProcessOptions
                            .filter(name => name !== "N/A")
                            .map((name, idx) => (
                              <option key={idx} value={name}>
                                {name}
                              </option>
                            ))}
                        </select>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Material</label>
                      <div className="relative">
                        <select
                          value={cap.material || "N/A"}
                          onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'material', e.target.value)}
                          className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="N/A">Please Select</option>
                          {capMaterialOptions
                            .filter(name => name !== "N/A")
                            .map((name, idx) => (
                              <option key={idx} value={name}>
                                {name}
                              </option>
                            ))}
                        </select>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 absolute right-3 top-3 text-orange-500 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={cap.quantity || ""}
                        onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'quantity', e.target.value)}
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                      focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                      />
                    </div>

                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                      <input
                        type="number"
                        value={cap.rate || ""}
                        onChange={(e) => handleTeamDetailChange(itemIndex, capIndex, 'caps', 'rate', e.target.value)}
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                      focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                <button
                  type="button"
                  onClick={() => addTeamAssignment(itemIndex, 'caps')}
                  className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                  title="Add Cap Item"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
                {item.teamAssignments.caps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeamAssignment(itemIndex, capIndex, 'caps')}
                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                    title="Remove Cap Item"
                  >
                    <Trash size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-[#FFF8F3] border-t border-orange-200">
        <div className="flex items-center mb-4">
          <h4 className="text-md font-medium text-orange-800">Team - Boxes</h4>
        </div>

        <div className="space-y-6">
          {item.teamAssignments.boxes.map((box, boxIndex) => (
            <div
              key={`box-${itemIndex}-${boxIndex}`}
              className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
            >
              <div className="grid grid-cols-12 gap-4">
                {/* Box Name Input */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Box Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={boxSearches[`${itemIndex}-${boxIndex}`] || ""}
                      placeholder={box.box_name !== "N/A" ? box.box_name : "Please Select"}
                      onFocus={() => {
                        setIsDropdownVisible(`box-${itemIndex}-${boxIndex}`);
                        setFilteredBoxData(boxData.filter(b => b.box_name !== "N/A"));
                      }}
                      onChange={(e) => {
                        const searchValue = e.target.value;
                        const newSearches = { ...boxSearches };
                        newSearches[`${itemIndex}-${boxIndex}`] = searchValue;
                        setBoxSearches(newSearches);

                        const searchTerm = searchValue.toLowerCase();
                        const filtered = boxData.filter(b =>
                          (b.box_name !== "N/A" || searchTerm === "n/a") &&
                          b.box_name.toLowerCase().includes(searchTerm)
                        );
                        setFilteredBoxData(filtered);
                      }}
                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                  focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 z-50"
                    />
                    <svg className="h-5 w-5 absolute right-3 top-3 text-orange-500" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isDropdownVisible === `box-${itemIndex}-${boxIndex}` && (
                      <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                        {filteredBoxData.length > 0 ? (
                          filteredBoxData.map((boxItem, idx) => (
                            <div
                              key={idx}
                              className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                              onClick={() => {
                                const newSearches = { ...boxSearches };
                                newSearches[`${itemIndex}-${boxIndex}`] = boxItem.box_name;
                                setBoxSearches(newSearches);
                                handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'box_name', boxItem.box_name);
                                setIsDropdownVisible(null);
                              }}
                            >
                              <span className="text-orange-700 font-medium">
                                {boxItem.box_name === "N/A" ? "Please Select" : boxItem.box_name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval, Quantity & Rate */}
                <div className="col-span-12 md:col-span-8">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Approval Code</label>
                      <input
                        type="text"
                        value={box.approval_code || ""}
                        onChange={(e) =>
                          handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'approval_code', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={box.quantity || ""}
                        onChange={(e) =>
                          handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'quantity', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                      <input
                        type="number"
                        value={box.rate || ""}
                        onChange={(e) =>
                          handleTeamDetailChange(itemIndex, boxIndex, 'boxes', 'rate', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                <button
                  type="button"
                  onClick={() => addTeamAssignment(itemIndex, 'boxes')}
                  className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                  title="Add Box Item"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
                {item.teamAssignments.boxes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeamAssignment(itemIndex, boxIndex, 'boxes')}
                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                    title="Remove Box Item"
                  >
                    <Trash size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-[#FFF8F3] border-t border-orange-200 rounded-b-xl">
        <div className="flex items-center mb-4">
          <h4 className="text-md font-medium text-orange-800">Team - Pumps</h4>
        </div>

        <div className="space-y-6">
          {item.teamAssignments.pumps.map((pump, pumpIndex) => (
            <div
              key={`pump-${itemIndex}-${pumpIndex}`}
              className="relative bg-white rounded-lg shadow-sm p-5 border border-orange-100 overflow-visible"
            >
              <div className="grid grid-cols-12 gap-4">
                {/* Pump Name */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium text-orange-800 mb-2">Pump Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pumpSearches[`${itemIndex}-${pumpIndex}`] || ""}
                      placeholder={pump.pump_name !== "N/A" ? pump.pump_name : "Please Select"}
                      onFocus={() => {
                        setIsDropdownVisible(`pump-${itemIndex}-${pumpIndex}`);
                        setFilteredPumpData(pumpData.filter(p => p.pump_name !== "N/A"));
                      }}
                      onChange={(e) => {
                        const searchValue = e.target.value;
                        const newSearches = { ...pumpSearches };
                        newSearches[`${itemIndex}-${pumpIndex}`] = searchValue;
                        setPumpSearches(newSearches);

                        const searchTerm = searchValue.toLowerCase();
                        const filtered = pumpData.filter(p =>
                          (p.pump_name !== "N/A" || searchTerm === "n/a") &&
                          p.pump_name.toLowerCase().includes(searchTerm)
                        );
                        setFilteredPumpData(filtered);
                      }}
                      className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                  focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 z-50"
                    />
                    <svg className="h-5 w-5 absolute right-3 top-3 text-orange-500" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isDropdownVisible === `pump-${itemIndex}-${pumpIndex}` && (
                      <div className="absolute z-50 w-full mt-1 min-w-[400px] bg-white shadow-xl max-h-60 rounded-md py-1 text-sm overflow-auto border border-orange-200">
                        {filteredPumpData.length > 0 ? (
                          filteredPumpData.map((pumpItem, idx) => (
                            <div
                              key={idx}
                              className="cursor-pointer px-4 py-3 hover:bg-orange-50 transition-colors flex items-center"
                              onClick={() => {
                                const newSearches = { ...pumpSearches };
                                newSearches[`${itemIndex}-${pumpIndex}`] = pumpItem.pump_name;
                                setPumpSearches(newSearches);
                                handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'pump_name', pumpItem.pump_name);
                                setIsDropdownVisible(null);
                              }}
                            >
                              <span className="text-orange-700 font-medium">
                                {pumpItem.pump_name === "N/A" ? "Please Select" : pumpItem.pump_name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 italic">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Neck, Quantity, Rate */}
                <div className="col-span-12 md:col-span-8">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Neck Type</label>
                      <select
                        value={pump.neck_type || "N/A"}
                        onChange={(e) =>
                          handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'neck_type', e.target.value)
                        }
                        className="w-full appearance-none px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="N/A">Please Select</option>
                        {pumpNeckTypeOptions.filter(name => name !== "N/A").map((name, idx) => (
                          <option key={idx} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={pump.quantity || ""}
                        onChange={(e) =>
                          handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'quantity', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-sm font-medium text-orange-800 mb-2">Rate</label>
                      <input
                        type="number"
                        value={pump.rate || ""}
                        onChange={(e) =>
                          handleTeamDetailChange(itemIndex, pumpIndex, 'pumps', 'rate', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-orange-300 rounded-md text-sm 
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="absolute top-0 right-0 flex space-x-1 -mt-3 -mr-3">
                <button
                  type="button"
                  onClick={() => addTeamAssignment(itemIndex, 'pumps')}
                  className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                  title="Add Pump Item"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
                {item.teamAssignments.pumps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeamAssignment(itemIndex, pumpIndex, 'pumps')}
                    className="bg-orange-100 hover:bg-orange-200 p-1 rounded-full text-orange-700 border border-orange-300 shadow-sm transition"
                    title="Remove Pump Item"
                  >
                    <Trash size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ))
}
