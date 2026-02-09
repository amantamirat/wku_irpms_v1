'use client';
import { Dropdown } from 'primereact/dropdown';
import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

interface WorkspaceSelectorProps {
    value?: Organization;
    onChange: (workspace: Organization) => void;
}

export const WorkspaceSelector = ({ value, onChange }: WorkspaceSelectorProps) => {
    const { getScopesByUnit } = useAuth();
    const [workspaces, setWorkspaces] = useState<Organization[]>([]);

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                let departments = getScopesByUnit(OrgnUnit.Department);
                if (departments === "*") {
                    departments = await OrganizationApi.getOrganizations({ type: OrgnUnit.Department });
                }
                let externals = getScopesByUnit(OrgnUnit.External);
                if (externals === "*") {
                    externals = await OrganizationApi.getOrganizations({ type: OrgnUnit.External });
                }
                setWorkspaces([...departments, ...externals]);
            } catch (err: any) {
                console.error(err);
            }
        };
        fetchWorkspaces();
    }, []);

    return (
        <div className="card p-fluid">
            <div className="formgrid grid">
                <div className="field col-12 md:col-6 lg:col-4">
                    <label htmlFor="workspace">Workspace</label>
                    <Dropdown
                        id="workspace"
                        value={value}
                        options={workspaces}
                        onChange={(e) => onChange(e.value)}
                        optionLabel="name"
                        placeholder="Select Workspace"
                    />
                </div>
            </div>
        </div>
    );
};
