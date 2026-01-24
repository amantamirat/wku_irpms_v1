'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';

export default function QuickLinks() {
    return (
        <div className="card flex flex-wrap gap-3 justify-content-center">
            <Link href="/projects">
                <Button label="My Projects" icon="pi pi-briefcase" className="p-button-success p-button-rounded" />
            </Link>
            
            <Link href="/calls/reviewers">
                <Button label="My Evaluations" icon="pi pi-chart-bar" className="p-button-warning p-button-rounded" />
            </Link>

            <Link href="/projects/collaborators">
                <Button label="My Collaborations" icon="pi pi-users" className="p-button-help p-button-rounded" />
            </Link>

        </div>
    );
}
