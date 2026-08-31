'use client';

import React from 'react';
import { Button } from 'primereact/button';
import Link from 'next/link';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = "pi pi-inbox",
    title,
    description,
    actionLabel,
    actionHref,
    onAction
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
            <p className="text-500 text-sm m-0 mb-4 max-w-26rem line-height-3">{description}</p>
            
            {actionLabel && actionHref && (
                <Link href={actionHref}>
                    <Button label={actionLabel} icon="pi pi-plus" className="p-button-sm" />
                </Link>
            )}

            {actionLabel && onAction && !actionHref && (
                <Button label={actionLabel} icon="pi pi-plus" onClick={onAction} className="p-button-sm" />
            )}
        </div>
    );
};

export default EmptyState;