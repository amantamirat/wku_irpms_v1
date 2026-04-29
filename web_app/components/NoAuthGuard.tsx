'use client';
import { AccountStatus } from '@/app/(main)/accounts/models/account.model';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NoAuthGuard({ children }: { children: React.ReactNode }) {
    const { account: user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (user?.status === AccountStatus.active) {
            router.push('/');
        } else if (user?.status === AccountStatus.pending) {
            router.push('/auth/request-activation');
        }
    }, [loading, user, router]);

    if (loading || user?.status === AccountStatus.active || user?.status === AccountStatus.pending) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
