'use client';

import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = "pi pi-inbox",
    title,
    description,
}) => {
    return (
        <div className="flex flex-column align-items-center justify-content-center p-6 text-center border-round-xl surface-50 border-1 surface-border my-2">
            <div 
                className="flex align-items-center justify-content-center border-circle bg-primary-50 text-primary mb-3" 
                style={{ width: '4rem', height: '4rem' }}
            >
                <i className={`${icon} text-3xl`}></i>
            </div>
            <h6 className="text-xl font-semibold text-900 m-0 mb-2">{title}</h6>
            <p className="text-500 text-sm m-0 max-w-26rem line-height-3">{description}</p>
        </div>
    );
};

export default EmptyState;