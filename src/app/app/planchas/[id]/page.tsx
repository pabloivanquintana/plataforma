'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Calendar, Tag, ExternalLink, Copy, Check, ScrollText } from 'lucide-react';
import { useState, use } from 'react';
import { MOCK_PLANCHAS, MOCK_TOPICS } from '@/lib/mock-data';
import { copyToClipboard } from '@/lib/utils';

export default function PlanchaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const plancha = MOCK_PLANCHAS.find((p) => p.id === id);
    if (!plancha) notFound();

    const relatedTopic = plancha.topic_id
        ? MOCK_TOPICS.find((t) => t.id === plancha.topic_id)
        : null;

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const ok = await copyToClipboard(plancha.resource_url);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="max-w-3xl space-y-8">
            {/* Back */}
            <Link
                href="/app/planchas"
                className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-yellow-400 transition-colors group"
            >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Volver a Planchas
            </Link>

            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border border-yellow-600/20 flex items-center justify-center text-yellow-500/70 font-serif font-bold text-sm flex-shrink-0">
                        {plancha.order_index}
                    </div>
                    <ScrollText className="w-4 h-4 text-yellow-600/50" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-white">{plancha.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" />{plancha.author}</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" />{plancha.date.slice(0, 4)}</span>
                </div>
            </header>

            {/* Body */}
            <div className="space-y-6">
                {/* Description */}
                {plancha.description && (
                    <div className="p-5 border border-white/5 bg-[#0d0d0d]">
                        <h2 className="text-[10px] uppercase tracking-widest text-yellow-600/60 mb-3">Resumen</h2>
                        <p className="text-sm text-slate-300 leading-relaxed">{plancha.description}</p>
                    </div>
                )}

                {/* Tags */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                        <Tag className="w-3 h-3" />Etiquetas
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {plancha.tags.map((tag) => (
                            <Link
                                key={tag}
                                href={`/app/planchas?tag=${tag}`}
                                className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-white/10 text-slate-400 hover:border-yellow-600/30 hover:text-yellow-400 transition-colors"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Related topic */}
                {relatedTopic && (
                    <div className="p-4 border border-yellow-600/15 bg-yellow-500/3">
                        <div className="text-[10px] uppercase tracking-widest text-yellow-600/60 mb-2">Tema relacionado</div>
                        <Link
                            href={`/app/topics/${relatedTopic.id}`}
                            className="text-sm text-yellow-400 hover:text-yellow-300 hover:underline"
                        >
                            {relatedTopic.order}. {relatedTopic.title}
                        </Link>
                    </div>
                )}

                {/* Document access */}
                <div className="p-5 border border-yellow-600/20 bg-yellow-500/3 space-y-3">
                    <h2 className="text-[10px] uppercase tracking-widest text-yellow-600/60">Documento</h2>
                    <p className="text-xs text-slate-500">Accede al documento completo de esta plancha a través del enlace seguro.</p>
                    <div className="flex items-center gap-3">
                        <a
                            href={plancha.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 text-sm gold-gradient text-black font-semibold hover:opacity-90 transition-opacity"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Abrir / Descargar
                        </a>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm border border-white/10 text-slate-400 hover:text-yellow-400 hover:border-yellow-600/30 transition-all"
                        >
                            {copied ? <><Check className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar link</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                {(() => {
                    const prev = MOCK_PLANCHAS.find((p) => p.order_index === plancha.order_index - 1);
                    return prev ? (
                        <Link href={`/app/planchas/${prev.id}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-yellow-400 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Plancha anterior
                        </Link>
                    ) : <div />;
                })()}
                {(() => {
                    const next = MOCK_PLANCHAS.find((p) => p.order_index === plancha.order_index + 1);
                    return next ? (
                        <Link href={`/app/planchas/${next.id}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-yellow-400 transition-colors">
                            Plancha siguiente
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                        </Link>
                    ) : <div />;
                })()}
            </div>
        </div>
    );
}
