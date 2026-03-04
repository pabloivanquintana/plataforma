'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save, BookOpen, Library, Calendar, ScrollText, User, Users, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { MOCK_TOPICS, MOCK_MEDIA, MOCK_EVENTS, MOCK_PLANCHAS, MOCK_USERS, GRADES as MOCK_GRADES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { Topic, MediaItem, CalendarEvent, Grade, Plancha, MockUser, GradeSlug, UserRole } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

type Tab = 'topics' | 'media' | 'events' | 'planchas' | 'usuarios';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('topics');
    const [topics, setTopics] = useState<Topic[]>([]);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [planchas, setPlanchas] = useState<Plancha[]>([]);
    const [usuarios, setUsuarios] = useState<MockUser[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ type: Tab; item?: any } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== '';

    const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        if (!hasSupabase) {
            setTopics(MOCK_TOPICS);
            setMedia(MOCK_MEDIA);
            setEvents(MOCK_EVENTS);
            setPlanchas(MOCK_PLANCHAS);
            setUsuarios(MOCK_USERS);
            setGrades(MOCK_GRADES);
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const [tRes, mRes, eRes, pRes, gRes, uRes] = await Promise.all([
                supabase.from('topics').select('*').order('order'),
                supabase.from('media_items').select('*').order('title'),
                supabase.from('events').select('*').order('event_date'),
                supabase.from('planchas').select('*').order('order_index'),
                supabase.from('grades').select('*').order('slug'),
                supabase.from('profiles').select('id, full_name, role, grade_id')
            ]);

            if (tRes.data) setTopics(tRes.data as any);
            if (mRes.data) setMedia(mRes.data as any);
            if (eRes.data) setEvents(eRes.data as any);
            if (pRes.data) setPlanchas(pRes.data as any);
            if (gRes.data) setGrades(gRes.data as any);

            if (uRes.data) {
                const mappedUsers = uRes.data.map(p => {
                    const grade = gRes.data?.find(g => g.id === p.grade_id);
                    return {
                        id: p.id,
                        full_name: p.full_name || 'Sin nombre',
                        email: '',
                        role: p.role as UserRole,
                        grade_id: p.grade_id,
                        grade_slug: (grade?.slug || 'aprendiz') as GradeSlug
                    };
                });
                setUsuarios(mappedUsers as any);
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [hasSupabase]);

    // GENERIC SAVE
    const handleSave = async (table: string, data: any, id?: string) => {
        if (!hasSupabase) {
            // Mock logic for demo mode
            showSaved();
            setModal(null);
            return;
        }

        try {
            const supabase = createClient();
            if (id && !id.startsWith('temp-')) {
                // Update
                const { error } = await supabase.from(table).update(data).eq('id', id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase.from(table).insert([data]);
                if (error) throw error;
            }

            // Sync state
            await fetchData(true);
            showSaved();
        } catch (err) {
            console.error(`Error saving to ${table}:`, err);
            alert('Error al guardar en la base de datos.');
        } finally {
            setModal(null);
        }
    };

    // TOPICS
    const saveTopic = (data: Partial<Topic>) => handleSave('topics', data, modal?.item?.id);

    // MEDIA
    const saveMedia = (data: Partial<MediaItem>) => handleSave('media_items', data, modal?.item?.id);

    // EVENTS
    const saveEvent = (data: Partial<CalendarEvent>) => handleSave('events', data, modal?.item?.id);

    // PLANCHAS
    const savePlancha = (data: Partial<Plancha>) => handleSave('planchas', data, modal?.item?.id);

    const deleteItem = async (id: string) => {
        if (!hasSupabase) {
            setTopics(p => p.filter(t => t.id !== id));
            setMedia(p => p.filter(m => m.id !== id));
            setEvents(p => p.filter(e => e.id !== id));
            setPlanchas(p => p.filter(pl => pl.id !== id));
            setDeleteConfirm(null);
            return;
        }

        const tableMap: Record<Tab, string> = {
            topics: 'topics',
            media: 'media_items',
            events: 'events',
            planchas: 'planchas',
            usuarios: 'profiles'
        };

        try {
            const supabase = createClient();
            const { error } = await supabase.from(tableMap[activeTab]).delete().eq('id', id);
            if (error) throw error;
            await fetchData(true);
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Error al eliminar registro.');
        } finally {
            setDeleteConfirm(null);
        }
    };

    // USUARIOS (Solo perfiles por ahora)
    const saveUsuario = (data: Partial<MockUser>) => handleSave('profiles', {
        full_name: data.full_name,
        role: data.role,
        grade_id: data.grade_id
    }, modal?.item?.id);

    const TABS = [
        { id: 'topics' as Tab, label: 'Temas', Icon: BookOpen },
        { id: 'media' as Tab, label: 'Biblioteca', Icon: Library },
        { id: 'events' as Tab, label: 'Eventos', Icon: Calendar },
        { id: 'planchas' as Tab, label: 'Planchas', Icon: ScrollText },
        { id: 'usuarios' as Tab, label: 'Usuarios', Icon: Users },
    ];

    const modalLabel = modal?.type === 'topics' ? 'Tema' : modal?.type === 'media' ? 'Item multimedia' : modal?.type === 'events' ? 'Evento' : modal?.type === 'planchas' ? 'Plancha' : 'Usuario';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-yellow-500/50 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-xs uppercase tracking-[0.2em]">Sincronizando con el Templo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="border-b border-yellow-600/15 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="text-xs uppercase tracking-widest text-red-400/80">Acceso Admin</span>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">Panel de <span className="gold-text-gradient">Administración</span></h1>
                    <p className="text-slate-400 mt-1.5 text-sm">Gestión de contenidos: temas, recursos, eventos y planchas.</p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-green-400 text-sm border border-green-500/20 bg-green-500/5 px-4 py-2 animate-fadeInUp self-start md:self-auto">
                        <Save className="w-4 h-4" />Guardado
                    </div>
                )}
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/5 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {TABS.map(({ id, label, Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={cn('flex items-center gap-2 px-4 md:px-5 py-3 text-sm transition-all border-b-2 -mb-px whitespace-nowrap',
                            activeTab === id ? 'text-yellow-400 border-yellow-500' : 'text-slate-400 border-transparent hover:text-slate-200')}>
                        <Icon className="w-4 h-4" />{label}
                    </button>
                ))}
            </div>

            {/* TOPICS */}
            {activeTab === 'topics' && (
                <ListSection count={`${topics.length} temas`} onNew={() => setModal({ type: 'topics' })} newLabel="Nuevo Tema">
                    {topics.map((topic) => (
                        <ListRow key={topic.id} id={topic.id} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onDelete={deleteItem} onEdit={() => setModal({ type: 'topics', item: topic })}>
                            <div className="w-8 h-8 border border-yellow-600/20 flex items-center justify-center text-yellow-500 font-serif font-bold text-sm flex-shrink-0">{topic.order}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{topic.title}</div>
                                <div className="text-xs text-slate-500 truncate">{topic.description}</div>
                            </div>
                        </ListRow>
                    ))}
                </ListSection>
            )}

            {/* MEDIA */}
            {activeTab === 'media' && (
                <ListSection count={`${media.length} items`} onNew={() => setModal({ type: 'media' })} newLabel="Nuevo Item">
                    {media.map((item) => (
                        <ListRow key={item.id} id={item.id} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onDelete={deleteItem} onEdit={() => setModal({ type: 'media', item })}>
                            <span className="text-[10px] uppercase tracking-wider border border-white/10 px-2 py-0.5 text-slate-400 flex-shrink-0">{item.type}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
                                <div className="text-xs text-slate-500 truncate">{item.description}</div>
                            </div>
                        </ListRow>
                    ))}
                </ListSection>
            )}

            {/* EVENTS */}
            {activeTab === 'events' && (
                <ListSection count={`${events.length} eventos`} onNew={() => setModal({ type: 'events' })} newLabel="Nuevo Evento">
                    {events.map((ev) => (
                        <ListRow key={ev.id} id={ev.id} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onDelete={deleteItem} onEdit={() => setModal({ type: 'events', item: ev })}>
                            <div className="text-center flex-shrink-0 w-12">
                                <div className="text-lg font-serif font-bold text-yellow-500">{format(parseISO(ev.event_date), 'd')}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{format(parseISO(ev.event_date), 'MMM', { locale: es })}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{ev.title}</div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">{ev.event_type}</span>
                            </div>
                        </ListRow>
                    ))}
                </ListSection>
            )}

            {/* PLANCHAS */}
            {activeTab === 'planchas' && (
                <ListSection count={`${planchas.length} planchas`} onNew={() => setModal({ type: 'planchas' })} newLabel="Nueva Plancha">
                    {planchas.map((pl) => (
                        <ListRow key={pl.id} id={pl.id} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onDelete={deleteItem} onEdit={() => setModal({ type: 'planchas', item: pl })}>
                            <div className="w-8 h-8 border border-yellow-600/20 flex items-center justify-center text-yellow-500/70 font-serif font-bold text-sm flex-shrink-0">{pl.order_index}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{pl.title}</div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 flex-shrink-0"><User className="w-3 h-3" />{pl.author}</span>
                                    <span className="flex-shrink-0">{pl.date.slice(0, 4)}</span>
                                    <span className="truncate">{pl.tags.slice(0, 2).join(', ')}</span>
                                </div>
                            </div>
                        </ListRow>
                    ))}
                </ListSection>
            )}

            {/* USUARIOS */}
            {activeTab === 'usuarios' && (
                <ListSection count={`${usuarios.length} usuarios`} onNew={() => { }} newLabel="" hideNew>
                    <div className="p-4 border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300 flex items-start gap-3 mb-4">
                        <Users className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">Gestión de Usuarios (Solo Lectura)</p>
                            <p className="opacity-80">Por seguridad, la creación, edición y eliminación de Hermanos se realiza exclusivamente desde el Dashboard de Supabase. Aquí puedes visualizar el estado actual de la Logia.</p>
                        </div>
                    </div>
                    {/* Sección Vigilantes */}
                    {['admin' as const, 'student' as const].map((roleGroup) => {
                        const group = usuarios.filter((u) => u.role === roleGroup);
                        if (group.length === 0) return null;
                        return (
                            <div key={roleGroup} className="space-y-2">
                                <div className={cn(
                                    'text-[9px] uppercase tracking-widest px-2 py-0.5 inline-flex items-center gap-1.5 border mt-4 mb-2',
                                    roleGroup === 'admin' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-500 border-white/8'
                                )}>
                                    {roleGroup === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                    {roleGroup === 'admin' ? 'Vigilantes' : 'Hermanos'}
                                </div>
                                {group.map((u) => (
                                    <ListRow key={u.id} id={u.id} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onDelete={deleteItem} onEdit={() => setModal({ type: 'usuarios', item: u })} hideActions>
                                        <div className="w-9 h-9 border border-yellow-600/20 bg-yellow-600/8 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-yellow-500">{u.full_name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-200 truncate">{u.full_name}</div>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                                <span className="truncate">{u.email}</span>
                                                <span className={cn(
                                                    'text-[9px] uppercase tracking-wider px-1.5 py-0.5 border flex-shrink-0',
                                                    u.grade_slug === 'aprendiz' ? 'text-stone-400 border-stone-600/30' :
                                                        u.grade_slug === 'maestro' ? 'text-purple-300 border-purple-600/20' :
                                                            'text-yellow-400 border-yellow-600/20'
                                                )}>{u.grade_slug}</span>
                                            </div>
                                        </div>
                                    </ListRow>
                                ))}
                            </div>
                        );
                    })}
                </ListSection>
            )}

            {/* MODAL */}
            {modal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0e0e0e] border border-yellow-600/20 w-full max-w-lg animate-fadeInUp max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0e0e0e]">
                            <h2 className="font-serif font-bold text-white">{modal.item ? 'Editar' : 'Nueva'} {modalLabel}</h2>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5">
                            {modal.type === 'topics' && <TopicForm topic={modal.item as Topic | undefined} grades={grades} onSave={saveTopic} onCancel={() => setModal(null)} />}
                            {modal.type === 'media' && <MediaForm item={modal.item as MediaItem | undefined} grades={grades} onSave={saveMedia} onCancel={() => setModal(null)} />}
                            {modal.type === 'events' && <EventForm event={modal.item as CalendarEvent | undefined} grades={grades} onSave={saveEvent} onCancel={() => setModal(null)} />}
                            {modal.type === 'planchas' && <PlanchaForm plancha={modal.item as Plancha | undefined} grades={grades} onSave={savePlancha} onCancel={() => setModal(null)} />}
                            {modal.type === 'usuarios' && <UsuarioForm usuario={modal.item as MockUser | undefined} grades={grades} onSave={saveUsuario} onCancel={() => setModal(null)} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Shared UI ────────────────────────────────────────

function ListSection({ count, onNew, newLabel, children, hideNew }: { count: string; onNew: () => void; newLabel: string; children: React.ReactNode; hideNew?: boolean }) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{count}</span>
                {!hideNew && (
                    <button onClick={onNew} className="flex items-center justify-center gap-2 px-4 py-2 text-xs gold-gradient text-black font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto">
                        <Plus className="w-3.5 h-3.5" />{newLabel}
                    </button>
                )}
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ListRow({ id, deleteConfirm, setDeleteConfirm, onDelete, onEdit, children, hideActions }: {
    id: string; deleteConfirm: string | null; setDeleteConfirm: (id: string | null) => void;
    onDelete: (id: string) => void; onEdit: () => void; children: React.ReactNode;
    hideActions?: boolean;
}) {
    return (
        <div className="flex items-start sm:items-center gap-4 p-4 border border-white/5 bg-[#0d0d0d]">
            <div className="flex-1 flex items-start sm:items-center gap-4 min-w-0">
                {children}
            </div>
            {!hideActions && (
                <div className="flex items-center gap-2 flex-shrink-0 mt-1 sm:mt-0">
                    <button onClick={onEdit} className="p-2 text-slate-500 hover:text-yellow-400 border border-white/5 hover:border-yellow-600/30 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    {deleteConfirm === id ? (
                        <button onClick={() => onDelete(id)} className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors whitespace-nowrap">¿Confirmar?</button>
                    ) : (
                        <button onClick={() => setDeleteConfirm(id)} className="p-2 text-slate-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Forms ────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputClass = 'w-full bg-[#0a0a0a] border border-white/10 text-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-600/40 transition-colors placeholder:text-slate-600';
const selectClass = 'w-full bg-[#0a0a0a] border border-white/10 text-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-600/40 transition-colors';

function TopicForm({ topic, grades, onSave, onCancel }: { topic?: Topic; grades: Grade[]; onSave: (d: Partial<Topic>) => void; onCancel: () => void }) {
    const [title, setTitle] = useState(topic?.title ?? '');
    const [description, setDescription] = useState(topic?.description ?? '');
    const [order, setOrder] = useState(String(topic?.order ?? ''));
    const [gradeId, setGradeId] = useState(topic?.grade_id ?? grades.find(g => g.slug === 'aprendiz')?.id ?? grades[0]?.id ?? '');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description, order: Number(order), grade_id: gradeId }); }} className="space-y-4">
            <FormField label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required /></FormField>
            <FormField label="Descripción"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-none')} rows={3} /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Orden"><input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className={inputClass} min={1} required /></FormField>
                <FormField label="Grado"><select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={selectClass}>{grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></FormField>
            </div>
            <FormActions onCancel={onCancel} />
        </form>
    );
}

function MediaForm({ item, grades, onSave, onCancel }: { item?: MediaItem; grades: Grade[]; onSave: (d: Partial<MediaItem>) => void; onCancel: () => void }) {
    const [title, setTitle] = useState(item?.title ?? '');
    const [description, setDescription] = useState(item?.description ?? '');
    const [type, setType] = useState(item?.type ?? 'link');
    const [url, setUrl] = useState(item?.url ?? '');
    const [gradeId, setGradeId] = useState(item?.grade_id ?? grades.find(g => g.slug === 'aprendiz')?.id ?? grades[0]?.id ?? '');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description, type: type as MediaItem['type'], url, grade_id: gradeId }); }} className="space-y-4">
            <FormField label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required /></FormField>
            <FormField label="Descripción"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-none')} rows={2} /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tipo"><select value={type} onChange={(e) => setType(e.target.value as MediaItem['type'])} className={selectClass}>{['video', 'audio', 'pdf', 'link'].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></FormField>
                <FormField label="Grado"><select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={selectClass}>{grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></FormField>
            </div>
            <FormField label="URL"><input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} type="url" placeholder="https://..." required /></FormField>
            <FormActions onCancel={onCancel} />
        </form>
    );
}

function EventForm({ event, grades, onSave, onCancel }: { event?: CalendarEvent; grades: Grade[]; onSave: (d: Partial<CalendarEvent>) => void; onCancel: () => void }) {
    const [title, setTitle] = useState(event?.title ?? '');
    const [description, setDescription] = useState(event?.description ?? '');
    const [eventDate, setEventDate] = useState(event?.event_date ?? '');
    const [eventType, setEventType] = useState(event?.event_type ?? 'general');
    const [gradeId, setGradeId] = useState(event?.grade_id ?? grades.find(g => g.slug === 'aprendiz')?.id ?? grades[0]?.id ?? '');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description, event_date: eventDate, event_type: eventType as CalendarEvent['event_type'], grade_id: gradeId }); }} className="space-y-4">
            <FormField label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required /></FormField>
            <FormField label="Descripción"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-none')} rows={2} /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Fecha"><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} required /></FormField>
                <FormField label="Tipo"><select value={eventType} onChange={(e) => setEventType(e.target.value as CalendarEvent['event_type'])} className={selectClass}>{['general', 'ritual', 'taller', 'examen'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></FormField>
            </div>
            <FormField label="Grado"><select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={selectClass}>{grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></FormField>
            <FormActions onCancel={onCancel} />
        </form>
    );
}

function PlanchaForm({ plancha, grades, onSave, onCancel }: { plancha?: Plancha; grades: Grade[]; onSave: (d: Partial<Plancha>) => void; onCancel: () => void }) {
    const [title, setTitle] = useState(plancha?.title ?? '');
    const [author, setAuthor] = useState(plancha?.author ?? '');
    const [date, setDate] = useState(plancha?.date ?? String(new Date().getFullYear()));
    const [description, setDescription] = useState(plancha?.description ?? '');
    const [tags, setTags] = useState(plancha?.tags?.join(', ') ?? '');
    const [resourceUrl, setResourceUrl] = useState(plancha?.resource_url ?? '');
    const [orderIndex, setOrderIndex] = useState(String(plancha?.order_index ?? ''));
    const [gradeId, setGradeId] = useState(plancha?.grade_id ?? grades.find(g => g.slug === 'aprendiz')?.id ?? grades[0]?.id ?? '');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, author, date, description, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), resource_url: resourceUrl, order_index: Number(orderIndex), grade_id: gradeId }); }} className="space-y-4">
            <FormField label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Autor"><input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} placeholder="H.·. Nombre A." required /></FormField>
                <FormField label="Año"><input value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} placeholder="2024 o 2024-03-15" required /></FormField>
            </div>
            <FormField label="Descripción"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-none')} rows={3} /></FormField>
            <FormField label="Etiquetas (separadas por coma)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="ritual, simbolismo, historia" /></FormField>
            <FormField label="URL del documento"><input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} className={inputClass} type="url" placeholder="https://drive.google.com/..." required /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Orden"><input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} className={inputClass} min={1} required /></FormField>
                <FormField label="Grado"><select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={selectClass}>{grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></FormField>
            </div>
            <FormActions onCancel={onCancel} />
        </form>
    );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
    return (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 text-sm gold-gradient text-black font-semibold hover:opacity-90 transition-opacity"><Save className="w-3.5 h-3.5" />Guardar</button>
        </div>
    );
}

function UsuarioForm({ usuario, grades, onSave, onCancel }: {
    usuario?: MockUser;
    grades: Grade[];
    onSave: (d: Partial<MockUser>) => void;
    onCancel: () => void;
}) {
    const [fullName, setFullName] = useState(usuario?.full_name ?? '');
    const [email, setEmail] = useState(usuario?.email ?? '');
    const [password, setPassword] = useState(usuario?.password ?? '');
    const [showPass, setShowPass] = useState(false);
    const [role, setRole] = useState<UserRole>(usuario?.role ?? 'student');
    const [gradeSlug, setGradeSlug] = useState<GradeSlug>(usuario?.grade_slug ?? 'companero');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const grade = grades.find(g => g.slug === gradeSlug);
                onSave({ full_name: fullName, email, password, role, grade_slug: gradeSlug, grade_id: grade?.id });
            }}
            className="space-y-4"
        >
            <FormField label="Nombre completo">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="H.·. Nombre Apellido" required />
            </FormField>
            <FormField label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} type="email" placeholder="hermano@logia.org" required />
            </FormField>
            <FormField label="Contraseña">
                <div className="relative">
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(inputClass, 'pr-10')}
                        type={showPass ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        required={!usuario}
                        minLength={8}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {usuario && <p className="text-[10px] text-slate-600 mt-1">Dejá vacío para no cambiar la contraseña.</p>}
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Rol">
                    <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={selectClass}>
                        <option value="student">Hermano (Estudiante)</option>
                        <option value="admin">Vigilante (Admin)</option>
                    </select>
                </FormField>
                <FormField label="Grado">
                    <select value={gradeSlug} onChange={(e) => setGradeSlug(e.target.value as GradeSlug)} className={selectClass}>
                        {grades.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
                    </select>
                </FormField>
            </div>
            {/* Permisos de acceso según grado */}
            <div className="p-3 border border-white/5 bg-white/2 text-[10px] text-slate-500 space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">Acceso al contenido</div>
                {(['aprendiz', 'companero', 'maestro'] as GradeSlug[]).map((s) => {
                    const can = { aprendiz: ['Temas Aprendiz'], companero: ['Temas Aprendiz', 'Temas Compañero', 'Planchas'], maestro: ['Todo el contenido'] }[s];
                    const active = { aprendiz: gradeSlug === 'aprendiz', companero: gradeSlug === 'companero', maestro: gradeSlug === 'maestro' }[s];
                    return (
                        <div key={s} className={cn('flex items-center gap-2', active ? 'text-yellow-400' : '')}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-yellow-500' : 'bg-slate-700')} />
                            <span className="capitalize font-medium">{s}:</span>
                            <span>{can.join(', ')}</span>
                        </div>
                    );
                })}
            </div>
            <FormActions onCancel={onCancel} />
        </form>
    );
}
