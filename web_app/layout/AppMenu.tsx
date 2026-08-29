/* eslint-disable @next/next/no-img-element */
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { useAuth } from '@/contexts/auth-context';
import { AppMenuItem } from '@/types';
import { PERMISSIONS } from '@/types/permissions';
import Link from 'next/link';
import { PrimeIcons } from 'primereact/api';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { useMemo } from 'react';
import { filterMenuByPermission } from '@/utils/menu';

const AppMenu = () => {
    const { hasPermission } = useAuth();


    const menuModel: AppMenuItem[] = [
        {
            label: 'Home',
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-fw pi-home',
                    to: '/'
                }
            ]
        },

        {
            label: 'Project',
            items: [
                {
                    label: 'Projects',
                    icon: 'pi pi-folder-open',
                    to: '/projects',
                    permission: 'project:create'
                },
                {
                    label: 'Applications',
                    icon: 'pi pi-list',
                    to: '/applications/stage',
                    permission: [
                        'application:transition.pending.accepted',
                        'application:transition.pending.rejected'
                    ]
                },
                {
                    label: 'Verifications',
                    icon: 'pi pi-fw pi-check-square',
                    to: '/verifications',
                    permission: 'verification:read'
                }
            ]
        },

        {
            label: 'Calls',
            permission: [
                'call:create',
                'project:create'
            ],
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: '/calls',
                    permission: 'call:create'
                },
                {
                    label: 'Evaluations',
                    icon: 'pi pi-chart-bar',
                    to: '/evaluations',
                    permission: 'evaluation:create'
                },
                {
                    label: 'Templates',
                    icon: 'pi pi-file-pdf',
                    to: '/templates',
                    permission: 'template:create'
                }
            ]
        },

        {
            label: 'Grants',
            permission: [
                'calendar:create',
                'grant:create',
                'thematic:create'
            ],
            items: [
                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/calendars',
                    permission: 'calendar:create'
                },
                {
                    label: 'Grants',
                    icon: 'pi pi-bitcoin',
                    to: '/grants',
                    permission: 'grant:create'
                },
                {
                    label: 'Thematics',
                    icon: 'pi pi-fw pi-tags',
                    to: '/thematics',
                    permission: 'thematic:create'
                }
            ]
        },

        {
            label: 'User Profiles',
            permission: [
                'user:create',
                'publication:create',
                'experience:create',
                'enrollment:create'
            ],
            items: [
                {
                    label: 'Users',
                    icon: PrimeIcons.USERS,
                    to: '/users',
                    permission: 'user:create'
                },
                {
                    label: 'Publications',
                    icon: PrimeIcons.BOOK,
                    to: '/users/publications',
                    permission: 'publication:create'
                },
                {
                    label: 'Experiences',
                    icon: PrimeIcons.BRIEFCASE,
                    to: '/users/experiences',
                    permission: 'experience:create'
                },
                {
                    label: 'Enrollments',
                    icon: PrimeIcons.ID_CARD,
                    to: '/users/enrollments',
                    permission: 'enrollment:create'
                }
            ]
        },

        {
            label: 'Administration',
            permission: [
                'account:create',
                'role:create'
            ],
            items: [
                {
                    label: 'Accounts',
                    icon: PrimeIcons.SHIELD,
                    to: '/accounts',
                    permission: 'account:create'
                },
                {
                    label: 'Roles & Permissions',
                    icon: PrimeIcons.LOCK,
                    to: '/roles',
                    permission: 'role:create'
                }
            ]
        },

        {
            label: 'Organizations',
            items: [
                {
                    label: 'Colleges',
                    icon: 'pi pi-fw pi-warehouse',
                    to: `/organizations/${OrgnUnit.college}`,
                    permission: PERMISSIONS.ORGANIAZTION.COLLEGE.CREATE
                },
                {
                    label: 'Departments',
                    icon: 'pi pi-fw pi-star',
                    to: `/organizations/${OrgnUnit.department}`,
                    permission: PERMISSIONS.ORGANIAZTION.DEPARTMENT.CREATE
                },
                {
                    label: 'Programs',
                    icon: 'pi pi-fw pi-star-half',
                    to: `/organizations/${OrgnUnit.program}`,
                    permission: PERMISSIONS.ORGANIAZTION.PROGRAM.CREATE
                },
                {
                    label: 'Directorates',
                    icon: 'pi pi-fw pi-objects-column',
                    to: `/organizations/${OrgnUnit.directorate}`,
                    permission: PERMISSIONS.ORGANIAZTION.DIRECTORATE.CREATE
                },
                {
                    label: 'Centers',
                    icon: 'pi pi-fw pi-circle',
                    to: `/organizations/${OrgnUnit.center}`,
                    permission: PERMISSIONS.ORGANIAZTION.CENTER.CREATE
                },
                {
                    label: 'External',
                    icon: 'pi pi-fw pi-mars',
                    to: `/organizations/${OrgnUnit.external}`,
                    permission: PERMISSIONS.ORGANIAZTION.EXTERNAL.CREATE
                }
            ]
        },
        {
            label: 'Miscellaneous',
            items: [
                {
                    label: 'Constraints',
                    icon: 'pi pi-fw pi-sliders-h',
                    to: '/constraints',
                    permission: 'constraint:create'
                },
                {
                    label: 'Compositions',
                    icon: 'pi pi-fw pi-user-edit',
                    to: '/compositions',
                    permission: 'composition:create'
                },
                {
                    label: 'Specializations',
                    icon: 'pi pi-fw pi-filter-fill',
                    to: '/specializations',
                    permission: PERMISSIONS.SPECIALIZATION.CREATE
                },
                {
                    label: 'Positions',
                    icon: 'pi pi-fw pi-flag',
                    to: '/positions',
                    permission: PERMISSIONS.POSITION.CREATE
                },
                {
                    label: 'Settings',
                    icon: PrimeIcons.COG,
                    to: '/settings',
                    permission: 'setting:update'
                }
            ]
        },

        {
            label: 'Reports',
            permission: PERMISSIONS.REPORT.OVERVIEW,
            items: [
                {
                    label: 'Overview',
                    icon: 'pi pi-circle-on',
                    to: '/reports/',
                    permission: PERMISSIONS.REPORT.OVERVIEW
                }
            ]
        },

        {
            label: 'Pages',
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe',
                    to: '/landing'
                },
                {
                    label: 'University Website',
                    icon: 'pi pi-external-link',
                    to: 'https://www.wku.edu.et',
                    target: '_blank'
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


    const model = useMemo(
        () => filterMenuByPermission(menuModel, hasPermission),
        [hasPermission]
    );

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

                <Link href="https://www.wku.edu.et" target="_blank" style={{ cursor: 'pointer' }}>
                    {
                        // <img alt="Wolkite University" className="w-full mt-3" src={`/images/wku-plan-${layoutConfig.colorScheme === 'light' ? '2' : '1'}.jpg`} />
                        <img alt="Wolkite University" className="w-full mt-3" src={`/images/wku-irpms-banner.png`} />

                    }
                </Link>
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
