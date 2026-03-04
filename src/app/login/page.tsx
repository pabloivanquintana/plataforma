'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { MOCK_USERS } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import type { GradeSlug } from '@/types';

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const hasSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!hasSupabase) {
            await new Promise((r) => setTimeout(r, 700));
            if (email && password) {
                // Buscar en MOCK_USERS por email
                const found = MOCK_USERS.find((u) => u.email === email);
                setUser({
                    role: found?.role ?? 'student',
                    name: found?.full_name ?? 'Hermano Demo',
                    gradeSlug: found?.grade_slug ?? 'companero',
                });
                router.push('/app/topics');
            } else {
                setError('Por favor ingresá email y contraseña.');
            }
            setLoading(false);
            return;
        }


        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) throw authError;
            // Obtener perfil para rol
            // Obtener perfil completo (incluyendo grado)
            if (authData.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name, grade_id, grades(slug, name)')
                    .eq('id', authData.user.id)
                    .single();

                if (profile) {
                    const gradeData = profile.grades;
                    const gSlug = (Array.isArray(gradeData) ? gradeData[0]?.slug : (gradeData as any)?.slug) as GradeSlug;
                    const gName = (Array.isArray(gradeData) ? gradeData[0]?.name : (gradeData as any)?.name) as string;

                    console.log("Login - Success profile fetch:", { gSlug, role: profile.role });
                    setUser({
                        role: profile.role,
                        name: profile.full_name || email,
                        gradeSlug: gSlug || 'aprendiz',
                        gradeId: profile.grade_id,
                        gradeName: gName || 'Aprendiz'
                    });
                } else {
                    // Fallback to metadata if DB profile is missing
                    const meta = authData.user?.user_metadata;
                    console.log("Login - Profile missing, using metadata:", meta);
                    setUser({
                        role: (meta?.role as any) || 'student',
                        name: meta?.full_name || email,
                        gradeSlug: (meta?.grade_slug as any) || 'aprendiz',
                        gradeName: meta?.grade_slug === 'maestro' ? 'Maestro' : 'Aprendiz'
                    });
                }
            }
            router.push('/app/topics');
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-900/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fadeInUp">
                {/* Header / Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-full border border-yellow-600/30 flex items-center justify-center bg-yellow-600/5 mb-2 shadow-[0_0_30px_rgba(202,138,4,0.1)]">
                        <div className="w-12 h-12 text-yellow-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3L2 21h20L12 3z" />
                                <circle cx="12" cy="14" r="3" />
                                <path d="M12 11v1" />
                            </svg>
                        </div>
                    </div>
                </div>
                {/* Form card */}
                <div className="card-glass rounded-none p-8">
                    {!hasSupabase ? (
                        <div className="mb-6 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs rounded-none space-y-2">
                            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Supabase Desconectado (Modo Demo)
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                La base de datos real no está configurada en la nube.
                                Sigue la <a href="#" className="underline text-yellow-500">guía de despliegue</a> para activarla.
                            </p>
                            <div className="pt-2 border-t border-white/5 space-y-1">
                                <strong className="block text-yellow-400/80">Acceso Admin Temporal:</strong>
                                <div className="text-slate-500"><code>admin@test.com</code> / <code>caelum671</code></div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-3 border border-green-500/30 bg-green-500/5 text-green-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Base de datos conectada
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hermano@logia.org"
                                    className="w-full bg-[#0a0a0a] border border-white/10 text-slate-200 pl-10 pr-4 py-3 text-sm
                    focus:outline-none focus:border-yellow-600/50 transition-colors placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#0a0a0a] border border-white/10 text-slate-200 pl-10 pr-12 py-3 text-sm
                    focus:outline-none focus:border-yellow-600/50 transition-colors placeholder:text-slate-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs border border-red-500/20 bg-red-500/5 p-3">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full gold-gradient text-black font-semibold py-3 text-sm uppercase tracking-wider
                hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Verificando...' : 'Entrar al Templo'}
                        </button>
                    </form>
                </div>

                <div className="text-center text-[10px] text-slate-600 mt-8 mb-4 border-t border-white/5 pt-6">
                    2026
                </div>
            </div>
        </div>
    );
}
