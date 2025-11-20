'use client';
import ErrorCard from '@/components/ErrorCard';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

const ErrorPage = () => {
    const router = useRouter();

    return (
        <>
            <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
                <div className="flex flex-column align-items-center justify-content-center">
                    {
                        //<img src={`/images/wku_logo.png`} alt="WKU logo" className="mb-5 w-6rem flex-shrink-0" />
                    }
                    <ErrorCard errorMessage='something went wrong' />
                    <Button icon="pi pi-arrow-left" label="Go to Dashboard" text onClick={() => router.push('/')} />
                </div>
            </div>
        </>
    );
};

export default ErrorPage;