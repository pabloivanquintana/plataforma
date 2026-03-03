'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/context/UserContext';
import { ShieldX } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, role } = useUser();
    const router = useRouter();

    // Si el rol está cargado y no es admin, redirigir
    useEffect(() => {
        // Esperamos un tick para que localStorage hidrate el contexto
        const timer = setTimeout(() => {
            if (role !== 'admin') {
                router.replace('/app/topics?unauthorized=admin');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [role, router]);

    // Pantalla de "no autorizado" mientras redirige
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Sidebar />
                <div className="md:ml-64 flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 pt-24 md:pt-8">
                    <div className="w-16 h-16 border border-red-500/30 bg-red-500/5 flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-serif font-bold text-white">Acceso Denegado</h1>
                    <p className="text-sm text-slate-400 max-w-xs">
                        Solo los administradores pueden acceder al panel de administración.
                    </p>
                    <button
                        onClick={() => router.replace('/app/topics')}
                        className="px-5 py-2.5 text-sm text-yellow-400 border border-yellow-600/30 hover:bg-yellow-500/5 transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505]">
            <Sidebar />
            <main className="md:ml-64 min-h-screen relative pt-16 md:pt-0">
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden md:ml-64">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/3 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
