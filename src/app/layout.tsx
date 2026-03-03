import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: 'Plataforma Virtual – Grado Compañero',
  description: 'Plataforma de formación masónica para el Grado Compañero. Accede a temas, recursos, biblioteca multimedia y calendario de actividades.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#050505] text-slate-200">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
