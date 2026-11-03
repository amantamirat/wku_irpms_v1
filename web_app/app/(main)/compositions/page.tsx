'use client';

import { TabView, TabPanel } from 'primereact/tabview';
import { ColumnProps } from 'primereact/column';
import { Tag } from 'primereact/tag';

import { ItemManager, ItemManagerProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

// APIs
import { CompositionApi } from './api/composition.api';
import { ProfileApi } from './api/profile.api';
import { HistoryApi } from './api/history.api';
import { MemberRequirementApi } from './api/requirement.api';

// Models
import { Composition } from './models/composition.model';
import { EligibilityProfile } from './models/profile.model';
import { HistoryParticipation, IHistoryRule } from './models/history.model';
import { IMemberRequirement } from './models/requirement.model';

// Forms
import CompositionForm from './components/CompositionForm';
import ProfileForm from './components/ProfileForm';
import HistoryForm from './components/HistoryForm';
import RequirementForm from './components/RequirementForm';

// Views
import { EligibilityProfileView } from './components/EligibilityProfileView';
import { HistoryRuleView } from './components/HistoryRuleView';
import { MemberRequirementView } from './components/MemberRequirementView';
import { IRange } from '@/types/range';

/* =====================================================================
   Shared helpers (module level => stable references)
===================================================================== */

// One place for the create/update toasts used by every tab.
const useCrudToasts = (label: string) => {
    const toast = useToast();
    return {
        onError: (error: any) => toast.error(error),
        onSuccess: (operation: string) =>
            toast.success(
                `${label} ${operation === 'create' ? 'created' : 'updated'} successfully`
            )
    };
};

const nameColumn = (header: string): ColumnProps => ({
    header,
    field: 'name',
    sortable: true,
    body: (item: { name: string; description?: string }) => (
        <div>
            <div className="font-semibold text-900">{item.name}</div>
            {item.description && (
                <small className="text-500">{item.description}</small>
            )}
        </div>
    )
});

// Treats undefined, null and Infinity as "no limit".
// (Infinity becomes null after JSON serialization.)
const formatBounds = (range?: { min?: number | null; max?: number | null }) => {
    const min = range?.min ?? 0;
    const max = range?.max == null || range.max === Infinity ? '∞' : range.max;
    return `${min} - ${max}`;
};

const renderEntityName = (
    entity?: string | EligibilityProfile | IHistoryRule,
    fallback = 'None'
) => {
    if (!entity) return <span className="text-500">{fallback}</span>;
    if (typeof entity === 'object' && entity.name) {
        return <span className="font-medium">{entity.name}</span>;
    }
    return <span className="text-sm text-600">{String(entity)}</span>;
};

const renderMemberRequirements = (
    requirements?: string[] | IMemberRequirement[]
) => {
    if (!requirements || requirements.length === 0) {
        return <span className="text-500">No member rules set</span>;
    }

    const count = requirements.length;
    const names = (requirements as Array<string | IMemberRequirement>)
        .map((req) => (typeof req === 'object' ? req.name : null))
        .filter(Boolean);

    return (
        <div className="flex align-items-center gap-2 flex-wrap">
            <Tag value={`${count} ${count === 1 ? 'Rule' : 'Rules'}`} rounded />
            {names.length > 0 && (
                <span className="text-sm text-500">({names.join(', ')})</span>
            )}
        </div>
    );
};

/* =====================================================================
   1. Compositions
===================================================================== */
const compositionColumns: ColumnProps[] = [
    nameColumn('Composition Name'),
    {
        header: 'Lead Rule',
        field: 'leadRule',
        body: (composition: Composition) =>
            renderEntityName(composition.leadRule)
    },
    {
        header: 'Member Rules Count',
        field: 'memberRules',
        body: (composition: Composition) => {
            const count = composition.memberRules?.length || 0;
            return <span className="text-sm font-semibold text-primary">{count} rule(s)</span>;
        }
    }
];

const mapSaved = (saved: Composition, submitted: Partial<Composition>): Composition => ({
    ...saved,
    leadRule: submitted.leadRule ?? saved.leadRule,
    memberRules: submitted.memberRules ?? saved.memberRules
});

const CompositionsTab = () => {
    const toasts = useCrudToasts('Composition');

    return (
        <ItemManager<Composition, undefined>
            api={CompositionApi}
            resource="composition"
            itemName="Composition Spec"
            headerTitle="Team Composition Rules"
            columns={compositionColumns}
            mapSaved={mapSaved}
            dialogWidth="720px"
            renderForm={(props) => <CompositionForm {...props} />}
            {...toasts}
        />
    );
};

/* =====================================================================
   2. Eligibility profiles
===================================================================== */

const profileColumns: ColumnProps[] = [
    nameColumn('Profile Name'),
    {
        header: 'Gender Target',
        field: 'gender',
        body: (profile: EligibilityProfile) => profile.gender || 'Any'
    },
    {
        header: 'Academic Levels',
        field: 'academicLevels',
        body: (profile: EligibilityProfile) =>
            profile.academicLevels?.join(', ') || 'Any'
    }
];

const profileTableProps: ItemManagerProps<
    EligibilityProfile,
    undefined
>['tableProps'] = {
    expandable: {
        template: (profile) => <EligibilityProfileView profile={profile} />
    }
};

const ProfilesTab = () => {
    const toasts = useCrudToasts('Profile');

    return (
        <ItemManager<EligibilityProfile, undefined>
            api={ProfileApi}
            resource="composition"
            itemName="Profile Criteria"
            headerTitle="Eligibility Demographics Profiles"
            columns={profileColumns}
            tableProps={profileTableProps}
            dialogWidth="680px"
            renderForm={(props) => <ProfileForm {...props} />}
            {...toasts}
        />
    );
};

/* =====================================================================
   3. History rules
===================================================================== */

const PARTICIPATION_SEVERITY: Record<string, 'success' | 'info' | 'warning'> = {
    [HistoryParticipation.LEAD]: 'success',
    [HistoryParticipation.MEMBER]: 'info',
    [HistoryParticipation.ANY]: 'warning'
};



const historyColumns: ColumnProps[] = [
    nameColumn('Rule Name'),
    {
        header: 'Context',
        field: 'context',
        sortable: true,
        style: { width: '140px' },
        body: (rule: IHistoryRule) => (
            <span className="text-sm font-medium text-700">{rule.context}</span>
        )
    },
    {
        header: 'Participation',
        field: 'participation',
        sortable: true,
        style: { width: '150px' },
        body: (rule: IHistoryRule) => {
            const value = rule.participation || HistoryParticipation.ANY;
            return (
                <Tag value={value} severity={PARTICIPATION_SEVERITY[value] ?? 'warning'} />
            );
        }
    },
    {
        header: 'Aggregated History Rule',
        field: 'sumRange',
        body: (rule: IHistoryRule) => {
            if (!rule.sumRange) return <span className="text-400">No rule set</span>;

            const fields = rule.metrics?.length
                ? rule.metrics.join(', ')
                : 'All metrics';

            return (
                <div>
                    <div className="text-sm font-medium text-900">
                        Sum Range:{' '}
                        <span className="text-primary">{formatBounds(rule.sumRange)}</span>
                    </div>
                    <small className="text-500">Metrics: {fields}</small>
                </div>
            );
        }
    }
];

const historyTableProps: ItemManagerProps<
    IHistoryRule,
    undefined
>['tableProps'] = {
    expandable: {
        template: (rule) => <HistoryRuleView historyRule={rule} />
    }
};

const HistoryTab = () => {
    const toasts = useCrudToasts('History rule');

    return (
        <ItemManager<IHistoryRule, undefined>
            api={HistoryApi}
            resource="composition"
            itemName="History Rule"
            headerTitle="Project History & Performance Rules"
            columns={historyColumns}
            tableProps={historyTableProps}
            dialogWidth="680px"
            renderForm={(props) => <HistoryForm {...props} />}
            {...toasts}
        />
    );
};

/* =====================================================================
    4. Member requirements
===================================================================== */

const requirementColumns: ColumnProps[] = [
    nameColumn('Requirement Name'),
    {
        header: 'Profile Filter',
        field: 'profile',
        body: (requirement: IMemberRequirement) => {
            const profile = requirement.profile;
            if (!profile) return <span className="text-400">None</span>;
            const profileName = typeof profile === 'object' && profile !== null && 'name' in profile
                ? (profile as any).name
                : 'Linked Profile';
            return <span className="text-sm font-medium text-700">{profileName}</span>;
        }
    },
    {
        header: 'History Rules',
        field: 'historyRules',
        body: (requirement: IMemberRequirement) => {
            const rules = requirement.historyRules || [];
            if (rules.length === 0) return <span className="text-400">No rules linked</span>;
            return (
                <span className="text-sm font-semibold text-primary">
                    {rules.length} rule{rules.length === 1 ? '' : 's'} linked
                </span>
            );
        }
    }
];

const requirementTableProps: ItemManagerProps<
    IMemberRequirement,
    undefined
>['tableProps'] = {
    expandable: {
        template: (requirement) => (
            <MemberRequirementView requirement={requirement} />
        )
    }
};

const RequirementsTab = () => {
    const toasts = useCrudToasts('Member requirement');

    return (
        <ItemManager<IMemberRequirement, undefined>
            api={MemberRequirementApi}
            resource="composition"
            itemName="Member Requirement"
            headerTitle="Member Requirements & Rules"
            columns={requirementColumns}
            tableProps={requirementTableProps}
            dialogWidth="680px"
            renderForm={(props) => <RequirementForm {...props} />}
            {...toasts}
        />
    );
};

/* =====================================================================
   Page
===================================================================== */

const Page = () => (
    <div className="card p-3">
        <h3 className="text-xl font-bold mb-4">
            Team Composition & Evaluation Engine
        </h3>

        <TabView>
            <TabPanel header="Compositions" leftIcon="pi pi-sitemap mr-2">
                <CompositionsTab />
            </TabPanel>

            <TabPanel header="Member Requirements" leftIcon="pi pi-users mr-2">
                <RequirementsTab />
            </TabPanel>

            <TabPanel header="Demographic Profiles" leftIcon="pi pi-id-card mr-2">
                <ProfilesTab />
            </TabPanel>

            <TabPanel header="History Rules" leftIcon="pi pi-history mr-2">
                <HistoryTab />
            </TabPanel>
        </TabView>
    </div>
);

export default Page;