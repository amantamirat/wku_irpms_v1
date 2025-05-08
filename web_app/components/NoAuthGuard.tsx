'use client';
import { useAuth } from '@/contexts/auth-context';
import { UserStatus } from '@/models/user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NoAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.status === UserStatus.Active) {
            router.push('/');
        }
    }, [loading, user, router]);

    if (loading || user?.status === UserStatus.Active) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
