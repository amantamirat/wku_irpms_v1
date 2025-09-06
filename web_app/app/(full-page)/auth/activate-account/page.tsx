'use client';
import { AuthApi } from '@/services/AuthService';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Messages } from 'primereact/messages';
import { classNames } from 'primereact/utils';
import { useContext, useRef, useState } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useAuth } from '@/contexts/auth-context';

export default function ActivateAccountPage() {
  const [activating, setActivating] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const router = useRouter();
  const { layoutConfig } = useContext(LayoutContext);
  const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });
  const msgs = useRef<Messages>(null);
  const { logout } = useAuth();




  const activateAccount = async () => {
    try {
      setActivating(true);
      if (!activationCode) {
        msgs.current?.clear();
        msgs.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
        return;
      }
      const data = await AuthApi.activateAccount(activationCode);
      if (data.success) {
        msgs.current?.clear();
        msgs.current?.show({ severity: 'success', summary: 'Success!', detail: 'Your account has been activated successfully.' });
        setTimeout(() => logout(), 3000);
      }
    } catch (err: any) {
      console.error(err);
      msgs.current?.clear();
      msgs.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Activating account failed. Try again later.'
      });
    } finally {
      setActivating(false);
    }
  };




  return (
    <div className={containerClassName}>
      <div className="flex flex-column align-items-center justify-content-center">
        <div
          style={{
            borderRadius: '56px',
            padding: '0.3rem',
            background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
          }}
        >
          <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
            <div className="text-center mb-5">
              <img src={`/images/wku_logo.png`} alt="wku logo" className="mb-5 w-6rem flex-shrink-0" />
              <div className="text-900 text-3xl font-medium mb-3">Account Activation</div>
              <span className="text-600 font-medium">Enter the activation code and your new password</span>
            </div>

            <div className="mb-5">
              <label htmlFor="resetCode" className="block text-900 text-xl font-medium mb-2">
                Activation Code
              </label>
              <InputText
                id="resetCode"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Enter the 9-digit code you received"
                className="w-full p-3 md:w-30rem"
              />
            </div>

            <Messages ref={msgs} style={{ width: '100%', wordBreak: 'break-word' }} />
            <Button
              loading={activating}
              label={"Activate Account"}
              className="w-full p-3 text-xl"
              type="submit"
              onClick={activateAccount}
              severity="success"
              outlined
            />
            <div className="flex flex-column align-items-center justify-content-center">
              <Button
                icon="pi pi-sign-out"
                label="Log out"
                className="mt-4"
                severity="danger"
                outlined
                onClick={logout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


