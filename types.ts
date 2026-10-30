
import React from 'react';

export interface Product {
  id: string;
  code?: string;
  name: string;
  quantity: number;
  price: number; // This is Selling/Retail Price
  costPrice?: number; // This is the purchase cost for the business
  cst?: number;
  supplier?: string;
  tpDiscount?: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  salePercent: number;
  openingBalance?: number;
}

export interface SaleRecord {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  region: string;
  area: string;
  productId: string;
  productName: string;
  quantity: number;
  date: string; // YYYY-MM-DD
  totalPrice: number;
  discountPercentage?: number;
}

export interface StockUpdateRecord {
  id: string;
  productId: string;
  productName: string;
  quantityAdded: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface FullStockRecordItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
}

export interface FullStockRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM AM/PM
  items: FullStockRecordItem[];
  totalCost: number;
  totalValue: number;
}

export interface BankTransaction {
  id: string;
  type: 'payment' | 'receipt';
  date: string; // YYYY-MM-DD
  party: string;
  description: string;
  amount: number;
  paymentMethod: 'Bank' | 'Cash';
  invoiceId?: string;
}

export interface SalesInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price per unit
  discountPercentage?: number;
  subtotal: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM AM/PM
  items: SalesInvoiceItem[];
  grandTotal: number;
  paidAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Returned';
}

export interface PurchaseInvoiceItem {
  productId: string;
  isNew?: boolean;
  productCode?: string;
  productName: string;
  quantity: number;
  retailPrice: number;
  tpDiscount: number;
  cst: number;
  costPrice: number;
  subtotal: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string; // YYYY-MM-DD
  items: PurchaseInvoiceItem[];
  grandTotal: number;
}

export interface AppSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly';
  lastBackupDate: string | null;
  adminPassword?: string;
  receiptPrinterType?: 'standard' | 'thermal';
  showPrintPreview?: boolean;
  companyName?: string;
}

export type View = 'dashboard' | 'recordsale' | 'inventory' | 'reports' | 'cash_bank' | 'settings';

export type QuickAccessItemId =
  | 'dashboard'
  | 'recordsale'
  | 'inventory'
  | 'cash_bank'
  | 'reports'
  | 'action_add_medicine'
  | 'action_record_transaction'
  | 'report_customer_ledger'
  | 'report_stock'
  | 'report_bank'
  | 'report_sales_invoices'
  | 'report_purchase_invoices'
  | 'report_stock_updates'
  | 'report_customer_monthly'
  | 'report_area_monthly'
  | 'report_region'
  | 'report_individual_customer'
  | 'report_individual_customer_ledger'
  | 'report_individual_medicine'
  | 'report_profit_daily'
  | 'report_profit_monthly'
  | 'report_profit_yearly'
  | 'report_sales_daily';

export interface QuickAccessOption {
  id: QuickAccessItemId;
  label: string;
  icon: React.ReactNode;
  view: View;
  category: 'General' | 'Actions' | 'Reports';
  initialState?: any;
}