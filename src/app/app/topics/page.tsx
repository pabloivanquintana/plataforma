'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { MOCK_TOPICS, GRADES } from '@/lib/mock-data';
import { ChevronRight, BookOpen, FileText, Lock } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import type { GradeSlug } from '@/types';
import { GRADE_ORDER } from '@/types';

const GRADE_LABEL: Record<GradeSlug, { label: string; color: string }> = {
    aprendiz: { label: 'Aprendiz', color: 'text-stone-400 border-stone-600/30 bg-stone-700/20' },
    companero: { label: 'Compañero', color: 'text-yellow-400 border-yellow-600/20 bg-yellow-700/10' },
    maestro: { label: 'Maestro', color: 'text-purple-300 border-purple-600/20 bg-purple-900/20' },
};

export default function TopicsPage() {
    const { canSeeGrade, gradeName, gradeSlug } = useUser();

    // Agrupar temas por grado y filtrar los que puede ver el usuario
    const grouped = useMemo(() => {
        return GRADES.map((grade) => ({
            grade,
            canSee: canSeeGrade(grade.slug as GradeSlug),
            topics: MOCK_TOPICS.filter((t) => t.grade_id === grade.id),
        })).filter((g) => g.topics.length > 0);
    }, [canSeeGrade]);

    const visibleTopics = grouped.filter((g) => g.canSee).flatMap((g) => g.topics);
    const totalResources = visibleTopics.reduce((a, t) => a + (t.resources?.length ?? 0), 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-yellow-600/80 mb-2">{gradeName}</p>
                        <h1 className="text-3xl font-serif font-bold text-white">
                            Programa de <span className="gold-text-gradient">Estudio</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm">
                            {visibleTopics.length} {visibleTopics.length === 1 ? 'tema' : 'temas'} disponibles según tu grado.
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs">
                        <BookOpen className="w-4 h-4" />
                        <span>{totalResources} recursos</span>
                    </div>
                </div>
            </header>

            {/* Topics grouped by grade */}
            {grouped.filter(g => g.canSee).map(({ grade, topics }) => {
                const slug = grade.slug as GradeSlug;
                const cfg = GRADE_LABEL[slug];
                const userOrder = GRADE_ORDER[gradeSlug];
                const gradeOrder = GRADE_ORDER[slug];

                return (
                    <section key={grade.id} className="space-y-2">
                        {/* Grade header */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className={cn('text-[10px] uppercase tracking-widest px-2.5 py-1 border', cfg.color)}>
                                {cfg.label}
                            </span>
                            {gradeOrder > userOrder && (
                                <span className="text-[10px] text-slate-600">Acceso por jerarquía</span>
                            )}
                        </div>

                        {topics.map((topic, i) => (
                            <Link key={topic.id} href={`/app/topics/${topic.id}`}>
                                <div
                                    className="group flex items-center gap-5 p-5 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/30 hover:bg-[#111] transition-all duration-300 animate-fadeInUp"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 border border-yellow-600/20 bg-yellow-600/5 flex items-center justify-center">
                                        <span className="text-yellow-500 font-serif font-bold text-sm">{topic.order}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-medium text-slate-200 group-hover:text-yellow-300 transition-colors">{topic.title}</h2>
                                        {topic.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topic.description}</p>}
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-4 text-xs text-slate-600">
                                        {topic.resources && topic.resources.length > 0 && (
                                            <span className="flex items-center gap-1.5">
                                                <FileText className="w-3 h-3" />
                                                {topic.resources.length} rec.
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </section>
                );
            })}
        </div>
    );
}
