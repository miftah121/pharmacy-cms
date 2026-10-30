
import React, { useState, Dispatch, SetStateAction, useMemo } from 'react';
import { SaleRecord, Product, View, QuickAccessOption, QuickAccessItemId } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  sales: SaleRecord[];
  inventory: Product[];
  onNavigate: (view: View, state?: any) => void;
  quickAccessIds: QuickAccessItemId[];
  setQuickAccessIds: Dispatch<SetStateAction<QuickAccessItemId[]>>;
  allQuickAccessOptions: QuickAccessOption[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center transition-transform transform hover:scale-105">
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const QuickAccessCard: React.FC<{ option: QuickAccessOption; onClick: () => void }> = ({ option, onClick }) => (
    <button onClick={onClick} className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center transition-all transform hover:scale-105 hover:shadow-lg hover:bg-blue-50">
        <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-3">
            {option.icon}
        </div>
        <p className="text-sm text-gray-700 font-semibold">{option.label}</p>
    </button>
);

const CustomizeQuickAccessModal: React.FC<{
    allOptions: QuickAccessOption[];
    currentIds: QuickAccessItemId[];
    onSave: (newIds: QuickAccessItemId[]) => void;
    onClose: () => void;
}> = ({ allOptions, currentIds, onSave, onClose }) => {
    const [selectedIds, setSelectedIds] = useState<Set<QuickAccessItemId>>(new Set(currentIds));

    const groupedOptions = useMemo(() => {
        return allOptions.reduce((acc, option) => {
            const category = option.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(option);
            return acc;
        }, {} as Record<string, QuickAccessOption[]>);
    }, [allOptions]);

    const handleToggle = (id: QuickAccessItemId) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSave = () => {
        const orderedSelection = allOptions.filter(opt => selectedIds.has(opt.id)).map(opt => opt.id);
        onSave(orderedSelection);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Customize Quick Access</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedOptions).map(([category, options]: [string, QuickAccessOption[]]) => (
                        <div key={category}>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">{category}</h4>
                             {options.map(option => (
                                <label key={option.id} className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(option.id)}
                                        onChange={() => handleToggle(option.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="ml-4 flex items-center text-gray-700">
                                        <span className="text-blue-600">{option.icon}</span>
                                        <span className="ml-3 font-medium">{option.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6 space-x-2 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Save</button>
                </div>
            </div>
        </div>
    );
};


const TrendArrow: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>;
    }
    if (change < 0) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-7.293l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 10.586V7a1 1 0 11-2 0v3.586L7.707 9.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 002 0V7a1 1 0 10-2 0v2zm0 4a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" /></svg>;
};

const SalesTrend: React.FC<{ sales: SaleRecord[] }> = ({ sales }) => {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);
    const last60Days = new Date();
    last60Days.setDate(today.getDate() - 60);

    const salesLast30Days = sales.filter(s => new Date(s.date) >= last30Days && new Date(s.date) <= today);
    const sales31to60Days = sales.filter(s => new Date(s.date) >= last60Days && new Date(s.date) < last30Days);

    const aggregateSales = (saleList: SaleRecord[]) => 
        saleList.reduce((acc, sale) => {
            acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
            return acc;
        }, {} as Record<string, number>);

    const currentPeriodSales = aggregateSales(salesLast30Days);
    const previousPeriodSales = aggregateSales(sales31to60Days);
    
    const topProducts = Object.entries(currentPeriodSales)
        .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
        .slice(0, 5)
        .map(([productName]) => productName);

    const trendData = topProducts.map(productName => {
        const currentQty = currentPeriodSales[productName] || 0;
        const previousQty = previousPeriodSales[productName] || 0;
        let change = 0;
        if (previousQty > 0) {
            change = ((currentQty - previousQty) / previousQty) * 100;
        } else if (currentQty > 0) {
            change = 100;
        }
        return { name: productName, currentSales: currentQty, change };
    });

    if (trendData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Medicine Sales Trends</h2>
                 <div className="text-center py-10 text-gray-600">
                    <p>Not enough sales data from the last 60 days to show trends.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Medicine Sales Trends (Last 30 days vs Previous 30)</h2>
            <ul className="space-y-4">
                {trendData.map(item => (
                    <li key={item.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">Sold: <span className="font-bold">{item.currentSales}</span></span>
                            <div className={`flex items-center text-sm font-bold ${item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                               <TrendArrow change={item.change} />
                               <span className="ml-1 w-16 text-right">
                                    {isFinite(item.change) ? `${item.change.toFixed(0)}%` : 'N/A'}
                               </span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export const Dashboard: React.FC<DashboardProps> = ({ sales, inventory, onNavigate, quickAccessIds, setQuickAccessIds, allQuickAccessOptions }) => {
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalProducts = inventory.length;

  const salesByProduct = sales.reduce((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByProduct)
    .map(([name, quantity]: [string, number]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  
  const iconClass = "w-8 h-8 text-white";
  
  const quickAccessItemsToDisplay = allQuickAccessOptions.filter(option => quickAccessIds.includes(option.id));

  return (
    <div className="space-y-8">
      {showCustomizeModal && (
          <CustomizeQuickAccessModal
              allOptions={allQuickAccessOptions}
              currentIds={quickAccessIds}
              onSave={setQuickAccessIds}
              onClose={() => setShowCustomizeModal(false)}
          />
      )}
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            title="Total Revenue (PKR)" 
            value={`PKR ${totalRevenue.toLocaleString()}`} 
            color="bg-blue-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 13v-1m-4.5-9.5l-.707-.707M19.071 5.929l-.707.707M5.929 19.071l-.707.707M18.364 18.364l.707.707M5.929 5.929l.707.707" /></svg>} 
        />
        <StatCard 
            title="Total Units Sold" 
            value={totalSales.toLocaleString()} 
            color="bg-green-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4z" /></svg>}
        />
        <StatCard 
            title="Medicines in Stock" 
            value={String(totalProducts)} 
            color="bg-purple-500"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Quick Access</h2>
          <button onClick={() => setShowCustomizeModal(true)} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
              Customize
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickAccessItemsToDisplay.map(item => (
                <QuickAccessCard 
                    key={item.id}
                    option={item}
                    onClick={() => onNavigate(item.view, item.initialState)} 
                />
            ))}
             {quickAccessItemsToDisplay.length === 0 && (
                <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No quick access items selected.</p>
                    <button onClick={() => setShowCustomizeModal(true)} className="mt-2 text-sm text-blue-600 hover:underline font-medium">Add some shortcuts</button>
                </div>
            )}
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 Selling Medicines</h2>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value.toLocaleString()} Units`, name]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="quantity" fill="#3B82F6" name="Units Sold" barSize={40} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center py-16 text-gray-600">
                    <p>No sales data available to display chart.</p>
                </div>
            )}
          </div>
          <SalesTrend sales={sales} />
      </div>
    </div>
  );
};
