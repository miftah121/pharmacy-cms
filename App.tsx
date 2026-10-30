
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RecordSale } from './components/RecordSale';
import { ManageInventory } from './components/ManageInventory';
import { Reports } from './components/Reports';
import { BankTransactions } from './components/BankTransactions';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { SaleRecord, Product, StockUpdateRecord, BankTransaction, SalesInvoice, PurchaseInvoice, Customer, QuickAccessItemId, QuickAccessOption, View, AppSettings, FullStockRecord } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DUMMY_PRODUCTS, DUMMY_SALES, DUMMY_BANK_TRANSACTIONS, DUMMY_SALES_INVOICES, DUMMY_PURCHASE_INVOICES, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, DEFAULT_QUICK_ACCESS_IDS } from './constants';

const quickAccessIconClass = "w-6 h-6";

// Expanded quick access options with categories and initial state for deep linking
const ALL_QUICK_ACCESS_OPTIONS: QuickAccessOption[] = [
    // General
    { id: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, view: 'dashboard', category: 'General' },
    { id: 'recordsale', label: 'Sales Invoices', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, view: 'recordsale', category: 'General' },
    { id: 'inventory', label: 'Purchases & Stock', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>, view: 'inventory', category: 'General' },
    { id: 'cash_bank', label: 'Cash & Bank', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, view: 'cash_bank', category: 'General' },
    { id: 'reports', label: 'All Reports', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, view: 'reports', category: 'General' },

    // Actions
    { id: 'action_add_medicine', label: 'Add New Medicine', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, view: 'inventory', initialState: { action: 'open_add_product_modal' }, category: 'Actions' },
    { id: 'action_record_transaction', label: 'Record Transaction', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, view: 'cash_bank', initialState: { action: 'open_add_transaction_modal' }, category: 'Actions' },

    // Reports
    { id: 'report_customer_ledger', label: 'Customer Ledger Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.002 3.002 0 013.39-2.43 3.002 3.002 0 013.39 2.43m-6.78 0a3.002 3.002 0 00-3.39-2.43 3.002 3.002 0 00-3.39 2.43m6.78 0a3.002 3.002 0 01-3.39 2.43m6.78 0a3.002 3.002 0 01-3.39-2.43m-3.39 0a3.002 3.002 0 01-3.39-2.43m3.39 0a3.002 3.002 0 013.39 2.43" /></svg>, view: 'reports', initialState: { reportType: 'customer_ledger' }, category: 'Reports' },
    { id: 'report_stock', label: 'Current Stock Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>, view: 'reports', initialState: { reportType: 'stock' }, category: 'Reports' },
    { id: 'report_bank', label: 'Bank Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, view: 'reports', initialState: { reportType: 'bank_report' }, category: 'Reports' },
    { id: 'report_sales_invoices', label: 'Sales Invoices List', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>, view: 'reports', initialState: { reportType: 'sales_invoices' }, category: 'Reports' },
    { id: 'report_purchase_invoices', label: 'Purchase Invoices List', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, view: 'reports', initialState: { reportType: 'purchase_invoices' }, category: 'Reports' },
    { id: 'report_stock_updates', label: 'Stock Update History', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M7 9l3-3 3 3M4 14v5h5M7 19l3-3 3 3" /></svg>, view: 'reports', initialState: { reportType: 'stock_updates' }, category: 'Reports' },
    { id: 'report_customer_monthly', label: 'Pharmacy Month Wise Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM12 14h.01" /></svg>, view: 'reports', initialState: { reportType: 'customer_monthly' }, category: 'Reports' },
    { id: 'report_area_monthly', label: 'City/Area Month Wise Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, view: 'reports', initialState: { reportType: 'area_monthly' }, category: 'Reports' },
    { id: 'report_region', label: 'Region Wise Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 10h6" /></svg>, view: 'reports', initialState: { reportType: 'region' }, category: 'Reports' },
    { id: 'report_individual_customer', label: 'Individual Pharmacy Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, view: 'reports', initialState: { reportType: 'individual_customer' }, category: 'Reports' },
    { id: 'report_individual_customer_ledger', label: 'Individual Customer Statement', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, view: 'reports', initialState: { reportType: 'individual_customer_ledger' }, category: 'Reports' },
    { id: 'report_individual_medicine', label: 'Individual Medicine Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 009-9h-9v9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3a9 9 0 00-9 9h9V3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9v-9h9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 019-9v9H3z" /></svg>, view: 'reports', initialState: { reportType: 'individual_medicine' }, category: 'Reports' },
    { id: 'report_sales_daily', label: 'Daily Sales Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, view: 'reports', initialState: { reportType: 'sales_daily' }, category: 'Reports' },
    { id: 'report_profit_daily', label: 'Daily Profit Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, view: 'reports', initialState: { reportType: 'profit_daily' }, category: 'Reports' },
    { id: 'report_profit_monthly', label: 'Monthly Profit Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, view: 'reports', initialState: { reportType: 'profit_monthly' }, category: 'Reports' },
    { id: 'report_profit_yearly', label: 'Yearly Profit Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className={quickAccessIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, view: 'reports', initialState: { reportType: 'profit_yearly' }, category: 'Reports' },
];

const App: React.FC = () => {
    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        try {
            return sessionStorage.getItem('isAuthenticated') === 'true';
        } catch (e) {
            return false;
        }
    });

    const [activeView, setActiveView] = useState<View>('dashboard');
    const [initialViewState, setInitialViewState] = useState<any>(null);

    const [sales, setSales] = useLocalStorage<SaleRecord[]>('salesData', DUMMY_SALES);
    const [inventory, setInventory] = useLocalStorage<Product[]>('inventoryData', DUMMY_PRODUCTS);
    const [stockUpdates, setStockUpdates] = useLocalStorage<StockUpdateRecord[]>('stockUpdatesData', []);
    const [bankTransactions, setBankTransactions] = useLocalStorage<BankTransaction[]>('bankTransactionsData', DUMMY_BANK_TRANSACTIONS);
    const [salesInvoices, setSalesInvoices] = useLocalStorage<SalesInvoice[]>('salesInvoicesData', DUMMY_SALES_INVOICES);
    const [purchaseInvoices, setPurchaseInvoices] = useLocalStorage<PurchaseInvoice[]>('purchaseInvoicesData', DUMMY_PURCHASE_INVOICES);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customersData', INITIAL_CUSTOMERS);
    const [suppliers, setSuppliers] = useLocalStorage<string[]>('suppliersData', INITIAL_SUPPLIERS);
    const [quickAccessIds, setQuickAccessIds] = useLocalStorage<QuickAccessItemId[]>('quickAccessIds', DEFAULT_QUICK_ACCESS_IDS);
    const [fullStockRecords, setFullStockRecords] = useLocalStorage<FullStockRecord[]>('fullStockRecords', []);

    const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('appSettings', {
        autoBackup: false,
        backupFrequency: 'daily',
        lastBackupDate: null,
        adminPassword: 'admin' // Default value for new installs
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    // Version check - clear localStorage if version changes (ensures clean data for new installs)
    useEffect(() => {
        const APP_VERSION = '1.2.0';
        const storedVersion = localStorage.getItem('appVersion');

        if (storedVersion !== APP_VERSION) {
            // Clear all app data except authentication
            const keysToKeep = ['isAuthenticated'];
            const allKeys = Object.keys(localStorage);

            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });

            // Set new version
            localStorage.setItem('appVersion', APP_VERSION);

            // Force reload to reinitialize with empty data
            window.location.reload();
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Authentication Handlers
    const handleLogin = () => {
        setIsAuthenticated(true);
        sessionStorage.setItem('isAuthenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('isAuthenticated');
    };

    const validatePassword = (password: string) => {
        // Use stored password or fallback to default 'admin123' if not set in settings yet
        const currentPassword = appSettings.adminPassword || 'admin123';
        return password === currentPassword;
    };

    const handleNavigate = (view: View, state?: any) => {
        setInitialViewState(state || null);
        setActiveView(view);
    };

    const handleStockUpdate = useCallback((productId: string, quantityAdded: number, notes?: string) => {
        let productName = '';
        setInventory(prevInventory =>
            prevInventory.map(p => {
                if (p.id === productId) {
                    productName = p.name;
                    return { ...p, quantity: p.quantity + quantityAdded };
                }
                return p;
            })
        );

        if (productName) {
            const newStockUpdate: StockUpdateRecord = {
                id: `update_${Date.now()}`,
                productId,
                productName,
                quantityAdded,
                date: new Date().toISOString().split('T')[0],
                notes,
            };
            setStockUpdates(prev => [...prev, newStockUpdate]);
        }
    }, [setInventory, setStockUpdates]);

    const handleCreateSalesInvoice = useCallback((
        invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'>,
        payment?: { amount: number; method: 'Cash' | 'Bank' }
    ) => {
        const paidAmount = payment?.amount || 0;
        const status: SalesInvoice['status'] = paidAmount === 0 ? 'Unpaid' : paidAmount >= invoiceData.grandTotal ? 'Paid' : 'Partially Paid';

        const newInvoice: SalesInvoice = {
            ...invoiceData,
            id: `si_${Date.now()}`,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            paidAmount: paidAmount,
            status: status,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        setSalesInvoices(prev => [newInvoice, ...prev]);

        if (paidAmount > 0 && payment) {
            const newTransaction: BankTransaction = {
                id: `bt_${Date.now()}_${Math.random()}`,
                type: 'receipt',
                date: newInvoice.date,
                party: newInvoice.customerName,
                description: `Payment for Invoice #${newInvoice.invoiceNumber}`,
                amount: paidAmount,
                paymentMethod: payment.method,
                invoiceId: newInvoice.id,
            };
            setBankTransactions(prev => [newTransaction, ...prev]);
        }

        const newSales: SaleRecord[] = [];
        const updatedInventory = [...inventory];

        for (const item of invoiceData.items) {
            const productIndex = updatedInventory.findIndex(p => p.id === item.productId);
            if (productIndex === -1) {
                alert(`Product ${item.productName} not found!`);
                return;
            }
            if (updatedInventory[productIndex].quantity < item.quantity) {
                alert(`Not enough stock for ${item.productName}!`);
                return;
            }

            updatedInventory[productIndex] = {
                ...updatedInventory[productIndex],
                quantity: updatedInventory[productIndex].quantity - item.quantity
            };

            newSales.push({
                id: `sale_${Date.now()}_${item.productId}`,
                invoiceId: newInvoice.id,
                customerId: invoiceData.customerId,
                customerName: invoiceData.customerName,
                region: 'N/A',
                area: 'N/A',
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                date: invoiceData.date,
                totalPrice: item.subtotal,
                discountPercentage: item.discountPercentage || 0,
            });
        }

        setInventory(updatedInventory);
        setSales(prev => [...prev, ...newSales]);

        return newInvoice;

    }, [inventory, setSalesInvoices, setSales, setInventory, setBankTransactions]);

    const handleEditSalesInvoice = useCallback((
        updatedInvoice: SalesInvoice,
        payment?: { amount: number; method: 'Cash' | 'Bank' }
    ) => {
        const originalInvoice = salesInvoices.find(inv => inv.id === updatedInvoice.id);
        if (!originalInvoice) return;

        let tempInventory = [...inventory];
        for (const item of originalInvoice.items) {
            const productIndex = tempInventory.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                tempInventory[productIndex].quantity += item.quantity;
            }
        }

        for (const item of updatedInvoice.items) {
            const productIndex = tempInventory.findIndex(p => p.id === item.productId);
            if (productIndex === -1) {
                alert(`Product ${item.productName} not found!`);
                return;
            }
            if (tempInventory[productIndex].quantity < item.quantity) {
                alert(`Not enough stock for ${item.productName}!`);
                return;
            }
            tempInventory[productIndex].quantity -= item.quantity;
        }

        const otherSalesRecords = sales.filter(s => s.invoiceId !== originalInvoice.id);
        const newSalesRecords: SaleRecord[] = updatedInvoice.items.map(item => ({
            id: `sale_${Date.now()}_${item.productId}`,
            invoiceId: updatedInvoice.id,
            customerId: updatedInvoice.customerId,
            customerName: updatedInvoice.customerName,
            region: 'N/A',
            area: 'N/A',
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            date: updatedInvoice.date,
            totalPrice: item.subtotal,
            discountPercentage: item.discountPercentage || 0,
        }));

        const otherTransactions = bankTransactions.filter(tx => tx.invoiceId !== originalInvoice.id);
        let updatedTransactions = otherTransactions;
        const paidAmount = payment?.amount || 0;

        if (paidAmount > 0 && payment) {
            const newTransaction: BankTransaction = {
                id: `bt_${Date.now()}_${Math.random()}`,
                type: 'receipt',
                date: updatedInvoice.date,
                party: updatedInvoice.customerName,
                description: `Payment for Invoice #${updatedInvoice.invoiceNumber}`,
                amount: paidAmount,
                paymentMethod: payment.method,
                invoiceId: updatedInvoice.id,
            };
            updatedTransactions = [newTransaction, ...updatedTransactions];
        }

        const finalInvoice: SalesInvoice = {
            ...updatedInvoice,
            paidAmount: paidAmount,
            status: paidAmount === 0 ? 'Unpaid' : paidAmount >= updatedInvoice.grandTotal ? 'Paid' : 'Partially Paid'
        };

        setInventory(tempInventory);
        setSales([...otherSalesRecords, ...newSalesRecords]);
        setSalesInvoices(prev => prev.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv));
        setBankTransactions(updatedTransactions);

        return finalInvoice;

    }, [inventory, sales, salesInvoices, bankTransactions, setInventory, setSales, setSalesInvoices, setSalesInvoices, setBankTransactions]);


    const handleAddProduct = useCallback((newProduct: Omit<Product, 'id'>) => {
        const productToAdd = { ...newProduct, id: `prod_${Date.now()}_${Math.random()}` };
        setInventory(prev => [...prev, productToAdd]);

        if (productToAdd.quantity > 0) {
            const newStockUpdate: StockUpdateRecord = {
                id: `update_${Date.now()}`,
                productId: productToAdd.id,
                productName: productToAdd.name,
                quantityAdded: productToAdd.quantity,
                date: new Date().toISOString().split('T')[0],
                notes: 'Initial stock',
            };
            setStockUpdates(prev => [...prev, newStockUpdate]);
        }
    }, [setInventory, setStockUpdates]);

    const handleEditProduct = (updatedProduct: Product) => {
        const originalProduct = inventory.find(p => p.id === updatedProduct.id);
        if (!originalProduct) return;

        setInventory(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        const quantityChange = updatedProduct.quantity - originalProduct.quantity;
        if (quantityChange !== 0) {
            const newStockUpdate: StockUpdateRecord = {
                id: `update_${Date.now()}`,
                productId: updatedProduct.id,
                productName: updatedProduct.name,
                quantityAdded: quantityChange,
                date: new Date().toISOString().split('T')[0],
                notes: `Stock manually edited. Change: ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
            };
            setStockUpdates(prev => [...prev, newStockUpdate]);
        }
    };

    const handleReturnInvoice = useCallback((invoiceId: string) => {
        const invoice = salesInvoices.find(inv => inv.id === invoiceId);
        if (!invoice || invoice.status === 'Returned') return;

        // 1. Update Invoice Status
        setSalesInvoices(prev => prev.map(inv =>
            inv.id === invoiceId ? { ...inv, status: 'Returned' } : inv
        ));

        // 2. Return products to stock and remove sales records
        setInventory(prevInv => {
            const updatedInv = [...prevInv];
            invoice.items.forEach(item => {
                const productIndex = updatedInv.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    updatedInv[productIndex] = {
                        ...updatedInv[productIndex],
                        quantity: updatedInv[productIndex].quantity + item.quantity
                    };

                    // Add stock update record
                    const newStockUpdate: StockUpdateRecord = {
                        id: `return_${Date.now()}_${item.productId}`,
                        productId: item.productId,
                        productName: item.productName,
                        quantityAdded: item.quantity,
                        date: new Date().toISOString().split('T')[0],
                        notes: `Returned from Invoice #${invoice.invoiceNumber}`,
                    };
                    setStockUpdates(prev => [...prev, newStockUpdate]);
                }
            });
            return updatedInv;
        });

        // 3. Remove associated SaleRecord items from sales array for correct reporting
        setSales(prevSales => prevSales.filter(s => s.invoiceId !== invoiceId));

    }, [salesInvoices, setSalesInvoices, setInventory, setSales, setStockUpdates]);

    const handleCreatePurchaseInvoice = useCallback((invoice: Omit<PurchaseInvoice, 'id' | 'invoiceNumber'>) => {
        const newInvoice: PurchaseInvoice = {
            ...invoice,
            id: `pi_${Date.now()}`,
            invoiceNumber: `PI-${Date.now().toString().slice(-6)}`
        };

        const generatedUpdates: StockUpdateRecord[] = [];

        setInventory(prevInv => {
            const updatedInv = [...prevInv];
            
            newInvoice.items.forEach(item => {
                if (item.isNew || !item.productId) {
                    const newProductId = `prod_${Date.now()}_${Math.random()}`;
                    const newProduct: Product = {
                        id: newProductId,
                        name: item.productName,
                        code: item.productCode || '',
                        quantity: item.quantity,
                        price: item.retailPrice,
                        costPrice: item.costPrice,
                        cst: item.cst,
                        tpDiscount: item.tpDiscount,
                        supplier: newInvoice.supplier
                    };
                    updatedInv.push(newProduct);
                    
                    item.productId = newProductId;
                    delete item.isNew;
                    delete item.productCode;

                    generatedUpdates.push({
                        id: `update_${Date.now()}_${Math.random()}`,
                        productId: newProductId,
                        productName: item.productName,
                        quantityAdded: item.quantity,
                        date: new Date().toISOString().split('T')[0],
                        notes: `Added completely new via Purchase Invoice #${newInvoice.invoiceNumber}`,
                    });

                } else {
                    const productIndex = updatedInv.findIndex(p => p.id === item.productId);
                    if (productIndex !== -1) {
                        updatedInv[productIndex] = {
                            ...updatedInv[productIndex],
                            quantity: updatedInv[productIndex].quantity + item.quantity,
                            price: item.retailPrice,
                            tpDiscount: item.tpDiscount,
                            cst: item.cst,
                            costPrice: item.costPrice,
                        };
                        generatedUpdates.push({
                            id: `update_${Date.now()}_${Math.random()}`,
                            productId: item.productId,
                            productName: item.productName,
                            quantityAdded: item.quantity,
                            date: new Date().toISOString().split('T')[0],
                            notes: `Purchase Invoice #${newInvoice.invoiceNumber}`,
                        });
                    }
                }
            });
            return updatedInv;
        });

        setPurchaseInvoices(prev => [newInvoice, ...prev]);
        setStockUpdates(prev => [...prev, ...generatedUpdates]);

    }, [setPurchaseInvoices, setInventory, setStockUpdates]);

    const handleEditPurchaseInvoice = useCallback((updatedInvoice: PurchaseInvoice) => {
        const originalInvoice = purchaseInvoices.find(inv => inv.id === updatedInvoice.id);
        if (!originalInvoice) return;

        let tempInventory = [...inventory];

        // Reverse original quantities safely without modifying prices
        for (const item of originalInvoice.items) {
            const pIdx = tempInventory.findIndex(p => p.id === item.productId);
            if (pIdx !== -1) {
                tempInventory[pIdx] = { ...tempInventory[pIdx], quantity: tempInventory[pIdx].quantity - item.quantity };
            }
        }

        // Apply new properties including inline creating items
        for (const item of updatedInvoice.items) {
            if (item.isNew || !item.productId) {
                const newProductId = `prod_${Date.now()}_${Math.random()}`;
                const newProduct: Product = {
                    id: newProductId,
                    name: item.productName,
                    code: item.productCode || '',
                    quantity: item.quantity,
                    price: item.retailPrice,
                    costPrice: item.costPrice,
                    cst: item.cst,
                    tpDiscount: item.tpDiscount,
                    supplier: updatedInvoice.supplier
                };
                tempInventory.push(newProduct);
                
                item.productId = newProductId;
                delete item.isNew;
                delete item.productCode;
            } else {
                const pIdx = tempInventory.findIndex(p => p.id === item.productId);
                if (pIdx !== -1) {
                    tempInventory[pIdx] = {
                        ...tempInventory[pIdx],
                        quantity: tempInventory[pIdx].quantity + item.quantity,
                        price: item.retailPrice,
                        tpDiscount: item.tpDiscount,
                        cst: item.cst,
                        costPrice: item.costPrice,
                    };
                }
            }
        }

        setInventory(tempInventory);
        setPurchaseInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));

        const editUpdate: StockUpdateRecord = {
            id: `update_${Date.now()}_edit`,
            productId: 'Multiple',
            productName: 'Multiple items',
            quantityAdded: 0,
            date: new Date().toISOString().split('T')[0],
            notes: `Edited Purchase Invoice #${updatedInvoice.invoiceNumber}`,
        };
        setStockUpdates(prev => [...prev, editUpdate]);

    }, [inventory, purchaseInvoices, setInventory, setPurchaseInvoices, setStockUpdates]);

    const handleAddBankTransaction = useCallback((newTransaction: Omit<BankTransaction, 'id'>) => {
        const transactionToAdd: BankTransaction = {
            ...newTransaction,
            id: `bt_${Date.now()}_${Math.random()}`
        };
        setBankTransactions(prev => [transactionToAdd, ...prev]);

        if (transactionToAdd.type === 'receipt' && transactionToAdd.invoiceId) {
            setSalesInvoices(prevInvoices =>
                prevInvoices.map(inv => {
                    if (inv.id === transactionToAdd.invoiceId) {
                        const newPaidAmount = inv.paidAmount + transactionToAdd.amount;
                        const newStatus: SalesInvoice['status'] = newPaidAmount >= inv.grandTotal ? 'Paid' : 'Partially Paid';
                        return { ...inv, paidAmount: newPaidAmount, status: newStatus };
                    }
                    return inv;
                })
            );
        }

    }, [setBankTransactions, setSalesInvoices]);

    const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
        if (customer.name && customer.code && !customers.some(c => c.name === customer.name || c.code === customer.code)) {
            const newCustomer: Customer = {
                ...customer,
                id: `cust_${Date.now()}`
            };
            setCustomers(prev => [...prev, newCustomer]);
        }
    };

    const handleEditCustomer = (updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    };

    const handleAddSupplier = (supplierName: string) => {
        if (supplierName && !suppliers.includes(supplierName)) {
            setSuppliers(prev => [...prev, supplierName]);
        }
    };

    const generateBackupData = () => {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                sales,
                inventory,
                stockUpdates,
                bankTransactions,
                salesInvoices,
                purchaseInvoices,
                customers,
                suppliers,
                quickAccessIds,
                appSettings,
                fullStockRecords
            }
        };
    };

    const handleBackup = async () => {
        const backupData = generateBackupData();
        try {
            const jsonString = JSON.stringify(backupData, null, 2);

            if (typeof CompressionStream !== 'undefined') {
                const stream = new Blob([jsonString], { type: 'application/json' }).stream();
                const compressedReadableStream = stream.pipeThrough(new CompressionStream('gzip'));
                const compressedResponse = new Response(compressedReadableStream);
                const blob = await compressedResponse.blob();

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pharmaflow_backup_${new Date().toISOString().split('T')[0]}.json.gz`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                throw new Error("CompressionStream not supported");
            }

            setAppSettings(prev => ({ ...prev, lastBackupDate: new Date().toISOString() }));
        } catch (error) {
            console.warn("Compression failed or not supported, using plain JSON", error);
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pharmaflow_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setAppSettings(prev => ({ ...prev, lastBackupDate: new Date().toISOString() }));
        }
    };

    const handleRestore = async (file: File): Promise<void> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            const isGzip = uint8Array.length >= 2 && uint8Array[0] === 0x1F && uint8Array[1] === 0x8B;

            let jsonString = '';

            if (isGzip) {
                if (typeof DecompressionStream === 'undefined') {
                    throw new Error("Your browser does not support built-in decompression. Please use a modern browser (Chrome/Edge/Firefox).");
                }

                const stream = new Blob([uint8Array]).stream();
                const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
                const response = new Response(decompressedStream);
                jsonString = await response.text();
            } else {
                jsonString = new TextDecoder("utf-8").decode(uint8Array);
            }

            await new Promise(resolve => setTimeout(resolve, 600));

            let json;
            try {
                json = JSON.parse(jsonString);
            } catch (parseError) {
                throw new Error("The file contains invalid JSON data or is corrupted.");
            }

            if (!json || !json.data) {
                throw new Error("Invalid backup file structure. Missing 'data' field.");
            }

            const { data } = json;

            if (data.sales) setSales(data.sales);
            if (data.inventory) setInventory(data.inventory);
            if (data.stockUpdates) setStockUpdates(data.stockUpdates);
            if (data.bankTransactions) setBankTransactions(data.bankTransactions);
            if (data.salesInvoices) setSalesInvoices(data.salesInvoices);
            if (data.purchaseInvoices) setPurchaseInvoices(data.purchaseInvoices);
            if (data.customers) setCustomers(data.customers);
            if (data.suppliers) setSuppliers(data.suppliers);
            if (data.quickAccessIds) setQuickAccessIds(data.quickAccessIds);
            if (data.appSettings) setAppSettings(data.appSettings);
            if (data.fullStockRecords) setFullStockRecords(data.fullStockRecords);

            return;

        } catch (error) {
            console.error("Restore process failed:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (appSettings.autoBackup) {
            const lastBackup = appSettings.lastBackupDate ? new Date(appSettings.lastBackupDate).getTime() : 0;
            const now = new Date().getTime();
            const oneDay = 24 * 60 * 60 * 1000;
            const oneWeek = 7 * oneDay;
            const interval = appSettings.backupFrequency === 'weekly' ? oneWeek : oneDay;

            if (now - lastBackup > interval) {
                console.log("Auto backup triggered");
                handleBackup();
            }
        }
    }, [appSettings.autoBackup, appSettings.backupFrequency, appSettings.lastBackupDate]);


    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <Dashboard
                        sales={sales}
                        inventory={inventory}
                        onNavigate={handleNavigate}
                        quickAccessIds={quickAccessIds}
                        setQuickAccessIds={setQuickAccessIds}
                        allQuickAccessOptions={ALL_QUICK_ACCESS_OPTIONS}
                    />
                );
            case 'recordsale':
                return (
                    <RecordSale
                        inventory={inventory}
                        salesInvoices={salesInvoices}
                        customers={customers}
                        bankTransactions={bankTransactions}
                        onCreateInvoice={handleCreateSalesInvoice}
                        onEditInvoice={handleEditSalesInvoice}
                        onAddCustomer={handleAddCustomer}
                        onEditCustomer={handleEditCustomer}
                        onReturnInvoice={handleReturnInvoice}
                        appSettings={appSettings}
                    />
                );
            case 'inventory':
                return (
                    <ManageInventory
                        inventory={inventory}
                        purchaseInvoices={purchaseInvoices}
                        suppliers={suppliers}
                        fullStockRecords={fullStockRecords}
                        setFullStockRecords={setFullStockRecords}
                        onAddProduct={handleAddProduct}
                        onEditProduct={handleEditProduct}
                        onUpdateStock={handleStockUpdate}
                        onCreatePurchaseInvoice={handleCreatePurchaseInvoice}
                        onEditPurchaseInvoice={handleEditPurchaseInvoice}
                        onAddSupplier={handleAddSupplier}
                        initialViewState={initialViewState}
                    />
                );
            case 'reports':
                return (
                    <Reports
                        sales={sales}
                        inventory={inventory}
                        stockUpdates={stockUpdates}
                        bankTransactions={bankTransactions}
                        salesInvoices={salesInvoices}
                        purchaseInvoices={purchaseInvoices}
                        customers={customers}
                        initialViewState={initialViewState}
                    />
                );
            case 'cash_bank':
                return (
                    <BankTransactions
                        transactions={bankTransactions}
                        salesInvoices={salesInvoices}
                        customers={customers}
                        onAddTransaction={handleAddBankTransaction}
                        initialViewState={initialViewState}
                    />
                );
            case 'settings':
                return (
                    <Settings
                        appSettings={appSettings}
                        setAppSettings={setAppSettings}
                        onBackup={handleBackup}
                        onRestore={handleRestore}
                    />
                );
            default:
                return (
                    <Dashboard
                        sales={sales}
                        inventory={inventory}
                        onNavigate={handleNavigate}
                        quickAccessIds={quickAccessIds}
                        setQuickAccessIds={setQuickAccessIds}
                        allQuickAccessOptions={ALL_QUICK_ACCESS_OPTIONS}
                    />
                );
        }
    };

    // If not authenticated, show Login screen
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} validatePassword={validatePassword} />;
    }

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
            <Sidebar activeView={activeView} setActiveView={handleNavigate} onLogout={handleLogout} />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="text-sm font-bold text-blue-800">{currentTime.toLocaleTimeString()}</div>
                </div>
                {renderView()}
            </main>
        </div>
    );
};

export default App;