'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { Ripple } from 'primereact/ripple';

interface QuickLinkItem {
    href: string;
    label: string;
    description: string;
    icon: string;
    permission: string;
    color: string;
}

export default function QuickLinks() {
    const { hasPermission } = useAuth();
    const router = useRouter();

    const links: QuickLinkItem[] = useMemo(() => [
        {
            href: '/projects/applicant',
            label: 'My Projects',
            description: 'Manage active research and deliverables',
            icon: 'pi pi-briefcase',
            permission: PERMISSIONS.PROJECT.READ,
            color: 'bg-blue-100 text-blue-700'
        },
        {
            href: '/calls/reviewers',
            label: 'Review Panel',
            description: 'Evaluate submitted proposals and scores',
            icon: 'pi pi-check-square',
            permission: PERMISSIONS.REVIEWER.READ,
            color: 'bg-orange-100 text-orange-700'
        },
        {
            href: '/projects/collaborators/applicant',
            label: 'Collaborations',
            description: 'View teams and joint research efforts',
            icon: 'pi pi-users',
            permission: PERMISSIONS.COLLABORATOR.READ,
            color: 'bg-purple-100 text-purple-700'
        },
        {
            href: '/submissions/drafts',
            label: 'Saved Drafts',
            description: 'Continue your pending applications',
            icon: 'pi pi-pencil',
            permission: PERMISSIONS.DOCUMENT.SUBMIT,
            color: 'bg-cyan-100 text-cyan-700'
        },
        {
            href: '/reports/financial',
            label: 'Grant Tracking',
            description: 'Monitor budget spend and funding',
            icon: 'pi pi-money-bill',
            permission: PERMISSIONS.PERMISSION.READ, // Admin or PI only
            color: 'bg-green-100 text-green-700'
        }
    ], []);

    const allowedLinks = links.filter(link => hasPermission([link.permission]));

    if (allowedLinks.length === 0) return null;

    return (
        <div className="col-12 mt-4">
            <h5 className="mb-3 font-bold text-900">Quick Access</h5>
            <div className="grid">
                {allowedLinks.map((link, index) => (
                    <div key={index} className="col-12 md:col-6 lg:col-3">
                        <div 
                            className="p-3 shadow-1 border-round surface-card h-full cursor-pointer hover:shadow-3 transition-duration-200 p-ripple"
                            onClick={() => router.push(link.href)}
                        >
                            <div className="flex align-items-center mb-3">
                                <div className={`w-3rem h-3rem flex align-items-center justify-content-center border-round ${link.color}`}>
                                    <i className={`${link.icon} text-2xl`}></i>
                                </div>
                                <span className="text-900 font-medium ml-3">{link.label}</span>
                            </div>
                            <span className="text-600 text-sm line-height-3">
                                {link.description}
                            </span>
                            <Ripple />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}