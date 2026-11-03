
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';

import { Project } from '@/app/(main)/projects/models/project.model';


import { User } from '@/app/(main)/users/models/user.model';
import { UserApi } from '@/app/(main)/users/api/user.api';

import { extractId } from '@/utils/utils';
import { ProjectComponentDTO } from '../models/component.model';
import { CollaboratorApi } from '../../collaborators/api/collaborator.api';

interface ProjectComponentFormProps
    extends ItemFormRenderProps<ProjectComponentDTO> {
    project?: Project | string | null;
}

const ProjectComponentForm = ({
    item,
    saving,
    formId,
    onSubmit,
    project,
}: ProjectComponentFormProps) => {

    const [localItem, setLocalItem] = useState<ProjectComponentDTO>({
        ...(item ?? {}),
        project: project ?? item?.project ?? undefined,
        title: item?.title ?? '',
        description: item?.description ?? '',
        contributors: item?.contributors ?? [],
        //investigator: item?.investigator ?? '',
    } as ProjectComponentDTO);

    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const projectId = extractId(localItem.project);

    // Reset form when selected component or project changes.
    useEffect(() => {
        setLocalItem({
            ...(item ?? {}),
            project: project ?? item?.project ?? undefined,
            title: item?.title ?? '',
            description: item?.description ?? '',
            contributors: item?.contributors ?? [],
            // investigator: item?.investigator ?? '',
        } as ProjectComponentDTO);

        setSubmitted(false);
    }, [item, project]);

    // Load available users.
    useEffect(() => {
        let cancelled = false;

        const fetchUsers = async () => {
            setLoadingUsers(true);

            try {
                const data = await CollaboratorApi.lookup!({ project: projectId });

                const users = data
                    .map(c => c.member) as User[];

                if (!cancelled) {
                    setUsers(users);
                }
            } catch (error) {
                console.error('Failed to load users:', error);

                if (!cancelled) {
                    setUsers([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingUsers(false);
                }
            }
        };

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    // Convert populated users or IDs to IDs for form controls.
    const contributorIds = (localItem.contributors ?? []).map(
        (user: any) => extractId(user)
    );

    /*
    const investigatorId = localItem.investigator
        ? extractId(localItem.investigator)
        : null;
        */
    const titleMissing = !localItem.title?.trim();
    const descriptionMissing = !localItem.description?.trim();
    //const investigatorMissing = !investigatorId;
    const projectMissing = !projectId;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            titleMissing ||
            descriptionMissing //||
            //investigatorMissing
        ) {
            return;
        }

        /*
        const componentData: ProjectComponentDTO = {
            ...localItem,
            project: projectId,
            contributors: contributorIds,
            investigator: investigatorId!,
            title: localItem.title.trim(),
            description: localItem.description?.trim(),
        };*/

        await onSubmit(localItem);
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            <div className="grid">

                {/* Project */}
                <div className="field col-12">
                    <label className="font-bold text-sm block mb-2">
                        Project <span className="text-red-500">*</span>
                    </label>

                    <div
                        className={classNames(
                            'p-inputtext p-component flex align-items-center surface-100 text-color-secondary',
                            {
                                'p-invalid': submitted && projectMissing
                            }
                        )}
                    >
                        {typeof localItem.project === 'object' &&
                            localItem.project
                            ? localItem.project.title
                            : projectId
                                ? `Project ID: ${projectId}`
                                : 'No project selected'}
                    </div>

                    {submitted && projectMissing && (
                        <small className="p-error block mt-1">
                            A project is required.
                        </small>
                    )}
                </div>


                {/* Component Title */}
                <div className="field col-12">
                    <label
                        htmlFor="title"
                        className="font-bold text-sm block mb-2"
                    >
                        Component Title{' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <InputText
                        id="title"
                        value={localItem.title}
                        onChange={(e) =>
                            setLocalItem((prev: any) => ({
                                ...prev,
                                title: e.target.value
                            }))
                        }
                        placeholder="e.g., Research Design"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && titleMissing
                        })}
                    />

                    {submitted && titleMissing && (
                        <small className="p-error block mt-1">
                            Component title is required.
                        </small>
                    )}
                </div>


                {/* Description */}
                <div className="field col-12">
                    <label
                        htmlFor="description"
                        className="font-bold text-sm block mb-2"
                    >
                        Description
                    </label>

                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ''}
                        onChange={(e) =>
                            setLocalItem((prev: any) => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                        rows={3}
                        autoResize
                        placeholder="Describe the project component..."
                        disabled={saving}
                        className={classNames({
                            'p-invalid':
                                submitted && descriptionMissing
                        })}
                    />

                    {submitted && descriptionMissing && (
                        <small className="p-error block mt-1">
                            Description is required.
                        </small>
                    )}
                </div>


                {/* Investigator */}
                {
                    /**
                     * 
                     * <div className="field col-12">
                    <label
                        htmlFor="investigator"
                        className="font-bold text-sm block mb-2"
                    >
                        Investigator{' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <Dropdown
                        id="investigator"
                        value={investigatorId}
                        options={users}
                        optionValue="_id"
                        optionLabel="name"
                        onChange={(e) => {
                            const selectedUser =
                                users.find((u) => u._id === e.value);

                            setLocalItem((prev) => ({
                                ...prev,
                                investigator: selectedUser ?? e.value
                            }));
                        }}
                        placeholder="Select investigator"
                        filter
                        showClear
                        //loading={loadingUsers}
                        disabled={saving || loadingUsers}
                        className={classNames({
                            'p-invalid':
                                submitted && investigatorMissing
                        })}
                        itemTemplate={(user: User) => (
                            <div className="flex flex-column">
                                <span className="font-medium">
                                    {user.name}
                                </span>
                            </div>
                        )}
                    />

                    {submitted && investigatorMissing && (
                        <small className="p-error block mt-1">
                            Investigator is required.
                        </small>
                    )}
                </div>
                     * 
                     */
                }

                {/* Contributors */}
                <div className="field col-12">
                    <label
                        htmlFor="contributors"
                        className="font-bold text-sm block mb-2"
                    >
                        Contributors
                    </label>

                    <MultiSelect
                        id="contributors"
                        value={contributorIds}
                        options={users}
                        optionValue="_id"
                        optionLabel="name"
                        onChange={(e) => {
                            setLocalItem((prev) => ({
                                ...prev,
                                contributors: e.value
                            }));
                        }}
                        placeholder="Select contributors"
                        display="chip"
                        filter
                        showClear
                        //loading={loadingUsers}
                        disabled={saving || loadingUsers}
                        maxSelectedLabels={3}
                    />

                    <small className="text-color-secondary block mt-1">
                        Select one or more contributors.
                    </small>
                </div>

            </div>
        </form>
    );
};

export default ProjectComponentForm;
