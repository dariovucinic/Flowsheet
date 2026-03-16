'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React from 'react';
import { Block } from '@/types/block';

// Assuming basic Block interface structure. The actual specific type can just be the base Block for now.
interface PdfBlockProps {
    block: Block & { content?: string };
    onChange: (updates: Partial<Block & { content?: string }>) => void;
}

const PdfBlock: React.FC<PdfBlockProps> = ({ block, onChange }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ content: e.target.value });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange({ content: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`flex flex-col h-full rounded overflow-hidden group ${!block.content ? 'border border-black/10 dark:border-white/10' : 'bg-transparent'}`} style={{ color: 'var(--text-color)' }}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileUpload}
            />
            {block.content ? (
                <div className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 rounded overflow-hidden shadow-inner">
                    <object
                        data={block.content}
                        type="application/pdf"
                        className="w-full flex-1"
                        style={{ minHeight: '300px' }}
                    >
                        <div className="flex flex-col items-center justify-center p-4">
                            <p className="mb-2">Your browser does not support inline PDFs.</p>
                            <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                Click here to download the PDF
                            </a>
                        </div>
                    </object>
                    {/* Controls overlay */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="bg-black/10 dark:bg-white/10 backdrop-blur-md p-1.5 rounded shadow-sm hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            title="Replace PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                        <button
                            className="bg-black/10 dark:bg-white/10 backdrop-blur-md p-1.5 rounded shadow-sm hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                            onClick={() => onChange({ content: undefined })}
                            title="Remove PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-black/5 dark:bg-white/5">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto opacity-50">
                            {/* PDF Icon outline */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium opacity-80">Add a PDF Document</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-transparent border border-black/10 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            Upload from PC
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-black/10 dark:border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-transparent px-2 opacity-50 backdrop-blur-md">Or via URL</span>
                            </div>
                        </div>

                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-transparent border border-black/10 dark:border-white/10 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:opacity-40"
                            placeholder="https://example.com/document.pdf"
                            onBlur={handleUrlChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUrlChange(e as any);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PdfBlock;
