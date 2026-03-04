import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Return a dummy client to avoid crashing during build
        return {
            from: () => ({
                select: () => ({
                    order: () => ({
                        eq: () => ({
                            order: () => Promise.resolve({ data: [], error: null }),
                            single: () => Promise.resolve({ data: null, error: null }),
                        }),
                        single: () => Promise.resolve({ data: null, error: null }),
                        then: (cb: any) => cb({ data: [], error: null }),
                    }),
                    eq: () => ({
                        order: () => Promise.resolve({ data: [], error: null }),
                    }),
                    then: (cb: any) => cb({ data: [], error: null }),
                }),
                insert: () => Promise.resolve({ error: null }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
            })
        } as any;
    }

    return createBrowserClient(url, key);
}
