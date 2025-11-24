'use client';

import { Card } from "primereact/card";

interface ErrorProps {
    errorMessage?: string;
}

const ErrorCard = ({ errorMessage }: ErrorProps) => {
    return (
        <div className="flex flex-column align-items-center justify-content-center">
            <Card
                className="w-full sm:w-6"
                style={{
                    borderRadius: '56px',
                    padding: '1rem',
                    background: 'linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)'
                }}
            >
                <div className="flex flex-column align-items-center">
                    <div className="flex justify-content-center align-items-center bg-pink-500 border-circle" style={{ height: '3.2rem', width: '3.2rem' }}>
                        <i className="pi pi-fw pi-exclamation-circle text-2xl text-white"></i>
                    </div>
                    <h1 className="text-900 font-bold text-5xl mb-2">Error Occurred</h1>
                    <div className="text-600 mb-5">{errorMessage}</div>
                    <img src="/images/asset-error.svg" alt="Error" className="mb-5" width="60%" />
                </div>
            </Card>
        </div>
    );
};

export default ErrorCard;