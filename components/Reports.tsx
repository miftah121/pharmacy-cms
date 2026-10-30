import React, { useState, useMemo, useEffect } from 'react';
import { SaleRecord, Product, StockUpdateRecord, BankTransaction, SalesInvoice, PurchaseInvoice, Customer } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ReportType = 'customer_monthly' | 'area_monthly' | 'region' | 'stock' | 'stock_updates' | 'individual_customer' | 'individual_customer_ledger' | 'individual_medicine' | 'bank_report' | 'sales_invoices' | 'purchase_invoices' | 'customer_ledger' | 'sales_daily' | 'profit_daily' | 'profit_monthly' | 'profit_yearly';

interface ReportsProps {
  sales: SaleRecord[];
  inventory: Product[];
  stockUpdates: StockUpdateRecord[];
  bankTransactions: BankTransaction[];
  salesInvoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  customers: Customer[];
  initialViewState?: any;
}

const ReportDataTable: React.FC<{ 
  headers: string[]; 
  data: Record<string, any>[];
  actionLabel?: string;
  onActionClick?: (row: Record<string, any>) => void;
  actionColumnName?: string;
}> = ({ headers, data, actionLabel, onActionClick, actionColumnName = 'Actions' }) => (
  <div className="overflow-x-auto mt-6">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {headers.map(header => <th key={header} className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">{header}</th>)}
          {onActionClick && <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">{actionColumnName}</th>}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, index) => (
          <tr key={index} className="hover:bg-gray-50">
            {headers.map(header => <td key={header} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{row[header]}</td>)}
            {onActionClick && (
              <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                 <button onClick={() => onActionClick(row)} className="text-indigo-600 hover:text-indigo-900 font-semibold px-3 py-1 bg-indigo-50 rounded-md hover:bg-indigo-100">{actionLabel}</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DailyInvoicesViewer: React.FC<{
    date: string;
    invoices: SalesInvoice[];
    inventory: Product[];
    onClose: () => void;
}> = ({ date, invoices, inventory, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center pt-10 pb-10 z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Invoices for {date}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {invoices.length === 0 ? (
                        <p className="text-gray-500 text-center">No invoices found for this date.</p>
                    ) : (
                        invoices.map(inv => {
                            const invoiceCost = inv.items.reduce((acc, item) => {
                                const product = inventory.find(p => p.id === item.productId);
                                return acc + ((product?.costPrice || 0) * item.quantity);
                            }, 0);
                            const invoiceProfit = inv.grandTotal - invoiceCost;

                            return (
                                <div key={inv.id} className="border rounded-lg p-5 shadow-sm bg-gray-50">
                                    <div className="flex justify-between items-start mb-4 border-b pb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-blue-700">Invoice #{inv.invoiceNumber}</h3>
                                            <p className="text-sm text-gray-600 mt-1">Customer: <span className="font-semibold text-gray-800">{inv.customerName}</span> | Status: <span className={`font-semibold ${inv.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>{inv.status}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Sale</p>
                                            <p className="text-lg font-bold text-gray-900 leading-tight border-b border-gray-200 mb-1 pb-1">PKR {inv.grandTotal.toFixed(2)}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit</p>
                                            <p className={`text-lg font-bold leading-tight ${invoiceProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>PKR {invoiceProfit.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                                                <tr>
                                                    <th className="px-3 py-2 rounded-tl-md">Medicine</th>
                                                    <th className="px-3 py-2 text-center">Qty</th>
                                                    <th className="px-3 py-2 text-right">Unit Price</th>
                                                    <th className="px-3 py-2 text-right">Discount</th>
                                                    <th className="px-3 py-2 text-right rounded-tr-md">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white shadow-sm border mt-1 block w-full rounded-b-md" style={{display: 'table-row-group'}}>
                                                {inv.items.map((item, idx) => {
                                                    const discountVal = item.discountPercentage || 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 font-medium text-gray-800">{item.productName}</td>
                                                            <td className="px-4 py-2 text-center font-semibold text-gray-600">{item.quantity}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600">{item.price.toFixed(2)}</td>
                                                            <td className="px-4 py-2 text-right text-gray-500">{discountVal > 0 ? `${discountVal}%` : '-'}</td>
                                                            <td className="px-4 py-2 text-right font-medium text-gray-800">{item.subtotal.toFixed(2)}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                            <tfoot className="bg-gray-100 mt-2 block w-full border-t border-gray-300" style={{display: 'table-footer-group'}}>
                                                 <tr>
                                                     <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-700">Paid Amount:</td>
                                                     <td className="px-4 py-2 text-right font-bold text-green-700">{inv.paidAmount.toFixed(2)}</td>
                                                 </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const TrendArrow: React.FC<{ change: number }> = ({ change }) => {
  const iconClass = "h-5 w-5";
  if (change > 0) {
    return <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-green-500`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>;
  }
  if (change < 0) {
    return <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-red-500`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-7.293l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 10.586V7a1 1 0 11-2 0v3.586L7.707 9.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" /></svg>;
  }
  return <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-gray-500`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 002 0V7a1 1 0 10-2 0v2zm0 4a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" /></svg>;
};

const StatDisplay: React.FC<{ title: string; value: string; change?: number; }> = ({ title, value, change }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="text-sm text-gray-700">{title}</p>
    <div className="flex items-center justify-between mt-1">
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {change !== undefined && (
        <div className={`flex items-center text-sm font-bold ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
          <TrendArrow change={change} />
          <span className="ml-1">{isFinite(change) ? `${change.toFixed(0)}%` : 'N/A'}</span>
        </div>
      )}
    </div>
  </div>
);


export const Reports: React.FC<ReportsProps> = ({ sales, inventory, stockUpdates, bankTransactions, salesInvoices, purchaseInvoices, customers, initialViewState }) => {
  const [reportType, setReportType] = useState<ReportType>('customer_monthly');
  const [selectedIndividual, setSelectedIndividual] = useState('');
  const [selectedDateForInvoices, setSelectedDateForInvoices] = useState<string | null>(null);

  useEffect(() => {
    if (initialViewState?.reportType) {
      setReportType(initialViewState.reportType);
      setSelectedIndividual(''); // Reset selection when deep-linking to a new report type
    }
  }, [initialViewState]);

  const reportData = useMemo(() => {
    switch (reportType) {
      case 'customer_monthly': {
        const data = sales.reduce((acc, sale) => {
          const month = new Date(sale.date).toISOString().slice(0, 7); // YYYY-MM
          const key = `${sale.customerName} - ${month}`;
          if (!acc[key]) acc[key] = { totalSales: 0, totalRevenue: 0 };
          acc[key].totalSales += sale.quantity;
          acc[key].totalRevenue += sale.totalPrice;
          return acc;
        }, {} as Record<string, { totalSales: number; totalRevenue: number }>);
        return Object.entries(data).map(([name, values]: [string, { totalSales: number; totalRevenue: number }]) => ({ name, 'Units Sold': values.totalSales, 'Revenue (PKR)': values.totalRevenue.toFixed(2) }));
      }
      case 'area_monthly': {
        const data = sales.reduce((acc, sale) => {
          const month = new Date(sale.date).toISOString().slice(0, 7); // YYYY-MM
          const key = `${sale.area} - ${month}`;
          if (!acc[key]) acc[key] = { totalSales: 0, totalRevenue: 0 };
          acc[key].totalSales += sale.quantity;
          acc[key].totalRevenue += sale.totalPrice;
          return acc;
        }, {} as Record<string, { totalSales: number; totalRevenue: number }>);
        return Object.entries(data).map(([name, values]: [string, { totalSales: number; totalRevenue: number }]) => ({ name, 'Units Sold': values.totalSales, 'Revenue (PKR)': values.totalRevenue.toFixed(2) }));
      }
      case 'region': {
        const data = sales.reduce((acc, sale) => {
          if (!acc[sale.region]) acc[sale.region] = { totalSales: 0, totalRevenue: 0 };
          acc[sale.region].totalSales += sale.quantity;
          acc[sale.region].totalRevenue += sale.totalPrice;
          return acc;
        }, {} as Record<string, { totalSales: number; totalRevenue: number }>);
        return Object.entries(data).map(([name, values]: [string, { totalSales: number; totalRevenue: number }]) => ({ name, 'Units Sold': values.totalSales, 'Revenue (PKR)': values.totalRevenue.toFixed(2) }));
      }
      case 'stock': {
        return inventory.map(p => ({
          'Medicine Name': p.name,
          'Quantity': p.quantity,
          'Price (PKR)': p.price.toFixed(2),
          'Stock Value (PKR)': (p.quantity * p.price).toFixed(2)
        }));
      }
      case 'stock_updates': {
        return [...stockUpdates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(update => ({
          'Date': update.date,
          'Medicine Name': update.productName,
          'Quantity Added': update.quantityAdded,
          'Notes': update.notes || '-',
        }));
      }
      case 'bank_report': {
        return [...bankTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => ({
          'Date': tx.date,
          'Type': tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
          'Party': tx.party,
          'Description': tx.description,
          'Receipt (PKR)': tx.type === 'receipt' ? tx.amount.toFixed(2) : '-',
          'Payment (PKR)': tx.type === 'payment' ? tx.amount.toFixed(2) : '-',
        }));
      }
      case 'sales_invoices': {
        return salesInvoices.map(inv => ({
          'Invoice #': inv.invoiceNumber,
          'Date': inv.date,
          'Customer': inv.customerName,
          'Status': inv.status,
          'Total (PKR)': inv.grandTotal.toFixed(2),
        }));
      }
      case 'purchase_invoices': {
        return purchaseInvoices.map(inv => ({
          'Invoice #': inv.invoiceNumber,
          'Date': inv.date,
          'Supplier': inv.supplier,
          'Total (PKR)': inv.grandTotal.toFixed(2),
        }));
      }
      case 'customer_ledger': {
        const ledger: Record<string, { totalBilled: number, totalReceived: number }> = {};
        
        customers.forEach(c => {
          ledger[c.name] = { totalBilled: c.openingBalance || 0, totalReceived: 0 };
        });

        salesInvoices
          .filter(inv => inv.status !== 'Returned')
          .forEach(inv => {
            if (!ledger[inv.customerName]) {
              ledger[inv.customerName] = { totalBilled: 0, totalReceived: 0 };
            }
            ledger[inv.customerName].totalBilled += inv.grandTotal;
            ledger[inv.customerName].totalReceived += inv.paidAmount;
          });

        return Object.entries(ledger).map(([customer, data]: [string, { totalBilled: number, totalReceived: number }]) => ({
          'Customer Name': customer,
          'Total Billed (PKR)': data.totalBilled.toFixed(2),
          'Total Received (PKR)': data.totalReceived.toFixed(2),
          'Balance Due (PKR)': (data.totalBilled - data.totalReceived).toFixed(2)
        }));
      }
      case 'individual_customer': {
        if (!selectedIndividual) return [];
        return sales.filter(s => s.customerName === selectedIndividual).map(s => ({
          'Date': s.date,
          'Medicine': s.productName,
          'Quantity': s.quantity,
          'Discount (%)': s.discountPercentage || 0,
          'Revenue (PKR)': s.totalPrice.toFixed(2),
        })).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
      }
      case 'individual_customer_ledger': {
        if (!selectedIndividual) return [];

        const customer = customers.find(c => c.name === selectedIndividual);
        const openingBalance = customer?.openingBalance || 0;

        const customerInvoices = salesInvoices
          .filter(inv => inv.customerName === selectedIndividual)
          .map(inv => ({
            date: inv.date,
            description: `Invoice #${inv.invoiceNumber}`,
            debit: inv.grandTotal,
            credit: 0,
          }));

        const customerReceipts = bankTransactions
          .filter(tx => tx.party === selectedIndividual && tx.type === 'receipt')
          .map(tx => ({
            date: tx.date,
            description: tx.description,
            debit: 0,
            credit: tx.amount,
          }));

        const transactions = [...customerInvoices, ...customerReceipts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = openingBalance;
        
        const ledgerRows = [];
        if (openingBalance > 0) {
            ledgerRows.push({
                'Date': '-',
                'Description': 'Opening Balance',
                'Debit (PKR)': openingBalance.toFixed(2),
                'Credit (PKR)': '-',
                'Balance (PKR)': balance.toFixed(2)
            });
        }

        const txRows = transactions.map(tx => {
          balance += tx.debit - tx.credit;
          return {
            'Date': tx.date,
            'Description': tx.description,
            'Debit (PKR)': tx.debit > 0 ? tx.debit.toFixed(2) : '-',
            'Credit (PKR)': tx.credit > 0 ? tx.credit.toFixed(2) : '-',
            'Balance (PKR)': balance.toFixed(2)
          }
        });

        return [...ledgerRows, ...txRows];
      }
      case 'individual_medicine': {
        if (!selectedIndividual) return [];
        return sales.filter(s => s.productId === selectedIndividual).map(s => ({
          'Date': s.date,
          'Pharmacy / Clinic': s.customerName,
          'Quantity': s.quantity,
          'Discount (%)': s.discountPercentage || 0,
          'Revenue (PKR)': s.totalPrice.toFixed(2),
        })).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
      }
      case 'sales_daily': {
        const data = salesInvoices
          .filter(inv => inv.status !== 'Returned')
          .reduce((acc, inv) => {
            const date = inv.date;
            if (!acc[date]) acc[date] = { revenue: 0, invoiceCount: 0 };
            acc[date].revenue += inv.grandTotal;
            acc[date].invoiceCount += 1;
            return acc;
          }, {} as Record<string, { revenue: number, invoiceCount: number }>);

        return Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).map(([date, values]) => ({
          'Date': date,
          'Invoices Count': values.invoiceCount,
          'Revenue (PKR)': values.revenue.toFixed(2)
        }));
      }
      case 'profit_daily': {
        const data = salesInvoices
          .filter(inv => inv.status !== 'Returned')
          .reduce((acc, inv) => {
            const date = inv.date;
            if (!acc[date]) acc[date] = { revenue: 0, cost: 0 };
            acc[date].revenue += inv.grandTotal;

            inv.items.forEach(item => {
              const product = inventory.find(p => p.id === item.productId);
              acc[date].cost += (product?.costPrice || 0) * item.quantity;
            });
            return acc;
          }, {} as Record<string, { revenue: number, cost: number }>);

        return Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).map(([date, values]) => ({
          'Date': date,
          'Revenue (PKR)': values.revenue.toFixed(2),
          'Cost (PKR)': values.cost.toFixed(2),
          'Net Profit (PKR)': (values.revenue - values.cost).toFixed(2),
          'Margin (%)': values.revenue > 0 ? (((values.revenue - values.cost) / values.revenue) * 100).toFixed(1) + '%' : '0%'
        }));
      }
      case 'profit_monthly': {
        const data = salesInvoices
          .filter(inv => inv.status !== 'Returned')
          .reduce((acc, inv) => {
            const month = inv.date.slice(0, 7); // YYYY-MM
            if (!acc[month]) acc[month] = { revenue: 0, cost: 0 };
            acc[month].revenue += inv.grandTotal;

            inv.items.forEach(item => {
              const product = inventory.find(p => p.id === item.productId);
              acc[month].cost += (product?.costPrice || 0) * item.quantity;
            });
            return acc;
          }, {} as Record<string, { revenue: number, cost: number }>);

        return Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).map(([month, values]) => ({
          'Month': month,
          'Revenue (PKR)': values.revenue.toFixed(2),
          'Cost (PKR)': values.cost.toFixed(2),
          'Net Profit (PKR)': (values.revenue - values.cost).toFixed(2),
          'Margin (%)': values.revenue > 0 ? (((values.revenue - values.cost) / values.revenue) * 100).toFixed(1) + '%' : '0%'
        }));
      }
      case 'profit_yearly': {
        const data = salesInvoices
          .filter(inv => inv.status !== 'Returned')
          .reduce((acc, inv) => {
            const year = inv.date.slice(0, 4); // YYYY
            if (!acc[year]) acc[year] = { revenue: 0, cost: 0 };
            acc[year].revenue += inv.grandTotal;

            inv.items.forEach(item => {
              const product = inventory.find(p => p.id === item.productId);
              acc[year].cost += (product?.costPrice || 0) * item.quantity;
            });
            return acc;
          }, {} as Record<string, { revenue: number, cost: number }>);

        return Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).map(([year, values]) => ({
          'Year': year,
          'Revenue (PKR)': values.revenue.toFixed(2),
          'Cost (PKR)': values.cost.toFixed(2),
          'Net Profit (PKR)': (values.revenue - values.cost).toFixed(2),
          'Margin (%)': values.revenue > 0 ? (((values.revenue - values.cost) / values.revenue) * 100).toFixed(1) + '%' : '0%'
        }));
      }
      default: return [];
    }
  }, [sales, inventory, reportType, selectedIndividual, stockUpdates, bankTransactions, salesInvoices, purchaseInvoices, customers]);

  const medicineTrendData = useMemo(() => {
    if (reportType !== 'individual_medicine' || !selectedIndividual) return null;

    const productSales = sales.filter(s => s.productId === selectedIndividual);
    if (productSales.length === 0) return null;

    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);
    const last60Days = new Date();
    last60Days.setDate(today.getDate() - 60);

    const salesLast30Days = productSales.filter(s => new Date(s.date) >= last30Days && new Date(s.date) <= today);
    const sales31to60Days = productSales.filter(s => new Date(s.date) >= last60Days && new Date(s.date) < last30Days);

    const aggregate = (saleList: SaleRecord[]) => saleList.reduce((acc, s) => {
      acc.quantity += s.quantity;
      acc.revenue += s.totalPrice;
      return acc;
    }, { quantity: 0, revenue: 0 });

    const currentPeriod = aggregate(salesLast30Days);
    const previousPeriod = aggregate(sales31to60Days);

    const calculateChange = (current: number, previous: number) => {
      if (previous > 0) return ((current - previous) / previous) * 100;
      if (current > 0) return 100;
      return 0;
    };

    return {
      currentQty: currentPeriod.quantity,
      currentRevenue: currentPeriod.revenue,
      qtyChange: calculateChange(currentPeriod.quantity, previousPeriod.quantity),
      revenueChange: calculateChange(currentPeriod.revenue, previousPeriod.revenue),
    };
  }, [sales, reportType, selectedIndividual]);

  const bankReportSummary = useMemo(() => {
    if (reportType !== 'bank_report') return null;
    const totalReceipts = bankTransactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = bankTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalReceipts - totalPayments;
    return { totalReceipts, totalPayments, netBalance };
  }, [bankTransactions, reportType]);


  const chartData = useMemo(() => {
    if (reportType === 'individual_customer') {
      if (!selectedIndividual) return [];
      const filteredSales = sales.filter(s => s.customerName === selectedIndividual);
      const data = filteredSales.reduce((acc, sale) => {
        acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(data).map(([name, quantity]) => ({ name, 'Units Sold': quantity }));
    }
    if (reportType === 'individual_medicine') {
      if (!selectedIndividual) return [];
      const filteredSales = sales.filter(s => s.productId === selectedIndividual);
      const data = filteredSales.reduce((acc, sale) => {
        acc[sale.customerName] = (acc[sale.customerName] || 0) + sale.quantity;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(data).map(([name, quantity]) => ({ name, 'Units Sold': quantity }));
    }
    // For summary reports, convert formatted revenue string back to number for charting
    return reportData.map(item => ({
      ...item,
      'Revenue (PKR)': parseFloat(String(item['Revenue (PKR)']).replace(/,/g, '')),
      'Cost (PKR)': item['Cost (PKR)'] ? parseFloat(String(item['Cost (PKR)']).replace(/,/g, '')) : undefined,
      'Net Profit (PKR)': item['Net Profit (PKR)'] ? parseFloat(String(item['Net Profit (PKR)']).replace(/,/g, '')) : undefined
    }));
  }, [reportData, reportType, selectedIndividual, sales]);

  const selectedProductName = reportType === 'individual_medicine' ? inventory.find(p => p.id === selectedIndividual)?.name : selectedIndividual;

  const reportTitles: Record<string, string> = {
    customer_monthly: "Monthly Sales by Pharmacy",
    area_monthly: "Monthly Sales by City/Area",
    region: "Sales by Region",
    stock: "Current Stock Report",
    stock_updates: "Stock Update History",
    bank_report: "Bank Transaction Report",
    sales_invoices: "Sales Invoice List",
    purchase_invoices: "Purchase Invoice List",
    customer_ledger: "Customer Ledger Report",
    individual_customer: `Individual Report for ${selectedIndividual}`,
    individual_customer_ledger: `Statement for ${selectedIndividual}`,
    individual_medicine: `Individual Report for ${selectedProductName || ''}`,
    sales_daily: "Daily Sales Report",
    profit_daily: "Daily Profit Report",
    profit_monthly: "Monthly Profit Report",
    profit_yearly: "Yearly Profit Report"
  };

  const tableHeaders = reportData.length > 0 ? Object.keys(reportData[0]) : [];
  const chartHeaders = chartData.length > 0 ? Object.keys(chartData[0]) : [];

  const chartXAxisKey = chartHeaders.includes('name') ? 'name' : (chartHeaders.includes('Month') ? 'Month' : (chartHeaders.includes('Year') ? 'Year' : (chartHeaders.includes('Medicine Name') ? 'Medicine Name' : chartHeaders[0])));
  const chartYAxisKeys = chartHeaders.filter(h => h.includes('Units Sold') || h.includes('Quantity') || h.includes('Revenue') || h.includes('Profit'));

  const showChart = !['stock', 'stock_updates', 'bank_report', 'sales_invoices', 'purchase_invoices', 'customer_ledger', 'individual_customer_ledger'].includes(reportType) && reportData.length > 0 && chartData.length > 0 && chartYAxisKeys.length > 0;

  const hasInvoiceAction = reportType === 'sales_daily' || reportType === 'profit_daily';
  
  const handleViewInvoices = (row: Record<string, any>) => {
      if (row['Date']) {
          setSelectedDateForInvoices(row['Date']);
      }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as ReportType);
              setSelectedIndividual('');
            }}
            className="block w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <optgroup label="Summary Reports">
              <option value="customer_monthly">Pharmacy Month Wise</option>
              <option value="customer_ledger">Customer Ledger</option>
              <option value="area_monthly">City/Area Month Wise</option>
              <option value="region">Region Wise</option>
              <option value="stock">Current Stock Report</option>
              <option value="stock_updates">Stock Update History</option>
              <option value="bank_report">Bank Report</option>
              <option value="sales_invoices">Sales Invoice List</option>
              <option value="purchase_invoices">Purchase Invoice List</option>
              <option value="sales_daily">Daily Sales Report</option>
              <option value="profit_daily">Daily Profit Report</option>
              <option value="profit_monthly">Monthly Profit Report</option>
              <option value="profit_yearly">Yearly Profit Report</option>
            </optgroup>
            <optgroup label="Detailed Reports">
              <option value="individual_customer">Individual Pharmacy</option>
              <option value="individual_customer_ledger">Individual Customer Statement</option>
              <option value="individual_medicine">Individual Medicine</option>
            </optgroup>
          </select>
        </div>

        {(reportType === 'individual_customer' || reportType === 'individual_customer_ledger') && (
          <div>
            <label htmlFor="individual-select" className="block text-sm font-medium text-gray-700 mb-1">Select Pharmacy</label>
            <select
              id="individual-select"
              value={selectedIndividual}
              onChange={(e) => setSelectedIndividual(e.target.value)}
              className="block w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">-- Please Select --</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {reportType === 'individual_medicine' && (
          <div>
            <label htmlFor="medicine-select" className="block text-sm font-medium text-gray-700 mb-1">Select Medicine</label>
            <select
              id="medicine-select"
              value={selectedIndividual}
              onChange={(e) => setSelectedIndividual(e.target.value)}
              className="block w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">-- Please Select --</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{reportTitles[reportType]}</h2>
        </div>
        {reportData.length > 0 ? (
          <>
            {bankReportSummary && (
              <div className="mb-8 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatDisplay title="Total Receipts" value={`PKR ${bankReportSummary.totalReceipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <StatDisplay title="Total Payments" value={`PKR ${bankReportSummary.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <StatDisplay title="Net Balance" value={`PKR ${bankReportSummary.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              </div>
            )}
            {medicineTrendData && (
              <div className="mb-8 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Sales Trend (Last 30 days vs Previous 30)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatDisplay title="Units Sold" value={medicineTrendData.currentQty.toLocaleString()} change={medicineTrendData.qtyChange} />
                  <StatDisplay title="Revenue" value={`PKR ${medicineTrendData.currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change={medicineTrendData.revenueChange} />
                </div>
              </div>
            )}
            {showChart && (
              <>
                {reportType === 'individual_medicine' && <h3 className="text-lg font-semibold text-gray-800 mb-3">Sales by Pharmacy</h3>}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartXAxisKey} tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px' }} />
                    <Legend />
                    {chartYAxisKeys.includes('Units Sold') && <Bar dataKey="Units Sold" fill="#3B82F6" />}
                    {chartYAxisKeys.includes('Quantity') && <Bar dataKey="Quantity" fill="#3B82F6" />}
                    {chartYAxisKeys.includes('Revenue (PKR)') && <Bar dataKey="Revenue (PKR)" fill="#10B981" />}
                    {chartYAxisKeys.includes('Net Profit (PKR)') && <Bar dataKey="Net Profit (PKR)" fill="#3B82F6" />}
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
            {reportType === 'individual_medicine' && <h3 className="text-lg font-semibold text-gray-800 mt-6">Sales Log</h3>}
            <ReportDataTable 
                headers={tableHeaders} 
                data={reportData} 
                onActionClick={hasInvoiceAction ? handleViewInvoices : undefined}
                actionLabel={hasInvoiceAction ? "View Invoices" : undefined}
            />
            {selectedDateForInvoices && (
                <DailyInvoicesViewer
                    date={selectedDateForInvoices}
                    invoices={salesInvoices.filter(inv => inv.date === selectedDateForInvoices && inv.status !== 'Returned')}
                    inventory={inventory}
                    onClose={() => setSelectedDateForInvoices(null)}
                />
            )}
          </>
        ) : (
          <p className="text-center py-10 text-gray-600">
            {((reportType.startsWith('individual_'))) && !selectedIndividual
              ? `Please select a ${reportType.split('_')[1]} to generate a report.`
              : 'No data available for this report.'
            }
          </p>
        )}
      </div>
    </div>
  );
};
