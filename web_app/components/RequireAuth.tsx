'use client';
import { AccountStatus } from '@/app/(main)/accounts/models/account.model';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();
    const router = useRouter();

    const pathname = usePathname();
    const isRequestActivationPage = pathname === '/auth/request-activation';

    useEffect(() => {
        if (loading) return;
        if (!session) {
            router.push('/auth/login');
        } else if (session.status !== AccountStatus.active && !isRequestActivationPage) {
            router.push('/auth/request-activation');
        }
    }, [loading, session, router, isRequestActivationPage]);

    if (loading || !session || (session.status !== AccountStatus.active && !isRequestActivationPage)) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
