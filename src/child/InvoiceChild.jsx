import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { X, Download, FileText, Globe, Home, Building2, Calendar, Hash, User, MapPin, ChevronDown, ChevronRight, DollarSign, Euro, PoundSterling } from 'lucide-react';
const InvoiceModal = ({ order, onClose }) => {
    const [orderType, setOrderType] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [showInvoice, setShowInvoice] = useState(false);
    const [expandedStep, setExpandedStep] = useState(1);
    const [exchangeRates, setExchangeRates] = useState({ USD: 0, EUR: 0, GBP: 0 });
    const [isLoadingRates, setIsLoadingRates] = useState(false);



    const downloadPDF = () => {
        const element = document.getElementById('invoice-content');

        // Create a complete HTML document with all necessary styles
        const printWindow = window.open('', '_blank');

        // Get all stylesheets from the parent document
        const stylesheets = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    // Handle cross-origin stylesheets
                    return '';
                }
            })
            .join('\n');

        // Get the Tailwind CSS link if it exists
        const tailwindLink = document.querySelector('link[href*="tailwind"]') ||
            document.querySelector('link[href*="cdn.tailwindcss.com"]');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice</title>
            ${tailwindLink ? tailwindLink.outerHTML : ''}
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                /* Preserve all existing styles */
                ${stylesheets}
                
                /* Print-specific styles */
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                
                /* Ensure all your component styles are preserved */
                body {
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                    margin: 0;
                    padding: 0;
                }
                
                /* Force background colors to print */
                .bg-gray-800 {
                    background-color: #1f2937 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .bg-gray-100 {
                    background-color: #f3f4f6 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .bg-blue-50 {
                    background-color: #eff6ff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .text-white {
                    color: white !important;
                }
                
                .text-gray-600 {
                    color: #4b5563 !important;
                }
                
                .text-gray-800 {
                    color: #1f2937 !important;
                }
                
                /* Ensure borders are visible */
                .border {
                    border: 1px solid #d1d5db !important;
                }
                
                .border-gray-400 {
                    border-color: #9ca3af !important;
                }
                
                .border-b-2 {
                    border-bottom: 2px solid #d1d5db !important;
                }
                
                .border-gray-300 {
                    border-color: #d1d5db !important;
                }
                
                /* Table specific styles */
                table {
                    border-collapse: collapse !important;
                }
                
                th, td {
                    border: 1px solid #9ca3af !important;
                }
                
                /* Maintain exact dimensions */
                #invoice-content {
                    width: 210mm !important;
                    min-height: 297mm !important;
                    margin: 0 auto !important;
                    padding: 15mm !important;
                    box-sizing: border-box !important;
                }
                
                /* Ensure proper spacing */
                .mb-2 { margin-bottom: 0.5rem !important; }
                .mb-3 { margin-bottom: 0.75rem !important; }
                .pb-2 { padding-bottom: 0.5rem !important; }
                .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
                .py-1\.5 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
                .px-1\.5 { padding-left: 0.375rem !important; padding-right: 0.375rem !important; }
                .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
                
                /* Text sizes */
                .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
                .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
                .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
                
                /* Font weights */
                .font-bold { font-weight: 700 !important; }
                .font-semibold { font-weight: 600 !important; }
                .font-medium { font-weight: 500 !important; }
                
                /* Text alignment */
                .text-center { text-align: center !important; }
                .text-left { text-align: left !important; }
                .text-right { text-align: right !important; }
                
                /* Display and layout */
                .grid { display: grid !important; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                .gap-3 { gap: 0.75rem !important; }
                .gap-x-1 { column-gap: 0.25rem !important; }
                .flex { display: flex !important; }
                .flex-col { flex-direction: column !important; }
                .justify-between { justify-content: space-between !important; }
                .items-center { align-items: center !important; }
                .space-y-0\.5 > * + * { margin-top: 0.125rem !important; }
                
                /* Positioning */
                .relative { position: relative !important; }
                
                /* Widths */
                .w-full { width: 100% !important; }
                .w-1\/5 { width: 20% !important; }
                .w-1\/2 { width: 50% !important; }
                .w-8 { width: 2rem !important; }
                .w-16 { width: 4rem !important; }
                .w-20 { width: 5rem !important; }
                
                /* Heights */
                .h-24 { height: 6rem !important; }
                
                /* Line height */
                .leading-tight { line-height: 1.25 !important; }
                
                /* Rounded corners */
                .rounded { border-radius: 0.25rem !important; }
                
                /* Box shadows */
                .shadow-lg {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                }
                
            </style>
        </head>
        <body>
            <div style="background: white; min-height: 100vh;">
                ${element.outerHTML}
            </div>
        </body>
        </html>
    `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 1000); 
        };
    };

    const countries = [
        { code: 'US', name: 'United States', currency: 'USD', symbol: '$', icon: DollarSign },
        { code: 'EU', name: 'European Union', currency: 'EUR', symbol: '€', icon: Euro },
        { code: 'UK', name: 'United Kingdom', currency: 'GBP', symbol: '£', icon: PoundSterling }
    ];

    const fetchExchangeRates = async () => {
        setIsLoadingRates(true);
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
            const data = await response.json();
            setExchangeRates({
                USD: data.rates.USD || 0,
                EUR: data.rates.EUR || 0,
                GBP: data.rates.GBP || 0
            });
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            setExchangeRates({
                USD: 0.012,
                EUR: 0.011,
                GBP: 0.0095
            });
        } finally {
            setIsLoadingRates(false);
        }
    };

    useEffect(() => {
        if (orderType === 'international') {
            fetchExchangeRates();
        }
    }, [orderType]);

    const calculateGrandTotal = () => {
        if (!order?.item_ids) return 0;
        return order.item_ids.reduce((total, item) => total + calculateItemTotal(item), 0);
    };

    const getAllItemsForSingleItem = (item) => {
        const items = [];
        const categories = [
            { key: 'glass', nameField: 'glass_name', type: 'Glass' },
            { key: 'caps', nameField: 'cap_name', type: 'Caps' },
            { key: 'boxes', nameField: 'box_name', type: 'Boxes' },
            { key: 'pumps', nameField: 'pump_name', type: 'Pumps' },
            { key: 'accessories', nameField: 'accessories_name', type: 'Accessories' }
        ];

        categories.forEach(category => {
            item.team_assignments?.[category.key]?.forEach(subItem => {
                const subtotal = (parseFloat(subItem.quantity) * parseFloat(subItem.rate)) / 1000;
                items.push({
                    name: subItem[category.nameField],
                    quantity: subItem.quantity,
                    rate: subItem.rate,
                    subtotal,
                    type: category.type
                });
            });
        });

        return items;
    };

    const calculateItemTotal = (item) => {
        const items = getAllItemsForSingleItem(item);
        return items.reduce((total, subItem) => total + subItem.subtotal, 0);
    };
    const handleProceed = () => {
        if (!orderType) return;
        if (orderType === 'international' && (!invoiceNumber.trim() || !selectedCountry)) return;
        setShowInvoice(true);
    };

    const formatCurrency = (amount, currency = 'INR') => {
        if (currency === 'INR') {
            return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        }

        const selectedCountryData = countries.find(c => c.currency === currency);
        const rate = exchangeRates[currency] || 1;
        const convertedAmount = amount * rate;

        return `${selectedCountryData?.symbol}${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    };


    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';

        const convertHundreds = (n) => {
            let result = '';
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }
            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            } else if (n >= 10) {
                result += teens[n - 10] + ' ';
                return result;
            }
            if (n > 0) {
                result += ones[n] + ' ';
            }
            return result;
        };

        let result = '';
        if (num >= 10000000) {
            result += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
            num %= 10000000;
        }
        if (num >= 100000) {
            result += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
            num %= 100000;
        }
        if (num >= 1000) {
            result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
            num %= 1000;
        }
        if (num > 0) {
            result += convertHundreds(num);
        }

        return result.trim() + ' Only';
    };

    if (!showInvoice) {
        return (
            <Dialog open={true} onClose={onClose} className="relative z-10">
                <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-2xl">

                            {/* Header */}
                            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-6 w-6 text-white" />
                                        <h3 className="text-white text-xl font-bold">Generate Invoice</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 hover:bg-orange-700 rounded-full transition-colors"
                                    >
                                        <X className="h-5 w-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white px-6 py-6 max-h-[70vh] overflow-y-auto">

                                {/* Step 1: Order Type */}
                                <div className="mb-6">
                                    <button
                                        onClick={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                            <span className="font-semibold text-gray-800">What type of order is this?</span>
                                        </div>
                                        {expandedStep === 1 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                    </button>

                                    {expandedStep === 1 && (
                                        <div className="mt-4 space-y-3 pl-6">
                                            <button
                                                onClick={() => {
                                                    setOrderType('domestic');
                                                    setExpandedStep(0);
                                                }}
                                                className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${orderType === 'domestic'
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-200 hover:border-orange-300 text-gray-700 hover:bg-orange-50'
                                                    }`}
                                            >
                                                <Home className="h-6 w-6 flex-shrink-0" />
                                                <div className="text-left">
                                                    <div className="font-semibold text-lg">Domestic Order</div>
                                                    <div className="text-sm opacity-75">Invoice in Indian Rupees (₹)</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setOrderType('international');
                                                    setExpandedStep(2);
                                                }}
                                                className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${orderType === 'international'
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-200 hover:border-orange-300 text-gray-700 hover:bg-orange-50'
                                                    }`}
                                            >
                                                <Globe className="h-6 w-6 flex-shrink-0" />
                                                <div className="text-left">
                                                    <div className="font-semibold text-lg">International Order</div>
                                                    <div className="text-sm opacity-75">Export invoice with foreign currency</div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Invoice Number (International only) */}
                                {orderType === 'international' && (
                                    <div className="mb-6">
                                        <button
                                            onClick={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                                <span className="font-semibold text-gray-800">Invoice Details</span>
                                            </div>
                                            {expandedStep === 2 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </button>

                                        {expandedStep === 2 && (
                                            <div className="mt-4 space-y-4 pl-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Invoice Number *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={invoiceNumber}
                                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                                        placeholder="Enter invoice number"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                </div>

                                                {invoiceNumber.trim() && (
                                                    <button
                                                        onClick={() => setExpandedStep(3)}
                                                        className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                                                    >
                                                        Continue to Country Selection
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Country Selection (International only) */}
                                {orderType === 'international' && invoiceNumber.trim() && (
                                    <div className="mb-6">
                                        <button
                                            onClick={() => setExpandedStep(expandedStep === 3 ? 0 : 3)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                                <span className="font-semibold text-gray-800">Select Destination Country</span>
                                            </div>
                                            {expandedStep === 3 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </button>

                                        {expandedStep === 3 && (
                                            <div className="mt-4 space-y-3 pl-6">
                                                {isLoadingRates && (
                                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                                        <div className="text-blue-600">Loading exchange rates...</div>
                                                    </div>
                                                )}

                                                {countries.map((country) => {
                                                    const IconComponent = country.icon;
                                                    const rate = exchangeRates[country.currency];

                                                    return (
                                                        <button
                                                            key={country.code}
                                                            onClick={() => setSelectedCountry(country.code)}
                                                            className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${selectedCountry === country.code
                                                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                                : 'border-gray-200 hover:border-orange-300 text-gray-700 hover:bg-orange-50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <IconComponent className="h-6 w-6 flex-shrink-0" />
                                                                <div className="text-left">
                                                                    <div className="font-semibold">{country.name}</div>
                                                                    <div className="text-sm opacity-75">{country.currency} ({country.symbol})</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-medium">
                                                                    Rate: {rate ? `₹1 = ${country.symbol}${rate.toFixed(4)}` : 'Loading...'}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleProceed}
                                        disabled={!orderType || (orderType === 'international' && (!invoiceNumber.trim() || !selectedCountry))}
                                        className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        Generate Invoice
                                    </button>
                                </div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        );
    }

    // Invoice Display
    const selectedCountryData = countries.find(c => c.code === selectedCountry);
    const grandTotal = calculateGrandTotal();

    return (
        <Dialog open={showInvoice} onClose={onClose} className="relative z-10">
            <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-5xl">

                        {/* Modal Header */}
                        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Invoice Preview</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={downloadPDF}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm font-medium"
                                >
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                                >
                                    <X className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="max-h-[100vh] overflow-y-auto bg-gray-50 p-4">
                            <div className="bg-white shadow-lg" id="invoice-content" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '15mm' }}>

                                {/* Company Header - Ultra Compact */}
                                <div className="text-center mb-2 pb-2 border-b-2 border-gray-300">
                                    <h1 className="text-lg font-bold text-gray-800 mb-0.5 leading-tight">PRAGATI GLASS & INDUSTRIES PRIVATE LIMITED</h1>
                                    <p className="text-xs text-gray-600 mb-0.5 leading-tight">PLOT NO.67 TO 71, ONGC ROAD KHARACH, DIST. BHARUCH, GUJARAT, INDIA PIN : 394120</p>
                                    <p className="text-xs text-gray-600 mb-1.5 leading-tight">GST NO. 24AABCP7377H1Z8 | CIN NO. U26100MH1981PTC200311</p>
                                    <div className="inline-block">
                                        <h2 className="text-base font-bold bg-gray-800 text-white py-1 px-4 rounded">
                                            {orderType === 'international' ? 'EXPORT INVOICE' : 'TAX INVOICE'}
                                        </h2>
                                    </div>
                                </div>

                                {/* Invoice Details Table - Ultra Compact */}
                                <div className="mb-2">
                                    <table className="w-full border border-gray-400 text-xs">
                                        <tbody>
                                            <tr>
                                                <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold w-1/2 text-xs">
                                                    CONSIGNEE / BILL TO:
                                                </td>
                                                <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold text-xs">
                                                    INVOICE DETAILS:
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-400 px-2 py-1 align-top">
                                                    <div className="font-semibold text-sm leading-tight">{order?.customer_name}</div>
                                                    <div className="text-gray-600 text-xs leading-tight mt-0.5">
                                                        Customer Address Line 1, Customer Address Line 2, City, State, PIN Code
                                                    </div>
                                                </td>
                                                <td className="border border-gray-400 px-2 py-1 align-top">
                                                    <div className="grid grid-cols-2 gap-x-1 text-xs leading-tight">
                                                        <span>Order #:</span><span className="font-semibold">#{order?.order_number}</span>
                                                        {orderType === 'international' && (
                                                            <>
                                                                <span>Invoice #:</span><span className="font-semibold">{invoiceNumber}</span>
                                                            </>
                                                        )}
                                                        <span>Date:</span><span className="font-semibold">{new Date().toLocaleDateString('en-IN')}</span>
                                                        <span>Dispatcher:</span><span className="font-semibold">{order?.dispatcher_name}</span>
                                                        {orderType === 'international' && selectedCountryData && (
                                                            <>
                                                                <span>Currency:</span><span className="font-semibold">{selectedCountryData.currency}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Items Table - More Compact */}
                                <div className="mb-3">
                                    <table className="w-full border border-gray-400 text-xs">
                                        <thead>
                                            <tr className="bg-gray-800 text-white">
                                                <th className="border border-gray-400 px-1.5 py-1.5 text-left w-8">Sr.</th>
                                                <th className="border border-gray-400 px-1.5 py-1.5 text-left w-16">Type</th>
                                                <th className="border border-gray-400 px-1.5 py-1.5 text-left">Description</th>
                                                <th className="border border-gray-400 px-1.5 py-1.5 text-center w-16">Qty</th>
                                                <th className="border border-gray-400 px-1.5 py-1.5 text-center w-16">Rate</th>
                                                <th className="border border-gray-400 px-1.5 py-1.5 text-right w-20">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order?.item_ids?.map((item, itemIndex) => {
                                                const items = getAllItemsForSingleItem(item);
                                                const itemTotal = calculateItemTotal(item);

                                                return (
                                                    <React.Fragment key={item._id}>
                                                        {/* Item Header Row - More Compact */}
                                                        <tr className="bg-blue-50">
                                                            <td className="border border-gray-400 px-1.5 py-1 font-bold text-xs" colSpan="6">
                                                                {item.name}
                                                            </td>
                                                        </tr>

                                                        {/* Item's Team Assignments - Tighter Spacing */}
                                                        {items.map((subItem, subIndex) => (
                                                            <tr key={`${item._id}-${subIndex}`}>
                                                                <td className="border border-gray-400 px-1.5 py-0.5 text-center text-xs">
                                                                    {itemIndex + 1}.{subIndex + 1}
                                                                </td>
                                                                <td className="border border-gray-400 px-1.5 py-0.5 text-center text-xs">
                                                                    {subItem.type}
                                                                </td>
                                                                <td className="border border-gray-400 px-1.5 py-0.5 text-xs">
                                                                    <span className="font-medium">{subItem.name}</span>
                                                                </td>
                                                                <td className="border border-gray-400 px-1.5 py-0.5 text-center text-xs">
                                                                    {parseFloat(subItem.quantity).toLocaleString('en-IN')}
                                                                </td>
                                                                <td className="border border-gray-400 px-1.5 py-0.5 text-center text-xs">
                                                                    ₹{subItem.rate}
                                                                </td>
                                                                <td className="border border-gray-400 px-1.5 py-0.5 text-right text-xs">
                                                                    {formatCurrency(subItem.subtotal, orderType === 'international' ? selectedCountryData?.currency : 'INR')}
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Item Subtotal Row - Compact */}
                                                        <tr className="bg-gray-100 font-semibold">
                                                            <td colSpan="5" className="border border-gray-400 px-1.5 py-0.5 text-right text-xs">
                                                                {item.name} Subtotal:
                                                            </td>
                                                            <td className="border border-gray-400 px-1.5 py-0.5 text-right text-xs">
                                                                {formatCurrency(itemTotal, orderType === 'international' ? selectedCountryData?.currency : 'INR')}
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Grand Total Row */}
                                            <tr className="bg-gray-800 text-white font-bold">
                                                <td colSpan="5" className="border border-gray-400 px-1.5 py-1.5 text-right text-xs">
                                                    GRAND TOTAL:
                                                </td>
                                                <td className="border border-gray-400 px-1.5 py-1.5 text-right text-xs">
                                                    {formatCurrency(grandTotal, orderType === 'international' ? selectedCountryData?.currency : 'INR')}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Amount in Words - Compact */}
                                <div className="mb-3">
                                    <table className="w-full border border-gray-400 text-xs">
                                        <tbody>
                                            <tr>
                                                <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold w-1/5">
                                                    Amount in Words:
                                                </td>
                                                <td className="border border-gray-400 px-2 py-1 text-xs">
                                                    {orderType === 'international' && selectedCountryData
                                                        ? `${selectedCountryData.currency} ${numberToWords(Math.round(grandTotal * exchangeRates[selectedCountryData.currency]))}`
                                                        : `Rupees ${numberToWords(Math.round(grandTotal))}`
                                                    }
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bank Details (International only) - Compact */}
                                {orderType === 'international' && (
                                    <div className="mb-3">
                                        <div className="border border-gray-400 p-2">
                                            <div className="font-semibold mb-1 text-xs">BANK DETAILS:</div>
                                            <p className="text-xs leading-tight">CREDIT THE PROCEEDS TO TREASURY ACC NO.121149 WITH BANK OF BARODA, NEW YORK (SWIFT : BARBUS33) ROUTING NO.026005322 FOR FURTHER CREDIT TO BANK OF BARODA, CHANDAVARKAR ROAD BRANCH, MATUNGA, MUMBAI (SWIFT : BARBINBBMAT) FOR CREDIT OF EEFC A/C. NO. 04060200001143, BENEFICIARY : PRAGATI GLASS PVT. LTD.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Footer - Compact Layout */}
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                    <div>
                                        <div className="border border-gray-400 p-2 h-24">
                                            <div className="font-semibold mb-1">Terms & Conditions:</div>
                                            <ul className="space-y-0.5 text-xs leading-tight">
                                                <li>• Payment due within 30 days</li>
                                                <li>• All disputes subject to local jurisdiction</li>
                                                <li>• Goods once sold will not be taken back</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border border-gray-400 p-2 h-24 flex flex-col justify-between">
                                            <div className="text-center">
                                                <p className="text-xs">For PRAGATI GLASS & INDUSTRIES PVT. LTD.</p>
                                            </div>
                                            <div className="text-center border-t border-gray-400 pt-1">
                                                <p className="text-xs font-semibold">AUTHORISED SIGNATORY</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {orderType === 'international' && (
                                    <div className="mb-2 border border-gray-400 p-2">
                                        <div className="text-xs">
                                            <div className="font-semibold mb-0.5">Declaration:</div>
                                            <p className="leading-tight">This is to certify that the goods mentioned in this invoice are entirely of Indian origin. We declare that this invoice shows actual price of the goods described and that all particulars are true and correct.</p>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default InvoiceModal;

