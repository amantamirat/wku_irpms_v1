/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Messages } from 'primereact/messages';
import NoAuthGuard from '@/components/NoAuthGuard';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accepted, setAccepted] = useState(false);

    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const msgs = useRef<Messages>(null);

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', {
        'p-input-filled': layoutConfig.inputStyle === 'filled'
    });

    const handleSignUp = () => {
        if (!username || !email || !password || !confirmPassword) {
            msgs.current?.show({ severity: 'warn', summary: 'Missing fields', detail: 'Please fill in all fields' });
            return;
        }

        if (password !== confirmPassword) {
            msgs.current?.show({ severity: 'error', summary: 'Password Mismatch', detail: 'Passwords do not match' });
            return;
        }

        if (!accepted) {
            msgs.current?.show({ severity: 'warn', summary: 'Terms Not Accepted', detail: 'Please accept terms and conditions' });
            return;
        }

        // Proceed with sign up logic
        // router.push('/'); // Redirect after signup (change this as needed)
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
                            <div className="text-900 text-3xl font-medium mb-3">Create Account</div>
                            <span className="text-600 font-medium">Sign up to get started</span>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                Username
                            </label>
                            <InputText id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password inputId="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem" />

                            <label htmlFor="confirmPassword" className="block text-900 font-medium text-xl mb-2">
                                Confirm Password
                            </label>
                            <Password inputId="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem" />

                            <div className="flex align-items-center mb-5">
                                <Checkbox inputId="accept" checked={accepted} onChange={(e) => setAccepted(e.checked ?? false)} className="mr-2" />
                                <label htmlFor="accept" className="text-sm">I agree to the terms and conditions</label>
                            </div>

                            <Messages ref={msgs} />
                            <Button label="Sign Up" className="w-full p-3 text-xl" onClick={handleSignUp} />

                            <div className="flex flex-column align-items-center justify-content-center">
                                <Button icon="pi pi-arrow-left" label="Back to Login" text className="mt-4" onClick={() => router.push('/auth/login')} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </NoAuthGuard>
    );
};

export default SignUpPage;
