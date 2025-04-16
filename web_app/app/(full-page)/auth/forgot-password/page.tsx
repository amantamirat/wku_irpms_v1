'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useContext } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { layoutConfig } = useContext(LayoutContext);
  const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Add your API call here
    console.log('Email submitted:', email);
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
              <div className="text-900 text-3xl font-medium mb-3">Forgot Password</div>
              <span className="text-600 font-medium">Enter your email to reset your password</span>
            </div>

            {success ? (
              <div className="text-center">
                <div className="text-green-500 mb-3">
                  If an account exists with this email, you will receive password reset instructions.
                </div>
                <Button
                  label="Back to Login"
                  className="w-full p-3 text-xl"
                  onClick={() => router.push('/auth/login')}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                    Email
                  </label>
                  <InputText
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="w-full md:w-30rem"
                    style={{ padding: '1rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {error && <small className="text-red-500">{error}</small>}
                </div>

                <Button
                  label="Send Reset Link"
                  className="w-full p-3 text-xl mb-3"
                  type="submit"
                />
                <Button
                  label="Back to Login"
                  className="w-full p-3 text-xl"
                  onClick={() => router.push('/auth/login')}
                  text
                />
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 