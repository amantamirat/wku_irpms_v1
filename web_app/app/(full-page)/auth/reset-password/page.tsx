'use client';
import { AuthApi } from '@/app/(full-page)/auth/api/auth.api';
import NoAuthGuard from '@/components/NoAuthGuard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { useContext, useState } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { User, UserStatus, validateVerification, VerfyUserDto } from '../model/login.model';

export default function ResetPassword() {

  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  let emptyVerification: VerfyUserDto = {
    email: email,
    reset_code: ''
  };

  const router = useRouter();
  const [progressing, setProgressing] = useState(false);
  const [credential, setCredential] = useState<VerfyUserDto>(emptyVerification);



  const resetPassword = async () => {
    try {
      setProgressing(true);

      const result = validateVerification(credential);
      if (!result.valid) {
        throw new Error(result.message);
      }

      const data = await AuthApi.resetPassword(credential);
      if (data.success) {
        alert('Your password has been reset successfully.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Resetting password failed. Try again later.');
    } finally {
      //setCredential(emptyUser);
      setProgressing(false);
    }
  };


  const { layoutConfig } = useContext(LayoutContext);
  const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });


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
                <div className="text-900 text-3xl font-medium mb-3">Reset Password</div>
                <span className="text-600 font-medium">Enter the verification code and your new password</span>
              </div>

              <div className="mb-5">
                <label htmlFor="verificationCode" className="block text-900 text-xl font-medium mb-2">
                  Reset Code
                </label>
                <InputText
                  id="verificationCode"
                  value={credential.reset_code}
                  onChange={(e) => setCredential({ ...credential, reset_code: e.target.value })}
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
                  value={credential.password}
                  onChange={(e) => setCredential({ ...credential, password: e.target.value })}
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
                  value={credential.confirmed_password}
                  onChange={(e) => setCredential({ ...credential, confirmed_password: e.target.value })}
                  placeholder="Confirm new password"
                  toggleMask
                  className="w-full"
                  inputClassName="w-full p-3 md:w-30rem"
                />
              </div>

              <Button
                loading={progressing}
                label={"Reset Password"}
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

    </NoAuthGuard>
  );
}
