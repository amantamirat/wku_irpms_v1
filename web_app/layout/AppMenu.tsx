/* eslint-disable @next/next/no-img-element */
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { useAuth } from '@/contexts/auth-context';
import { AppMenuItem } from '@/types';
import { PERMISSIONS } from '@/types/permissions';
import Link from 'next/link';
import { PrimeIcons } from 'primereact/api';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { useContext, useMemo } from 'react';
import { filterMenuByPermission } from '@/utils/menu';
import { LayoutContext } from './context/layoutcontext';
import { MENU_ICONS } from '@/utils/menu-icons';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { hasPermission } = useAuth();

    const menuModel: AppMenuItem[] = [
        {
            label: 'Home',
            items: [
                {
                    label: 'Dashboard',
                    icon: MENU_ICONS.dashboard,
                    to: '/'
                }
            ]
        },
        {
            label: 'Project',
            items: [
                {
                    label: 'Projects',
                    icon: MENU_ICONS.projects,
                    to: '/projects',
                    permission: 'project:read'
                },
                {
                    label: 'Applications',
                    icon: MENU_ICONS.applications,
                    to: '/applications/stage',
                    permission: 'application:read',
                },
                {
                    label: 'Verifications',
                    icon: MENU_ICONS.verifications,
                    to: '/verifications',
                    permission: 'verification:read'
                },
                {
                    label: 'Collaborators',
                    icon: MENU_ICONS.collaborators,
                    to: '/projects/collaborators',
                    permission: 'collaborator:read',
                },

                {
                    label: 'Reviewers',
                    icon: MENU_ICONS.reviewers,
                    to: '/reviewers',
                    permission: 'reviewer:read',
                },
            ]
        },
        {
            label: 'Opportunities',
            items: [
                {
                    label: 'Calls',
                    icon: MENU_ICONS.calls,
                    to: '/calls',
                    permission: 'call:read'
                },
                {
                    label: 'Grants',
                    icon: MENU_ICONS.grants,
                    to: '/grants',
                    permission: 'grant:read'
                }
            ]
        },
        {
            label: 'Resources',
            items: [
                {
                    label: 'Evaluations',
                    icon: MENU_ICONS.evaluations,
                    to: '/evaluations',
                    permission: 'evaluation:read'
                },
                {
                    label: 'Thematics',
                    icon: MENU_ICONS.thematics,
                    to: '/thematics',
                    permission: 'thematic:read'
                },
                {
                    label: 'Templates',
                    icon: MENU_ICONS.templates,
                    to: '/templates',
                    permission: 'template:read'
                },
                {
                    label: 'Agreements & Certificates',
                    icon: MENU_ICONS.documentTemplates,
                    to: '/documentTemplates',
                    permission: 'documentTemplate:read'
                },

            ]
        },

        {
            label: 'Rules',
            items: [
                {
                    label: 'Constraints',
                    icon: MENU_ICONS.constraints,
                    to: '/constraints',
                    permission: 'constraint:read'
                },
                {
                    label: 'Compositions',
                    icon: MENU_ICONS.compositions,
                    to: '/compositions',
                    permission: 'composition:read'
                }
            ]
        },
        {
            label: 'Administration',
            items: [
                {
                    label: 'Users',
                    icon: PrimeIcons.USER,
                    to: '/users',
                    permission: 'user:read'
                },
                {
                    label: 'Accounts',
                    icon: PrimeIcons.SHIELD,
                    to: '/accounts',
                    permission: 'account:read'
                },
                {
                    label: 'Roles',
                    icon: PrimeIcons.USERS,
                    to: '/roles',
                    permission: 'role:read'
                },
                {
                    label: 'Permissions',
                    icon: PrimeIcons.LOCK,
                    to: '/permissions',
                    permission: 'permission:read'
                },
            ]
        },

        {
            label: 'Organizations',
            items: [
                {
                    label: 'Colleges',
                    icon: 'pi pi-fw pi-warehouse',
                    to: `/organizations/${OrgnUnit.college}`,
                    permission: PERMISSIONS.ORGANIAZTION.COLLEGE.READ
                },
                {
                    label: 'Departments',
                    icon: 'pi pi-fw pi-star',
                    to: `/organizations/${OrgnUnit.department}`,
                    permission: PERMISSIONS.ORGANIAZTION.DEPARTMENT.READ
                },
                {
                    label: 'Programs',
                    icon: 'pi pi-fw pi-star-half',
                    to: `/organizations/${OrgnUnit.program}`,
                    permission: PERMISSIONS.ORGANIAZTION.PROGRAM.READ
                },
                {
                    label: 'Directorates',
                    icon: 'pi pi-fw pi-objects-column',
                    to: `/organizations/${OrgnUnit.directorate}`,
                    permission: PERMISSIONS.ORGANIAZTION.DIRECTORATE.READ
                },
                {
                    label: 'Centers',
                    icon: 'pi pi-fw pi-circle',
                    to: `/organizations/${OrgnUnit.center}`,
                    permission: PERMISSIONS.ORGANIAZTION.CENTER.READ
                },
                {
                    label: 'External',
                    icon: 'pi pi-fw pi-mars',
                    to: `/organizations/${OrgnUnit.external}`,
                    permission: PERMISSIONS.ORGANIAZTION.EXTERNAL.READ
                }
            ]
        },
        {
            label: 'Miscellaneous',
            items: [
                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/calendars',
                    permission: 'calendar:read'
                },
                {
                    label: 'Specializations',
                    icon: 'pi pi-fw pi-filter-fill',
                    to: '/specializations',
                    permission: PERMISSIONS.SPECIALIZATION.READ
                },
                {
                    label: 'Positions',
                    icon: MENU_ICONS.positions,
                    to: '/positions',
                    permission: PERMISSIONS.POSITION.READ
                },
                {
                    label: 'Settings',
                    icon: MENU_ICONS.settings,
                    to: '/settings',
                    permission: 'setting:read'
                }
            ]
        },

        {
            label: 'Reports',
            permission: PERMISSIONS.REPORT.OVERVIEW,
            items: [
                {
                    label: 'Overview',
                    icon: MENU_ICONS.reports,
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
                    icon: MENU_ICONS.documentation,
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
                        <img alt="Wolkite University" className="w-full mt-3" src={`/images/wku-irpms-banner-${layoutConfig.colorScheme === 'light' ? 'light' : 'dark'}.jpg`} />
                        //<img alt="Wolkite University" className="w-full mt-3" src={`/images/wku-irpms-banner.png`} />

                    }
                </Link>
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
