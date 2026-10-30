import { Product, SaleRecord, BankTransaction, SalesInvoice, PurchaseInvoice, Customer, QuickAccessItemId } from './types';

// Empty arrays for production - fresh installations start with no data
export const DUMMY_PRODUCTS: Product[] = [];

export const DUMMY_SALES: SaleRecord[] = [];

export const DUMMY_SALES_INVOICES: SalesInvoice[] = [];

export const DUMMY_PURCHASE_INVOICES: PurchaseInvoice[] = [];

export const DUMMY_BANK_TRANSACTIONS: BankTransaction[] = [];

export const REGIONS = ['Punjab', 'Sindh', 'KPK', 'Balochistan'];
export const AREAS = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta'];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: string[] = [];

export const DEFAULT_QUICK_ACCESS_IDS: QuickAccessItemId[] = ['recordsale', 'inventory', 'cash_bank', 'reports'];