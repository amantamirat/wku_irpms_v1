'use client';
import CallManager from './components/CallManager';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CallPage = () => {
    const { hasPermission } = useAuth();
    const router = useRouter();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        if (!hasPermission([PERMISSIONS.CALL.READ])) {
            setAllowed(false);
            // Optional: redirect to another page
            //router.replace('/');
        } else {
            setAllowed(true);
        }
    }, [hasPermission, router]);

    if (allowed === null) return null; // waiting for permission check
    if (!allowed) return <p>You do not have permission to access this page.</p>;

    return <CallManager />;
};

export default CallPage;
