'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useContext } from 'react';
import { Messages } from 'primereact/messages';

export default function ResetPassword() {
  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const { layoutConfig } = useContext(LayoutContext);
  const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });
  const msgs = useRef<Messages>(null);  
  const [expired, setExpired] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const resetPassword = async () => {

    if (!email) {
      msgs.current?.clear();
      msgs.current?.show({ severity: 'error', summary: 'Missing Email', detail: 'Email information is missing.' });
      return;
    }

    if (!resetCode) {
      msgs.current?.clear();
      msgs.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
      return;
    }
    if (!password.trim() || !confirmPassword.trim()) {
      msgs.current?.clear();
      msgs.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Password is required.' });
      return;
    }
    if (password !== confirmPassword) {
      msgs.current?.clear();
      msgs.current?.show({ severity: 'error', summary: 'Password Mismatch', detail: 'Passwords do not match' });
      return;
    }

    // TODO: Replace with real API call
    console.log('Submitted:', { resetCode, password });

    // Simulate success    
    setTimeout(() => router.push('/auth/login'), 3000);
  };


  if (expired===true) {
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
              <div className="text-center">
                <div className="text-red-500">Code is Expired!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="text-900 text-3xl font-medium mb-3">Reset Password</div>
              <span className="text-600 font-medium">Enter the reset code and your new password</span>
            </div>

            <div className="mb-5">
              <label htmlFor="resetCode" className="block text-900 text-xl font-medium mb-2">
                Reset Code
              </label>
              <InputText
                id="resetCode"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter the 9-digit code you received"
                className="w-full p-3 md:w-30rem"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-900 text-xl font-medium mb-2">
                New Password
              </label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                toggleMask
                className="w-full"
                inputClassName="w-full p-3 md:w-30rem"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="confirmPassword" className="block text-900 text-xl font-medium mb-2">
                Confirm New Password
              </label>
              <Password
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                toggleMask
                className="w-full"
                inputClassName="w-full p-3 md:w-30rem"
              />
            </div>
            <Messages ref={msgs} />
            <Button
              label="Reset Password"
              className="w-full p-3 text-xl"
              type="submit"
              onClick={resetPassword}
            />
            <div className="flex flex-column align-items-center justify-content-center">
              <Button icon="pi pi-arrow-left" label="Back to Login" text className="mt-4" onClick={() => router.push('/auth/login')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
