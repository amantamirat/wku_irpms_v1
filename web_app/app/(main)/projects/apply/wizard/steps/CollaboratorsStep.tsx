'use client';

import { Constraint } from '@/app/(main)/constraints/models/constraint.model';
import { UserApi } from '@/app/(main)/users/api/user.api';
import { User } from '@/app/(main)/users/models/user.model';
import { useAuth } from '@/contexts/auth-context';
import { extractId } from '@/utils/utils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { useEffect, useMemo, useState } from 'react';
import { Collaborator, roleOptions } from '../../../collaborators/models/collaborator.model';


export const validateCollaborators = (
    collaborators: Collaborator[],
    constraint?: Constraint | null
) => {
    const min = constraint?.participants?.min ?? 1;
    const max = constraint?.participants?.max ?? Infinity;
    const count = collaborators.length;

    const isCountValid = count >= min && count <= max;
    const hasEmptyRows = collaborators.some((c) => !c.member || !c.role?.trim());

    return { min, max, count, isCountValid, hasEmptyRows, isValid: isCountValid && !hasEmptyRows };
};

interface CollaboratorsStepProps {
    collaborators: Collaborator[];
    constraint?: Constraint | null;
    showErrors?: boolean;
    onChange: (items: Collaborator[]) => void;
}

export const CollaboratorsStep = ({
    collaborators,
    constraint,
    showErrors = false,
    onChange
}: CollaboratorsStepProps) => {
    const { hasPermission } = useAuth();
    const canLookUsers = hasPermission(['user:lookup']);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!canLookUsers) return;
        (async () => {
            setLoading(true);
            try {
                setUsers(await UserApi.lookup!({}));
            } catch (err) {
                console.error('Failed to fetch users', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [canLookUsers]);

    const options = useMemo(() => {
        const map = new Map<string, User>();

        const add = (u?: User | null) => {
            if (u?._id) map.set(u._id, u);
        };

        users.forEach(add);
        collaborators.forEach((c) => {
            if (c.member && typeof c.member === 'object') add(c.member as User);
        });

        return [...map.values()];
    }, [users, collaborators]);

    

    const validation = useMemo(
        () => validateCollaborators(collaborators, constraint),
        [collaborators, constraint]
    );

    const max = constraint?.participants?.max;
    const isMaxReached = max !== undefined && max !== null && collaborators.length >= max;
    const maxLabel = max ?? 'No limit';

    const add = () => {
        if (isMaxReached || !canLookUsers) return;
        onChange([...collaborators, { member: null, role: '', isLeadPI: false } as Collaborator]);
    };

    const remove = (index: number) => {
        if (collaborators[index]?.isLeadPI) return;
        onChange(collaborators.filter((_, i) => i !== index));
    };

    const update = (index: number, patch: Partial<Collaborator>) =>
        onChange(collaborators.map((c, i) => (i === index ? { ...c, ...patch } : c)));

    return (
        <div className="mt-4">
            <div className="flex justify-content-between align-items-center mb-4 p-3 bg-gray-50 border-round-lg border-1 border-200">
                <div>
                    <h4 className="m-0 text-900">Project Team</h4>
                    <p className="text-600 text-sm m-0">
                        Required team size: {validation.min} - {maxLabel} members.
                    </p>
                </div>
                <Button
                    type="button"
                    label="Add Member"
                    icon="pi pi-user-plus"
                    className="p-button-sm p-button-outlined"
                    onClick={add}
                    disabled={isMaxReached || !canLookUsers}
                    tooltip={isMaxReached ? `Maximum of ${max} members reached` : undefined}
                    tooltipOptions={{ showOnDisabled: true }}
                />
            </div>

            {!canLookUsers && (
                <Message
                    severity="warn"
                    text="You don't have permission to add other collaborators."
                    className="w-full mb-3"
                />
            )}

            {showErrors && !validation.isCountValid && (
                <Message
                    severity="error"
                    text={`Team size must be between ${validation.min} and ${maxLabel} members.`}
                    className="w-full mb-3"
                />
            )}

            {showErrors && validation.hasEmptyRows && (
                <Message
                    severity="error"
                    text="Every collaborator needs a member and a role."
                    className="w-full mb-3"
                />
            )}

            <DataTable
                value={collaborators}
                className="p-datatable-sm shadow-1 border-round-lg overflow-hidden"
                emptyMessage="No collaborators added."
                loading={loading}
            >
                <Column
                    header="Collaborator"
                    style={{ width: '40%' }}
                    body={(row: Collaborator, { rowIndex }) => {
                        const selectedIds = collaborators.map((c) => extractId(c.member)).filter(Boolean);
                        const currentId = extractId(row.member);
                        const available = options.filter(
                            (u) => u._id === currentId || !selectedIds.includes(u._id)
                        );

                        return (
                            <Dropdown
                                value={row.member}
                                options={available}
                                dataKey="_id"
                                optionLabel="name"
                                onChange={(e) => update(rowIndex, { member: e.value })}
                                placeholder="Select Member"
                                filter
                                className={classNames('w-full', {
                                    'p-invalid': showErrors && !row.member
                                })}
                                disabled={row.isLeadPI}
                            />
                        );
                    }}
                />

                <Column
                    header="Role"
                    style={{ width: '35%' }}
                    body={(row: Collaborator, { rowIndex }) => (
                        <Dropdown
                            value={row.role}
                            options={roleOptions}
                            onChange={(e) => update(rowIndex, { role: e.value })}
                            placeholder="Select Role"
                            editable
                            className={classNames('w-full text-sm', {
                                'p-invalid': showErrors && !row.role?.trim()
                            })}
                            disabled={row.isLeadPI}
                        />
                    )}
                />

                <Column
                    style={{ width: '4rem' }}
                    body={(row: Collaborator, { rowIndex }) => (
                        <Button
                            type="button"
                            icon="pi pi-user-minus"
                            className="p-button-rounded p-button-danger p-button-text"
                            onClick={() => remove(rowIndex)}
                            disabled={row.isLeadPI}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

export default CollaboratorsStep;