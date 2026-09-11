/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { classNames } from 'primereact/utils';

import NoAuthGuard from '@/components/NoAuthGuard';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { AuthApi } from '../api/auth.api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [progressing, setProgressing] = useState(false);
    const [touched, setTouched] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);
    const msgs = useRef<Messages>(null);
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const emailError =
        touched && email.trim().length === 0
            ? 'Enter your email address.'
            : touched && !EMAIL_PATTERN.test(email.trim())
            ? 'Enter a valid email address.'
            : null;

    const handleSendCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setTouched(true);

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            msgs.current?.clear();
            msgs.current?.show({
                severity: 'warn',
                summary: 'Required',
                detail: 'Please enter your email address.'
            });
            return;
        }

        if (!EMAIL_PATTERN.test(trimmedEmail)) {
            msgs.current?.clear();
            msgs.current?.show({
                severity: 'warn',
                summary: 'Invalid Email',
                detail: 'Please enter a valid email address format.'
            });
            return;
        }

        try {
            setProgressing(true);
            msgs.current?.clear();

            const data = await AuthApi.sendVerificationCode(trimmedEmail);

            if (data.success) {
                msgs.current?.show({
                    severity: 'success',
                    summary: 'Check your inbox',
                    detail: 'Verification code sent. Redirecting to reset page...'
                });
                setTimeout(() => {
                    router.push(`/auth/reset-password?email=${encodeURIComponent(trimmedEmail)}`);
                }, 2000);
            }
        } catch (err: any) {
            msgs.current?.clear();
            msgs.current?.show({
                severity: 'error',
                summary: 'Request Failed',
                detail: err?.message || 'We could not send a reset code. Please try again later.'
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
                        style={{
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Top accent line */}
                        <div
                            style={{
                                height: '4px',
                                background: 'var(--primary-color)'
                            }}
                        />

                        <div
                            className="p-4 sm:p-5 md:p-6"
                            style={{
                                paddingTop: '2.5rem',
                                paddingBottom: '2.25rem'
                            }}
                        >
                            {/* Header */}
                            <div className="text-center mb-5">
                                <img
                                    src="/images/wku_logo.png"
                                    alt="WKU Logo"
                                    style={{
                                        width: '76px',
                                        height: '76px',
                                        objectFit: 'contain',
                                        marginBottom: '1rem'
                                    }}
                                />

                                <h1
                                    className="text-900 font-bold m-0"
                                    style={{
                                        fontSize: '1.75rem',
                                        lineHeight: '1.2',
                                        letterSpacing: '-0.02em'
                                    }}
                                >
                                    Forgot Password?
                                </h1>

                                <p
                                    className="text-600 m-0 mt-2"
                                    style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5'
                                    }}
                                >
                                    Enter your institutional email to receive a password reset code.
                                </p>
                            </div>

                            {/* Alert Messages */}
                            <div className="mb-4">
                                <Messages ref={msgs} style={{ width: '100%', wordBreak: 'break-word' }} />
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSendCode} className="flex flex-column" noValidate>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-900 font-semibold mb-2 text-sm">
                                        Email address
                                    </label>

                                    <InputText
                                        id="email"
                                        ref={emailRef}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => setTouched(true)}
                                        placeholder="name@wku.edu.et"
                                        className={classNames('w-full text-sm', {
                                            'p-invalid': !!emailError
                                        })}
                                        style={{
                                            height: '48px',
                                            padding: '0.75rem 1rem'
                                        }}
                                        disabled={progressing}
                                        autoComplete="email"
                                    />

                                    {emailError && (
                                        <small className="block text-red-500 mt-1 text-xs">{emailError}</small>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    label={progressing ? 'Sending Code...' : 'Send Verification Code'}
                                    loading={progressing}
                                    className="w-full mt-2"
                                    style={{
                                        height: '48px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        borderRadius: '8px'
                                    }}
                                />
                            </form>

                            {/* Navigation Back */}
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

                    {/* Footer branding */}
                    <div className="text-center text-500 mt-4 text-xs">
                        Wolkite University Institutional Research & Project Management System
                    </div>
                </div>
            </div>
        </NoAuthGuard>
    );
}