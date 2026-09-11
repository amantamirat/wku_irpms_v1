'use client';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({
    children
}: {
    children: React.ReactNode;
}) {
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!session) {
            router.replace('/auth/login');
        }
    }, [loading, session, router]);

    if (loading || !session) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}