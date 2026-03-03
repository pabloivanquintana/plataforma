import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#050505]">
            <Sidebar />
            <main className="md:ml-64 min-h-screen relative pt-16 md:pt-0">
                {/* Ambient glow */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden md:ml-64">
                    <div className="absolute top-[-20%] right-[-5%] w-[700px] h-[700px] bg-yellow-600/3 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-900/3 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
