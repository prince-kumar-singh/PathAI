import React from 'react';
import { CheckCircle, Youtube, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
    title: string;
    url?: string;
    platform?: string;
    completed?: boolean;
    onComplete?: () => void;
    isLoading?: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/results\?search_query=/  // Search URL - no ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * Generate a YouTube search URL for a topic
 */
function generateSearchUrl(title: string): string {
    const query = encodeURIComponent(`${title} tutorial`);
    return `https://www.youtube.com/results?search_query=${query}`;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    title,
    url,
    platform,
    completed = false,
    onComplete,
    isLoading = false
}) => {
    const videoId = url ? extractYouTubeId(url) : null;
    const isEmbeddable = videoId !== null;
    const searchUrl = !isEmbeddable ? generateSearchUrl(title) : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Video Embed or Placeholder */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
                {isEmbeddable ? (
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex flex-col items-center justify-center text-white p-8">
                        <Youtube size={64} className="mb-4 opacity-80" />
                        <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
                        <p className="text-sm text-red-100 text-center mb-6">
                            Click below to search for this video on YouTube
                        </p>
                        <a
                            href={searchUrl || url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                        >
                            <ExternalLink size={18} />
                            Search on YouTube
                        </a>
                    </div>
                )}
            </div>

            {/* Video Info & Completion */}
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{title}</h3>
                        <p className="text-sm text-gray-500">
                            {platform || 'YouTube'} {isEmbeddable ? '• Embedded' : '• External Link'}
                        </p>
                    </div>
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
                        {completed ? 'Video completed ✓' : 'I watched this video'}
                    </span>
                    {isLoading && (
                        <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                    )}
                </label>
            </div>
        </div>
    );
};

export default VideoPlayer;
