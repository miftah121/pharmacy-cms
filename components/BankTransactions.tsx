import React, { useState, useEffect } from 'react';
import { BankTransaction, SalesInvoice, Customer } from '../types';

interface BankTransactionsProps {
  transactions: BankTransaction[];
  salesInvoices: SalesInvoice[];
  customers: Customer[];
  onAddTransaction: (transaction: Omit<BankTransaction, 'id'>) => void;
  initialViewState?: any;
}

const AddTransactionForm: React.FC<{
    salesInvoices: SalesInvoice[];
    customers: Customer[];
    onAddTransaction: (transaction: Omit<BankTransaction, 'id'>) => void;
    onClose: () => void;
}> = ({ salesInvoices, customers, onAddTransaction, onClose }) => {
    const [type, setType] = useState<'payment' | 'receipt'>('receipt');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [party, setParty] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Bank' | 'Cash'>('Bank');
    const [invoiceId, setInvoiceId] = useState<string>('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!party || !description || amount <= 0) {
            setError('Please fill all fields with valid values.');
            return;
        }
        onAddTransaction({ type, date, party, description, amount, paymentMethod, invoiceId: invoiceId || undefined });
        onClose();
    };

    const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setInvoiceId(selectedId);
        if (selectedId) {
            const selectedInvoice = salesInvoices.find(inv => inv.id === selectedId);
            if (selectedInvoice) {
                setParty(selectedInvoice.customerName);
                setDescription(`Payment for Invoice #${selectedInvoice.invoiceNumber}`);
            }
        }
    };


    const unpaidInvoices = salesInvoices.filter(inv => inv.status !== 'Paid');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                            <div className="flex gap-4">
                               <label className="flex items-center">
                                    <input type="radio" value="receipt" checked={type === 'receipt'} onChange={() => setType('receipt')} className="form-radio h-4 w-4 text-blue-600"/>
                                    <span className="ml-2 text-gray-700">Receipt</span>
                               </label>
                               <label className="flex items-center">
                                    <input type="radio" value="payment" checked={type === 'payment'} onChange={() => setType('payment')} className="form-radio h-4 w-4 text-red-600"/>
                                    <span className="ml-2 text-gray-700">Payment</span>
                               </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                            <div className="flex gap-4">
                               <label className="flex items-center">
                                    <input type="radio" value="Bank" checked={paymentMethod === 'Bank'} onChange={() => setPaymentMethod('Bank')} className="form-radio h-4 w-4 text-indigo-600"/>
                                    <span className="ml-2 text-gray-700">Bank</span>
                               </label>
                               <label className="flex items-center">
                                    <input type="radio" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} className="form-radio h-4 w-4 text-green-600"/>
                                    <span className="ml-2 text-gray-700">Cash</span>
                               </label>
                            </div>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {type === 'receipt' ? 'Received From (Customer)' : 'Paid To (Party)'}
                        </label>
                        {type === 'receipt' ? (
                            <select 
                                value={party} 
                                onChange={e => setParty(e.target.value)} 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" 
                                required 
                                disabled={!!invoiceId}
                            >
                                <option value="">-- Select Customer --</option>
                                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        ) : (
                            <input 
                                type="text" 
                                value={party} 
                                onChange={e => setParty(e.target.value)} 
                                placeholder="e.g., Supplier Name, Office Rent" 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" 
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Payment for Invoice #123" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="0.01" step="0.01" required/>
                    </div>
                    {type === 'receipt' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Allocate to Invoice (Optional)</label>
                            <select value={invoiceId} onChange={handleInvoiceChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="">None</option>
                                {unpaidInvoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoiceNumber} - {inv.customerName} (Due: {(inv.grandTotal - inv.paidAmount).toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const BankTransactions: React.FC<BankTransactionsProps> = ({ transactions, salesInvoices, customers, onAddTransaction, initialViewState }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [filter, setFilter] = useState<'all' | 'payment' | 'receipt' | 'cash' | 'bank'>('all');

    useEffect(() => {
        if (initialViewState?.action === 'open_add_transaction_modal') {
            setShowAddForm(true);
        }
    }, [initialViewState]);
    
    const sortedTransactions = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredTransactions = sortedTransactions.filter(tx => {
        if (filter === 'all') return true;
        if (filter === 'payment' || filter === 'receipt') return tx.type === filter;
        if (filter === 'cash' || filter === 'bank') return tx.paymentMethod.toLowerCase() === filter;
        return true;
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cash & Bank Transactions</h1>
        <button onClick={() => setShowAddForm(true)} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Transaction
        </button>
      </div>

       {showAddForm && <AddTransactionForm salesInvoices={salesInvoices} customers={customers} onAddTransaction={onAddTransaction} onClose={() => setShowAddForm(false)} />}
       
       <div className="mb-4">
            <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 w-fit">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:bg-white/50'}`}>All</button>
                <button onClick={() => setFilter('receipt')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'receipt' ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:bg-white/50'}`}>Receipts</button>
                <button onClick={() => setFilter('payment')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'payment' ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:bg-white/50'}`}>Payments</button>
                <button onClick={() => setFilter('bank')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'bank' ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:bg-white/50'}`}>Bank</button>
                <button onClick={() => setFilter('cash')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'cash' ? 'bg-white text-gray-800 shadow' : 'text-gray-700 hover:bg-white/50'}`}>Cash</button>
            </div>
       </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Party</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Method</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Receipt (PKR)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Payment (PKR)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.party}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.paymentMethod === 'Bank' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {tx.paymentMethod}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    {tx.type === 'receipt' ? tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                    {tx.type === 'payment' ? tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-600">No transactions to display.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};