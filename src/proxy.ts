import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasSupabase = supabaseUrl && supabaseAnonKey;

    const { pathname } = request.nextUrl;

    // Si no hay Supabase configurado, permitir todo (modo demo con datos mock)
    if (!hasSupabase) {
        // En modo demo, proteger /admin requiriendo query param ?admin=true
        if (pathname.startsWith('/admin')) {
            const isAdmin = request.nextUrl.searchParams.get('mock_admin') === 'true';
            if (!isAdmin) {
                const url = request.nextUrl.clone();
                url.pathname = '/admin';
                url.searchParams.set('mock_admin', 'true');
                return NextResponse.redirect(url);
            }
        }
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Rutas que requieren autenticación
    if (!user && (pathname.startsWith('/app') || pathname.startsWith('/admin'))) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Si ya está autenticado y va al login, redirigir al dashboard
    if (user && pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/app/topics';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
