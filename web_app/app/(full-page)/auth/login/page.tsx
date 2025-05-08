/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Messages } from "primereact/messages";
import { AuthService } from '@/services/AuthService';
import { useAuth } from '@/contexts/auth-context';
import NoAuthGuard from '@/components/NoAuthGuard';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });
    const msgs = useRef<Messages>(null);
    const { login } = useAuth();

    const handleLogin = async () => {
        try {
            const user_name = email.trim();
            const userPassword = password.trim();

            if (!user_name || !userPassword) {
                msgs.current?.clear();
                msgs.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Email and password are required.' });
                return;
            }

            const { token, user } = await AuthService.loginUser({ user_name, password: userPassword });
            if (token) {
                login(user, token);
                msgs.current?.clear();
                msgs.current?.show({ severity: 'success', summary: 'Success', detail: 'Login successful!' });
                setTimeout(() => router.push('/'), 500);
            }
        } catch (err: any) {
            console.error(err);
            msgs.current?.clear();
            msgs.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Login failed. Try again later.'
            });
        }
    };

    return (
        <NoAuthGuard>
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
                                <div className="text-900 text-3xl font-medium mb-3">Welcome Back!</div>
                                <span className="text-600 font-medium">Sign in to continue</span>
                            </div>

                            <div>
                                <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">
                                    Email
                                </label>
                                <InputText id="email1" value={email}
                                    onChange={(e) => setEmail(e.target.value)} type="text" placeholder="Email address" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                                <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                    Password
                                </label>
                                <Password inputId="password1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem"></Password>

                                <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                    <div className="flex align-items-center">
                                        <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                        <label htmlFor="rememberme1">Remember me</label>
                                    </div>
                                    <a
                                        className="font-medium no-underline ml-2 text-right cursor-pointer"
                                        style={{ color: 'var(--primary-color)' }}
                                        onClick={() => router.push('/auth/forgot-password')}
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                                <Messages ref={msgs} />
                                <Button label="Sign In" className="w-full p-3 text-xl" onClick={handleLogin}></Button>
                                <div className="flex flex-column align-items-center justify-content-center">
                                    <Button icon="pi pi-arrow-left" label="Go to Landing" text className="mt-4" onClick={() => router.push('/landing')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </NoAuthGuard>
    );
};

export default LoginPage;
