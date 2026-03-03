'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, FileText, Video, Link, HardDrive, Volume2 } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import type { Resource, ResourceType } from '@/types';

const TYPE_CONFIG: Record<ResourceType, { label: string; color: string; Icon: React.ElementType }> = {
    pdf: { label: 'PDF', color: 'text-red-400 bg-red-500/10 border-red-500/20', Icon: FileText },
    video: { label: 'Video', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', Icon: Video },
    audio: { label: 'Audio', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', Icon: Volume2 },
    link: { label: 'Link', color: 'text-green-400 bg-green-500/10 border-green-500/20', Icon: Link },
    drive: { label: 'Drive', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', Icon: HardDrive },
};

interface ResourceCardProps {
    resource: Resource;
    index?: number;
}

export default function ResourceCard({ resource, index = 0 }: ResourceCardProps) {
    const [copied, setCopied] = useState(false);
    const config = TYPE_CONFIG[resource.type] || TYPE_CONFIG.link;
    const { label, color, Icon } = config;

    const handleCopy = async () => {
        const ok = await copyToClipboard(resource.url);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            className="group flex items-start gap-4 p-4 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/25 transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Type icon */}
            <div className={cn('flex-shrink-0 w-10 h-10 border flex items-center justify-center', color)}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-[10px] font-semibold uppercase tracking-wider border px-1.5 py-0.5', color)}>
                                {label}
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-snug">
                            {resource.title}
                        </h3>
                        {resource.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{resource.description}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row items-center gap-2 sm:flex-shrink-0">
                        <button
                            onClick={handleCopy}
                            title="Copiar link"
                            className={cn(
                                'flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border transition-all duration-200 flex-1 sm:flex-none',
                                copied
                                    ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                    : 'text-slate-400 border-white/10 hover:text-yellow-400 hover:border-yellow-600/30'
                            )}
                        >
                            {copied ? (
                                <><Check className="w-3 h-3" /><span>¡Copiado!</span></>
                            ) : (
                                <><Copy className="w-3 h-3" /><span>Copiar</span></>
                            )}
                        </button>
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs gold-gradient text-black font-semibold hover:opacity-90 transition-opacity flex-1 sm:flex-none"
                        >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
