/**
 * Import Parser Module
 * 
 * Responsibility: Parse JavaScript/Python code to extract package/module names
 * from import statements automatically.
 * Following SRP - only handles parsing, not loading or execution
 */

export type SupportedLanguage = 'javascript' | 'python';

/**
 * Parse JavaScript import statements
 * Handles: 
 * - ES6 imports: import X from 'pkg', import { X } from 'pkg', import * as X from 'pkg'
 * - CommonJS: require('pkg'), require("pkg")
 * - Dynamic imports: import('pkg')
 */
export function parseJavaScriptImports(code: string): string[] {
    const imports = new Set<string>();

    // ES6 import patterns: import X from 'package' or import { X } from 'package'
    const es6Pattern = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;

    // CommonJS require pattern: require('package') or require("package")
    const requirePattern = /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;

    // Dynamic import pattern: import('package')
    const dynamicPattern = /import\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;

    let match;

    // Extract ES6 imports
    while ((match = es6Pattern.exec(code)) !== null) {
        const pkg = extractPackageName(match[1]);
        if (pkg && !isBuiltinJS(pkg)) {
            imports.add(pkg);
        }
    }

    // Extract require calls
    while ((match = requirePattern.exec(code)) !== null) {
        const pkg = extractPackageName(match[1]);
        if (pkg && !isBuiltinJS(pkg)) {
            imports.add(pkg);
        }
    }

    // Extract dynamic imports
    while ((match = dynamicPattern.exec(code)) !== null) {
        const pkg = extractPackageName(match[1]);
        if (pkg && !isBuiltinJS(pkg)) {
            imports.add(pkg);
        }
    }

    return Array.from(imports);
}

/**
 * Parse Python import statements
 * Handles:
 * - import pkg
 * - import pkg as alias
 * - from pkg import X
 * - from pkg.submodule import X
 */
export function parsePythonImports(code: string): string[] {
    const imports = new Set<string>();

    // Pattern for: import pkg, import pkg as alias, import pkg1, pkg2
    const importPattern = /^\s*import\s+([\w,\s]+)/gm;

    // Pattern for: from pkg import X, from pkg.sub import X
    const fromPattern = /^\s*from\s+([\w.]+)\s+import/gm;

    let match;

    // Extract 'import X' statements
    while ((match = importPattern.exec(code)) !== null) {
        const modulesPart = match[1];
        // Split by comma and handle 'as' aliases
        const modules = modulesPart.split(',').map(m => {
            // Remove 'as alias' part
            return m.trim().split(/\s+as\s+/)[0].trim();
        });

        modules.forEach(mod => {
            // Get the root package name (before any dot)
            const rootPkg = mod.split('.')[0];
            if (rootPkg && !isBuiltinPython(rootPkg)) {
                imports.add(rootPkg);
            }
        });
    }

    // Extract 'from X import' statements
    while ((match = fromPattern.exec(code)) !== null) {
        const modulePath = match[1];
        // Get the root package name (first part before any dot)
        const rootPkg = modulePath.split('.')[0];
        if (rootPkg && !isBuiltinPython(rootPkg)) {
            imports.add(rootPkg);
        }
    }

    return Array.from(imports);
}

/**
 * Parse imports based on language
 */
export function parseImports(code: string, language: SupportedLanguage): string[] {
    if (language === 'javascript') {
        return parseJavaScriptImports(code);
    }
    return parsePythonImports(code);
}

/**
 * Extract the package name from an import path
 * Handles scoped packages like @scope/package
 */
function extractPackageName(importPath: string): string {
    if (!importPath) return '';

    // Handle scoped packages: @scope/package -> @scope/package
    if (importPath.startsWith('@')) {
        const parts = importPath.split('/');
        if (parts.length >= 2) {
            return `${parts[0]}/${parts[1]}`;
        }
        return importPath;
    }

    // Regular package: lodash/fp -> lodash
    return importPath.split('/')[0];
}

/**
 * Check if a package is a JavaScript builtin or browser global
 */
function isBuiltinJS(pkg: string): boolean {
    const builtins = new Set([
        // Browser globals
        'window', 'document', 'console', 'navigator', 'location', 'history',
        'fetch', 'localStorage', 'sessionStorage', 'indexedDB',
        // Node.js core modules (won't work in browser anyway)
        'fs', 'path', 'http', 'https', 'url', 'util', 'os', 'events',
        'stream', 'buffer', 'crypto', 'child_process', 'cluster'
    ]);
    return builtins.has(pkg);
}

/**
 * Check if a package is a Python standard library module
 */
function isBuiltinPython(pkg: string): boolean {
    const builtins = new Set([
        // Common standard library modules
        'sys', 'os', 'io', 're', 'json', 'math', 'random', 'time', 'datetime',
        'collections', 'itertools', 'functools', 'operator', 'string',
        'typing', 'dataclasses', 'abc', 'copy', 'pickle', 'hashlib',
        'pathlib', 'glob', 'shutil', 'tempfile', 'csv', 'configparser',
        'logging', 'warnings', 'traceback', 'unittest', 'doctest',
        'threading', 'multiprocessing', 'queue', 'asyncio', 'concurrent',
        'socket', 'email', 'html', 'xml', 'urllib', 'http',
        'struct', 'codecs', 'unicodedata', 'base64', 'binascii',
        'numbers', 'decimal', 'fractions', 'statistics', 'cmath',
        'array', 'enum', 'graphlib', 'heapq', 'bisect',
        'weakref', 'types', 'inspect', 'dis', 'gc',
        'builtins', '__future__', 'contextlib', 'atexit',
        // Pyodide has these available without explicit loading
        'micropip'
    ]);
    return builtins.has(pkg);
}

/**
 * Check if detected packages are valid/supported
 */
export function filterSupportedPackages(
    packages: string[],
    _language: SupportedLanguage,
    supportedList?: string[]
): { supported: string[]; unsupported: string[] } {
    if (!supportedList) {
        return { supported: packages, unsupported: [] };
    }

    const supported: string[] = [];
    const unsupported: string[] = [];

    for (const pkg of packages) {
        if (supportedList.includes(pkg.toLowerCase())) {
            supported.push(pkg);
        } else {
            unsupported.push(pkg);
        }
    }

    return { supported, unsupported };
}
