/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import NoAuthGuard from '@/components/NoAuthGuard';
import { useAuth } from '@/contexts/auth-context';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { validateLogin } from '../dto/auth.dto';
import { ERROR_CODES } from '@/api/error.codes';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AlertState {
    severity: 'error' | 'warn' | 'success';
    summary: string;
    detail: string;
}

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [alert, setAlert] = useState<AlertState | null>(null);

    const [touched, setTouched] = useState<{
        email: boolean;
        password: boolean;
    }>({
        email: false,
        password: false
    });

    const emailRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const { login } = useAuth();
    const { layoutConfig } = useContext(LayoutContext);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const emailError =
        touched.email && email.trim().length === 0
            ? 'Enter your email address.'
            : touched.email && !EMAIL_PATTERN.test(email.trim())
                ? 'Enter a valid email address.'
                : null;

    const passwordError =
        touched.password && password.length === 0
            ? 'Enter your password.'
            : null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setTouched({
            email: true,
            password: true
        });

        setAlert(null);

        const loginDto = {
            email: email.trim(),
            password
        };

        const result = validateLogin(loginDto);

        if (!result.valid) {
            setAlert({
                severity: 'warn',
                summary: 'Check the highlighted fields',
                detail:
                    result.message ||
                    'Please fill in all required fields.'
            });

            return;
        }

        try {
            setLoading(true);

            const loggedIn = await login(loginDto);

            if (loggedIn) {
                setAlert({
                    severity: 'success',
                    summary: 'Signed in successfully',
                    detail: 'Redirecting you now...'
                });

                setTimeout(() => router.push('/'), 1000);
            }
        } catch (err: any) {
            if (err?.code === ERROR_CODES.ACCOUNT_PENDING) {
                setAlert({
                    severity: 'warn',
                    summary: 'Account Activation Required',
                    detail:
                        err.message ||
                        'Your account is not activated. A verification code has been sent to your email.'
                });

                setTimeout(() => {
                    router.replace(
                        `/auth/activate-account?email=${encodeURIComponent(email.trim())}`
                    );
                }, 1000);

                return;
            }

            setAlert({
                severity: 'error',
                summary: "That didn't work",
                detail:
                    err?.message ||
                    "We couldn't sign you in. Check your email and password and try again."
            });
        }
        finally {
            setLoading(false);
        }
    };

    const handlePasswordKeyEvent = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        setCapsLockOn(
            e.getModifierState?.('CapsLock') ?? false
        );
    };

    return (
        <NoAuthGuard>
            <div
                className="surface-ground flex align-items-center justify-content-center min-h-screen w-full"
                style={{
                    padding: '2rem 1rem'
                }}
            >
                <div
                    className="w-full"
                    style={{
                        maxWidth: '480px'
                    }}
                >
                    <div
                        className="surface-card border-1 surface-border shadow-3"
                        style={{
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Top accent bar */}
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
                                    Welcome back
                                </h1>

                                <p
                                    className="text-600 m-0 mt-2"
                                    style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5'
                                    }}
                                >
                                    Sign in to your account to continue
                                </p>
                            </div>

                            {/* Alert */}
                            {alert && (
                                <div
                                    className={classNames(
                                        'p-3 mb-4 flex align-items-start gap-3 border-round-lg text-sm',
                                        {
                                            'bg-red-50 text-red-900 border-1 border-red-200':
                                                alert.severity === 'error',

                                            'bg-yellow-50 text-yellow-900 border-1 border-yellow-200':
                                                alert.severity === 'warn',

                                            'bg-green-50 text-green-900 border-1 border-green-200':
                                                alert.severity === 'success'
                                        }
                                    )}
                                >
                                    <i
                                        className={classNames(
                                            'pi mt-1 flex-shrink-0 text-base',
                                            {
                                                'pi-exclamation-circle text-red-600':
                                                    alert.severity === 'error',

                                                'pi-exclamation-triangle text-yellow-600':
                                                    alert.severity === 'warn',

                                                'pi-check-circle text-green-600':
                                                    alert.severity === 'success'
                                            }
                                        )}
                                    />

                                    <div className="flex-1">
                                        <div className="font-semibold mb-1">
                                            {alert.summary}
                                        </div>

                                        <div
                                            className="opacity-90 line-height-3"
                                            style={{
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {alert.detail}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form
                                onSubmit={handleLogin}
                                className="flex flex-column"
                                noValidate
                            >
                                {/* Email */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="email"
                                        className="block text-900 font-semibold mb-2 text-sm"
                                    >
                                        Email address
                                    </label>

                                    <InputText
                                        id="email"
                                        ref={emailRef}
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        onBlur={() =>
                                            setTouched((t) => ({
                                                ...t,
                                                email: true
                                            }))
                                        }
                                        placeholder="name@organization.edu"
                                        className={classNames(
                                            'w-full text-sm',
                                            {
                                                'p-invalid':
                                                    !!emailError
                                            }
                                        )}
                                        style={{
                                            height: '48px',
                                            padding: '0.75rem 1rem'
                                        }}
                                        disabled={loading}
                                        autoComplete="email"
                                    />

                                    {emailError && (
                                        <small className="block text-red-500 mt-1 text-xs">
                                            {emailError}
                                        </small>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="mb-4">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <label
                                            htmlFor="password"
                                            className="text-900 font-semibold text-sm"
                                        >
                                            Password
                                        </label>

                                        <Button
                                            type="button"
                                            label="Forgot password?"
                                            link
                                            className="p-0 font-medium text-xs no-underline"
                                            onClick={() =>
                                                router.push(
                                                    '/auth/forgot-password'
                                                )
                                            }
                                            disabled={loading}
                                        />
                                    </div>

                                    <Password
                                        inputId="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        onBlur={() =>
                                            setTouched((t) => ({
                                                ...t,
                                                password: true
                                            }))
                                        }
                                        onKeyUp={
                                            handlePasswordKeyEvent
                                        }
                                        onKeyDown={
                                            handlePasswordKeyEvent
                                        }
                                        placeholder="Enter your password"
                                        toggleMask
                                        feedback={false}
                                        className={classNames(
                                            'w-full text-sm',
                                            {
                                                'p-invalid':
                                                    !!passwordError
                                            }
                                        )}
                                        inputClassName="w-full text-sm"
                                        inputStyle={{
                                            height: '48px',
                                            padding:
                                                '0.75rem 2.5rem 0.75rem 1rem'
                                        }}
                                        disabled={loading}
                                        autoComplete="current-password"
                                    />

                                    {passwordError && (
                                        <small className="block text-red-500 mt-1 text-xs">
                                            {passwordError}
                                        </small>
                                    )}

                                    {!passwordError &&
                                        capsLockOn && (
                                            <small className="block text-orange-500 mt-1 text-xs flex align-items-center gap-1">
                                                <i className="pi pi-exclamation-triangle" />
                                                Caps Lock is on.
                                            </small>
                                        )}
                                </div>

                                {/* Sign in */}
                                <Button
                                    type="submit"
                                    label={
                                        loading
                                            ? 'Signing in...'
                                            : 'Sign in'
                                    }
                                    loading={loading}
                                    className="w-full mt-2"
                                    style={{
                                        height: '48px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        borderRadius: '8px'
                                    }}
                                />
                            </form>

                            {/* Back */}
                            <div className="flex align-items-center justify-content-center mt-4">
                                <Button
                                    type="button"
                                    icon="pi pi-arrow-left"
                                    label="Back to landing page"
                                    text
                                    className="p-button-secondary text-xs"
                                    onClick={() =>
                                        router.push('/landing')
                                    }
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-500 mt-4 text-xs">
                        Wolkite University Institutional Research & Project Management System
                    </div>
                </div>
            </div>
        </NoAuthGuard>
    );
};

export default LoginPage;