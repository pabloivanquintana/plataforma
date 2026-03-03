'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, User, Calendar, Tag, ExternalLink, ScrollText, ChevronRight, Lock } from 'lucide-react';
import { MOCK_PLANCHAS, GRADES } from '@/lib/mock-data';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import type { Plancha } from '@/types';
import type { GradeSlug } from '@/types';

const GRADE_BADGE: Record<GradeSlug, string> = {
    aprendiz: 'border-stone-500/30 bg-stone-500/8 text-stone-400',
    companero: 'border-yellow-600/30 bg-yellow-500/8 text-yellow-500',
    maestro: 'border-purple-500/30 bg-purple-500/8 text-purple-400',
};

export default function PlanchasPage() {
    const { canSeeGrade, gradeName } = useUser();
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState('Todos');
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [gradeFilter, setGradeFilter] = useState<string>('all');

    // accessible grades (respecting hierarchy)
    const accessibleGradeIds = useMemo(
        () => GRADES.filter((g) => canSeeGrade(g.slug as GradeSlug)).map((g) => g.id),
        [canSeeGrade],
    );

    const accessiblePlanchas = useMemo(
        () => MOCK_PLANCHAS.filter((p) => accessibleGradeIds.includes(p.grade_id)),
        [accessibleGradeIds],
    );
    const lockedCount = MOCK_PLANCHAS.length - accessiblePlanchas.length;

    // Derived filter options from accessible planchas only
    const ALL_YEARS = ['Todos', ...Array.from(new Set(accessiblePlanchas.map((p) => p.date.slice(0, 4)))).sort().reverse()];
    const ALL_TAGS = Array.from(new Set(accessiblePlanchas.flatMap((p) => p.tags))).sort();

    const filtered = useMemo(() => {
        return accessiblePlanchas.filter((p) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                p.title.toLowerCase().includes(q) ||
                p.author.toLowerCase().includes(q) ||
                (p.description ?? '').toLowerCase().includes(q) ||
                p.tags.some((t) => t.toLowerCase().includes(q));
            const matchYear = yearFilter === 'Todos' || p.date.startsWith(yearFilter);
            const matchTag = !tagFilter || p.tags.includes(tagFilter);
            const matchGrade = gradeFilter === 'all' || p.grade_id === gradeFilter;
            return matchSearch && matchYear && matchTag && matchGrade;
        }).sort((a, b) => a.order_index - b.order_index);
    }, [accessiblePlanchas, search, yearFilter, tagFilter, gradeFilter]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6">
                <span className="text-xs uppercase tracking-widest text-yellow-600/70">{gradeName}</span>
                <h1 className="text-3xl font-serif font-bold text-white mt-1">
                    <span className="gold-text-gradient">Planchas</span>
                </h1>
                <p className="text-slate-400 mt-2 text-sm max-w-2xl">
                    Trabajos e investigaciones filosóficas presentadas por los Hermanos del Grado. El conocimiento fraternal, preservado y compartido.
                </p>
            </header>

            {/* Filters */}
            <div className="space-y-4">
                {/* Grade filter (only accessible grades) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Grado:</span>
                    <button
                        onClick={() => setGradeFilter('all')}
                        className={cn(
                            'px-3 py-1.5 text-xs border transition-colors',
                            gradeFilter === 'all'
                                ? 'gold-gradient text-black border-transparent font-semibold'
                                : 'text-slate-400 border-white/10 hover:border-yellow-600/30 hover:text-slate-200',
                        )}
                    >
                        Todos
                    </button>
                    {GRADES.filter((g) => canSeeGrade(g.slug as GradeSlug)).map((g) => (
                        <button
                            key={g.id}
                            onClick={() => setGradeFilter(gradeFilter === g.id ? 'all' : g.id)}
                            className={cn(
                                'px-3 py-1.5 text-xs border transition-colors',
                                gradeFilter === g.id
                                    ? cn(GRADE_BADGE[g.slug as GradeSlug], 'font-semibold')
                                    : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200',
                            )}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por título, autor, tema o etiqueta..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-white/8 text-slate-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-yellow-600/30 transition-colors placeholder:text-slate-600"
                    />
                </div>

                {/* Year + Tag filters */}
                <div className="flex flex-wrap items-start gap-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">Año:</span>
                        {ALL_YEARS.map((y) => (
                            <button
                                key={y}
                                onClick={() => setYearFilter(y)}
                                className={cn(
                                    'px-3 py-1.5 text-xs border transition-colors',
                                    yearFilter === y
                                        ? 'gold-gradient text-black border-transparent font-semibold'
                                        : 'text-slate-400 border-white/10 hover:border-yellow-600/30 hover:text-slate-200',
                                )}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-3 h-3 text-slate-500" />
                        <button
                            onClick={() => setTagFilter(null)}
                            className={cn(
                                'px-2.5 py-1 text-[10px] border transition-colors uppercase tracking-wide',
                                !tagFilter
                                    ? 'text-yellow-400 border-yellow-600/40 bg-yellow-500/8'
                                    : 'text-slate-500 border-white/8 hover:text-slate-300',
                            )}
                        >
                            Todos
                        </button>
                        {ALL_TAGS.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                                className={cn(
                                    'px-2.5 py-1 text-[10px] border transition-colors uppercase tracking-wide',
                                    tagFilter === tag
                                        ? 'text-yellow-400 border-yellow-600/40 bg-yellow-500/8'
                                        : 'text-slate-500 border-white/8 hover:text-slate-300 hover:border-white/20',
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{filtered.length} {filtered.length === 1 ? 'plancha' : 'planchas'}</span>
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                    <ScrollText className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-slate-500 text-sm">No hay planchas que coincidan con los filtros.</p>
                    <button
                        onClick={() => { setSearch(''); setYearFilter('Todos'); setTagFilter(null); setGradeFilter('all'); }}
                        className="text-yellow-500 text-xs hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((plancha, i) => (
                        <PlanchaRow key={plancha.id} plancha={plancha} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PlanchaRow({ plancha, index }: { plancha: Plancha; index: number }) {
    const grade = GRADES.find((g) => g.id === plancha.grade_id);
    const gradeBadge = grade ? GRADE_BADGE[grade.slug as GradeSlug] : '';

    return (
        <div
            className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-4 sm:p-5 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/25 transition-all duration-300 animate-fadeInUp"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-start gap-4 w-full sm:w-auto">
                {/* Order index */}
                <div className="flex-shrink-0 w-10 h-10 border border-yellow-600/20 flex items-center justify-center text-yellow-500/70 font-serif font-bold text-sm">
                    {plancha.order_index}
                </div>

                {/* Mobile Title & Grade (When in column) */}
                <div className="flex-1 min-w-0 sm:hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug">
                            {plancha.title}
                        </h3>
                        {grade && (
                            <span className={cn('text-[9px] uppercase tracking-wider px-1.5 py-0.5 border flex-shrink-0', gradeBadge)}>
                                {grade.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content (Title & Grade moved here for desktop, metadata for both) */}
            <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug">
                        {plancha.title}
                    </h3>
                    {grade && (
                        <span className={cn('text-[9px] uppercase tracking-wider px-1.5 py-0.5 border flex-shrink-0', gradeBadge)}>
                            {grade.name}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{plancha.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plancha.date.slice(0, 4)}</span>
                </div>
                {plancha.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{plancha.description}</p>
                )}
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {plancha.tags.map((tag) => (
                        <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-white/8 text-slate-500">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:flex-shrink-0">
                <Link
                    href={`/app/planchas/${plancha.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-400 border border-white/10 hover:text-slate-200 hover:border-white/20 transition-colors flex-1 sm:flex-none"
                >
                    Ver
                    <ChevronRight className="w-3 h-3" />
                </Link>
                <a
                    href={plancha.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs gold-gradient text-black font-semibold hover:opacity-90 transition-opacity flex-1 sm:flex-none"
                >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                </a>
            </div>
        </div>
    );
}
