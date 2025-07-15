import React from 'react';
import { Receipt, TrendingUp } from 'lucide-react';

const ModernPriceDisplay = ({ orderItems, exchangeRates, isLoadingRates, orderNumber }) => {
  const calculateItemPrice = (item) => {
    let totalPrice = 0;

    item.teamAssignments.glass.forEach(glass => {
      const qty = parseFloat(glass.quantity) || 0;
      const rate = parseFloat(glass.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    item.teamAssignments.caps.forEach(cap => {
      const qty = parseFloat(cap.quantity) || 0;
      const rate = parseFloat(cap.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    item.teamAssignments.boxes.forEach(box => {
      const qty = parseFloat(box.quantity) || 0;
      const rate = parseFloat(box.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    item.teamAssignments.pumps.forEach(pump => {
      const qty = parseFloat(pump.quantity) || 0;
      const rate = parseFloat(pump.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    item.teamAssignments.accessories.forEach(accessory => {
      const qty = parseFloat(accessory.quantity) || 0;
      const rate = parseFloat(accessory.rate) || 0;
      totalPrice += (qty * rate) / 1000;
    });

    return totalPrice;
  };

  const calculateTotalOrderPrice = () => {
    return orderItems.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const formatCurrency = (amount, currency) => {
    if (isLoadingRates && currency !== 'INR') {
      return <span className="text-orange-400">...</span>;
    }
    
    const formatters = {
      INR: (val) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      USD: (val) => `$${(val * (exchangeRates?.USD || 1)).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      EUR: (val) => `€${(val * (exchangeRates?.EUR || 1)).toLocaleString('en-DE', { maximumFractionDigits: 2 })}`,
      GBP: (val) => `£${(val * (exchangeRates?.GBP || 1)).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`
    };
    
    return formatters[currency](amount);
  };

  const totalOrderPrice = calculateTotalOrderPrice();

  return (
    <div className="w-full bg-white">
      {/* Compact Header */}
      <div className="bg-[#FF6701] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-white" />
          <div>
            <h3 className="text-white text-xl font-bold tracking-wide">Order Invoice</h3>
            <p className="text-orange-100 text-sm">#{orderNumber}</p>
          </div>
        </div>
        <div className="text-white text-right">
          <div className="text-lg font-bold">{orderItems.length}</div>
          <div className="text-orange-100 text-xs">Items</div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-[#FFF0E7] p-3">
        <h4 className="text-orange-800 font-medium mb-3">Item Details</h4>
        
        <div className="space-y-2">
          {orderItems.map((item, index) => {
            const itemPrice = calculateItemPrice(item);
            return (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-[#FF6701] to-[#FF8533] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>USD: {formatCurrency(itemPrice, 'USD')}</span>
                      <span>EUR: {formatCurrency(itemPrice, 'EUR')}</span>
                      <span>GBP: {formatCurrency(itemPrice, 'GBP')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-800">{formatCurrency(itemPrice, 'INR')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Section */}
      <div className="bg-[#FFF8F3] p-4 border-t border-orange-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-orange-800">Total Order Amount</h4>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <TrendingUp className="h-3 w-3 text-[#FF6701]" />
            <span>{isLoadingRates ? 'Updating...' : 'Live rates'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-white rounded border border-orange-200">
            <div className="text-xs text-orange-600 font-medium mb-1">INR</div>
            <div className="text-sm font-bold text-orange-800">
              {formatCurrency(totalOrderPrice, 'INR')}
            </div>
          </div>
          
          <div className="text-center p-2 bg-white rounded border border-orange-200">
            <div className="text-xs text-orange-600 font-medium mb-1">USD</div>
            <div className="text-sm font-bold text-orange-800">
              {formatCurrency(totalOrderPrice, 'USD')}
            </div>
          </div>
          
          <div className="text-center p-2 bg-white rounded border border-orange-200">
            <div className="text-xs text-orange-600 font-medium mb-1">EUR</div>
            <div className="text-sm font-bold text-orange-800">
              {formatCurrency(totalOrderPrice, 'EUR')}
            </div>
          </div>
          
          <div className="text-center p-2 bg-white rounded border border-orange-200">
            <div className="text-xs text-orange-600 font-medium mb-1">GBP</div>
            <div className="text-sm font-bold text-orange-800">
              {formatCurrency(totalOrderPrice, 'GBP')}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-2 px-4 text-xs text-gray-500 border-t border-orange-200">
        <span>Generated: {new Date().toLocaleDateString()}</span>
        <span>{orderItems.length} items total</span>
      </div>
    </div>
  );
};

export default ModernPriceDisplay;