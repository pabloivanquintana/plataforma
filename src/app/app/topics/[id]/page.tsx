import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { MOCK_TOPICS } from '@/lib/mock-data';
import ResourceCard from '@/components/ResourceCard';

// Next.js 15+ params is a Promise
export default async function TopicDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const topic = MOCK_TOPICS.find((t) => t.id === id);

    if (!topic) notFound();

    return (
        <div className="space-y-8 animate-fadeInUp">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-slate-500">
                <Link href="/app/topics" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Temas
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-400">Tema {topic.order}</span>
            </nav>

            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 border border-yellow-600/25 bg-yellow-600/5 flex items-center justify-center">
                        <span className="text-yellow-500 font-serif font-bold text-lg">{topic.order}</span>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-yellow-600/80 mb-1">Tema {topic.order} · Grado Compañero</p>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">
                            {topic.title}
                        </h1>
                        {topic.description && (
                            <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">{topic.description}</p>
                        )}
                    </div>
                </div>
            </header>

            {/* Resources */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs uppercase tracking-widest text-slate-400">
                        Recursos del tema
                        {topic.resources && (
                            <span className="ml-2 text-yellow-600">({topic.resources.length})</span>
                        )}
                    </h2>
                </div>

                {topic.resources && topic.resources.length > 0 ? (
                    <div className="space-y-2">
                        {topic.resources.map((resource, i) => (
                            <ResourceCard key={resource.id} resource={resource} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-600 border border-white/5">
                        <p>No hay recursos disponibles para este tema todavía.</p>
                    </div>
                )}
            </section>

            {/* Navigation between topics */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                {(() => {
                    const prev = MOCK_TOPICS.find((t) => t.order === topic.order - 1);
                    const next = MOCK_TOPICS.find((t) => t.order === topic.order + 1);
                    return (
                        <>
                            {prev ? (
                                <Link
                                    href={`/app/topics/${prev.id}`}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-yellow-400 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:block">{prev.title}</span>
                                </Link>
                            ) : <span />}
                            {next ? (
                                <Link
                                    href={`/app/topics/${next.id}`}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-yellow-400 transition-colors"
                                >
                                    <span className="hidden sm:block">{next.title}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : <span />}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
