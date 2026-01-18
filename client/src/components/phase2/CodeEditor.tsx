import React, { useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { AutoTypings, LocalStorageCache } from 'monaco-editor-auto-typings';
import { Play, CheckCircle, Terminal, Code2, AlertCircle, Loader2, Package } from 'lucide-react';
import { executeJavaScript, executePython, initializePyodide } from '../../utils/executionEngine';
import { loadJavaScriptPackages, getAvailablePackages, type SupportedLanguage } from '../../utils/packageLoader';
import { parseImports } from '../../utils/importParser';

interface CodeEditorProps {
    title: string;
    description?: string;
    initialCode?: string;
    language?: SupportedLanguage;
    /** When true, shows toggle buttons to switch between JavaScript and Python */
    allowLanguageSwitch?: boolean;
    completed?: boolean;
    onComplete?: () => void;
    isLoading?: boolean;
}

// Default code templates per language
const DEFAULT_CODE_TEMPLATES: Record<SupportedLanguage, string> = {
    javascript: '// Write your code here\n// Packages are auto-detected from imports!\n// Example: import lodash from "lodash"\nconsole.log("Hello, World!");',
    python: '# Write your code here\n# Packages are auto-detected from imports!\n# Example: import numpy as np\nprint("Hello, World!")'
};

// Language display configuration
const LANGUAGE_CONFIG: Record<SupportedLanguage, { label: string; icon: string; monacoId: string }> = {
    javascript: { label: 'JavaScript', icon: 'JS', monacoId: 'javascript' },
    python: { label: 'Python', icon: '🐍', monacoId: 'python' }
};

/**
 * Code Editor Component with Monaco Editor
 * 
 * Features:
 * - Monaco Editor with syntax highlighting
 * - Language switching (JavaScript/Python)
 * - **Automatic package detection from imports**
 * - Enhanced IntelliSense for JavaScript (auto-typings)
 * - Sandboxed code execution
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
    title,
    description,
    initialCode,
    language = 'javascript',
    allowLanguageSwitch = false,
    completed = false,
    onComplete,
    isLoading = false
}) => {
    // Active language state
    const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(language);
    const [code, setCode] = useState(initialCode || DEFAULT_CODE_TEMPLATES[activeLanguage]);
    const [output, setOutput] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Package loading state
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [detectedPackages, setDetectedPackages] = useState<string[]>([]);

    // Pyodide instance (cached)
    const pyodideRef = useRef<unknown>(null);
    const [isPyodideLoading, setIsPyodideLoading] = useState(false);

    // Monaco editor reference for auto-typings
    const autoTypingsRef = useRef<{ dispose: () => void } | null>(null);

    /**
     * Handle Monaco Editor mount - setup auto-typings for JavaScript
     */
    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
        // Only setup auto-typings for JavaScript/TypeScript
        if (activeLanguage === 'javascript') {
            // Dispose previous instance if exists
            if (autoTypingsRef.current) {
                autoTypingsRef.current.dispose();
                autoTypingsRef.current = null;
            }

            // Create new auto-typings instance (async)
            AutoTypings.create(editor, {
                sourceCache: new LocalStorageCache(),
                monaco: monaco,
                preloadPackages: true,
                onlySpecifiedPackages: false,
                versions: {
                    'lodash': '4.17.21',
                    'axios': '1.6.0',
                    'moment': '2.29.4',
                    'dayjs': '1.11.10'
                }
            }).then((instance) => {
                autoTypingsRef.current = instance;
            }).catch((err) => {
                console.warn('Failed to initialize auto-typings:', err);
            });
        }
    }, [activeLanguage]);

    /**
     * Handle language switch
     */
    const handleLanguageSwitch = useCallback((newLang: SupportedLanguage) => {
        if (newLang === activeLanguage) return;

        // Dispose auto-typings when switching away from JavaScript
        if (autoTypingsRef.current) {
            autoTypingsRef.current.dispose();
            autoTypingsRef.current = null;
        }

        setActiveLanguage(newLang);
        setCode(DEFAULT_CODE_TEMPLATES[newLang]);
        setOutput([]);
        setError(null);
        setDetectedPackages([]);
    }, [activeLanguage]);

    /**
     * Load Pyodide if needed
     */
    const ensurePyodide = useCallback(async () => {
        if (pyodideRef.current) return pyodideRef.current;

        setIsPyodideLoading(true);
        try {
            pyodideRef.current = await initializePyodide();
            return pyodideRef.current;
        } finally {
            setIsPyodideLoading(false);
        }
    }, []);

    /**
     * Run code with automatic package detection
     */
    const runCode = useCallback(async () => {
        setIsRunning(true);
        setOutput([]);
        setError(null);

        try {
            // Auto-detect packages from code
            const packages = parseImports(code, activeLanguage);
            setDetectedPackages(packages);

            if (activeLanguage === 'javascript') {
                let loadedPackages: Record<string, unknown> = {};

                // Auto-load detected packages
                if (packages.length > 0) {
                    setOutput([`📦 Auto-detected packages: ${packages.join(', ')}`]);
                    setLoadingPackages(true);
                    try {
                        // Filter to only supported packages
                        const supportedList = getAvailablePackages('javascript');
                        const packagesToLoad = packages.filter(pkg =>
                            supportedList.includes(pkg.toLowerCase())
                        );

                        if (packagesToLoad.length > 0) {
                            loadedPackages = await loadJavaScriptPackages(packagesToLoad);
                            setOutput([`✅ Loaded: ${packagesToLoad.join(', ')}`]);
                        }

                        // Warn about unsupported packages
                        const unsupported = packages.filter(pkg =>
                            !supportedList.includes(pkg.toLowerCase())
                        );
                        if (unsupported.length > 0) {
                            setOutput(prev => [
                                ...prev,
                                `⚠️ Unsupported packages (skipped): ${unsupported.join(', ')}`
                            ]);
                        }
                    } finally {
                        setLoadingPackages(false);
                    }
                }

                // Execute JavaScript
                const result = executeJavaScript(code, loadedPackages);
                if (result.error) {
                    setError(result.error);
                } else {
                    setOutput(prev => [...prev.filter(l => !l.startsWith('📦')), ...result.output]);
                }
            } else {
                // Python execution with auto-detection
                setOutput(['🐍 Loading Python runtime...']);
                const pyodide = await ensurePyodide();

                if (packages.length > 0) {
                    setOutput(prev => [...prev, `📦 Auto-detected packages: ${packages.join(', ')}`]);
                }

                // Execute Python - packages are auto-loaded inside executePython
                const result = await executePython(code, pyodide);
                if (result.error) {
                    setError(result.error);
                } else {
                    setOutput(result.output);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Execution error');
        } finally {
            setIsRunning(false);
        }
    }, [code, activeLanguage, ensurePyodide]);

    const isDisabled = isRunning || isPyodideLoading || loadingPackages;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Code2 size={24} className="text-indigo-400" />
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                {description && (
                    <p className="text-gray-400 text-sm">{description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {allowLanguageSwitch ? (
                        <div className="flex rounded-lg overflow-hidden border border-gray-700">
                            {(['javascript', 'python'] as SupportedLanguage[]).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageSwitch(lang)}
                                    disabled={isDisabled}
                                    className={`
                                        px-4 py-1.5 text-xs font-bold uppercase transition-all
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${activeLanguage === lang
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                        }
                                    `}
                                >
                                    {LANGUAGE_CONFIG[lang].icon} {LANGUAGE_CONFIG[lang].label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span className="px-3 py-1 bg-indigo-600 text-xs font-bold rounded-full uppercase">
                            {LANGUAGE_CONFIG[activeLanguage].icon} {activeLanguage}
                        </span>
                    )}

                    {/* Auto-detected packages indicator */}
                    {detectedPackages.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-700">
                            <Package size={14} />
                            <span>Auto: {detectedPackages.slice(0, 3).join(', ')}{detectedPackages.length > 3 ? '...' : ''}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Monaco Code Editor */}
            <div className="border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Code Editor</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                            ✨ Packages auto-detected from imports
                        </span>
                    </div>
                    <button
                        onClick={runCode}
                        disabled={isDisabled}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {isDisabled ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Play size={16} />
                        )}
                        {isPyodideLoading ? 'Loading Python...' : loadingPackages ? 'Loading Packages...' : 'Run Code'}
                    </button>
                </div>
                <Editor
                    height="300px"
                    language={LANGUAGE_CONFIG[activeLanguage].monacoId}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        padding: { top: 16, bottom: 16 },
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        parameterHints: { enabled: true }
                    }}
                />
            </div>

            {/* Output Console */}
            <div className="bg-gray-950 text-white">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <Terminal size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400 font-medium">Output</span>
                </div>
                <div className="p-4 min-h-[120px] max-h-[200px] overflow-y-auto font-mono text-sm">
                    {error ? (
                        <div className="flex items-start gap-2 text-red-400">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span className="whitespace-pre-wrap">{error}</span>
                        </div>
                    ) : output.length > 0 ? (
                        output.map((line, idx) => (
                            <div key={idx} className="text-gray-300 whitespace-pre-wrap">
                                {line}
                            </div>
                        ))
                    ) : (
                        <span className="text-gray-500 italic">Run your code to see output here...</span>
                    )}
                </div>
            </div>

            {/* Completion Section */}
            <div className="p-6 bg-gray-50">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                    <p className="text-sm text-blue-800">
                        <strong>✨ Auto-Detection:</strong> Just write <code className="bg-blue-100 px-1 rounded">import</code> statements and packages will be loaded automatically!
                        {activeLanguage === 'javascript'
                            ? ' Try: lodash, moment, axios, d3, three'
                            : ' Try: numpy, pandas, matplotlib, scipy'}
                    </p>
                </div>

                <label className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }
                `}>
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={completed}
                            onChange={() => !completed && onComplete?.()}
                            disabled={completed || isLoading}
                            className="peer w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-green-600 checked:border-green-600 transition-all cursor-pointer appearance-none disabled:cursor-not-allowed"
                        />
                        {completed && (
                            <CheckCircle size={16} className="absolute text-white pointer-events-none" />
                        )}
                    </div>
                    <span className={`font-medium ${completed ? 'text-green-700' : 'text-gray-700'}`}>
                        {completed ? 'Exercise completed ✓' : 'I completed this exercise'}
                    </span>
                    {isLoading && (
                        <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                    )}
                </label>
            </div>
        </div>
    );
};

export default CodeEditor;
