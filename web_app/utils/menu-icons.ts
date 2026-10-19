import { PrimeIcons } from 'primereact/api';

export const MENU_ICONS = {
    dashboard: 'pi pi-fw pi-home',

    // Project
    projects: 'pi pi-folder-open',
    applications: 'pi pi-list',
    verifications: 'pi pi-fw pi-check-square',
    collaborators: 'pi pi-users',
    reviewers: 'pi pi-user-edit',

    // Opportunities
    calls: 'pi pi-fw pi-megaphone',
    grants: 'pi pi-bitcoin',

    // Resources
    evaluations: 'pi pi-chart-bar',
    criteria: 'pi pi-list-check',
    thematics: 'pi pi-fw pi-tags',
    templates: 'pi pi-file-pdf',
    documentTemplates: 'pi pi-file-edit',

    // Rules
    constraints: 'pi pi-fw pi-sliders-h',
    compositions: 'pi pi-fw pi-user-edit',

    // Administration
    users: PrimeIcons.USER,
    accounts: PrimeIcons.SHIELD,
    roles: PrimeIcons.USERS,
    permissions: PrimeIcons.LOCK,

    // Organizations
    colleges: 'pi pi-fw pi-warehouse',
    departments: 'pi pi-fw pi-star',
    programs: 'pi pi-fw pi-star-half',
    directorates: 'pi pi-fw pi-objects-column',
    centers: 'pi pi-fw pi-circle',
    externalOrganizations: 'pi pi-fw pi-mars',

    // Miscellaneous
    calendars: PrimeIcons.CALENDAR,
    specializations: 'pi pi-fw pi-filter-fill',
    positions: 'pi pi-fw pi-flag',
    settings: PrimeIcons.COG,

    // Reports
    reports: 'pi pi-circle-on',

    // Pages
    landing: 'pi pi-fw pi-globe',
    externalLink: 'pi pi-external-link',

    // Help
    documentation: 'pi pi-fw pi-question'
} as const;
