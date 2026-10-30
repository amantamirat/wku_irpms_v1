'use client';

import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { FormEvent, useEffect, useState } from 'react';

import { UserApi } from '@/app/(main)/users/api/user.api';
import { User } from '@/app/(main)/users/models/user.model';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { Collaborator, roleOptions } from '../models/collaborator.model';
import { Project } from '@/app/(main)/projects/models/project.model';

interface CollaboratorFormProps extends ItemFormRenderProps<Collaborator> {
    project?: Project | string | null;
}

const CollaboratorForm = ({
    mode,
    item,
    saving,
    formId,
    onSubmit,
    project
}: CollaboratorFormProps) => {
    const [localItem, setLocalItem] = useState<Collaborator>(
        item ?? { member: null, role: '' }
    );

    const [members, setMembers] = useState<User[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalItem({
            ...(item ?? { member: null, role: '' }),
            project: project ?? item?.project ?? null
        } as Collaborator);

        setSubmitted(false);
    }, [item, project]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingMembers(true);

            try {
                const data = await UserApi.lookup!({});
                setMembers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchUsers();
    }, []);

    const projectMissing = !localItem.project;
    const memberMissing = !localItem.member;
    const roleMissing = !localItem.role?.trim();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving || projectMissing || memberMissing || roleMissing) {
            return;
        }

        await onSubmit({
            ...localItem
        });
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            <div className="grid">
                {/* Project validation */}
                {projectMissing && (
                    <div className="field col-12">
                        {submitted && (
                            <small className="p-error block">
                                A project is required. Please provide a project.
                            </small>
                        )}
                    </div>
                )}

                {/* Member Selection */}
                <div className="field col-12 mt-2">
                    <label htmlFor="member" className="font-bold text-sm block mb-2">
                        Collaborator <span className="text-red-500">*</span>
                    </label>

                    <Dropdown
                        id="member"
                        value={localItem.member}
                        options={members}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                member: e.value
                            }))
                        }
                        dataKey="_id"
                        optionLabel="name"
                        //loading={loadingMembers}
                        disabled={saving}
                        placeholder="Search by name..."
                        filter
                        showClear
                        className={classNames({
                            'p-invalid': submitted && memberMissing
                        })}
                    />

                    {submitted && memberMissing && (
                        <small className="p-error block mt-1">
                            Please select a team member.
                        </small>
                    )}
                </div>

                {/* Role Selection */}
                <div className="field col-12 mb-4">
                    <label htmlFor="role" className="font-bold text-sm block mb-2">
                        Project Role <span className="text-red-500">*</span>
                    </label>

                    <Dropdown
                        id="role"
                        value={localItem.role}
                        options={roleOptions}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                role: e.value
                            }))
                        }
                        disabled={saving}
                        placeholder="Select or type a role"
                        editable
                        className={classNames({
                            'p-invalid': submitted && roleMissing
                        })}
                    />

                    {submitted && roleMissing && (
                        <small className="p-error block mt-1">
                            Role is required.
                        </small>
                    )}
                </div>
            </div>
        </form>
    );
};

export default CollaboratorForm;