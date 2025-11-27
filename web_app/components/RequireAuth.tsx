'use client';
import { UserStatus } from '@/app/(main)/users/models/user.model';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const pathname = usePathname();
    const isRequestActivationPage = pathname === '/auth/request-activation';

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/auth/login');
        } else if (user.status !== UserStatus.active && !isRequestActivationPage) {
            router.push('/auth/request-activation');
        }
    }, [loading, user, router, isRequestActivationPage]);

    if (loading || !user || (user.status !== UserStatus.active && !isRequestActivationPage)) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
