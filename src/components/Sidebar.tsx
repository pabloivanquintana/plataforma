'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Library, Calendar, ScrollText, ShieldCheck, LogOut, Compass, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
    { href: '/app/topics', label: 'Temas', Icon: BookOpen },
    { href: '/app/planchas', label: 'Planchas', Icon: ScrollText },
    { href: '/app/library', label: 'Biblioteca', Icon: Library },
    { href: '/app/calendar', label: 'Calendario', Icon: Calendar },
] as const;

const GRADE_BADGE: Record<string, string> = {
    aprendiz: 'bg-stone-700/40 text-stone-300 border-stone-600/30',
    companero: 'bg-yellow-900/30 text-yellow-400 border-yellow-600/20',
    maestro: 'bg-purple-900/30 text-purple-300 border-purple-600/20',
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { fullName, isAdmin, gradeName, gradeSlug } = useUser();
    const [showLogout, setShowLogout] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
            const supabase = createClient();
            await supabase.auth.signOut();
        }
        localStorage.removeItem('mock_role');
        localStorage.removeItem('mock_name');
        localStorage.removeItem('mock_grade');
        router.push('/login');
    };

    return (
        <>
            {/* ── Mobile Hamburger Header ── */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-yellow-600/10 flex items-center justify-between px-5 z-40 md:hidden">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 border border-yellow-600/40 flex items-center justify-center">
                        <Compass className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    <span className="text-[10px] font-semibold text-yellow-500/80 uppercase tracking-widest">Plataforma digital Caelum 671</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 border border-white/10 bg-white/5 text-slate-300 hover:text-white transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Mobile Overlay ── */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar Desktop / Mobile Drawer ── */}
            <aside className={cn(
                "fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-yellow-600/10 flex flex-col z-50 transition-transform duration-300 md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0 shadow-2xl shadow-yellow-600/5" : "-translate-x-full"
            )}>
                {/* ── Logo + User identity ── */}
                <div className="px-5 py-5 border-b border-white/5 space-y-3">
                    {/* Logo (Desktop only) */}
                    <div className="hidden md:flex items-center gap-2.5">
                        <div className="w-7 h-7 border border-yellow-600/40 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-3.5 h-3.5 text-yellow-500" />
                        </div>
                        <span className="text-[10px] font-semibold text-yellow-500/80 uppercase tracking-widest">Plataforma digital Caelum 671</span>
                    </div>

                    {/* Mobile Close Button (Visual hint inside) */}
                    <div className="md:hidden flex justify-end">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-1.5 text-slate-600 hover:text-slate-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* User card */}
                    <button
                        onClick={() => setShowLogout((v) => !v)}
                        className="w-full flex items-center gap-3 p-2.5 border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all text-left group"
                    >
                        <div className="w-9 h-9 border border-yellow-600/30 bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-yellow-500">{fullName.charAt(0)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-slate-200 truncate leading-tight">{fullName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={cn(
                                    'text-[9px] uppercase tracking-wider px-1.5 py-0.5 border',
                                    GRADE_BADGE[gradeSlug] ?? GRADE_BADGE.companero
                                )}>
                                    {gradeName}
                                </span>
                                {isAdmin && (
                                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-red-500/20 bg-red-500/8 text-red-400">
                                        Vigilante
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform', showLogout && 'rotate-180')} />
                    </button>

                    {showLogout && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 border border-red-500/10 transition-all animate-fadeInUp"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Cerrar sesión
                        </button>
                    )}
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ href, label, Icon }) => {
                        const active = pathname === href || pathname.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 text-sm transition-all group border-l-2',
                                    active
                                        ? 'text-yellow-400 bg-yellow-500/8 border-yellow-500'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/3 border-transparent'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', active ? 'text-yellow-500' : 'text-slate-500 group-hover:text-slate-300')} />
                                {label}
                            </Link>
                        );
                    })}

                    {/* Admin – solo para Vigilantes */}
                    {isAdmin && (
                        <>
                            <div className="pt-5 pb-1 px-3">
                                <span className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold">Administración</span>
                            </div>
                            <Link
                                href="/admin"
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 text-sm transition-all group border-l-2',
                                    pathname.startsWith('/admin')
                                        ? 'text-red-400 bg-red-500/8 border-red-500'
                                        : 'text-slate-500 hover:text-red-300 hover:bg-red-500/5 border-transparent'
                                )}
                            >
                                <ShieldCheck className={cn('w-4 h-4', pathname.startsWith('/admin') ? 'text-red-400' : 'text-slate-600 group-hover:text-red-400')} />
                                Panel Admin
                            </Link>
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}
