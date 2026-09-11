/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { classNames } from 'primereact/utils';

import NoAuthGuard from '@/components/NoAuthGuard';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { AuthApi } from '../api/auth.api';

export default function ActivateAccountPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);

    const [activating, setActivating] = useState(false);
    const [activationCode, setActivationCode] = useState('');
    const [touched, setTouched] = useState(false);

    const codeRef = useRef<HTMLInputElement>(null);
    const msgs = useRef<Messages>(null);

    useEffect(() => {
        codeRef.current?.focus();
    }, []);

    // Local Field Validation
    const trimmedCode = activationCode.trim();
    const codeError = !touched
        ? null
        : !trimmedCode
        ? 'Enter your activation code.'
        : null;

    const activateAccount = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setTouched(true);

        msgs.current?.clear();

        if (!email) {
            msgs.current?.show({
                severity: 'error',
                summary: 'Missing Email',
                detail: 'No email address detected. Please return to sign in or sign up.'
            });
            return;
        }

        if (!trimmedCode) {
            return;
        }

        try {
            setActivating(true);

            const data = await AuthApi.activateUser({
                email,
                resetCode: trimmedCode
            });

            if (data.success) {
                msgs.current?.show({
                    severity: 'success',
                    summary: 'Account Activated',
                    detail: 'Your account is now ready. Redirecting to sign in...'
                });

                setTimeout(() => {
                    router.replace('/auth/login');
                }, 1500);
            }
        } catch (err: any) {
            msgs.current?.show({
                severity: 'error',
                summary: 'Activation Failed',
                detail: err?.message || 'Invalid activation code or server error. Please try again.'
            });
        } finally {
            setActivating(false);
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
                        {/* Top Primary Color Bar */}
                        <div style={{ height: '4px', background: 'var(--primary-color)' }} />

                        <div className="p-4 sm:p-5 md:p-6" style={{ paddingTop: '2.5rem', paddingBottom: '2.25rem' }}>
                            <div className="text-center mb-4">
                                <img
                                    src="/images/wku_logo.png"
                                    alt="WKU Logo"
                                    style={{ width: '76px', height: '76px', objectFit: 'contain', marginBottom: '1rem' }}
                                />
                                <h1 className="text-900 font-bold m-0" style={{ fontSize: '1.75rem', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                                    Activate Account
                                </h1>
                                <p className="text-600 m-0 mt-2 text-sm" style={{ lineHeight: '1.5' }}>
                                    Enter the activation code sent to your email to verify your registration.
                                </p>
                            </div>

                            {/* Email Target Indicator */}
                            {email && (
                                <div className="surface-100 border-round p-3 mb-4 flex align-items-center justify-content-center gap-2">
                                    <i className="pi pi-envelope text-500 text-sm" />
                                    <span className="text-700 font-medium text-sm word-break-all">{email}</span>
                                </div>
                            )}

                            {/* API Alert Messages */}
                            <div className="mb-4">
                                <Messages ref={msgs} style={{ width: '100%', wordBreak: 'break-word' }} />
                            </div>

                            <form onSubmit={activateAccount} className="flex flex-column" noValidate>
                                <div className="mb-4">
                                    <label htmlFor="activationCode" className="block text-900 font-semibold mb-2 text-sm">
                                        Activation Code
                                    </label>

                                    <InputText
                                        id="activationCode"
                                        ref={codeRef}
                                        value={activationCode}
                                        onChange={(e) => setActivationCode(e.target.value)}
                                        onBlur={() => setTouched(true)}
                                        placeholder="Enter code"
                                        className={classNames('w-full text-sm', {
                                            'p-invalid': !!codeError
                                        })}
                                        style={{ height: '48px', padding: '0.75rem 1rem' }}
                                        disabled={activating}
                                        autoComplete="one-time-code"
                                    />

                                    {codeError && (
                                        <small className="block text-red-500 mt-1 text-xs">{codeError}</small>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    label={activating ? 'Activating...' : 'Activate Account'}
                                    loading={activating}
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
                                    onClick={() => router.replace('/auth/login')}
                                    disabled={activating}
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