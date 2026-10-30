
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
    appSettings: AppSettings;
    setAppSettings: (settings: AppSettings) => void;
    onBackup: () => void;
    onRestore: (file: File) => Promise<void>;
}

interface RestoreModalProps {
    isOpen: boolean;
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    onClose: () => void;
}

const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, status, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                {status === 'processing' && (
                    <div className="text-center space-y-4">
                        <div className="relative w-16 h-16 mx-auto">
                             <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                             <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Restoring Data...</h3>
                        <p className="text-gray-500 text-sm">Please wait while we process your backup file.</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
                            <div className="bg-blue-600 h-2.5 rounded-full animate-progress-indeterminate"></div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Restore Complete</h3>
                        <p className="text-gray-600 text-sm">{message}</p>
                        <button onClick={onClose} className="w-full py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition">
                            Close & Reload
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Restore Failed</h3>
                        <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{message}</p>
                        <button onClick={onClose} className="w-full py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">
                            Close
                        </button>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes progress-indeterminate {
                    0% { width: 0%; margin-left: 0%; }
                    50% { width: 70%; margin-left: 30%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 1.5s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export const Settings: React.FC<SettingsProps> = ({ appSettings, setAppSettings, onBackup, onRestore }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [restoreStatus, setRestoreStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [restoreMessage, setRestoreMessage] = useState('');

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' as 'success' | 'error' | '' });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm("WARNING: Restoring data will completely overwrite your current inventory, sales, and settings. This action cannot be undone.\n\nAre you sure you want to proceed?")) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsModalOpen(true);
        setRestoreStatus('processing');
        setRestoreMessage('Preparing to restore...');

        try {
            await onRestore(file);
            
            setRestoreStatus('success');
            setRestoreMessage('Your data has been successfully restored from the backup file.');
        } catch (err: any) {
            console.error(err);
            setRestoreStatus('error');
            setRestoreMessage(err.message || 'Failed to restore data. The file might be corrupt or invalid.');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setRestoreStatus('idle');
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ text: '', type: '' });

        const actualCurrentPassword = appSettings.adminPassword || 'admin123';

        if (currentPassword !== actualCurrentPassword) {
            setPasswordMessage({ text: 'Incorrect current password.', type: 'error' });
            return;
        }

        if (newPassword.length < 4) {
             setPasswordMessage({ text: 'New password must be at least 4 characters long.', type: 'error' });
             return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
            return;
        }

        setAppSettings({ ...appSettings, adminPassword: newPassword });
        setPasswordMessage({ text: 'Password successfully changed!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <h1 className="text-3xl font-bold text-gray-800">Settings & Data Management</h1>

            <RestoreModal 
                isOpen={isModalOpen} 
                status={restoreStatus} 
                message={restoreMessage} 
                onClose={handleCloseModal} 
            />

            {/* Security Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center text-red-600">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Security Settings
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input 
                            type="password" 
                            value={currentPassword} 
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                                required
                            />
                        </div>
                    </div>
                    {passwordMessage.text && (
                        <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600 font-medium' : 'text-red-500'}`}>
                            {passwordMessage.text}
                        </p>
                    )}
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 shadow-sm transition">
                        Change Password
                    </button>
                </form>
            </div>

            {/* Printer Settings */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Printer Settings
                </h2>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700">Receipt Printer Type</label>
                        <p className="text-xs text-gray-500 mb-2">Select the layout type for your sales receipts.</p>
                        <div className="flex items-center space-x-4 mt-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="form-radio text-indigo-600 h-4 w-4" 
                                    name="printerType" 
                                    value="standard" 
                                    checked={appSettings.receiptPrinterType !== 'thermal'} 
                                    onChange={() => setAppSettings({...appSettings, receiptPrinterType: 'standard'})} 
                                />
                                <span className="ml-2 text-sm text-gray-700">Standard A4 / Letter</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="form-radio text-indigo-600 h-4 w-4" 
                                    name="printerType" 
                                    value="thermal" 
                                    checked={appSettings.receiptPrinterType === 'thermal'} 
                                    onChange={() => setAppSettings({...appSettings, receiptPrinterType: 'thermal'})} 
                                />
                                <span className="ml-2 text-sm text-gray-700">Thermal Printer (80mm)</span>
                            </label>
                        </div>
                    </div>
                </div>
                {/* Print Preview Toggle */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="flex items-center cursor-pointer select-none">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={!!appSettings.showPrintPreview}
                                onChange={e => setAppSettings({...appSettings, showPrintPreview: e.target.checked})}
                            />
                            <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${appSettings.showPrintPreview ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${appSettings.showPrintPreview ? 'transform translate-x-5' : ''}`}></div>
                        </div>
                        <div className="ml-3">
                            <span className="text-gray-700 font-medium text-sm">
                                {appSettings.showPrintPreview ? 'Print Preview Enabled' : 'Print Preview Disabled'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">When enabled, a preview window will appear before printing so you can verify the invoice.</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Auto Backup Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                    Auto Backup Configuration
                </h2>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                         <label className="flex items-center cursor-pointer select-none">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={appSettings.autoBackup}
                                    onChange={e => setAppSettings({...appSettings, autoBackup: e.target.checked})}
                                />
                                <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${appSettings.autoBackup ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${appSettings.autoBackup ? 'transform translate-x-5' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-gray-700 font-medium">
                                {appSettings.autoBackup ? 'Auto Backup Enabled' : 'Auto Backup Disabled'}
                            </div>
                        </label>
                    </div>
                    
                    {appSettings.autoBackup && (
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                            <label className="text-sm font-medium text-gray-700">Frequency:</label>
                            <select 
                                value={appSettings.backupFrequency}
                                onChange={(e) => setAppSettings({...appSettings, backupFrequency: e.target.value as any})}
                                className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                    )}
                </div>
                {appSettings.autoBackup && (
                    <div className="mt-2 text-xs text-gray-500">
                        Next backup will happen automatically when you open the app if the time interval has passed.
                        <br/>
                        Last Backup: <span className="font-medium">{appSettings.lastBackupDate ? new Date(appSettings.lastBackupDate).toLocaleString() : 'Never'}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Backup */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Manual Backup</h2>
                    </div>
                    <p className="text-gray-600 mb-6 flex-grow text-sm">
                        Instantly download a compressed backup (.json.gz) of your inventory, sales history, customers, and financial records.
                    </p>
                    <button 
                        onClick={onBackup}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm flex justify-center items-center"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         Download Compressed Backup
                    </button>
                </div>

                {/* Restore */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
                     <div className="flex items-center mb-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Restore Data</h2>
                    </div>
                    <p className="text-gray-600 mb-6 flex-grow text-sm">
                        Restore your data from a previously saved backup file.
                        <span className="block mt-1 text-red-500 font-semibold text-xs bg-red-50 p-1 rounded">Warning: This will replace all current data!</span>
                    </p>
                    
                    <input 
                        type="file" 
                        accept=".json,.gz,application/json,application/x-gzip,application/gzip" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition shadow-sm flex justify-center items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Select Backup File
                    </button>
                </div>
            </div>
        </div>
    );
}