/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { classNames } from 'primereact/utils';
import NoAuthGuard from '@/components/NoAuthGuard';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { AuthApi } from '../api/auth.api';
import { ResetPasswordDto } from '../dto/auth.dto';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const router = useRouter();
  const { layoutConfig } = useContext(LayoutContext);

  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [progressing, setProgressing] = useState(false);
  const [touched, setTouched] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const msgs = useRef<Messages>(null);

  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  // Form Validation Rules
  const trimmedCode = resetCode.trim();
  const isCodeInvalid = touched && !trimmedCode;
  const isPasswordInvalid = touched && (!password || password.length < 6);
  const isConfirmInvalid = touched && (confirmPassword !== password || !confirmPassword);

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTouched(true);

    msgs.current?.clear();

    if (!email) {
      msgs.current?.show({
        severity: 'error',
        summary: 'Missing Email',
        detail: 'No email provided. Please restart the reset process from the forgot password page.'
      });
      return;
    }

    if (!trimmedCode || !password || password.length < 6 || password !== confirmPassword) {
      return;
    }

    const dto: ResetPasswordDto = {
      email,
      resetCode: trimmedCode,
      password
    };

    try {
      setProgressing(true);

      const data = await AuthApi.resetPassword(dto);

      if (data?.success) {
        msgs.current?.show({
          severity: 'success',
          summary: 'Password Reset Successful',
          detail: 'Your password has been reset. Redirecting to sign in...'
        });

        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err: any) {
      msgs.current?.show({
        severity: 'error',
        summary: 'Reset Failed',
        detail: err?.message || 'Failed to reset password. Please verify your code and try again.'
      });
    } finally {
      setProgressing(false);
    }
  };

  return (
    <NoAuthGuard>
      <div
        className={classNames('surface-ground flex align-items-center justify-content-center min-h-screen w-full', {
          'p-input-filled': layoutConfig.inputStyle === 'filled'
        })}
        style={{ padding: '2rem 1rem' }}
      >
        <div className="w-full" style={{ maxWidth: '480px' }}>
          <div
            className="surface-card border-1 surface-border shadow-3"
            style={{ borderRadius: '16px', overflow: 'hidden' }}
          >
            <div style={{ height: '4px', background: 'var(--primary-color)' }} />

            <div className="p-4 sm:p-5 md:p-6" style={{ paddingTop: '2.5rem', paddingBottom: '2.25rem' }}>
              <div className="text-center mb-4">
                <img
                  src="/images/wku_logo.png"
                  alt="WKU Logo"
                  style={{ width: '76px', height: '76px', objectFit: 'contain', marginBottom: '1rem' }}
                />
                <h1 className="text-900 font-bold m-0" style={{ fontSize: '1.75rem', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                  Reset Password
                </h1>
                <p className="text-600 m-0 mt-2 text-sm" style={{ lineHeight: '1.5' }}>
                  Enter your verification code and choose a new password.
                </p>
              </div>

              {/* Target Email Indicator */}
              {email && (
                <div className="surface-100 border-round p-3 mb-4 flex align-items-center justify-content-center gap-2">
                  <i className="pi pi-envelope text-500 text-sm" />
                  <span className="text-700 font-medium text-sm word-break-all">{email}</span>
                </div>
              )}

              {/* API Messages */}
              <div className="mb-4">
                <Messages ref={msgs} style={{ width: '100%', wordBreak: 'break-word' }} />
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-column" noValidate>
                {/* Reset Code Input */}
                <div className="mb-4">
                  <label htmlFor="resetCode" className="block text-900 font-semibold mb-2 text-sm">
                    Reset Code
                  </label>
                  <InputText
                    id="resetCode"
                    ref={codeRef}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Enter the code sent to your email"
                    className={classNames('w-full text-sm', {
                      'p-invalid': isCodeInvalid
                    })}
                    style={{ height: '48px', padding: '0.75rem 1rem' }}
                    disabled={progressing}
                    autoComplete="one-time-code"
                  />
                  {isCodeInvalid && (
                    <small className="block text-red-500 mt-1 text-xs">Reset code is required.</small>
                  )}
                </div>

                {/* New Password Input */}
                <div className="mb-4">
                  <label htmlFor="password" className="block text-900 font-semibold mb-2 text-sm">
                    New Password
                  </label>
                  <Password
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Minimum 6 characters"
                    toggleMask
                    feedback
                    className={classNames('w-full', {
                      'p-invalid': isPasswordInvalid
                    })}
                    inputClassName="w-full text-sm"
                    inputStyle={{ height: '48px', padding: '0.75rem 1rem' }}
                    disabled={progressing}
                    autoComplete="new-password"
                  />
                  {isPasswordInvalid && (
                    <small className="block text-red-500 mt-1 text-xs">
                      Password must be at least 6 characters long.
                    </small>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="block text-900 font-semibold mb-2 text-sm">
                    Confirm New Password
                  </label>
                  <Password
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Re-enter new password"
                    toggleMask
                    feedback={false}
                    className={classNames('w-full', {
                      'p-invalid': isConfirmInvalid
                    })}
                    inputClassName="w-full text-sm"
                    inputStyle={{ height: '48px', padding: '0.75rem 1rem' }}
                    disabled={progressing}
                    autoComplete="new-password"
                  />
                  {isConfirmInvalid && (
                    <small className="block text-red-500 mt-1 text-xs">
                      {!confirmPassword ? 'Please confirm your password.' : 'Passwords do not match.'}
                    </small>
                  )}
                </div>

                <Button
                  type="submit"
                  label={progressing ? 'Resetting Password...' : 'Reset Password'}
                  loading={progressing}
                  className="w-full mt-2"
                  style={{ height: '48px', fontSize: '0.95rem', fontWeight: 600, borderRadius: '8px' }}
                />
              </form>

              <div className="flex align-items-center justify-content-center mt-4">
                <Button
                  type="button"
                  icon="pi pi-arrow-left"
                  label="Back to Sign In"
                  text
                  className="p-button-secondary text-xs"
                  onClick={() => router.push('/auth/login')}
                  disabled={progressing}
                />
              </div>
            </div>
          </div>

          <div className="text-center text-500 mt-4 text-xs">
            Wolkite University Institutional Research & Project Management System
          </div>
        </div>
      </div>
    </NoAuthGuard>
  );
}