'use client';

import { useState, useMemo } from 'react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
    addMonths, subMonths, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import { MOCK_EVENTS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { EventType } from '@/types';

const EVENT_TYPE_COLORS: Record<EventType, string> = {
    ritual: 'bg-yellow-500/80 text-black',
    taller: 'bg-blue-500/80 text-white',
    examen: 'bg-red-500/80 text-white',
    general: 'bg-slate-500/80 text-white',
};

const EVENT_TYPE_BADGES: Record<EventType, string> = {
    ritual: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20',
    taller: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
    examen: 'text-red-400 bg-red-500/10 border border-red-500/20',
    general: 'text-slate-400 bg-slate-500/10 border border-slate-500/20',
};

type View = 'month' | 'list';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
    const [view, setView] = useState<View>('month');
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const events = MOCK_EVENTS;

    // Days for the current month grid
    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getEventsForDay = (day: Date) =>
        events.filter((e) => isSameDay(parseISO(e.event_date), day));

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    // Events grouped by month for list view (current year)
    const eventsByMonth = useMemo(() => {
        const sorted = [...events].sort(
            (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );
        const groups: Record<string, typeof events> = {};
        sorted.forEach((e) => {
            const key = format(parseISO(e.event_date), 'MMMM yyyy', { locale: es });
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return groups;
    }, [events]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white">
                            Calendario <span className="gold-text-gradient">Anual</span>
                        </h1>
                        <p className="text-slate-400 mt-1.5 text-sm">Tenidas, talleres y eventos del año.</p>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 border border-white/10 p-1">
                        <button
                            onClick={() => setView('month')}
                            className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all', view === 'month' ? 'gold-gradient text-black font-semibold' : 'text-slate-400 hover:text-white')}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Mensual
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all', view === 'list' ? 'gold-gradient text-black font-semibold' : 'text-slate-400 hover:text-white')}
                        >
                            <List className="w-3.5 h-3.5" />
                            Lista
                        </button>
                    </div>
                </div>
            </header>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => { setCurrentDate(subMonths(currentDate, 1)); setSelectedDay(null); }}
                    className="p-2 border border-white/10 hover:border-yellow-600/30 text-slate-400 hover:text-yellow-400 transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-serif font-semibold text-white capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <button
                    onClick={() => { setCurrentDate(addMonths(currentDate, 1)); setSelectedDay(null); }}
                    className="p-2 border border-white/10 hover:border-yellow-600/30 text-slate-400 hover:text-yellow-400 transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {view === 'month' ? (
                <div>
                    {/* Day names */}
                    <div className="grid grid-cols-7 mb-2">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                            <div key={d} className="text-center text-[10px] uppercase tracking-wider text-slate-600 py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 border-l border-t border-white/5">
                        {monthDays.map((day) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                            const today = isToday(day);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDay(isSelected ? null : day)}
                                    className={cn(
                                        'relative min-h-[80px] border-r border-b border-white/5 p-2 text-left transition-colors',
                                        !isCurrentMonth && 'opacity-30',
                                        isSelected && 'bg-yellow-600/10',
                                        isCurrentMonth && !isSelected && 'hover:bg-white/3',
                                    )}
                                >
                                    <span className={cn(
                                        'text-xs font-medium w-6 h-6 flex items-center justify-center',
                                        today && 'gold-gradient text-black rounded-full font-bold',
                                        !today && isCurrentMonth && 'text-slate-300',
                                        !today && !isCurrentMonth && 'text-slate-600',
                                    )}>
                                        {format(day, 'd')}
                                    </span>

                                    <div className="mt-1 space-y-0.5">
                                        {dayEvents.slice(0, 2).map((ev) => (
                                            <div
                                                key={ev.id}
                                                className={cn('text-[9px] px-1 py-0.5 truncate rounded-sm', EVENT_TYPE_COLORS[ev.event_type])}
                                            >
                                                {ev.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[9px] text-slate-500">+{dayEvents.length - 2} más</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected day events */}
                    {selectedDay && selectedEvents.length > 0 && (
                        <div className="mt-4 p-4 border border-yellow-600/20 bg-yellow-600/5 animate-fadeInUp">
                            <h3 className="text-xs uppercase tracking-widest text-yellow-600 mb-3">
                                {format(selectedDay, "d 'de' MMMM", { locale: es })}
                            </h3>
                            <div className="space-y-3">
                                {selectedEvents.map((ev) => (
                                    <div key={ev.id} className="flex items-start gap-3">
                                        <span className={cn('text-[10px] px-2 py-0.5 uppercase tracking-wide font-bold flex-shrink-0 mt-0.5', EVENT_TYPE_BADGES[ev.event_type])}>
                                            {ev.event_type}
                                        </span>
                                        <div>
                                            <div className="text-sm font-medium text-white">{ev.title}</div>
                                            {ev.description && <p className="text-xs text-slate-400 mt-0.5">{ev.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* List view */
                <div className="space-y-6">
                    {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
                        <div key={month}>
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3 capitalize">{month}</h3>
                            <div className="space-y-2">
                                {monthEvents.map((ev) => (
                                    <div key={ev.id} className="flex items-start gap-4 p-4 border border-white/5 bg-[#0d0d0d] hover:border-yellow-600/20 transition-all">
                                        <div className="flex-shrink-0 text-center w-12">
                                            <div className="text-2xl font-serif font-bold text-yellow-500 leading-none">
                                                {format(parseISO(ev.event_date), 'd')}
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                                                {format(parseISO(ev.event_date), 'EEE', { locale: es })}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn('text-[10px] font-semibold uppercase tracking-wide border px-1.5 py-0.5', EVENT_TYPE_BADGES[ev.event_type])}>
                                                    {ev.event_type}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-200">{ev.title}</div>
                                            {ev.description && <p className="text-xs text-slate-500 mt-1">{ev.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
