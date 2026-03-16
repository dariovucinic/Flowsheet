'use client';

/**
 * Copyright (c) 2026 Dario Vucinic - FlowSheet
 * MIT License
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('flowsheet_gemini_api_key');
            if (storedKey) {
                setApiKey(storedKey);
            }
            setIsSaved(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('flowsheet_gemini_api_key', apiKey.trim());
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleClear = () => {
        localStorage.removeItem('flowsheet_gemini_api_key');
        setApiKey('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md p-6 glass rounded-xl border border-white/10 shadow-2xl"
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity hover:bg-white/5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-80">
                                Google Gemini API Key
                            </label>
                            <p className="text-xs opacity-60 mb-2">
                                Required for the AI Assistant and Generative CAD features. This key is stored securely in your browser's local storage and is never sent to any server other than Google's.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="flex-1 bg-black/10 dark:bg-white/5 border border-black/20 dark:border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                                {apiKey && (
                                    <button
                                        onClick={handleClear}
                                        className="px-3 py-2 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
                                        title="Clear Key"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-black/10 dark:border-white/10">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleSave}
                                className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                                    isSaved 
                                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' 
                                        : 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/50 hover:bg-cyan-500/30'
                                }`}
                            >
                                {isSaved ? 'Saved!' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SettingsDialog;
