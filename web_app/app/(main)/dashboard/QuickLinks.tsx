'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';

export default function QuickLinks() {
    return (
        <div className="card flex flex-wrap gap-3 justify-content-center">
            <Link href="/">
                <Button label="View All Calls" icon="pi pi-bullhorn" className="p-button-info p-button-rounded" />
            </Link>
            <Link  href="/projects">
                <Button label="Manage Projects" icon="pi pi-briefcase" className="p-button-success p-button-rounded" />
            </Link>
            <Link href="/">
                <Button label="View Evaluations" icon="pi pi-chart-bar" className="p-button-warning p-button-rounded" />
            </Link>
            <Link href="/">
                <Button label="Researchers" icon="pi pi-users" className="p-button-help p-button-rounded" />
            </Link>
        </div>
    );
}
