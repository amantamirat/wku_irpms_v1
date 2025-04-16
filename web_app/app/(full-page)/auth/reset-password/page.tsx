'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useContext } from 'react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { layoutConfig } = useContext(LayoutContext);
  const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid or expired reset link');
    }
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Add your API call here
    console.log('Password reset submitted:', { token, password });
  };

  if (!token) {
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
                <div className="text-red-500">Invalid or expired reset link</div>
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
              <span className="text-600 font-medium">Enter your new password</span>
            </div>

            {success ? (
              <div className="text-center">
                <div className="text-green-500 mb-3">
                  Password has been reset successfully. Redirecting to login...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
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
                  {error && <small className="text-red-500">{error}</small>}
                </div>

                <Button
                  label="Reset Password"
                  className="w-full p-3 text-xl"
                  type="submit"
                />
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 