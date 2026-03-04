'use client';

import { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(err.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-8 animate-fadeIn">
            {/* Header */}
            <header className="border-b border-yellow-600/15 pb-6">
                <h1 className="text-3xl font-serif font-bold text-white mt-1">
                    <span className="gold-text-gradient">Ajustes</span> de Perfil
                </h1>
                <p className="text-slate-400 mt-2 text-sm">
                    Gestiona tu seguridad y preferencias de cuenta.
                </p>
            </header>

            <div className="grid gap-8">
                {/* Seguiridad section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-yellow-500/80 mb-2">
                        <ShieldCheck className="w-5 h-5" />
                        <h2 className="text-lg font-serif font-semibold text-slate-200">Seguridad</h2>
                    </div>

                    <div className="card-glass p-6 space-y-6">
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-yellow-600/60" />
                                Cambiar Contraseña
                            </h3>

                            <div className="space-y-4 max-w-sm">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0d0d0d] border border-white/10 text-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-600/30 transition-colors"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-[#0d0d0d] border border-white/10 text-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-600/30 transition-colors"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 text-xs mt-2 bg-red-500/5 p-3 border border-red-500/20">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="flex items-center gap-2 text-green-500 text-xs mt-2 bg-green-500/5 p-3 border border-green-500/20">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>Contraseña actualizada con éxito</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        "w-full py-2.5 px-4 text-sm font-semibold gold-gradient text-black transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2",
                                        loading && "cursor-not-allowed"
                                    )}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Actualizando...
                                        </>
                                    ) : (
                                        'Actualizar Contraseña'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* Info section */}
                <section className="p-6 border border-yellow-600/10 bg-yellow-600/5 rounded-sm">
                    <p className="text-xs text-yellow-600/70 leading-relaxed">
                        <span className="font-bold flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3" /> Nota sobre seguridad:</span>
                        Asegúrate de utilizar una contraseña robusta que no utilices en otros servicios. Se cerrará tu sesión activa en otros dispositivos al realizar este cambio.
                    </p>
                </section>
            </div>
        </div>
    );
}
