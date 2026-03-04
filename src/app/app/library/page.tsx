'use client';

import { useState, useMemo, useEffect } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { MOCK_MEDIA, GRADES as MOCK_GRADES } from '@/lib/mock-data';
import MediaCard from '@/components/MediaCard';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import { useUser } from '@/context/UserContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { GradeSlug, MediaType, MediaItem, Grade } from '@/types';

const TYPE_FILTERS: { value: MediaType | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'pdf', label: 'PDF' },
    { value: 'link', label: 'Link' },
];

const GRADE_BADGE: Record<GradeSlug, string> = {
    aprendiz: 'border-stone-500/30 bg-stone-500/8 text-stone-400',
    companero: 'border-yellow-600/30 bg-yellow-500/8 text-yellow-500',
    maestro: 'border-purple-500/30 bg-purple-500/8 text-purple-400',
};

export default function LibraryPage() {
    const { canSeeGrade, gradeName, gradeOrder } = useUser();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
    const [gradeFilter, setGradeFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState<MediaItem | null>(null);

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== '';

    useEffect(() => {
        async function fetchData() {
            if (!hasSupabase) {
                setMediaItems(MOCK_MEDIA);
                setGrades(MOCK_GRADES);
                setLoading(false);
                return;
            }

            try {
                const supabase = createClient();
                const [mRes, gRes] = await Promise.all([
                    supabase.from('media_items').select('*').order('created_at', { ascending: false }),
                    supabase.from('grades').select('*').order('name')
                ]);

                if (mRes.data) setMediaItems(mRes.data as any);
                if (gRes.data) setGrades(gRes.data as any);
            } catch (err) {
                console.error('Error fetching media:', err);
                setMediaItems(MOCK_MEDIA);
                setGrades(MOCK_GRADES);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [hasSupabase]);

    // accessible grades (respecting hierarchy)
    const accessibleGradeIds = useMemo(
        () => grades.filter((g) => canSeeGrade(g.slug as GradeSlug)).map((g) => g.id),
        [canSeeGrade, grades],
    );

    const filtered = useMemo(() => {
        return mediaItems.filter((m) => {
            const accessible = accessibleGradeIds.includes(m.grade_id);
            const matchType = typeFilter === 'all' || m.type === typeFilter;
            const matchGrade = gradeFilter === 'all' || m.grade_id === gradeFilter;
            return accessible && matchType && matchGrade;
        });
    }, [accessibleGradeIds, typeFilter, gradeFilter, mediaItems]);

    // count locked items (not accessible)
    const lockedCount = mediaItems.filter((m) => !accessibleGradeIds.includes(m.grade_id)).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6">
                <p className="text-xs uppercase tracking-widest text-yellow-600/80 mb-2">{gradeName}</p>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white">
                            Biblioteca <span className="gold-text-gradient">Multimedia</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm">
                            Colección de recursos multimedia organizados para tu formación.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 hidden md:flex">
                        <span>{filtered.length} {filtered.length === 1 ? 'recurso' : 'recursos'}</span>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="space-y-3">
                {/* Grade filter (only visible grades) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Grado:</span>
                    <button
                        onClick={() => setGradeFilter('all')}
                        className={cn(
                            'px-3 py-1.5 text-xs uppercase tracking-wider border transition-all duration-200',
                            gradeFilter === 'all'
                                ? 'gold-gradient text-black font-semibold border-transparent'
                                : 'border-white/10 text-slate-400 hover:border-yellow-600/30 hover:text-slate-200',
                        )}
                    >
                        Todos mis grados
                    </button>
                    {grades.filter((g) => canSeeGrade(g.slug as GradeSlug)).map((g) => (
                        <button
                            key={g.id}
                            onClick={() => setGradeFilter(gradeFilter === g.id ? 'all' : g.id)}
                            className={cn(
                                'px-3 py-1.5 text-xs border transition-all duration-200',
                                gradeFilter === g.id
                                    ? cn(GRADE_BADGE[g.slug as GradeSlug], 'font-semibold')
                                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200',
                            )}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
                {/* Type filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Tipo:</span>
                    {TYPE_FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setTypeFilter(value)}
                            className={cn(
                                'px-4 py-1.5 text-xs uppercase tracking-wider border transition-all duration-200',
                                typeFilter === value
                                    ? 'gold-gradient text-black font-semibold border-transparent'
                                    : 'border-white/10 text-slate-400 hover:border-yellow-600/30 hover:text-slate-200',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((item, i) => (
                        <MediaCard key={item.id} item={item} index={i} onPreview={setPreview} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-slate-600 border border-white/5 space-y-2">
                    <p>No hay contenido con estos filtros.</p>
                    <button
                        onClick={() => { setTypeFilter('all'); setGradeFilter('all'); }}
                        className="text-yellow-500 text-xs hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}
            {/* Modal de Previsualización */}
            {preview && (
                <MediaPreviewModal
                    isOpen={!!preview}
                    onClose={() => setPreview(null)}
                    url={preview.url}
                    title={preview.title}
                    type={preview.type}
                />
            )}
        </div>
    );
}
