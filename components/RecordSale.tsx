
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SalesInvoice, SalesInvoiceItem, Customer, BankTransaction, AppSettings } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RecordSaleProps {
    inventory: Product[];
    salesInvoices: SalesInvoice[];
    customers: Customer[];
    bankTransactions: BankTransaction[];
    onCreateInvoice: (
        invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'>,
        payment?: { amount: number; method: 'Cash' | 'Bank' }
    ) => SalesInvoice | undefined;
    onEditInvoice: (
        invoice: SalesInvoice,
        payment?: { amount: number; method: 'Cash' | 'Bank' }
    ) => SalesInvoice | undefined;
    onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
    onEditCustomer: (customer: Customer) => void;
    onReturnInvoice: (invoiceId: string) => void;
    appSettings: AppSettings;
}

const ManageCustomersModal: React.FC<{
    customers: Customer[];
    onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
    onEditCustomer: (customer: Customer) => void;
    onClose: () => void;
}> = ({ customers, onAddCustomer, onEditCustomer, onClose }) => {
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerCode, setNewCustomerCode] = useState('');
    const [salePercent, setSalePercent] = useState(0);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        if (editingCustomer) {
            setNewCustomerName(editingCustomer.name);
            setNewCustomerCode(editingCustomer.code);
            setSalePercent(editingCustomer.salePercent);
            setOpeningBalance(editingCustomer.openingBalance || 0);
        } else {
            setNewCustomerName('');
            setNewCustomerCode('');
            setSalePercent(0);
            setOpeningBalance(0);
        }
    }, [editingCustomer]);

    const handleSave = () => {
        if (newCustomerName.trim() && newCustomerCode.trim()) {
            if (editingCustomer) {
                onEditCustomer({
                    ...editingCustomer,
                    name: newCustomerName.trim(),
                    code: newCustomerCode.trim(),
                    salePercent,
                    openingBalance,
                });
            } else {
                onAddCustomer({ name: newCustomerName.trim(), code: newCustomerCode.trim(), salePercent, openingBalance });
            }
            setEditingCustomer(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingCustomer(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Customers</h3>
                <div className="mb-4 space-y-2 p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</label>
                    <div className="grid grid-cols-3 gap-2">
                        <input
                            type="text"
                            value={newCustomerCode}
                            onChange={(e) => setNewCustomerCode(e.target.value)}
                            placeholder="e.g., C005"
                            className="col-span-1 p-2 border border-gray-300 rounded-md"
                        />
                        <input
                            type="text"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="e.g., City Pharmacy"
                            className="col-span-2 p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Preferred Sale Percent (%)</label>
                            <input
                                type="number"
                                value={salePercent}
                                onChange={(e) => setSalePercent(Number(e.target.value))}
                                placeholder="e.g., 5"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                min="0"
                                max="100"
                                step="any"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Opening Balance (PKR)</label>
                            <input
                                type="number"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                                placeholder="0"
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={handleSave} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">{editingCustomer ? 'Update Customer' : 'Add Customer'}</button>
                        {editingCustomer && <button onClick={handleCancelEdit} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>}
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Existing Customers</h4>
                    <ul className="h-48 overflow-y-auto space-y-2 text-sm">
                        {customers.map(c => (
                            <li key={c.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 text-gray-900">
                                <span>
                                    <span className="font-mono bg-gray-200 px-2 py-1 rounded-md text-xs">{c.code}</span> - {c.name} ({c.salePercent}%)
                                </span>
                                <button onClick={() => setEditingCustomer(c)} className="text-xs px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Edit</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
};

type InvoiceItemFormState = {
    productId: string;
    productCode: string;
    quantity: number;
    price: number; // This will now hold the Sale T.P
    cst: number;
    discountPercentage: number;
}

const NewSalesInvoice: React.FC<{
    inventory: Product[],
    customers: Customer[],
    salesInvoices: SalesInvoice[],
    bankTransactions: BankTransaction[],
    onCreateInvoice: (
        invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'>,
        payment?: { amount: number; method: 'Cash' | 'Bank' }
    ) => SalesInvoice | undefined;
    onEditInvoice: (
        invoice: SalesInvoice,
        payment?: { amount: number; method: 'Cash' | 'Bank' }
    ) => SalesInvoice | undefined;
    invoiceToEdit: SalesInvoice | null;
    clearEditing: () => void;
    onPrintInvoice: (invoice: SalesInvoice) => void;
}> = ({ inventory, customers, salesInvoices, bankTransactions, onCreateInvoice, onEditInvoice, invoiceToEdit, clearEditing, onPrintInvoice }) => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(-1);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<InvoiceItemFormState[]>([
        { productId: '', productCode: '', quantity: 1, price: 0, cst: 0, discountPercentage: 0 }
    ]);

    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');

    const [error, setError] = useState('');
    const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const resetForm = () => {
        setItems([{ productId: '', productCode: '', quantity: 1, price: 0, cst: 0, discountPercentage: 0 }]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentAmount(0);
        setPaymentMethod('Cash');
        setError('');
    };

    useEffect(() => {
        if (invoiceToEdit) {
            const customer = customers.find(c => c.id === invoiceToEdit.customerId);
            if (customer) {
                setSelectedCustomer(customer);
                setCustomerSearch(`${customer.code} - ${customer.name}`);
            }
            setDate(invoiceToEdit.date);
            const formItems = invoiceToEdit.items.map(item => {
                const product = inventory.find(p => p.id === item.productId);
                return {
                    productId: item.productId,
                    productCode: product?.code || '',
                    quantity: item.quantity,
                    price: item.price, // This is already Sale T.P
                    cst: product?.cst || 0,
                    discountPercentage: item.discountPercentage || 0,
                };
            });
            setItems(formItems);
            setPaymentAmount(invoiceToEdit.paidAmount);
            const originalTransaction = bankTransactions.find(tx => tx.invoiceId === invoiceToEdit.id);
            setPaymentMethod(originalTransaction?.paymentMethod || 'Cash');
        } else {
            resetForm();
        }
    }, [invoiceToEdit, customers, inventory, bankTransactions]);

    useEffect(() => {
        if (selectedCustomer && !invoiceToEdit) {
            setItems(items => items.map(item => ({
                ...item,
                discountPercentage: selectedCustomer.salePercent || 0
            })))
        }
    }, [selectedCustomer, invoiceToEdit]);

    const customerPendingBalance = useMemo(() => {
        if (!selectedCustomer) return 0;
        const totalBilled = salesInvoices.filter(inv => inv.customerId === selectedCustomer.id).reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalReceived = bankTransactions.filter(tx => tx.type === 'receipt' && tx.party === selectedCustomer.name).reduce((sum, inv) => sum + inv.amount, 0);
        return (selectedCustomer.openingBalance || 0) + totalBilled - totalReceived;
    }, [selectedCustomer, salesInvoices, bankTransactions]);

    const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setCustomerSearch(term);
        setHighlightedCustomerIndex(-1);
        if (term) {
            setCustomerSuggestions(customers.filter(c =>
                c.name.toLowerCase().includes(term.toLowerCase()) ||
                c.code.toLowerCase().includes(term.toLowerCase())
            ));
        } else {
            setCustomerSuggestions([]);
        }
    };

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(`${customer.code} - ${customer.name}`);
        setCustomerSuggestions([]);
        setHighlightedCustomerIndex(-1);
    };

    const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (customerSuggestions.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedCustomerIndex(prev => (prev < customerSuggestions.length - 1 ? prev + 1 : prev)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedCustomerIndex(prev => (prev > 0 ? prev - 1 : 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (highlightedCustomerIndex > -1 && customerSuggestions[highlightedCustomerIndex]) { handleSelectCustomer(customerSuggestions[highlightedCustomerIndex]); } }
        else if (e.key === 'Escape') { setCustomerSuggestions([]); }
    };

    const handleItemChange = (index: number, field: keyof InvoiceItemFormState, value: string | number) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        (currentItem as any)[field] = value;
        if (field === 'productCode') {
            const searchTerm = (value as string).toLowerCase();
            currentItem.productId = ''; currentItem.price = 0; currentItem.cst = 0;
            if (searchTerm) {
                setSuggestions(inventory.filter(p => p.code?.toLowerCase().includes(searchTerm) || p.name.toLowerCase().includes(searchTerm)));
                setActiveAutocompleteIndex(index); setHighlightedIndex(-1);
            } else { setSuggestions([]); setActiveAutocompleteIndex(null); }
        }
        if (field === 'productId') {
            const product = inventory.find(p => p.id === value);
            currentItem.productCode = product?.code || '';

            if (product) {
                const discount = product.tpDiscount ?? 15;
                currentItem.price = product.price * (1 - discount / 100);
                currentItem.cst = product.cst || 0;
            } else {
                currentItem.price = 0;
                currentItem.cst = 0;
            }

            setSuggestions([]); setActiveAutocompleteIndex(null);
        }
        newItems[index] = currentItem;
        setItems(newItems);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemIndex: number) => {
        if (activeAutocompleteIndex !== itemIndex || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (highlightedIndex > -1 && suggestions[highlightedIndex]) { handleSuggestionSelect(itemIndex, suggestions[highlightedIndex]); } }
        else if (e.key === 'Escape') { setSuggestions([]); setActiveAutocompleteIndex(null); }
    };

    const handleSuggestionSelect = (index: number, product: Product) => {
        const newItems = [...items];
        const discount = product.tpDiscount ?? 15;
        const price = product.price * (1 - discount / 100);
        newItems[index] = { ...newItems[index], productId: product.id, productCode: product.code || '', price: price, cst: product.cst || 0, discountPercentage: selectedCustomer?.salePercent || newItems[index].discountPercentage || 0 };
        setItems(newItems);
        setSuggestions([]); setActiveAutocompleteIndex(null); setHighlightedIndex(-1);
    };

    const addItem = () => setItems([...items, { productId: '', productCode: '', quantity: 1, price: 0, cst: 0, discountPercentage: selectedCustomer?.salePercent || 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const { grandTotal, invoiceProfit } = useMemo(() => {
        let total = 0, profit = 0;
        for (const item of items) {
            if (!item.productId) continue;
            const product = inventory.find(p => p.id === item.productId); if (!product) continue;
            const subtotal = item.price * (1 - (item.discountPercentage || 0) / 100) * item.quantity;
            const itemCost = (product.costPrice || 0) * item.quantity;
            total += subtotal; profit += subtotal - itemCost;
        }
        return { grandTotal: total, invoiceProfit: profit };
    }, [items, inventory]);

    const handleSubmit = (e: React.FormEvent | KeyboardEvent, shouldPrint: boolean = false) => {
        if (e && 'preventDefault' in e) e.preventDefault();
        setError('');
        const validItems = items.filter(i => i.productId && i.quantity > 0);
        if (!selectedCustomer || !date || validItems.length === 0) { setError('Please select a customer, set a date, and add at least one valid item.'); return; }
        const invoiceItems: SalesInvoiceItem[] = validItems.map(item => {
            const product = inventory.find(p => p.id === item.productId)!;
            const subtotal = item.price * (1 - (item.discountPercentage || 0) / 100) * item.quantity;
            return { productId: item.productId, productName: product.name, quantity: item.quantity, price: item.price, discountPercentage: item.discountPercentage, subtotal };
        });
        const finalGrandTotal = invoiceItems.reduce((total, item) => total + item.subtotal, 0);
        const payment = paymentAmount > 0 ? { amount: paymentAmount, method: paymentMethod } : undefined;

        let savedInvoice: SalesInvoice | undefined;

        if (invoiceToEdit) {
            const updatedInvoice: SalesInvoice = { ...invoiceToEdit, customerId: selectedCustomer.id, customerName: selectedCustomer.name, date, items: invoiceItems, grandTotal: finalGrandTotal, paidAmount: 0, status: 'Unpaid' };
            savedInvoice = onEditInvoice(updatedInvoice, payment);
        } else {
            savedInvoice = onCreateInvoice({ customerId: selectedCustomer.id, customerName: selectedCustomer.name, date, items: invoiceItems, grandTotal: finalGrandTotal }, payment);
        }

        if (savedInvoice && shouldPrint) {
            onPrintInvoice(savedInvoice);
        }

        if (!invoiceToEdit) {
            resetForm();
        } else {
            clearEditing();
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F4') {
                e.preventDefault();
                handleSubmit(e, false);
            } else if (e.key === 'F5') {
                e.preventDefault();
                handleSubmit(e, true);
            } else if (e.key === 'F6') {
                e.preventDefault();
                if (invoiceToEdit) {
                    clearEditing();
                } else {
                    resetForm();
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [items, selectedCustomer, date, paymentAmount, paymentMethod, invoiceToEdit]);

    return (
        <div className="bg-white p-8 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{invoiceToEdit ? `Editing Invoice #${invoiceToEdit.invoiceNumber}` : 'Create New Sales Invoice'}</h2>
            <div className="text-xs text-gray-500 mb-6 flex space-x-4">
                <span><strong>F4:</strong> Save Invoice</span>
                <span><strong>F5:</strong> Save & Print</span>
                <span><strong>F6:</strong> Clear / Reset</span>
            </div>
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-gray-700 px-2">Customer & Date</legend>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer (ID or Name)</label>
                        <div className="relative">
                            <input type="text" value={customerSearch} onChange={handleCustomerSearch} onKeyDown={handleCustomerKeyDown} onBlur={() => setTimeout(() => setCustomerSuggestions([]), 150)} placeholder="Start typing to search..." className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                            {customerSuggestions.length > 0 && (
                                <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                    {customerSuggestions.map((c, index) => <li key={c.id} className={`p-2 hover:bg-blue-100 cursor-pointer text-sm text-gray-800 ${highlightedCustomerIndex === index ? 'bg-blue-200' : ''}`} onMouseDown={() => handleSelectCustomer(c)} onMouseOver={() => setHighlightedCustomerIndex(index)}><span className="font-bold">{c.code}</span> - {c.name}</li>)}
                                </ul>
                            )}
                        </div>
                        {selectedCustomer && (<div className="text-sm text-gray-600 mt-1">Pending Balance: <span className={`font-bold ${customerPendingBalance > 0 ? 'text-red-600' : customerPendingBalance < 0 ? 'text-green-600' : 'text-gray-700'}`}>PKR {customerPendingBalance.toFixed(2)}</span></div>)}
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                </fieldset>
                <fieldset className="border-t pt-4"><legend className="text-lg font-semibold text-gray-700 px-2 -mb-2">Invoice Items</legend>
                    <div className="grid grid-cols-12 gap-x-2 items-center px-2 pb-2 text-xs font-bold text-gray-700 uppercase"><div className="col-span-2">Code</div><div className="col-span-2">Medicine</div><div className="col-span-1 text-right">Qty</div><div className="col-span-1 text-right">Sale T.P</div><div className="col-span-1 text-right">CST (%)</div><div className="col-span-1">Disc (%)</div><div className="col-span-1 text-right">Final Price</div><div className="col-span-2 text-right">Subtotal</div><div className="col-span-1"></div></div>
                    <div className="space-y-2">
                        {items.map((item, index) => {
                            const finalUnitPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
                            const subtotal = finalUnitPrice * item.quantity;
                            return (
                                <div key={index} className="grid grid-cols-12 gap-x-2 items-center p-2 bg-gray-50 rounded-lg text-sm">
                                    <div className="col-span-2 relative">
                                        <input type="text" placeholder="Med Code" value={item.productCode} onChange={e => handleItemChange(index, 'productCode', e.target.value)} onKeyDown={e => handleKeyDown(e, index)} onBlur={() => { setTimeout(() => { const exactMatch = inventory.find(p => p.code?.toLowerCase() === item.productCode.toLowerCase()); if (exactMatch && !item.productId) { handleSuggestionSelect(index, exactMatch); } else { setActiveAutocompleteIndex(null); } }, 150); }} className="w-full p-2 border border-gray-300 rounded-md" />
                                        {activeAutocompleteIndex === index && suggestions.length > 0 && (<ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">{suggestions.map((p, sIndex) => <li key={p.id} onMouseDown={() => handleSuggestionSelect(index, p)} onMouseOver={() => setHighlightedIndex(sIndex)} className={`p-2 hover:bg-blue-100 cursor-pointer text-sm text-gray-800 ${highlightedIndex === sIndex ? 'bg-blue-200' : ''}`}><span className="font-bold">{p.code}</span>: {p.name}</li>)}</ul>)}
                                    </div>
                                    <div className="col-span-2"><select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select Medicine</option>{inventory.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>)}</select></div>
                                    <div className="col-span-1"><input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md text-right" min="1" /></div>
                                    <div className="col-span-1"><input type="number" readOnly value={item.price.toFixed(2)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-200 text-xs text-right text-gray-800" /></div>
                                    <div className="col-span-1"><input type="number" readOnly value={item.cst} className="w-full p-2 border border-gray-300 rounded-md bg-gray-200 text-xs text-right text-gray-800" /></div>
                                    <div className="col-span-1"><input type="number" placeholder="%" value={item.discountPercentage} onChange={e => handleItemChange(index, 'discountPercentage', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md" min="0" max="100" step="any" /></div>
                                    <div className="col-span-1"><input type="number" readOnly value={finalUnitPrice.toFixed(2)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-200 text-xs font-medium text-right text-gray-800" /></div>
                                    <div className="col-span-2 text-right font-semibold text-gray-800">{subtotal.toFixed(2)}</div>
                                    <div className="col-span-1 text-right"><button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">&#10005;</button></div>
                                </div>
                            );
                        })}
                    </div>
                    <button type="button" onClick={addItem} className="mt-4 px-4 py-2 text-sm bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200">+ Add Item</button>
                </fieldset>
                <fieldset className="p-4 bg-gray-50 rounded-lg border">
                    <legend className="text-md font-semibold text-gray-700 px-2">Payment (Optional)</legend>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">Amount Received</label><input type="number" value={paymentAmount || ''} onChange={e => setPaymentAmount(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="0" step="0.01" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label><div className="flex gap-4 mt-2"><label className="flex items-center"><input type="radio" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} className="form-radio h-4 w-4 text-green-600" /><span className="ml-2 text-gray-700 text-sm">Cash</span></label><label className="flex items-center"><input type="radio" value="Bank" checked={paymentMethod === 'Bank'} onChange={() => setPaymentMethod('Bank')} className="form-radio h-4 w-4 text-indigo-600" /><span className="ml-2 text-gray-700 text-sm">Bank</span></label></div></div>
                    </div>
                </fieldset>
                <div className="flex justify-end items-center pt-4 border-t space-x-6">
                    <div className="text-right"><span className="text-md font-semibold text-gray-600">Invoice Profit</span><p className="text-lg font-bold text-green-600">PKR {invoiceProfit.toFixed(2)}</p></div>
                    <div className="text-right"><span className="text-md font-semibold text-gray-600">Grand Total</span><p className="text-xl font-bold text-gray-800">PKR {grandTotal.toFixed(2)}</p></div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-2">
                    {invoiceToEdit && <button type="button" onClick={clearEditing} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300">Cancel Edit</button>}
                    <button type="button" onClick={() => handleSubmit({} as any, true)} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                        Save & Print (F5)
                    </button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">Save Invoice (F4)</button>
                </div>
            </form>
        </div>
    );
}

const StatusBadge: React.FC<{ status: SalesInvoice['status'] }> = ({ status }) => {
    const colors = {
        Paid: 'bg-green-100 text-green-800',
        'Partially Paid': 'bg-yellow-100 text-yellow-800',
        Unpaid: 'bg-red-100 text-red-800',
        Returned: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>{status}</span>;
};

export const RecordSale: React.FC<RecordSaleProps> = ({ inventory, salesInvoices, customers, bankTransactions, onCreateInvoice, onEditInvoice, onAddCustomer, onEditCustomer, onReturnInvoice, appSettings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);

    const filteredInvoices = useMemo(() => {
        return salesInvoices.filter(invoice => invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [salesInvoices, searchTerm]);

    const dailyProfit = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return salesInvoices.filter(inv => inv.date === today).reduce((totalProfit, inv) => {
            const invoiceProfit = inv.items.reduce((itemProfit, item) => {
                const product = inventory.find(p => p.id === item.productId);
                if (!product) return itemProfit;
                const itemCost = (product.costPrice || 0) * item.quantity;
                return itemProfit + (item.subtotal - itemCost);
            }, 0);
            return totalProfit + invoiceProfit;
        }, 0);
    }, [salesInvoices, inventory]);

    const handleEditClick = (invoice: SalesInvoice) => {
        setEditingInvoice(invoice);
        window.scrollTo(0, 0);
    };

    const handleReturnClick = (invoice: SalesInvoice) => {
        if (window.confirm(`Are you sure you want to return Invoice #${invoice.invoiceNumber}? This will add the items back to stock and remove these sales from reports.`)) {
            onReturnInvoice(invoice.id);
        }
    };

    const handlePrintInvoice = async (invoice: SalesInvoice) => {
        try {
            // Check if running in Electron
            if (typeof (window as any).electronAPI !== 'undefined') {
                if (appSettings.receiptPrinterType === 'thermal') {
                    // ── Thermal printer: HTML via Electron ──────────────────
                    // Using HTML allows us to bypass Notepad's default margins,
                    // utilizing the full width of the slip without arbitrary wrapping.
                    const tableRows = invoice.items.map(item => `
                        <tr>
                            <td style="padding: 3px 2px; vertical-align: top; border: 1px solid #000;">${item.productName}</td>
                            <td style="padding: 3px 2px; text-align: right; vertical-align: top; border: 1px solid #000;">${item.price.toFixed(2)}</td>
                            <td style="padding: 3px 2px; text-align: center; vertical-align: top; border: 1px solid #000;">${item.discountPercentage || 0}%</td>
                            <td style="padding: 3px 2px; text-align: right; vertical-align: top; border: 1px solid #000;">${item.quantity}</td>
                            <td style="padding: 3px 2px; text-align: right; vertical-align: top; border: 1px solid #000;">${item.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('');

                    const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
                    const totalDiscountAmount = invoice.items.reduce((sum, item) => sum + (item.price * (item.discountPercentage || 0) / 100) * item.quantity, 0);

                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <title>Receipt ${invoice.invoiceNumber}</title>
                            <style>
                                @page { margin: 0; }
                                body {
                                    font-family: 'Courier New', Courier, monospace;
                                    font-size: 11px; /* Slightly smaller to fit more columns */
                                    margin: 0 auto;
                                    padding: 8px;
                                    color: #000;
                                    width: 100%;
                                    max-width: 260px; /* Constrain width for 58mm/80mm thermal printers */
                                    box-sizing: border-box;
                                }
                                .text-center { text-align: center; }
                                .text-right { text-align: right; }
                                .text-left { text-align: left; }
                                .font-bold { font-weight: bold; }
                                .mb-1 { margin-bottom: 5px; }
                                .mb-2 { margin-bottom: 10px; }
                                .line { border-top: 1px dashed #000; margin: 8px 0; }
                                table { width: 100%; border-collapse: collapse; }
                                .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
                                .items-table th, .items-table td { border: 1px solid #000; padding: 3px 2px; }
                            </style>
                        </head>
                        <body>
                            <div class="text-center font-bold mb-1" style="font-size: 14px;">${appSettings.companyName || 'PharmaFlow IMS'}</div>
                            <div class="text-center mb-2">Sales Receipt</div>
                            <div class="line"></div>
                            <div>Inv #: ${invoice.invoiceNumber}</div>
                            <div>Date : ${invoice.date}${invoice.time ? ' ' + invoice.time : ''}</div>
                            <div>Cust : ${invoice.customerName}</div>
                            <div class="line"></div>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th style="text-align: left;">Item</th>
                                        <th style="text-align: right;">T.Price</th>
                                        <th style="text-align: center;">Disc</th>
                                        <th style="text-align: right;">Qty</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                            <div class="line"></div>
                            <table style="margin-top: 5px;">
                                <tr>
                                    <td>Total Items:</td>
                                    <td class="text-right">${totalItems}</td>
                                </tr>
                                <tr>
                                    <td>Total Discount:</td>
                                    <td class="text-right">PKR ${totalDiscountAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td class="font-bold">Grand Total:</td>
                                    <td class="font-bold text-right">PKR ${invoice.grandTotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Paid:</td>
                                    <td class="text-right">PKR ${invoice.paidAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Balance:</td>
                                    <td class="text-right">PKR ${(invoice.grandTotal - invoice.paidAmount).toFixed(2)}</td>
                                </tr>
                            </table>
                            <div class="line"></div>
                            <div class="text-center mb-2">Thank you!</div>
                            <!-- Extra space for clean tear -->
                            <div style="height: 30px;"></div>
                        </body>
                        </html>
                    `;

                    const result = await (window as any).electronAPI.printPDF(htmlContent, 'thermal', !!appSettings.showPrintPreview);
                    if (!result.success) {
                        alert('Printing failed. Please check your thermal printer connection.');
                    }
                } else {
                    // ── Standard A4/Letter printer: HTML via Electron ────────
                    const tableRows = invoice.items.map((item, index) => {
                        const product = inventory.find(p => p.id === item.productId);
                        return `
                            <tr>
                                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${product?.code || '-'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item.productName}</td>
                                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${item.price.toFixed(2)}</td>
                                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.discountPercentage || 0}%</td>
                                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${item.subtotal.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('');

                    const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
                    const totalDiscountAmount = invoice.items.reduce((sum, item) => sum + (item.price * (item.discountPercentage || 0) / 100) * item.quantity, 0);

                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <title>Invoice ${invoice.invoiceNumber}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { margin-bottom: 20px; }
                                .company-name { font-size: 24px; font-weight: bold; }
                                .invoice-title { font-size: 18px; margin-top: 5px; }
                                .invoice-info { text-align: right; margin-top: -40px; }
                                .customer-info { margin: 20px 0; padding-top: 10px; border-top: 2px solid #000; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th { background-color: #16a085; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
                                td { padding: 8px; border: 1px solid #ddd; }
                                .summary { margin-top: 20px; text-align: right; }
                                .summary-row { margin: 5px 0; }
                                .total { font-weight: bold; font-size: 16px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div class="company-name">${appSettings.companyName || 'PharmaFlow IMS'}</div>
                                <div class="invoice-title">Sales Invoice</div>
                                <div class="invoice-info">
                                    <div>Invoice #: ${invoice.invoiceNumber}</div>
                                    <div>Date: ${invoice.date}</div>
                                    ${invoice.time ? `<div>Time: ${invoice.time}</div>` : ''}
                                </div>
                            </div>
                            <div class="customer-info">
                                <strong>Bill To:</strong><br>
                                ${invoice.customerName}
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 40px; text-align: center;">#</th>
                                        <th style="width: 100px;">Code</th>
                                        <th>Product Name</th>
                                        <th style="width: 60px; text-align: center;">Qty</th>
                                        <th style="width: 80px; text-align: right;">Sale T.P</th>
                                        <th style="width: 70px; text-align: center;">Disc %</th>
                                        <th style="width: 100px; text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                            <div class="summary">
                                <div class="summary-row">Total Items: ${totalItems}</div>
                                <div class="summary-row">Total Discount: PKR ${totalDiscountAmount.toFixed(2)}</div>
                                <div class="summary-row">Grand Total: <strong>PKR ${invoice.grandTotal.toFixed(2)}</strong></div>
                                <div class="summary-row">Amount Paid: PKR ${invoice.paidAmount.toFixed(2)}</div>
                                <div class="summary-row total">Balance Due: PKR ${(invoice.grandTotal - invoice.paidAmount).toFixed(2)}</div>
                            </div>
                        </body>
                        </html>
                    `;

                    const result = await (window as any).electronAPI.printPDF(htmlContent, appSettings.receiptPrinterType, !!appSettings.showPrintPreview);
                    if (!result.success) {
                        alert('Printing failed. Please check your printer connection.');
                    }
                }
            } else {
                // Fallback for web browser (development mode) - use jsPDF
                const doc = new jsPDF();
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text("PharmaFlow IMS", 14, 22);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'normal');
                doc.text("Sales Invoice", 14, 30);
                doc.setFontSize(10);
                doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 22);
                doc.text(`Date: ${invoice.date}`, 140, 28);
                if (invoice.time) {
                    doc.text(`Time: ${invoice.time}`, 140, 33);
                }
                doc.line(14, 40, 196, 40);
                doc.setFont('helvetica', 'bold');
                doc.text("Bill To:", 14, 48);
                doc.setFont('helvetica', 'normal');
                doc.text(invoice.customerName, 14, 54);

                const tableColumn = ["#", "Code", "Product Name", "Qty", "Sale T.P", "Disc %", "Total"];
                const tableRows = invoice.items.map((item, index) => {
                    const product = inventory.find(p => p.id === item.productId);
                    return [
                        index + 1,
                        product?.code || '-',
                        item.productName,
                        item.quantity,
                        item.price.toFixed(2),
                        item.discountPercentage || 0,
                        item.subtotal.toFixed(2)
                    ];
                });

                autoTable(doc, {
                    startY: invoice.time ? 65 : 60,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'grid' as any,
                    styles: { textColor: [0, 0, 0], fontSize: 9, cellPadding: 2 },
                    headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: 10 },
                        1: { cellWidth: 25 },
                        3: { halign: 'center' },
                        4: { halign: 'right' },
                        5: { halign: 'center' },
                        6: { halign: 'right' }
                    }
                });

                const finalY = (doc as any).lastAutoTable?.finalY || 80;
                
                const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
                const totalDiscountAmount = invoice.items.reduce((sum, item) => sum + (item.price * (item.discountPercentage || 0) / 100) * item.quantity, 0);

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                
                doc.text(`Total Items:`, 140, finalY + 10, { align: 'right' });
                doc.text(`${totalItems}`, 196, finalY + 10, { align: 'right' });

                doc.text(`Total Discount:`, 140, finalY + 16, { align: 'right' });
                doc.text(`PKR ${totalDiscountAmount.toFixed(2)}`, 196, finalY + 16, { align: 'right' });

                doc.text(`Grand Total:`, 140, finalY + 22, { align: 'right' });
                doc.text(`PKR ${invoice.grandTotal.toFixed(2)}`, 196, finalY + 22, { align: 'right' });
                
                doc.text(`Amount Paid:`, 140, finalY + 28, { align: 'right' });
                doc.text(`PKR ${invoice.paidAmount.toFixed(2)}`, 196, finalY + 28, { align: 'right' });
                
                doc.setFont('helvetica', 'bold');
                doc.text(`Balance Due:`, 140, finalY + 34, { align: 'right' });
                doc.text(`PKR ${(invoice.grandTotal - invoice.paidAmount).toFixed(2)}`, 196, finalY + 34, { align: 'right' });

                window.open(doc.output('bloburl'), '_blank');
            }

        } catch (err) {
            console.error("Error generating invoice", err);
            alert("An error occurred while preparing the invoice for printing.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-gray-800">Sales Invoices</h1><button onClick={() => setShowCustomerModal(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 text-sm">Manage Customers</button></div>
            {showCustomerModal && <ManageCustomersModal customers={customers} onAddCustomer={onAddCustomer} onEditCustomer={onEditCustomer} onClose={() => setShowCustomerModal(false)} />}

            <NewSalesInvoice
                inventory={inventory}
                customers={customers}
                salesInvoices={salesInvoices}
                bankTransactions={bankTransactions}
                onCreateInvoice={onCreateInvoice}
                onEditInvoice={onEditInvoice}
                invoiceToEdit={editingInvoice}
                clearEditing={() => setEditingInvoice(null)}
                onPrintInvoice={handlePrintInvoice}
            />

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-start mb-4">
                    <div><h2 className="text-xl font-bold text-gray-800">Past Sales Invoices</h2><input type="text" placeholder="Search by Invoice # or Customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-xs p-2 border border-gray-300 rounded-md mt-2" /></div>
                    <div className="text-right bg-green-50 p-4 rounded-lg"><p className="text-sm font-semibold text-green-800">Total Profit for Today</p><p className="text-2xl font-bold text-green-700">PKR {dailyProfit.toFixed(2)}</p></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Inv #</th><th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th><th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Customer</th><th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th><th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total</th><th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase">Paid</th><th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase">Due</th><th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.date}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customerName}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700"><StatusBadge status={invoice.status} /></td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">{invoice.grandTotal.toFixed(2)}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-600">{invoice.paidAmount.toFixed(2)}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">{(invoice.grandTotal - invoice.paidAmount).toFixed(2)}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm flex items-center">
                                        {invoice.status !== 'Returned' && (
                                            <>
                                                <button onClick={() => handleEditClick(invoice)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                                <button onClick={() => handleReturnClick(invoice)} className="ml-4 text-red-600 hover:text-red-800 font-medium">Return</button>
                                            </>
                                        )}
                                        <button onClick={() => handlePrintInvoice(invoice)} className="ml-4 text-green-600 hover:text-green-800 font-medium flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                                            Print
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
