import React, { useState, useCallback } from 'react';
import { Play, CheckCircle, Terminal, Code2, AlertCircle } from 'lucide-react';

interface CodeEditorProps {
    title: string;
    description?: string;
    initialCode?: string;
    language?: 'javascript' | 'python';
    completed?: boolean;
    onComplete?: () => void;
    isLoading?: boolean;
}

/**
 * Simple code editor with syntax highlighting and execution
 * Note: For production, consider using Monaco Editor (@monaco-editor/react)
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
    title,
    description,
    initialCode = '// Write your code here\nconsole.log("Hello, World!");',
    language = 'javascript',
    completed = false,
    onComplete,
    isLoading = false
}) => {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Execute JavaScript code safely
     */
    const runCode = useCallback(() => {
        setIsRunning(true);
        setOutput([]);
        setError(null);

        // Create a custom console to capture logs
        const logs: string[] = [];
        const customConsole = {
            log: (...args: unknown[]) => {
                logs.push(args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' '));
            },
            error: (...args: unknown[]) => {
                logs.push(`❌ ${args.map(arg => String(arg)).join(' ')}`);
            },
            warn: (...args: unknown[]) => {
                logs.push(`⚠️ ${args.map(arg => String(arg)).join(' ')}`);
            }
        };

        try {
            if (language === 'javascript') {
                // Create a sandboxed function
                const fn = new Function('console', code);
                fn(customConsole);
                setOutput(logs.length > 0 ? logs : ['✓ Code executed successfully (no output)']);
            } else {
                setOutput(['⚠️ Python execution requires a backend service.', 'Try running this code in a Python environment.']);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Execution error');
        } finally {
            setIsRunning(false);
        }
    }, [code, language]);

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
                <div className="mt-3 flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-600 text-xs font-bold rounded-full uppercase">
                        {language}
                    </span>
                </div>
            </div>

            {/* Code Editor */}
            <div className="border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
                    <span className="text-sm text-gray-500 font-medium">Code Editor</span>
                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {isRunning ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                            <Play size={16} />
                        )}
                        Run Code
                    </button>
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none"
                    spellCheck={false}
                    placeholder="Write your code here..."
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
                            <span>{error}</span>
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
                {/* Tips */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Exercise Tips:</strong> Try modifying the code and running it multiple times.
                        Experiment with different inputs!
                    </p>
                </div>

                {/* Completion Checkbox */}
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
