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
import { HistoryParticipation, HistoryRule } from './models/history.model';
import { MemberRequirement } from './models/requirement.model';

// Forms
import CompositionForm from './components/CompositionForm';
import ProfileForm from './components/ProfileForm';
import HistoryForm from './components/HistoryForm';
import RequirementForm from './components/RequirementForm';

// Views
import { EligibilityProfileView } from './components/EligibilityProfileView';
import { HistoryRuleView } from './components/HistoryRuleView';
import { MemberRequirementView } from './components/MemberRequirementView';

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
    entity?: string | EligibilityProfile | HistoryRule,
    fallback = 'None'
) => {
    if (!entity) return <span className="text-500">{fallback}</span>;
    if (typeof entity === 'object' && entity.name) {
        return <span className="font-medium">{entity.name}</span>;
    }
    return <span className="text-sm text-600">{String(entity)}</span>;
};

const renderMemberRequirements = (
    requirements?: string[] | MemberRequirement[]
) => {
    if (!requirements || requirements.length === 0) {
        return <span className="text-500">No member rules set</span>;
    }

    const count = requirements.length;
    const names = (requirements as Array<string | MemberRequirement>)
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
        header: 'Lead Profile Rule',
        field: 'leadProfileRule',
        body: (composition: Composition) =>
            renderEntityName(composition.leadProfileRule)
    },
    {
        header: 'Lead History Rules',
        field: 'leadHistoryRules',
        body: (composition: Composition) => {
            if (!composition.leadHistoryRules?.length) {
                return <span className="text-500 italic">None</span>;
            }
            return (
                <div className="flex flex-column gap-1">
                    {composition.leadHistoryRules.map((hr, idx) => {
                        const ruleName =
                            typeof hr.rule === 'object' && hr.rule !== null
                                ? hr.rule.name
                                : hr.rule;
                        return (
                            <div key={idx} className="flex align-items-center gap-2 text-xs">
                                <Tag value={hr.context} severity="warning" className="text-xs" />
                                <span className="font-medium text-900">
                                    {ruleName || `ID: ${String(hr.rule)}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            );
        }
    },
    {
        header: 'Member Requirements',
        field: 'memberRequirements',
        body: (composition: Composition) =>
            renderMemberRequirements(composition.memberRequirements)
    }
];

// Keep the permission ids the user picked: the API response may not echo them back
const mapSaved = (saved: Composition, submitted: Partial<Composition>): Composition => ({
    ...saved,
    leadProfileRule: submitted.leadProfileRule ?? saved.leadProfileRule,
    leadHistoryRules: submitted.leadHistoryRules ?? saved.leadHistoryRules,
    memberRequirements: submitted.memberRequirements ?? saved.memberRequirements
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
    [HistoryParticipation.MEMBER]: 'info'
};

const historyColumns: ColumnProps[] = [
    nameColumn('Rule Name'),
    {
        header: 'Participation',
        field: 'participation',
        sortable: true,
        style: { width: '150px' },
        body: (rule: HistoryRule) => {
            const value = rule.participation || HistoryParticipation.ANY;
            return (
                <Tag value={value} severity={PARTICIPATION_SEVERITY[value] ?? 'warning'} />
            );
        }
    },
    {
        header: 'Total Aggregated Rule',
        field: 'total',
        body: (rule: HistoryRule) => {
            if (!rule.total) return <span className="text-400">No rule set</span>;

            const fields = rule.total.fields?.length
                ? rule.total.fields.join(', ')
                : 'All metrics';

            return (
                <div>
                    <div className="text-sm font-medium text-900">
                        Range:{' '}
                        <span className="text-primary">{formatBounds(rule.total.range)}</span>
                    </div>
                    <small className="text-500">Metrics: {fields}</small>
                </div>
            );
        }
    }
];

const historyTableProps: ItemManagerProps<
    HistoryRule,
    undefined
>['tableProps'] = {
    expandable: {
        template: (rule) => <HistoryRuleView historyRule={rule} />
    }
};

const HistoryTab = () => {
    const toasts = useCrudToasts('History rule');

    return (
        <ItemManager<HistoryRule, undefined>
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
        header: 'Mode',
        field: 'mode',
        sortable: true,
        style: { width: '150px' },
        body: (requirement: MemberRequirement) => (
            <Tag value={requirement.mode} severity="info" />
        )
    },
    {
        header: 'Threshold Target',
        field: 'threshold',
        body: (requirement: MemberRequirement) =>
            requirement.threshold ? formatBounds(requirement.threshold) : 'N/A'
    }
];

const requirementTableProps: ItemManagerProps<
    MemberRequirement,
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
        <ItemManager<MemberRequirement, undefined>
            api={MemberRequirementApi}
            resource="composition"
            itemName="Member Requirement"
            headerTitle="Member Requirements & Aggregation Rules"
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