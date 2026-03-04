'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, BookOpen, FileText, Lock, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { createClient } from '@/lib/supabase/client';
import { MOCK_TOPICS, GRADES as MOCK_GRADES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { GradeSlug, Topic, Grade } from '@/types';
import { GRADE_ORDER } from '@/types';

const GRADE_LABEL: Record<GradeSlug, { label: string; color: string }> = {
    aprendiz: { label: 'Aprendiz', color: 'text-stone-400 border-stone-600/30 bg-stone-700/20' },
    companero: { label: 'Compañero', color: 'text-yellow-400 border-yellow-600/20 bg-yellow-700/10' },
    maestro: { label: 'Maestro', color: 'text-purple-300 border-purple-600/20 bg-purple-900/20' },
};

export default function TopicsPage() {
    const { canSeeGrade, gradeName, gradeSlug, isAdmin } = useUser();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<GradeSlug>(gradeSlug);

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== '';

    useEffect(() => {
        async function fetchData() {
            if (!hasSupabase) {
                setTopics(MOCK_TOPICS);
                setGrades(MOCK_GRADES);
                setLoading(false);
                return;
            }

            try {
                const supabase = createClient();
                const [tRes, gRes] = await Promise.all([
                    supabase.from('topics').select('*, resources(*)').order('order'),
                    supabase.from('grades').select('*').order('name')
                ]);

                if (tRes.data) setTopics(tRes.data as any);
                if (gRes.data) setGrades(gRes.data as any);
            } catch (err) {
                console.error('Error fetching data:', err);
                setTopics(MOCK_TOPICS);
                setGrades(MOCK_GRADES);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [hasSupabase]);

    // Ensure activeTab is set correctly once gradeSlug is available
    useEffect(() => {
        if (gradeSlug) setActiveTab(gradeSlug);
    }, [gradeSlug]);

    const isMaestroOrAdmin = isAdmin || gradeSlug === 'maestro';

    const filteredGrades = useMemo(() => {
        if (isMaestroOrAdmin) return grades.sort((a, b) => GRADE_ORDER[a.slug as GradeSlug] - GRADE_ORDER[b.slug as GradeSlug]);
        return grades.filter(g => g.slug === gradeSlug);
    }, [grades, isMaestroOrAdmin, gradeSlug]);

    const currentGrade = grades.find(g => g.slug === activeTab);
    const currentTopics = topics.filter(t => t.grade_id === currentGrade?.id);
    const totalResources = currentTopics.reduce((a, t) => a + (t.resources?.length ?? 0), 0);

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500/50" />
                <p className="text-xs uppercase tracking-widest text-slate-500">Cargando programa...</p>
            </div>
        );
    }

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
                    </div>
                </div>
            </header>

            {/* Tabs for Maestro/Admin */}
            {isMaestroOrAdmin && (
                <div className="flex items-center gap-1 border-b border-white/5 pb-px">
                    {filteredGrades.map((g) => (
                        <button
                            key={g.id}
                            onClick={() => setActiveTab(g.slug as GradeSlug)}
                            className={cn(
                                "px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all relative",
                                activeTab === g.slug
                                    ? "text-yellow-500"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {g.name}
                            {activeTab === g.slug && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Content List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-serif italic text-slate-400">
                        {isMaestroOrAdmin ? `Mostrando temas de ${currentGrade?.name}` : "Temas de tu grado"}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-600 text-[10px] uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{totalResources} recursos</span>
                    </div>
                </div>

                {currentTopics.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-white/10 rounded-lg">
                        <FileText className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm">No existen temas cargados para este grado aún.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {currentTopics.map((topic, i) => (
                            <div
                                key={topic.id}
                                className="group flex items-start gap-5 p-5 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/20 transition-all duration-300 animate-fadeInUp"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <div className="flex-shrink-0 w-10 h-10 border border-yellow-600/20 bg-yellow-600/5 flex items-center justify-center mt-0.5">
                                    <span className="text-yellow-500 font-serif font-bold text-sm">{topic.order}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-slate-200 group-hover:text-yellow-500/90 transition-colors uppercase tracking-wide text-sm">{topic.title}</h3>
                                    {topic.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{topic.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
