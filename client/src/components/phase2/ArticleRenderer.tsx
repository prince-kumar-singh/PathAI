import React from 'react';
import { CheckCircle, ExternalLink, BookOpen, FileText, Globe } from 'lucide-react';

interface ArticleRendererProps {
    title: string;
    url?: string;
    platform?: string;
    description?: string;
    completed?: boolean;
    onComplete?: () => void;
    isLoading?: boolean;
}

/**
 * Get platform-specific icon and color
 */
function getPlatformStyle(platform?: string): { icon: React.ReactNode; bgColor: string; textColor: string } {
    const p = platform?.toLowerCase() || '';

    if (p.includes('medium')) {
        return { icon: <FileText size={24} />, bgColor: 'bg-gray-900', textColor: 'text-white' };
    }
    if (p.includes('freecodecamp')) {
        return { icon: <BookOpen size={24} />, bgColor: 'bg-green-600', textColor: 'text-white' };
    }
    if (p.includes('dev.to')) {
        return { icon: <FileText size={24} />, bgColor: 'bg-black', textColor: 'text-white' };
    }
    if (p.includes('mdn') || p.includes('mozilla')) {
        return { icon: <Globe size={24} />, bgColor: 'bg-blue-600', textColor: 'text-white' };
    }
    if (p.includes('geeksforgeeks')) {
        return { icon: <BookOpen size={24} />, bgColor: 'bg-green-700', textColor: 'text-white' };
    }
    if (p.includes('w3schools')) {
        return { icon: <Globe size={24} />, bgColor: 'bg-green-500', textColor: 'text-white' };
    }

    return { icon: <BookOpen size={24} />, bgColor: 'bg-indigo-600', textColor: 'text-white' };
}

/**
 * Generate a search URL for the article topic
 */
function generateSearchUrl(title: string, platform?: string): string {
    const query = encodeURIComponent(`${title} tutorial`);
    const p = platform?.toLowerCase() || '';

    if (p.includes('medium')) return `https://medium.com/search?q=${query}`;
    if (p.includes('freecodecamp')) return `https://www.freecodecamp.org/news/search/?query=${query}`;
    if (p.includes('dev.to')) return `https://dev.to/search?q=${query}`;
    if (p.includes('mdn')) return `https://developer.mozilla.org/en-US/search?q=${query}`;
    if (p.includes('geeksforgeeks')) return `https://www.geeksforgeeks.org/search/?q=${query}`;
    if (p.includes('w3schools')) return `https://www.w3schools.com/search/search_result.asp?query=${query}`;

    return `https://www.google.com/search?q=${query}`;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({
    title,
    url,
    platform,
    description,
    completed = false,
    onComplete,
    isLoading = false
}) => {
    const { icon, bgColor, textColor } = getPlatformStyle(platform);
    const articleUrl = url && url.startsWith('http') ? url : generateSearchUrl(title, platform);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Article Header */}
            <div className={`${bgColor} ${textColor} p-8`}>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        {icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm opacity-80 mb-1">{platform || 'Article'}</p>
                        <h3 className="text-2xl font-bold">{title}</h3>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <div className="p-6">
                {description && (
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* External Link Button */}
                <a
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors group"
                >
                    <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                    {url && url.startsWith('http') ? 'Read Article' : 'Search for Article'}
                </a>

                {/* Reading Tips */}
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-800">
                        <strong>💡 Tip:</strong> Take notes while reading and try to implement what you learn!
                    </p>
                </div>

                {/* Completion Checkbox */}
                <label className={`
                    mt-6 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
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
                        {completed ? 'Article completed ✓' : 'I read this article'}
                    </span>
                    {isLoading && (
                        <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                    )}
                </label>
            </div>
        </div>
    );
};

export default ArticleRenderer;
