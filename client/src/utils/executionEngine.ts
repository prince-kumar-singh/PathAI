/**
 * Execution Engine Module
 * 
 * Responsibility: Execute code in the correct runtime (JavaScript or Python)
 * Following SRP - only handles execution, not package loading or UI
 */

import { loadPythonPackages, parsePackageInput, resetLoadedPythonPackages } from './packageLoader';
import { parsePythonImports } from './importParser';

export interface ExecutionResult {
    output: string[];
    error: string | null;
    detectedPackages?: string[];
}

/**
 * Execute JavaScript code in a sandboxed environment
 */
export function executeJavaScript(
    code: string,
    loadedPackages?: Record<string, unknown>
): ExecutionResult {
    const logs: string[] = [];

    // Create a custom console to capture logs
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
        },
        info: (...args: unknown[]) => {
            logs.push(`ℹ️ ${args.map(arg => String(arg)).join(' ')}`);
        }
    };

    // Create a mock require function that returns loaded packages
    const mockRequire = (packageName: string) => {
        // Direct lookup
        if (loadedPackages && packageName in loadedPackages) {
            const pkg = loadedPackages[packageName];
            if (pkg !== undefined && pkg !== null) {
                return pkg;
            }
        }

        // Lowercase lookup
        const normalizedName = packageName.toLowerCase();
        if (loadedPackages && normalizedName in loadedPackages) {
            const pkg = loadedPackages[normalizedName];
            if (pkg !== undefined && pkg !== null) {
                return pkg;
            }
        }

        // Check if package exists but is undefined (CDN loading issue)
        if (loadedPackages && (packageName in loadedPackages || normalizedName in loadedPackages)) {
            throw new Error(`Package "${packageName}" was loaded but is undefined. The CDN script may not have set the global correctly.`);
        }

        const availablePackages = Object.keys(loadedPackages || {}).filter(k => loadedPackages![k] !== undefined);
        throw new Error(`Package "${packageName}" is not loaded. Available: ${availablePackages.join(', ') || 'none'}`);
    };

    // Create a mock import function (for dynamic imports)
    const mockImport = async (packageName: string) => {
        const pkg = mockRequire(packageName);
        return { default: pkg, ...((typeof pkg === 'object' && pkg !== null) ? pkg : {}) };
    };

    try {
        // Build the sandbox context - provide require() and import() mocks
        // Instead of injecting packages as global variables (which causes "already declared" errors),
        // we let users use require() or access them via the loaded packages object
        const sandboxContext: string[] = ['console', 'require', '__import__', '__packages__'];
        const sandboxArgs: unknown[] = [customConsole, mockRequire, mockImport, loadedPackages || {}];

        // Wrap the code to handle ES6 import syntax by transforming it
        // This converts `import X from 'pkg'` to `const X = require('pkg')`
        let transformedCode = code;

        // Transform ES6 default imports: import X from 'pkg' -> const X = require('pkg')
        transformedCode = transformedCode.replace(
            /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
            'const $1 = require("$2")'
        );

        // Transform ES6 named imports: import { X, Y } from 'pkg' -> const { X, Y } = require('pkg')
        transformedCode = transformedCode.replace(
            /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
            'const {$1} = require("$2")'
        );

        // Transform ES6 namespace imports: import * as X from 'pkg' -> const X = require('pkg')
        transformedCode = transformedCode.replace(
            /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
            'const $1 = require("$2")'
        );

        // Create a sandboxed function with only console and require available
        const fn = new Function(...sandboxContext, transformedCode);
        fn(...sandboxArgs);

        return {
            output: logs.length > 0 ? logs : ['✓ Code executed successfully (no output)'],
            error: null
        };
    } catch (err) {
        return {
            output: [],
            error: err instanceof Error ? err.message : 'JavaScript execution error'
        };
    }
}

/**
 * Execute Python code using Pyodide
 */
export async function executePython(
    code: string,
    pyodide: unknown,
    packages?: string
): Promise<ExecutionResult> {
    const py = pyodide as {
        runPython: (code: string) => unknown;
        runPythonAsync: (code: string) => Promise<unknown>;
        loadPackage: (packages: string[]) => Promise<void>;
    };

    try {
        // Auto-detect packages from code
        const detectedPackages = parsePythonImports(code);

        // Combine with manually specified packages (for backward compatibility)
        const manualPackages = packages?.trim() ? parsePackageInput(packages) : [];
        const allPackages = [...new Set([...detectedPackages, ...manualPackages])];

        // Load all detected and specified packages
        if (allPackages.length > 0) {
            // Debug: print what we are loading
            const debugPy = pyodide as { runPython: (code: string) => void };
            debugPy.runPython(`print("📦 Auto-loading packages: ${allPackages.join(', ')}...")`);

            await loadPythonPackages(pyodide, allPackages);

            debugPy.runPython(`print("✅ Packages loaded.")`);
        }

        // Redirect stdout/stderr to capture print statements
        py.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
        `);

        // Run the user's code (use async to support await in user code)
        await py.runPythonAsync(code);

        // Capture output
        const stdout = py.runPython('sys.stdout.getvalue()') as string;
        const stderr = py.runPython('sys.stderr.getvalue()') as string;

        const outputs: string[] = [];
        if (stdout) {
            outputs.push(...stdout.split('\n').filter((line: string) => line));
        }
        if (stderr) {
            outputs.push(`❌ ${stderr}`);
        }

        // Reset stdout/stderr for next execution
        py.runPython(`
sys.stdout = StringIO()
sys.stderr = StringIO()
        `);

        return {
            output: outputs.length > 0 ? outputs : ['✓ Code executed successfully (no output)'],
            error: null,
            detectedPackages: detectedPackages.length > 0 ? detectedPackages : undefined
        };
    } catch (err) {
        return {
            output: [],
            error: err instanceof Error ? err.message : 'Python execution error'
        };
    }
}

/**
 * Initialize Pyodide runtime
 */
export async function initializePyodide(): Promise<unknown> {
    try {
        const pyodideModule = await (window as unknown as {
            loadPyodide: (config: { indexURL: string }) => Promise<unknown>
        }).loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });

        // Reset package cache since we have a new Pyodide instance
        resetLoadedPythonPackages();

        return pyodideModule;
    } catch {
        throw new Error('Failed to load Python runtime. Please check your internet connection.');
    }
}
