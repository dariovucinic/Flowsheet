'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useComputation } from '@/contexts/ComputationContext';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: 'python' | 'javascript' | 'r';
    readOnly?: boolean;
    onRun?: () => void;
    autoFocus?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
    value, 
    onChange, 
    language = 'python', 
    readOnly = false, 
    onRun, 
    autoFocus = false 
}) => {
    const editorRef = useRef<any>(null);
    const monaco = useMonaco();
    const { scope } = useComputation();

    // Setup custom autocompletion for FlowSheet variables
    useEffect(() => {
        if (!monaco) return;

        // Register completion item provider for the current language
        const disposable = monaco.languages.registerCompletionItemProvider(language, {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const variables = Object.entries(scope.current || {}).map(([key, val]) => {
                    let typeDesc = typeof val;
                    if (Array.isArray(val)) {
                        typeDesc = `Array[${val.length}]`;
                    }
                    return {
                        label: key,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: key,
                        detail: `FlowSheet Variable (${typeDesc})`,
                        range: range
                    };
                });

                return {
                    suggestions: variables
                };
            }
        });

        // Add custom theme matching the app's aesthetic
        monaco.editor.defineTheme('flowsheet-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0f172a00', // Transparent to let the container background show
                'editor.lineHighlightBackground': '#ffffff0a',
                'editorLineNumber.foreground': '#475569',
            }
        });

        return () => {
            disposable.dispose();
        };
    }, [monaco, language, scope]);

    const onRunRef = useRef(onRun);
    
    // Update ref always so we have latest closure
    useEffect(() => {
        onRunRef.current = onRun;
    }, [onRun]);

    const handleEditorDidMount = (editor: any, monacoInst: any) => {
        editorRef.current = editor;

        // Add Shift+Enter keybinding to run script
        editor.addCommand(monacoInst.KeyMod.Shift | monacoInst.KeyCode.Enter, () => {
            if (onRunRef.current) {
                onRunRef.current();
            }
        });

        if (autoFocus) {
            editor.focus();
        }
    };

    // Keep the Shift+Enter executing correctly with latest state by listening to DOM events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // prevent React Flow events
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            if (onRun) onRun();
        }
    };

    return (
        <div 
            className="h-full w-full relative bg-slate-900/50"
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                theme="flowsheet-dark"
                value={value}
                onChange={(val) => onChange(val || '')}
                onMount={handleEditorDidMount}
                options={{
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    padding: { top: 12, bottom: 12 },
                    contextmenu: false,
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                        alwaysConsumeMouseWheel: false
                    }
                }}
                loading={
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 font-mono">
                        Loading Monaco Editor...
                    </div>
                }
            />
        </div>
    );
};

export default CodeEditor;
