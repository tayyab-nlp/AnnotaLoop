import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle } from 'lucide-react';
import { clearSecureStorage } from '../../utils/secureStorage';

interface ForgotPinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPinModal: React.FC<ForgotPinModalProps> = ({ isOpen, onClose }) => {
    const { security, setSecurity, unlockApp, showToast } = useApp();
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'verify' | 'reset' | 'factory-reset'>('verify');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    if (!isOpen) return null;

    const handleVerifyKey = (e: React.FormEvent) => {
        e.preventDefault();

        if (secretKey.trim().toUpperCase() === security.secret.toUpperCase()) {
            // Move to reset PIN step
            setStep('reset');
            setError('');
        } else {
            setError('Invalid recovery key. Please try again.');
        }
    };

    const handleResetPin = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        // Update PIN and unlock
        setSecurity(prev => ({ ...prev, pin: newPin }));
        unlockApp();
        showToast('success', 'PIN Reset', 'Your PIN has been successfully reset.');

        // Reset state
        onClose();
        setSecretKey('');
        setNewPin('');
        setConfirmPin('');
        setError('');
        setStep('verify');
        setDeleteConfirmation('');
    };

    const handleFactoryReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (deleteConfirmation !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        try {
            // Clear Tauri secure storage (security data, API keys)
            await clearSecureStorage();
        } catch (error) {
            console.error('Failed to clear secure storage:', error);
        }

        // Clear all localStorage and sessionStorage data
        localStorage.clear();
        sessionStorage.clear();

        // Show success message and reload
        showToast('success', 'Reset Complete', 'All data has been cleared. The app will now reload.');

        // Reload after a short delay to show the toast
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const handleClose = () => {
        onClose();
        setSecretKey('');
        setNewPin('');
        setConfirmPin('');
        setError('');
        setStep('verify');
        setDeleteConfirmation('');
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            {step === 'verify' ? 'Forgot PIN?' : step === 'reset' ? 'Reset PIN' : 'Reset App & Clear Data'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {step === 'verify' ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                                Enter your recovery key to reset your PIN.
                                Your data will not be deleted.
                            </p>

                            <form onSubmit={handleVerifyKey}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Recovery Key
                                    </label>
                                    <input
                                        type="text"
                                        value={secretKey}
                                        onChange={(e) => {
                                            setSecretKey(e.target.value.toUpperCase());
                                            setError('');
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono tracking-wider"
                                        placeholder="XXXX-XXXX-XXXX"
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!secretKey.trim()}
                                        className="flex-1 px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Verify Key
                                    </button>
                                </div>
                            </form>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { setStep('factory-reset'); setError(''); }}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    Lost your recovery key? Reset app & clear data instead
                                </button>
                            </div>
                        </>
                    ) : step === 'reset' ? (
                        <>
                            <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    ✓ Recovery key verified. Set your new PIN below.
                                </p>
                            </div>

                            <form onSubmit={handleResetPin}>
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            New PIN
                                        </label>
                                        <input
                                            type="password"
                                            value={newPin}
                                            onChange={(e) => {
                                                setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                                                setError('');
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-[0.5em] font-bold"
                                            placeholder="••••"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Confirm PIN
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPin}
                                            onChange={(e) => {
                                                setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                                                setError('');
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-[0.5em] font-bold"
                                            placeholder="••••"
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setStep('verify')}
                                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={newPin.length !== 4 || confirmPin.length !== 4}
                                        className="flex-1 px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Reset PIN
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : step === 'factory-reset' ? (
                        <>
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                                            Warning: This will delete all your data
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                            All projects, documents, annotations, settings, and API keys will be permanently deleted. This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleFactoryReset}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => {
                                            setDeleteConfirmation(e.target.value.toUpperCase());
                                            setError('');
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono tracking-wider text-center"
                                        placeholder="DELETE"
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('verify'); setDeleteConfirmation(''); setError(''); }}
                                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={deleteConfirmation !== 'DELETE'}
                                        className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Reset App & Clear Data
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ForgotPinModal;
