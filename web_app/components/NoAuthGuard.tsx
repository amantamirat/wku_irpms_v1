'use client';
import { AccountStatus } from '@/app/(main)/accounts/models/account.model';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NoAuthGuard({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (session?.status === AccountStatus.active) {
            router.push('/');
        } else if (session?.status === AccountStatus.pending) {
            router.push('/auth/request-activation');
        }
    }, [loading, session, router]);

    if (loading || session?.status === AccountStatus.active || session?.status === AccountStatus.pending) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
