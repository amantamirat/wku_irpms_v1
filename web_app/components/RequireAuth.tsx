'use client';

import { AccountStatus } from '@/app/(main)/accounts/models/account.model';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({
    children
}: {
    children: React.ReactNode;
}) {
    const { session, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isLoginPage = pathname === '/auth/login';
    const isRequestActivationPage = pathname === '/auth/request-activation';

    useEffect(() => {
        if (loading) return;
        if (!session) {
            if (!isLoginPage) {
                router.replace('/auth/login');
            }
            return;
        }

        if (
            session.status !== AccountStatus.active && !isRequestActivationPage
        ) {
            router.replace('/auth/request-activation');
        }
    }, [
        loading,
        session,
        router,
        pathname,
        isLoginPage,
        isRequestActivationPage,
    ]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!session) {
        return <div>Loading...</div>;
    }

    if (
        session.status !== AccountStatus.active &&
        !isRequestActivationPage
    ) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}