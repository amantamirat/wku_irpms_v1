'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { useAuth } from '@/contexts/auth-context';
import { AuthService } from '@/services/AuthService';
import RequireAuth from '@/components/RequireAuth';

export default function RequestActivationPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const msgs = useRef<Messages>(null);
  const [activating, setActivating] = useState(false);



  const handleActivate = async () => {
    try {
      setActivating(true);
      const res = await AuthService.sendResetCode(user?.email || '');
      if (res.success) {
        msgs.current?.clear();
        msgs.current?.show({ severity: 'success', summary: 'Almost There!', detail: 'Reset code has been sent to your email.' });
        setTimeout(() => router.push(`/auth/reset-password?email=${encodeURIComponent(user?.email || '-')}`), 3000);
      } else {
        throw new Error(res.message || 'Activation failed.');
      }
    } catch (err: any) {
      msgs.current?.clear();
      msgs.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Activation failed.' });
    } finally {
      setActivating(false);
    }
  };

  return (
    <RequireAuth>
      <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div className="flex flex-column align-items-center justify-content-center">
          <div
            style={{
              borderRadius: '56px',
              padding: '0.3rem',
              background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
            }}
          >
            <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px', maxWidth: '600px' }}>
              <div className="text-center mb-5">
                <img src="/images/wku_logo.png" alt="wku logo" className="mb-5 w-6rem" />
                <div className="text-900 text-3xl font-medium mb-3">Account Activation Required</div>
                <p className="text-600 font-medium">
                  Your account is currently not activated. To access all features, please click the <strong>Request Activation Code</strong> button below.
                </p>
              </div>
              <div className="mb-4 text-center">
                <div className="text-xl"><strong>Username:</strong> {user?.user_name}</div>
                <div className="text-xl mt-2"><strong>Email:</strong> {user?.email}</div>
              </div>
              <Messages ref={msgs} />
              <Button
                loading={activating}
                label="Request Activation Code"
                className="w-full p-3 text-xl"
                onClick={handleActivate}
                severity="success"
              />
              <div className="flex flex-column align-items-center justify-content-center">
                <Button icon="pi pi-arrow-times" label="Cancel"  className="mt-4" severity="danger" onClick={logout} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
