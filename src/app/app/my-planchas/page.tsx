'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, User, Calendar, Tag, ExternalLink, ScrollText, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Plancha, Grade, GradeSlug } from '@/types';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import GradeBadge from '@/components/GradeBadge';

const inputClass = "w-full bg-[#0d0d0d] border border-white/10 text-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-600/30 transition-colors placeholder:text-slate-600";
const selectClass = "w-full bg-[#0d0d0d] border border-white/10 text-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-600/30 transition-colors";

export default function MyPlanchasPage() {
    const { userId, fullName, gradeSlug } = useUser();
    const [planchas, setPlanchas] = useState<Plancha[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlancha, setEditingPlancha] = useState<Plancha | null>(null);
    const [preview, setPreview] = useState<Plancha | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const supabase = createClient();

    const fetchMyPlanchas = async () => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('planchas')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlanchas(data || []);
        } catch (err) {
            console.error('Error fetching my planchas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchGrades = async () => {
            const { data } = await supabase.from('grades').select('*').order('slug');
            if (data) setGrades(data);
        };
        fetchGrades();
        fetchMyPlanchas();
    }, [userId]);

    const handleSave = async (formData: any) => {
        if (!userId) return;

        try {
            const planchaData = {
                ...formData,
                user_id: userId,
                author: fullName, // Automatically set author to user's name
            };

            if (editingPlancha) {
                const { error } = await supabase
                    .from('planchas')
                    .update(planchaData)
                    .eq('id', editingPlancha.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('planchas')
                    .insert([planchaData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            setEditingPlancha(null);
            fetchMyPlanchas();
        } catch (err) {
            console.error('Error saving plancha:', err);
            alert('Error al guardar la plancha. Por favor, revisa los datos.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('planchas')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setPlanchas(planchas.filter(p => p.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting plancha:', err);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-yellow-600/15 pb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">
                        Mis <span className="gold-text-gradient">Planchas</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-2xl">
                        Gestiona tus trabajos e investigaciones personales. Solo tú y los administradores pueden ver y editar este contenido hasta que sea aprobado.
                    </p>
                </div>
                <button
                    onClick={() => { setEditingPlancha(null); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 gold-gradient text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Plancha
                </button>
            </header>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500/50" />
                    <p className="text-xs uppercase tracking-widest text-slate-500">Cargando tus trabajos...</p>
                </div>
            ) : planchas.length === 0 ? (
                <div className="py-24 text-center border border-white/5 bg-[#0d0d0d]/50 p-8 space-y-4">
                    <ScrollText className="w-12 h-12 text-slate-800 mx-auto" />
                    <div>
                        <h3 className="text-slate-300 font-medium">Aún no has subido ninguna plancha</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            Comienza compartiendo tu conocimiento con la logia subiendo tu primer trabajo de arquitectura.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {planchas.map((plancha) => (
                        <div
                            key={plancha.id}
                            className="group p-5 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-serif font-bold text-slate-200 group-hover:text-white transition-colors">
                                        {plancha.title}
                                    </h3>
                                    {(() => {
                                        const grade = grades.find(g => g.id === plancha.grade_id);
                                        return grade && <GradeBadge slug={grade.slug as GradeSlug} name={grade.name} />;
                                    })()}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{plancha.date}</span>
                                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />{plancha.tags.join(', ')}</span>
                                </div>
                                {plancha.description && (
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{plancha.description}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreview(plancha)}
                                    className="px-4 py-2 text-xs text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition-all"
                                >
                                    Ver
                                </button>
                                <button
                                    onClick={() => { setEditingPlancha(plancha); setIsModalOpen(true); }}
                                    className="p-2 text-slate-400 border border-white/10 hover:text-yellow-400 hover:border-yellow-600/30 transition-all"
                                    title="Editar"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {deleteConfirm === plancha.id ? (
                                    <div className="flex items-center gap-1 animate-scaleIn">
                                        <button
                                            onClick={() => handleDelete(plancha.id)}
                                            className="px-3 py-1.5 text-[10px] bg-red-600 text-white font-bold uppercase"
                                        >
                                            Confirmar
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="px-3 py-1.5 text-[10px] border border-white/10 text-slate-400"
                                        >
                                            X
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(plancha.id)}
                                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-[#0a0a0a] border border-yellow-600/20 w-full max-w-lg p-6 animate-scaleIn">
                        <h2 className="text-xl font-serif font-bold text-white mb-6">
                            {editingPlancha ? 'Editar Plancha' : 'Nueva Plancha'}
                        </h2>
                        <PlanchaForm
                            plancha={editingPlancha}
                            grades={grades}
                            onSave={handleSave}
                            onCancel={() => setIsModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {preview && (
                <MediaPreviewModal
                    isOpen={!!preview}
                    onClose={() => setPreview(null)}
                    url={preview.resource_url}
                    title={preview.title}
                    type="pdf"
                />
            )}
        </div>
    );
}

function PlanchaForm({ plancha, grades, onSave, onCancel }: { plancha?: Plancha | null; grades: Grade[]; onSave: (d: any) => void; onCancel: () => void }) {
    const [title, setTitle] = useState(plancha?.title ?? '');
    const [date, setDate] = useState(plancha?.date ?? new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(plancha?.description ?? '');
    const [tags, setTags] = useState(plancha?.tags?.join(', ') ?? '');
    const [resourceUrl, setResourceUrl] = useState(plancha?.resource_url ?? '');
    const [gradeId, setGradeId] = useState(plancha?.grade_id ?? grades[0]?.id ?? '');

    useEffect(() => {
        if (!gradeId && grades.length > 0) {
            setGradeId(grades[0].id);
        }
    }, [grades, gradeId]);

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            onSave({
                title,
                date,
                description,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                resource_url: resourceUrl,
                grade_id: gradeId
            });
        }} className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Fecha</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Grado</label>
                    <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={selectClass}>
                        {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Descripción / Resumen</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-none')} rows={3} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">URL del Documento</label>
                <input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} className={inputClass} type="url" placeholder="https://..." required />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Etiquetas (comas)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="ritual, historia, simbolismo" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-300">
                    Cancelar
                </button>
                <button type="submit" className="px-6 py-2 gold-gradient text-black font-bold text-xs uppercase tracking-wider">
                    Guardar
                </button>
            </div>
        </form>
    );
}
