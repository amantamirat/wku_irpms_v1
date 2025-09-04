'use client';
import { UserStatus } from '@/app/(main)/users/models/user.model';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NoAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (user?.status === UserStatus.Active) {
            router.push('/');
        } else if (user?.status === UserStatus.Pending) {
            router.push('/auth/request-activation');
        }
    }, [loading, user, router]);

    if (loading || user?.status === UserStatus.Active || user?.status === UserStatus.Pending) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
