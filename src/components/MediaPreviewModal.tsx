'use client';

import { X, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    type: 'video' | 'audio' | 'pdf' | 'link';
}

export default function MediaPreviewModal({ isOpen, onClose, url, title, type }: MediaPreviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(false);
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, url]);

    if (!isOpen) return null;

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isDrive = url.includes('drive.google.com');

    const getEmbedUrl = () => {
        if (isYouTube) {
            const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
            return `https://www.youtube.com/embed/${id}`;
        }
        if (isDrive && type === 'pdf') {
            // Convert view link to preview link for Drive
            return url.replace('/view', '/preview');
        }
        if (type === 'pdf') {
            // Use Google Docs viewer as a fallback for direct PDFs to ensure cross-browser compatibility
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        }
        return url;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#0a0a0a] border border-yellow-600/20 w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0d0d0d]">
                    <div className="flex-1 min-w-0 mr-4">
                        <h3 className="text-sm font-medium text-slate-200 truncate">{title}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-yellow-600/60 mt-0.5">{type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-white transition-colors border border-white/5 hover:bg-white/5"
                            title="Abrir en pestaña nueva"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors border border-white/5 hover:bg-white/5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 relative bg-[#050505] overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-yellow-500/50 space-y-3 z-10">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-[10px] uppercase tracking-widest">Cargando previsualización...</p>
                        </div>
                    )}

                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500/50" />
                            <div className="max-w-md">
                                <h4 className="text-slate-200 font-medium mb-1">No se puede previsualizar</h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Este contenido no permite ser visualizado dentro de la plataforma por razones de seguridad del sitio externo.
                                </p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-2 gold-gradient text-black text-xs font-bold uppercase tracking-wider"
                                >
                                    Abrir en pestaña externa
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={getEmbedUrl()}
                            className={cn(
                                "w-full h-full border-0 transition-opacity duration-500",
                                loading ? "opacity-0" : "opacity-100"
                            )}
                            onLoad={() => setLoading(false)}
                            onError={() => setError(true)}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
