import React, { useState, useMemo, useEffect } from 'react';
import { Product, PurchaseInvoice, PurchaseInvoiceItem, FullStockRecord } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ManageInventoryProps {
  inventory: Product[];
  purchaseInvoices: PurchaseInvoice[];
  suppliers: string[];
  fullStockRecords: FullStockRecord[];
  setFullStockRecords: (records: FullStockRecord[]) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onUpdateStock: (productId: string, quantityAdded: number, notes?: string) => void;
  onCreatePurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id' | 'invoiceNumber'>) => void;
  onEditPurchaseInvoice?: (invoice: PurchaseInvoice) => void;
  onAddSupplier: (supplierName: string) => void;
  initialViewState?: any;
}

const AddOrEditProductModal: React.FC<{
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onEditProduct: (product: Product) => void;
    productToEdit: Product | null;
    suppliers: string[];
    onClose: () => void;
}> = ({ onAddProduct, onEditProduct, productToEdit, suppliers, onClose }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [price, setPrice] = useState(0);
    const [tpDiscount, setTpDiscount] = useState(15);
    const [cst, setCst] = useState(0);
    const [supplier, setSupplier] = useState(suppliers[0] || '');
    const [error, setError] = useState('');

    const isEditMode = !!productToEdit;

    useEffect(() => {
        if (isEditMode) {
            setName(productToEdit.name);
            setCode(productToEdit.code || '');
            setQuantity(productToEdit.quantity);
            setPrice(productToEdit.price);
            setCst(productToEdit.cst || 0);
            setSupplier(productToEdit.supplier || '');
            setTpDiscount(productToEdit.tpDiscount ?? 15);
        } else {
            setSupplier(suppliers[0] || '');
            setTpDiscount(15);
        }
    }, [productToEdit, isEditMode, suppliers]);

    const tradePrice = useMemo(() => price * (1 - tpDiscount / 100), [price, tpDiscount]);
    const finalCost = useMemo(() => tradePrice * (1 - cst / 100), [tradePrice, cst]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || price <= 0) {
            setError('Medicine name and a valid retail price are required.');
            return;
        }

        if (isEditMode) {
            onEditProduct({ ...productToEdit, name, code, quantity, price, costPrice: finalCost, cst, supplier, tpDiscount });
        } else {
            onAddProduct({ name, code, quantity, price, costPrice: finalCost, cst, supplier, tpDiscount });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Code (Optional)</label>
                             <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g., PNDL500" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{isEditMode ? 'Current Quantity' : 'Initial Quantity'}</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Retail Price (MRP)</label>
                            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="0.01" step="0.01" required />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-md font-semibold text-gray-600 mb-2">Cost Calculation</h4>
                        <div className="grid grid-cols-4 gap-3 items-end">
                             <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700">T.P Disc (%)</label>
                                <input type="number" value={tpDiscount} onChange={e => setTpDiscount(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm" min="0" max="100" step="any"/>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700">Sale T.P</label>
                                <input type="text" value={tradePrice.toFixed(2)} readOnly className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-200 text-sm" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700">CST (%)</label>
                                <input type="number" value={cst} onChange={e => setCst(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm" min="0" max="100" step="any"/>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700">Final Cost</label>
                                <input type="text" value={finalCost.toFixed(2)} readOnly className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-200 text-sm font-bold" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <select value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEditMode ? 'Update Medicine' : 'Add Medicine'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageSuppliersModal: React.FC<{
    suppliers: string[];
    onAddSupplier: (name: string) => void;
    onClose: () => void;
}> = ({ suppliers, onAddSupplier, onClose }) => {
    const [newSupplier, setNewSupplier] = useState('');
    
    const handleAdd = () => {
        if (newSupplier.trim()) {
            onAddSupplier(newSupplier.trim());
            setNewSupplier('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Suppliers</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Add New Supplier</label>
                    <div className="flex gap-2 mt-1">
                        <input
                            type="text"
                            value={newSupplier}
                            onChange={(e) => setNewSupplier(e.target.value)}
                            placeholder="e.g., Global Pharma"
                            className="flex-grow p-2 border border-gray-300 rounded-md"
                        />
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Add</button>
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Existing Suppliers</h4>
                    <ul className="h-48 overflow-y-auto space-y-1 text-sm list-disc list-inside">
                        {suppliers.map(s => <li key={s}>{s}</li>)}
                    </ul>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
};

const CreatePurchaseInvoice: React.FC<{
    inventory: Product[];
    suppliers: string[];
    onCreatePurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id' | 'invoiceNumber'>) => void;
    onEditPurchaseInvoice?: (invoice: PurchaseInvoice) => void;
    invoiceToEdit?: PurchaseInvoice | null;
    isViewMode?: boolean;
    onClose: () => void;
}> = ({ inventory, suppliers, onCreatePurchaseInvoice, onEditPurchaseInvoice, invoiceToEdit, isViewMode, onClose }) => {
    const isEditMode = !!invoiceToEdit && !isViewMode;
    const [supplier, setSupplier] = useState(invoiceToEdit ? invoiceToEdit.supplier : suppliers[0] || '');
    const [date, setDate] = useState(invoiceToEdit ? invoiceToEdit.date : new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<Omit<PurchaseInvoiceItem, 'subtotal' | 'productName'>[]>(() => {
        if (invoiceToEdit) {
            return invoiceToEdit.items.map(i => ({
                productId: i.productId,
                productCode: (i as any).productCode,
                isNew: (i as any).isNew,
                productName: i.productName, // preloading if edit mode
                quantity: i.quantity,
                retailPrice: i.retailPrice,
                tpDiscount: i.tpDiscount,
                cst: i.cst,
                costPrice: i.costPrice
            }));
        }
        return [{ productId: '', quantity: 1, retailPrice: 0, tpDiscount: 15, cst: 0, costPrice: 0 }];
    });
    const [error, setError] = useState('');

    const handleProductSelect = (index: number, productId: string) => {
        const product = inventory.find(p => p.id === productId);
        if (product) {
            setItems(prev => prev.map((item, i) => i === index ? {
                ...item,
                productId,
                retailPrice: product.price,
                tpDiscount: product.tpDiscount || 0,
                cst: product.cst || 0,
                costPrice: product.costPrice || 0
            } : item));
        } else {
             setItems(prev => prev.map((item, i) => i === index ? { ...item, productId: '' } : item));
        }
    };

    const handleItemChange = (index: number, field: keyof typeof items[0] | 'productName' | 'productCode', value: string | number) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value } as any; 
            
            const rPrice = newItems[index].retailPrice || 0;
            const tpD = newItems[index].tpDiscount || 0;
            const cstVal = newItems[index].cst || 0;
            const tradePrice = rPrice * (1 - (tpD / 100));
            const finalCost = tradePrice * (1 - (cstVal / 100));
            newItems[index].costPrice = finalCost;
            return newItems;
        });
    };

    const addExistingItem = () => {
        setItems([...items, { productId: '', quantity: 1, retailPrice: 0, tpDiscount: 15, cst: 0, costPrice: 0 }]);
    };
    
    const addNewMedicineItem = () => {
        setItems([...items, { productId: '', isNew: true, productCode: '', productName: '', quantity: 1, retailPrice: 0, tpDiscount: 15, cst: 0, costPrice: 0 } as any]);
    };
    
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const grandTotal = useMemo(() => {
        return items.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
    }, [items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!supplier || !date || items.some((i: any) => (!i.productId && !i.isNew) || (i.isNew && !i.productName) || i.quantity <= 0)) {
            setError('Please fill all invoice details and ensure all items have valid quantities and names.');
            return;
        }

        const invoiceItems: PurchaseInvoiceItem[] = items.map((item: any) => ({
            ...item,
            productName: item.isNew ? item.productName : (inventory.find(p => p.id === item.productId)?.name || item.productName),
            subtotal: item.costPrice * item.quantity,
        }));

        if (isEditMode && invoiceToEdit && onEditPurchaseInvoice) {
             onEditPurchaseInvoice({
                 ...invoiceToEdit,
                 supplier,
                 date,
                 items: invoiceItems,
                 grandTotal
             });
        } else {
             onCreatePurchaseInvoice({ supplier, date, items: invoiceItems, grandTotal });
        }
        
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{isViewMode ? `View Purchase Invoice #${invoiceToEdit?.invoiceNumber}` : (isEditMode ? `Edit Purchase Invoice #${invoiceToEdit?.invoiceNumber}` : 'Create Purchase Invoice')}</h2>
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Supplier</label>
                            <select value={supplier} onChange={e => setSupplier(e.target.value)} disabled={isViewMode} className="mt-1 block w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100">
                                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isViewMode} className="mt-1 block w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-12 gap-x-2 items-center pb-2 text-xs font-bold text-gray-700 uppercase border-b mb-2">
                        <div className="col-span-3">Medicine</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2">Ret. Price</div>
                        <div className="col-span-1">TPDisc(%)</div>
                        <div className="col-span-1">CST(%)</div>
                        <div className="col-span-2">Final Cost</div>
                        <div className="col-span-1 text-right">Subtotal</div>
                        <div className="col-span-1"></div>
                    </div>
                     <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                        {items.map((item: any, index) => (
                             <div key={index} className="grid grid-cols-12 gap-x-2 items-center bg-gray-50 p-2 rounded-md border">
                                 <div className="col-span-3">
                                    {item.isNew ? (
                                        <div className="flex gap-1">
                                            <input type="text" placeholder="Code" value={item.productCode || ''} onChange={e => handleItemChange(index, 'productCode', e.target.value)} disabled={isViewMode} className="w-1/3 p-2 border border-blue-300 bg-blue-50 rounded-md text-xs font-semibold disabled:bg-gray-200" />
                                            <input type="text" placeholder="New Med Name" value={item.productName || ''} onChange={e => handleItemChange(index, 'productName', e.target.value)} disabled={isViewMode} className="w-2/3 p-2 border border-blue-300 bg-blue-50 rounded-md text-xs font-semibold disabled:bg-gray-200" required />
                                        </div>
                                    ) : (
                                        <select value={item.productId} onChange={e => handleProductSelect(index, e.target.value)} disabled={isViewMode} className="w-full p-2 border border-gray-300 rounded-md text-xs font-semibold disabled:bg-gray-100">
                                            <option value="">Select Medicine</option>
                                            {inventory.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ''}{p.name}</option>)}
                                        </select>
                                    )}
                                 </div>
                                 <div className="col-span-1">
                                     <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} disabled={isViewMode} className="w-full p-2 border border-gray-300 rounded-md text-sm text-center font-bold disabled:bg-gray-100" min="1"/>
                                 </div>
                                 <div className="col-span-2">
                                     <input type="number" placeholder="Retail Pkr" value={item.retailPrice} onChange={e => handleItemChange(index, 'retailPrice', Number(e.target.value))} disabled={isViewMode} className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100" min="0" step="any"/>
                                 </div>
                                 <div className="col-span-1">
                                     <input type="number" placeholder="TP%" value={item.tpDiscount} onChange={e => handleItemChange(index, 'tpDiscount', Number(e.target.value))} disabled={isViewMode} className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100" min="0" max="100" step="any"/>
                                 </div>
                                 <div className="col-span-1">
                                      <input type="number" placeholder="CST%" value={item.cst} onChange={e => handleItemChange(index, 'cst', Number(e.target.value))} disabled={isViewMode} className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100" min="0" max="100" step="any"/>
                                 </div>
                                  <div className="col-span-2">
                                      <input type="text" readOnly value={item.costPrice.toFixed(2)} className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-200 font-bold" />
                                 </div>
                                 <div className="col-span-1 text-right font-medium text-gray-700 text-sm">
                                     {(item.quantity * item.costPrice).toFixed(0)}
                                 </div>
                                 <div className="col-span-1 text-right">
                                     {!isViewMode && <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1 text-xs">&#10005;</button>}
                                 </div>
                             </div>
                        ))}
                    </div>
                    
                    {!isViewMode && (
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={addExistingItem} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200">+ Add Existing Item</button>
                            <button type="button" onClick={addNewMedicineItem} className="px-3 py-1 text-xs bg-green-100 text-green-700 font-semibold rounded-md hover:bg-green-200">+ Add Brand New Medicine</button>
                        </div>
                    )}

                    <div className="text-right text-lg font-bold text-gray-800 pt-2 border-t mt-4">
                        Total: PKR {grandTotal.toFixed(2)}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

                    <div className="flex justify-end pt-4 space-x-2 mt-2">
                        {isViewMode ? (
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                        ) : (
                            <>
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">{isEditMode ? 'Update Purchase' : 'Save Purchase'}</button>
                            </>
                        )}
                    </div>
                 </form>
            </div>
        </div>
    );
}

export const ManageInventory: React.FC<ManageInventoryProps> = ({ inventory, purchaseInvoices, suppliers, fullStockRecords, setFullStockRecords, onAddProduct, onEditProduct, onUpdateStock, onCreatePurchaseInvoice, onEditPurchaseInvoice, onAddSupplier, initialViewState }) => {
    const [activeTab, setActiveTab] = useState<'stock' | 'purchases' | 'snapshots'>('stock');
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [invoiceToEdit, setInvoiceToEdit] = useState<PurchaseInvoice | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    useEffect(() => {
        if (initialViewState?.action === 'open_add_product_modal') {
            setShowProductModal(true);
        }
    }, [initialViewState]);

    const handleEditProductClick = (product: Product) => {
        setEditingProduct(product);
        setShowProductModal(true);
    };

    const handleCloseProductModal = () => {
        setEditingProduct(null);
        setShowProductModal(false);
    };

    const handleCreateSnapshot = () => {
        if (!window.confirm("Save a permanent record of the current full stock?")) return;
        
        const items = inventory.map(p => ({
            productId: p.id,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
            costPrice: p.costPrice || 0
        }));

        const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        const newRecord: FullStockRecord = {
            id: `snapshot_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            items,
            totalCost,
            totalValue
        };

        setFullStockRecords([newRecord, ...fullStockRecords]);
    };

    const handlePrintSnapshot = async (record: FullStockRecord) => {
        try {
            if (typeof (window as any).electronAPI !== 'undefined') {
                const tableRows = record.items.map((item, index) => `
                    <tr>
                        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${item.costPrice.toFixed(2)}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${item.price.toFixed(2)}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${(item.quantity * item.costPrice).toFixed(2)}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                `).join('');

                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Full Stock Record - ${record.date}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                            h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
                            p { text-align: center; margin-top: 0; color: #555; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { background-color: #16a085; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
                            td { padding: 6px; border: 1px solid #ddd; }
                            .summary { margin-top: 20px; font-size: 14px; text-align: right; padding-right: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1>PharmaFlow - Full Stock Record</h1>
                        <p>Generated on: ${record.date} at ${record.time || ''}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 30px; text-align: center;">#</th>
                                    <th>Product Name</th>
                                    <th style="width: 50px; text-align: center;">Qty</th>
                                    <th style="width: 60px; text-align: right;">Unit Cost</th>
                                    <th style="width: 60px; text-align: right;">Ret. Price</th>
                                    <th style="width: 80px; text-align: right;">Total Cost</th>
                                    <th style="width: 80px; text-align: right;">Total Retail</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                        <div class="summary">
                            <div><strong>Total Items:</strong> ${record.items.length}</div>
                            <div><strong>Grand Total Cost:</strong> PKR ${record.totalCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                            <div><strong>Grand Total Retail:</strong> PKR ${record.totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                        </div>
                    </body>
                    </html>
                `;
                const result = await (window as any).electronAPI.printPDF(htmlContent);
                if (!result.success) alert('Printing failed. Check printer connection.');
            } else {
                const doc = new jsPDF();
                doc.setFontSize(16); doc.text("PharmaFlow - Full Stock Record", 14, 20);
                doc.setFontSize(10); doc.text(`Date: ${record.date} ${record.time ? record.time : ''}`, 14, 28);
                const cols = ["#", "Product", "Qty", "Cost", "Retail", "Total Cost", "Total Retail"];
                const rows = record.items.map((item, i) => [
                    i + 1, item.name, item.quantity, item.costPrice.toFixed(2), item.price.toFixed(2), (item.quantity * item.costPrice).toFixed(2), (item.quantity * item.price).toFixed(2)
                ]);
                autoTable(doc, {
                    startY: 35, head: [cols], body: rows, styles: { fontSize: 8 },
                    headStyles: { fillColor: [22, 160, 133] },
                });
                const finalY = (doc as any).lastAutoTable?.finalY || 80;
                doc.setFontSize(10);
                doc.text(`Total Items: ${record.items.length}`, 14, finalY + 10);
                doc.text(`Grand Total Cost: PKR ${record.totalCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, 196, finalY + 10, { align: 'right' });
                doc.text(`Grand Total Retail: PKR ${record.totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, 196, finalY + 16, { align: 'right' });
                window.open(doc.output('bloburl'), '_blank');
            }
        } catch(e) {
            console.error(e);
            alert("Error printing stock record.");
        }
    };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Purchases & Stock</h1>
        </div>
        
        <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-4" aria-label="Tabs">
                <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'stock' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-700'}`}>
                    Current Stock
                </button>
                <button onClick={() => setActiveTab('purchases')} className={`px-4 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'purchases' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-700'}`}>
                    Purchase Invoices
                </button>
                <button onClick={() => setActiveTab('snapshots')} className={`px-4 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'snapshots' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-700'}`}>
                    Stock Records
                </button>
            </nav>
        </div>

        {showPurchaseForm && <CreatePurchaseInvoice inventory={inventory} suppliers={suppliers} onCreatePurchaseInvoice={onCreatePurchaseInvoice} onEditPurchaseInvoice={onEditPurchaseInvoice} invoiceToEdit={invoiceToEdit} isViewMode={isViewMode} onClose={() => { setShowPurchaseForm(false); setInvoiceToEdit(null); setIsViewMode(false); }} />}
        {showProductModal && <AddOrEditProductModal onAddProduct={onAddProduct} onEditProduct={onEditProduct} productToEdit={editingProduct} suppliers={suppliers} onClose={handleCloseProductModal} />}
        {showSupplierModal && <ManageSuppliersModal suppliers={suppliers} onAddSupplier={onAddSupplier} onClose={() => setShowSupplierModal(false)} />}
        
        {activeTab === 'stock' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 flex justify-end">
                     {/* Creation moved exclusively to Purchase Invoices flow */}
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Medicine Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Quantity in Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Selling Price (PKR)</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Stock Value (at cost)</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{product.code || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">PKR {product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">PKR {(product.quantity * (product.costPrice || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleEditProductClick(product)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        )}

        {activeTab === 'purchases' && (
             <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Purchase Invoice History</h2>
                    <div className="flex gap-2">
                         <button onClick={() => setShowSupplierModal(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 text-sm">
                            Manage Suppliers
                        </button>
                        <button onClick={() => setShowPurchaseForm(true)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 text-sm">
                            + New Purchase Invoice
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Invoice #</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Supplier</th>
                          <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total (PKR)</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseInvoices.map(invoice => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{invoice.date}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{invoice.supplier}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-gray-800">{invoice.grandTotal.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                <button onClick={() => { setInvoiceToEdit(invoice); setIsViewMode(true); setShowPurchaseForm(true); }} className="text-indigo-600 hover:text-indigo-800 font-semibold px-2">View</button>
                                <button onClick={() => { setInvoiceToEdit(invoice); setIsViewMode(false); setShowPurchaseForm(true); }} className="text-blue-600 hover:text-blue-800 font-semibold px-2">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            </div>
        )}
        {activeTab === 'snapshots' && (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Saved Stock Records</h2>
                    <button onClick={handleCreateSnapshot} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 text-sm">
                        + Save Current Stock Record
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Time</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Total Items</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total Cost Value</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total Retail Value</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fullStockRecords.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4 text-gray-500">No stock records saved yet.</td></tr>
                        ) : fullStockRecords.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{record.time || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-800 font-semibold">{record.items.length} unique</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">{record.totalCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">{record.totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                <button onClick={() => handlePrintSnapshot(record)} className="text-blue-600 hover:text-blue-800 font-medium">Print Report</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};
