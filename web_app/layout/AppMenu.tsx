/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';
import { PrimeIcons } from 'primereact/api';
import { Organization, OrganizationalUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
//import { Scope } from '@/app/(main)/applicants/models/applicant.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';


const AppMenu = () => {
    const { hasPermission, hasOrganizationType } = useAuth();
    const { layoutConfig } = useContext(LayoutContext);
    const icons = ['pi pi-mars', 'pi pi-microchip', 'pi pi-prime', 'pi pi-sparkles', 'pi pi-venus'];

    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        OrganizationApi.getOrganizations({ type: OrganizationalUnit.Directorate })
            .then(data => setOrganizations(data))
            .catch(err => console.error('Failed to fetch organization of directorates', err));
    }, []);

    const directoratesMenu: AppMenuItem = {
        label: 'Directorates',
        icon: 'pi pi-sitemap',
        items: organizations.map((dir, index) => ({
            label: dir.name,
            icon: icons[index % icons.length],
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: `/calls?id=${dir._id}&name=${encodeURIComponent(dir.name)}`
                },
                {
                    label: 'Themes',
                    icon: 'pi pi-fw pi-tags',
                    to: `/themes?id=${dir._id}&name=${encodeURIComponent(dir.name)}`

                },

            ]
        }))
    };



    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        directoratesMenu,
        {
            label: 'Directorate',
            icon: PrimeIcons.SITEMAP,
            visible: hasOrganizationType([OrganizationalUnit.Directorate]),
            items: [
                {
                    label: 'Evaluations',
                    icon: 'pi pi-fw pi-calculator',
                    to: '/evals',
                    visible: hasPermission(
                        [
                            PERMISSIONS.EVALUATION.CREATE,
                            PERMISSIONS.EVALUATION.UPDATE,
                            PERMISSIONS.EVALUATION.DELETE
                        ]
                    )
                },
                {
                    label: 'Grants',
                    icon: 'pi pi-fw pi-wrench',
                    to: '/grants',
                    visible: hasPermission(
                        [
                            PERMISSIONS.GRANT.CREATE,
                            PERMISSIONS.GRANT.UPDATE,
                            PERMISSIONS.GRANT.DELETE
                        ]
                    )
                }
            ]
        },
        {
            label: 'Manage',
            items: [
                {
                    label: 'Projects',
                    icon: PrimeIcons.BRIEFCASE,
                    to: '/projects'
                },
                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/calendars',
                    visible: hasPermission(
                        [
                            PERMISSIONS.CALENDAR.CREATE,
                            PERMISSIONS.CALENDAR.UPDATE,
                            PERMISSIONS.CALENDAR.DELETE
                        ]
                    )
                },
                {
                    label: 'Applicants',
                    icon: PrimeIcons.GLOBE,
                    visible: hasPermission(
                        [
                            PERMISSIONS.APPLICANT.CREATE,
                            PERMISSIONS.APPLICANT.UPDATE,
                            PERMISSIONS.APPLICANT.DELETE
                        ]
                    ),
                    to: '/applicants',
                    /*
                    items: [
                        {
                            label: 'Academic',
                            icon: 'pi pi-fw pi-crown',
                            to: `/applicants?scope=${Scope.academic}`,
                            visible: hasOrganizationType([OrganizationalUnit.Department]),
                        },
                        {
                            label: 'Supportive',
                            icon: 'pi pi-fw pi-bullseye',
                            to: `/applicants?scope=${Scope.supportive}`,
                            visible: hasOrganizationType([OrganizationalUnit.Supportive]),
                        },
                        {
                            label: 'External',
                            icon: 'pi pi-fw pi-asterisk',
                            to: `/applicants?scope=${Scope.external}`,
                            visible: hasOrganizationType([OrganizationalUnit.External]),
                        }
                    ]
                    */
                },
                {
                    label: 'Organizations',
                    icon: 'pi pi-sitemap',
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.CREATE,
                            PERMISSIONS.ORGANIAZTION.UPDATE,
                            PERMISSIONS.ORGANIAZTION.DELETE
                        ]
                    ),
                    items: [
                        {
                            label: 'Colleges',
                            icon: 'pi pi-fw pi-warehouse',
                            to: `/organizations?type=${OrganizationalUnit.College}`
                        },
                        {
                            label: 'Directorates',
                            icon: 'pi pi-fw pi-objects-column',
                            to: `/organizations?type=${OrganizationalUnit.Directorate}`
                        },
                        {
                            label: 'Offices',
                            icon: 'pi pi-fw pi-shop',
                            to: `/organizations?type=${OrganizationalUnit.Supportive}`
                        },
                        {
                            label: 'Sectors',
                            icon: 'pi pi-fw pi-building-columns',
                            to: `/organizations?type=${OrganizationalUnit.Sector}`
                        },
                        {
                            label: 'Specializations',
                            icon: PrimeIcons.FILTER,
                            to: `/organizations?type=${OrganizationalUnit.Specialization}`
                        }
                    ]
                },
                {
                    label: 'Positions',
                    icon: 'pi pi-fw pi-flag',
                    to: '/applicants/positions',
                    visible: hasPermission([
                        PERMISSIONS.POSITION.CREATE,
                        PERMISSIONS.POSITION.UPDATE,
                        PERMISSIONS.POSITION.DELETE
                    ])
                },
                {
                    label: 'User Accounts',
                    icon: PrimeIcons.USERS,
                    to: '/users',
                    visible: hasPermission(
                        [
                            PERMISSIONS.USER.CREATE,
                            PERMISSIONS.USER.UPDATE,
                            PERMISSIONS.USER.DELETE
                        ]
                    )
                },
                {
                    label: 'Roles &  Permissions',
                    icon: PrimeIcons.LOCK,
                    to: '/roles',
                    visible: hasPermission(
                        [
                            PERMISSIONS.ROLE.CREATE,
                            PERMISSIONS.ROLE.UPDATE,
                            PERMISSIONS.ROLE.DELETE
                        ]
                    )
                }
            ]
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe',
                    to: '/landing'
                }
            ]
        },
        {
            label: 'Get Started',
            items: [
                {
                    label: 'Documentation',
                    icon: 'pi pi-fw pi-question',
                    to: '/documentation'
                }
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

                <Link href="https://www.wku.edu.et" target="_blank" style={{ cursor: 'pointer' }}>
                    <img alt="Wolkite University" className="w-full mt-3" src={`/images/wku-plan-${layoutConfig.colorScheme === 'light' ? '2' : '1'}.jpg`} />
                </Link>
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
