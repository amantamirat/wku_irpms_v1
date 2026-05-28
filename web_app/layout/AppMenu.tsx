/* eslint-disable @next/next/no-img-element */
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { useAuth } from '@/contexts/auth-context';
import { AppMenuItem } from '@/types';
import { PERMISSIONS } from '@/types/permissions';
import Link from 'next/link';
import { PrimeIcons } from 'primereact/api';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';

const AppMenu = () => {
    const { hasPermission } = useAuth();

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Applications',
            visible: hasPermission(
                [
                    "call:create",
                    "project:create",
                ]
            ),
            items: [
                {
                    label: 'Applications',
                    icon: 'pi pi-list',
                    to: '/projects/stages/applications',
                    visible: hasPermission("project.stage:read") &&
                        hasPermission("grant.allocation:read")
                },
                {
                    label: 'Projects',
                    icon: "pi pi-folder-open",
                    to: '/projects/all',
                    visible: hasPermission("project:create")
                },
                {
                    label: 'Collaborators',
                    to: '/projects/collaborators/all',
                    icon: 'pi pi-share-alt',
                    visible: hasPermission("collaborator:read")
                },

                {
                    label: 'Reviewers',
                    to: '/reviewers/all',
                    icon: 'pi pi-check-square',
                    visible: hasPermission("reviewer:read")
                },

            ]
        },

        {
            label: 'Grants & Calls',
            visible: hasPermission(
                [
                    "calendar:create",
                    "grant:create",
                    "evaluation:create",
                    "thematic:create",
                    "call:create",
                ]
            ),
            items: [
                {
                    label: 'Calls',
                    icon: 'pi pi-fw pi-megaphone',
                    to: '/calls',
                    visible: hasPermission("call:create")
                },
                {
                    label: 'Calendars',
                    icon: PrimeIcons.CALENDAR,
                    to: '/calendars',
                    visible: hasPermission("calendar:create")
                },
                {
                    label: 'Grants',
                    icon: 'pi pi-bitcoin',
                    to: '/grants',
                    visible: hasPermission("grant:create")
                },
                {
                    label: 'Evaluations',
                    icon: 'pi pi-chart-bar',
                    to: '/evaluations',
                    visible: hasPermission("evaluation:create")
                },
                {
                    label: 'Thematics',
                    icon: 'pi pi-fw pi-tags',
                    to: '/thematics',
                    visible: hasPermission("thematic:create")
                }
            ]
        },
        {
            label: 'User Profiles',
            visible: hasPermission([
                "user:create"
            ]),
            items: [
                {
                    label: 'Users',
                    icon: PrimeIcons.USERS,
                    visible: hasPermission(
                        [
                            "user:create",
                        ]
                    ),
                    to: '/users',
                },
                {
                    label: 'Publications',
                    icon: PrimeIcons.BOOK, // or PrimeIcons.COPYRIGHT for a formal look
                    visible: hasPermission("publication:create"),
                    to: '/users/publications',
                },
                {
                    label: 'Experiences',
                    icon: PrimeIcons.BRIEFCASE,
                    visible: hasPermission("experience:create"),
                    to: '/users/experiences',
                },
                {
                    label: 'Enrollments',
                    icon: PrimeIcons.ID_CARD,
                    visible: hasPermission("enrollment:create"),
                    to: '/users/enrollments',
                },
            ]
        },
        {
            label: 'Accounts',
            visible: hasPermission(
                [
                    "account:create",
                    "role:create",
                ]
            ),
            items: [

                {
                    label: 'Accounts',
                    icon: PrimeIcons.SHIELD,
                    to: '/accounts',
                    visible: hasPermission(
                        [
                            "account:create",
                        ]
                    )
                },
                {
                    label: 'Roles &  Permissions',
                    icon: PrimeIcons.LOCK,
                    to: '/roles',
                    visible: hasPermission(
                        [
                            "role:create",
                        ]
                    )
                }
            ]
        },
        {
            label: 'Organizations',
            visible: hasPermission(
                [
                    PERMISSIONS.ORGANIAZTION.COLLEGE.CREATE,
                    PERMISSIONS.ORGANIAZTION.DEPARTMENT.CREATE,
                    PERMISSIONS.ORGANIAZTION.PROGRAM.CREATE,
                    PERMISSIONS.ORGANIAZTION.DIRECTORATE.CREATE,
                    PERMISSIONS.ORGANIAZTION.CENTER.CREATE,
                    PERMISSIONS.ORGANIAZTION.EXTERNAL.CREATE,
                ]
            ),
            items: [
                {
                    label: 'Colleges',
                    icon: 'pi pi-fw pi-warehouse',
                    to: `/organizations/${OrgnUnit.college}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.COLLEGE.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Departments',
                    icon: 'pi pi-fw pi-star',
                    to: `/organizations/${OrgnUnit.department}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.DEPARTMENT.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Programs',
                    icon: 'pi pi-fw pi-star-half',
                    to: `/organizations/${OrgnUnit.program}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.PROGRAM.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Directorates',
                    icon: 'pi pi-fw pi-objects-column',
                    to: `/organizations/${OrgnUnit.directorate}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.DIRECTORATE.CREATE,
                        ]
                    ),
                },
                {
                    label: 'Centers',
                    icon: 'pi pi-fw pi-circle',
                    to: `/organizations/${OrgnUnit.center}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.CENTER.CREATE,
                        ]
                    ),
                },
                {
                    label: 'External',
                    icon: "pi pi-fw pi-mars",
                    to: `/organizations/${OrgnUnit.external}`,
                    visible: hasPermission(
                        [
                            PERMISSIONS.ORGANIAZTION.EXTERNAL.CREATE,
                        ]
                    ),
                }

            ]
        },
        {
            label: 'Miscellaneous',
            visible: hasPermission([

                PERMISSIONS.SPECIALIZATION.CREATE,
                PERMISSIONS.POSITION.CREATE,
                "setting:update"
            ]),
            items: [
                /*
                {
                    label: 'Templates',
                    icon: 'pi pi-copy', // Professional icon for blueprints/templates
                    to: '/templates',
                    visible: hasPermission(
                        [
                            "template:create",
                            // Depending on your logic, you might also include .READ or .VIEW
                        ]
                    )
                },*/
                {
                    label: 'Specializations',
                    icon: 'pi pi-fw pi-filter-fill',
                    to: '/specializations',
                    visible: hasPermission("specialization:create")
                },
                {
                    label: 'Positions',
                    icon: 'pi pi-fw pi-flag',
                    to: '/positions',
                    visible: hasPermission("position:create")
                },
                {
                    label: 'Settings',
                    icon: PrimeIcons.COG,
                    visible: hasPermission(
                        [
                            "setting:update"
                        ]
                    ),
                    to: '/settings',
                },
            ]
        },
        {
            label: 'Reports',
            visible: hasPermission([
                PERMISSIONS.REPORT.OVERVIEW
            ]),
            items: [
                {
                    label: 'Overview',
                    icon: 'pi pi-circle-on',
                    to: '/reports/overview',
                    visible: hasPermission([
                        PERMISSIONS.REPORT.OVERVIEW
                    ]),
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
