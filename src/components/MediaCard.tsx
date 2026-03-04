'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, FileText, Video, Link, Volume2 } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import type { MediaItem, MediaType } from '@/types';

const TYPE_CONFIG: Record<MediaType, { label: string; color: string; Icon: React.ElementType }> = {
    pdf: { label: 'PDF', color: 'text-red-400 bg-red-500/10 border-red-500/20', Icon: FileText },
    video: { label: 'Video', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', Icon: Video },
    audio: { label: 'Audio', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', Icon: Volume2 },
    link: { label: 'Link', color: 'text-green-400 bg-green-500/10 border-green-500/20', Icon: Link },
};

interface MediaCardProps {
    item: MediaItem;
    index?: number;
    onPreview?: (item: MediaItem) => void;
}

export default function MediaCard({ item, index = 0, onPreview }: MediaCardProps) {
    const [copied, setCopied] = useState(false);
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.link;
    const { label, color, Icon } = config;

    const handleCopy = async () => {
        const ok = await copyToClipboard(item.url);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            className="group p-5 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/25 transition-all duration-300 animate-fadeInUp flex flex-col"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Type badge */}
            <div className="flex items-center justify-between mb-3">
                <div className={cn('flex items-center gap-1.5 px-2 py-1 border text-[10px] font-semibold uppercase tracking-wide', color)}>
                    <Icon className="w-3 h-3" />
                    {label}
                </div>
            </div>

            {/* Content */}
            <h3 className="font-medium text-slate-200 group-hover:text-white transition-colors leading-snug mb-2">
                {item.title}
            </h3>
            {item.description && (
                <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-4">{item.description}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                <button
                    onClick={handleCopy}
                    className={cn(
                        'p-2 text-slate-400 border border-white/10 hover:text-yellow-400 hover:border-yellow-600/30 transition-all duration-200',
                        copied && 'text-green-400 border-green-500/30 bg-green-500/10'
                    )}
                    title="Copiar link"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {onPreview && (
                    <button
                        onClick={() => onPreview(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition-all"
                    >
                        Ver
                    </button>
                )}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs gold-gradient text-black font-semibold hover:opacity-90 transition-opacity",
                        onPreview ? "w-24" : "flex-1"
                    )}
                >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                </a>
            </div>
        </div>
    );
}
