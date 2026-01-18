/**
 * Package Loader Module
 * 
 * Responsibility: Load packages on-demand for JavaScript and Python
 * Following SRP - only handles package loading, not execution
 */

export type SupportedLanguage = 'javascript' | 'python';

// Popular JavaScript packages available via CDN with their global variable names
const JS_PACKAGE_CDN_MAP: Record<string, { url: string; globalName: string }> = {
    'lodash': {
        url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
        globalName: '_'
    },
    'moment': {
        url: 'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js',
        globalName: 'moment'
    },
    'axios': {
        url: 'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js',
        globalName: 'axios'
    },
    'dayjs': {
        url: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js',
        globalName: 'dayjs'
    },
    'uuid': {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js',
        globalName: 'uuid'
    },
    'mathjs': {
        url: 'https://cdn.jsdelivr.net/npm/mathjs@12.0.0/lib/browser/math.min.js',
        globalName: 'math'
    },
    'chart.js': {
        url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
        globalName: 'Chart'
    },
    'd3': {
        url: 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
        globalName: 'd3'
    },
    'three': {
        url: 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js',
        globalName: 'THREE'
    },
    'jquery': {
        url: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        globalName: '$'
    },
    'rxjs': {
        url: 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',
        globalName: 'rxjs'
    },
    'ramda': {
        url: 'https://cdn.jsdelivr.net/npm/ramda@0.29.1/dist/ramda.min.js',
        globalName: 'R'
    },
    'underscore': {
        url: 'https://cdn.jsdelivr.net/npm/underscore@1.13.6/underscore-umd-min.js',
        globalName: '_'
    },
};

// Python packages pre-built in Pyodide
// Python packages pre-built in Pyodide (Strict Core)
const PYODIDE_BUILTIN_PACKAGES = [
    'numpy', 'pandas', 'scipy', 'matplotlib', 'scikit-learn',
    'pillow', 'networkx', 'sympy', 'statsmodels', 'micropip',
    'pytz', 'packaging', 'six' // Dependencies often needed
];
// Note: seaborn, bokeh, plotly, nltk, opencv-python should be loaded via micropip

// Map Python import names to actual package names
// e.g., `import PIL` needs to load `pillow`, `import sklearn` needs `scikit-learn`
const PYTHON_PACKAGE_ALIASES: Record<string, string> = {
    'pil': 'pillow',
    'sklearn': 'scikit-learn',
    'cv2': 'opencv-python',
    'bs4': 'beautifulsoup4',
    'yaml': 'pyyaml',
};

// Track loaded packages to avoid re-loading
const loadedPackages = {
    javascript: new Set<string>(),
    python: new Set<string>()
};

// Cache for JavaScript global objects
const jsPackageCache: Record<string, unknown> = {};

/**
 * Reset loaded Python packages cache
 * Call this when a new Pyodide instance is created
 */
export function resetLoadedPythonPackages(): void {
    loadedPackages.python.clear();
}

/**
 * Check if a JavaScript package is supported
 */
export function isJavaScriptPackageSupported(packageName: string): boolean {
    return packageName.toLowerCase().trim() in JS_PACKAGE_CDN_MAP;
}

/**
 * Check if a Python package is supported
 */
export function isPythonPackageSupported(packageName: string): boolean {
    const normalized = packageName.toLowerCase().trim();
    return PYODIDE_BUILTIN_PACKAGES.includes(normalized);
}

/**
 * Load a JavaScript package from CDN
 */
export async function loadJavaScriptPackage(packageName: string): Promise<unknown> {
    const normalizedName = packageName.toLowerCase().trim();

    // Return cached if already loaded
    if (loadedPackages.javascript.has(normalizedName)) {
        return jsPackageCache[normalizedName];
    }

    const packageInfo = JS_PACKAGE_CDN_MAP[normalizedName];
    if (!packageInfo) {
        throw new Error(
            `Package "${packageName}" is not available. ` +
            `Supported packages: ${Object.keys(JS_PACKAGE_CDN_MAP).join(', ')}`
        );
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = packageInfo.url;
        script.async = true;

        // Monaco Editor adds 'define' to the global scope (AMD loader).
        // Many UMD scripts (like moment, lodash) see 'define' and try to register as AMD modules
        // instead of setting a global variable. We need to hide 'define' temporarily.
        const backupDefine = (window as any).define;
        const backupExports = (window as any).exports;
        const backupModule = (window as any).module;

        (window as any).define = undefined;
        (window as any).exports = undefined;
        (window as any).module = undefined;

        const restoreGlobals = () => {
            (window as any).define = backupDefine;
            (window as any).exports = backupExports;
            (window as any).module = backupModule;
        };

        script.onload = () => {
            restoreGlobals();
            loadedPackages.javascript.add(normalizedName);
            // Use the configured global name for the package
            const loadedPackage = (window as unknown as Record<string, unknown>)[packageInfo.globalName];
            jsPackageCache[normalizedName] = loadedPackage;
            resolve(loadedPackage);
        };

        script.onerror = () => {
            restoreGlobals();
            reject(new Error(`Failed to load package "${packageName}" from CDN`));
        };

        document.head.appendChild(script);
    });
}

/**
 * Load multiple JavaScript packages
 */
export async function loadJavaScriptPackages(packageNames: string[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    for (const name of packageNames) {
        try {
            const pkg = await loadJavaScriptPackage(name);
            // Store with both original name and lowercase for flexible lookup
            result[name] = pkg;
            result[name.toLowerCase()] = pkg;

            // Validate the package was actually loaded
            if (pkg === undefined || pkg === null) {
                console.warn(`Package "${name}" loaded but returned undefined/null`);
            }
        } catch (err) {
            throw err; // Re-throw to stop on first failure
        }
    }

    return result;
}

/**
 * Load Python packages using Pyodide
 */
export async function loadPythonPackages(
    pyodide: unknown,
    packageNames: string[]
): Promise<void> {
    const py = pyodide as {
        loadPackage: (packages: string[]) => Promise<void>;
        runPythonAsync: (code: string) => Promise<void>;
    };

    const packagesToLoad: string[] = [];
    const micropipPackages: string[] = [];

    for (const name of packageNames) {
        const normalizedName = name.toLowerCase().trim();

        // Skip if already loaded (check both original name and alias)
        if (loadedPackages.python.has(normalizedName)) {
            continue;
        }

        // Resolve package alias (e.g., 'pil' -> 'pillow', 'sklearn' -> 'scikit-learn')
        const actualPackageName = PYTHON_PACKAGE_ALIASES[normalizedName] || normalizedName;

        // Skip if the actual package is already loaded
        if (loadedPackages.python.has(actualPackageName)) {
            loadedPackages.python.add(normalizedName); // Mark alias as loaded too
            continue;
        }

        // Check if it's a builtin package
        if (PYODIDE_BUILTIN_PACKAGES.includes(actualPackageName)) {
            packagesToLoad.push(actualPackageName);
            // Track both the alias and actual name
            loadedPackages.python.add(normalizedName);
        } else {
            micropipPackages.push(actualPackageName);
        }
    }

    // Load builtin packages
    if (packagesToLoad.length > 0) {
        await py.loadPackage(packagesToLoad);
        packagesToLoad.forEach(pkg => loadedPackages.python.add(pkg));
    }

    // Load micropip packages (pure Python packages from PyPI)
    if (micropipPackages.length > 0) {
        // First ensure micropip is loaded
        if (!loadedPackages.python.has('micropip')) {
            await py.loadPackage(['micropip']);
            loadedPackages.python.add('micropip');
        }

        for (const pkg of micropipPackages) {
            try {
                await py.runPythonAsync(`
import micropip
await micropip.install("${pkg}")
                `);
                loadedPackages.python.add(pkg);
            } catch {
                throw new Error(
                    `Failed to install package "${pkg}". ` +
                    `It may not be available or compatible with Pyodide.`
                );
            }
        }
    }
}

/**
 * Get list of loaded packages
 */
export function getLoadedPackages(): { javascript: string[]; python: string[] } {
    return {
        javascript: Array.from(loadedPackages.javascript),
        python: Array.from(loadedPackages.python)
    };
}

/**
 * Get available packages for a language
 */
export function getAvailablePackages(language: SupportedLanguage): string[] {
    if (language === 'javascript') {
        return Object.keys(JS_PACKAGE_CDN_MAP);
    }
    return [...PYODIDE_BUILTIN_PACKAGES, '(any pure Python package via micropip)'];
}

/**
 * Parse package names from a comma-separated string
 * @deprecated Use parseImports from importParser.ts for automatic detection
 */
export function parsePackageInput(input: string): string[] {
    return input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/**
 * Get the global variable name for a JavaScript package
 */
export function getPackageGlobalName(packageName: string): string {
    const normalized = packageName.toLowerCase().trim();
    const packageInfo = JS_PACKAGE_CDN_MAP[normalized];
    return packageInfo?.globalName || normalized;
}
