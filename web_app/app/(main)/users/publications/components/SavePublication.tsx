'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

// Types & APIs
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Publication, PublicationType, validatePublication } from '../models/publication.model';
import { PublicationApi } from '../api/publication.api';
import { User } from '../../models/user.model';
import { UserApi } from '../../api/user.api';

const SavePublicationDialog = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Publication>) => {
    const toast = useRef<Toast>(null);

    // State
    const [localPublication, setLocalPublication] = useState<Publication>({ ...item });
    const [users, setUsers] = useState<User[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check if the user/applicant is already passed from a parent context
    const isAuthorPredefined = !!item.author;    /**
     * Fetch Applicants only if not predefined
     */
    useEffect(() => {
        if (!visible || isAuthorPredefined) return;

        UserApi.getAll({})
            .then(setUsers)
            .catch((err) => console.error('Failed to fetch applicant data:', err));
    }, [visible, isAuthorPredefined]);

    /**
     * Sync local state with prop updates
     */
    useEffect(() => {
        setLocalPublication({ ...item });
    }, [item]);

    const handleHide = () => {
        setSubmitted(false);
        onHide();
    };

    const savePublication = async () => {
        setSubmitted(true);

        const validation = validatePublication(localPublication);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation Error',
                detail: validation.message,
                life: 3000,
            });
            return;
        }

        setLoading(true);
        try {
            let saved: Publication;
            if (localPublication._id) {
                saved = await PublicationApi.update(localPublication);
            } else {
                saved = await PublicationApi.create(localPublication);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Publication record saved successfully',
                life: 2000,
            });

            // Ensure we return the full object including predefined references
            onComplete?.({
                ...localPublication,
                ...saved
            });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Save Failed',
                detail: err.message || 'An unexpected error occurred',
                life: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={handleHide} disabled={loading} />
            <Button label="Save Publication" icon="pi pi-check" onClick={savePublication} loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '650px' }}
                header={localPublication._id ? 'Edit Publication' : 'New Publication Record'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={handleHide}
            >
                <div className="grid">
                    {/* Applicant Selection */}
                    <div className="field col-12">
                        <label htmlFor="applicant" className="font-bold text-sm">Author</label>
                        {isAuthorPredefined ? (
                            <InputText
                                value={(localPublication.author as User)?.name || 'Linked Author'}
                                disabled
                                className="bg-gray-100"
                            />
                        ) : (
                            <Dropdown
                                id="applicant"
                                value={localPublication.author}
                                options={users}
                                optionLabel="name"
                                dataKey="_id"
                                placeholder="Select Author"
                                onChange={(e) => setLocalPublication({ ...localPublication, author: e.value })}
                                className={classNames({ 'p-invalid': submitted && !localPublication.author })}
                            />
                        )}
                        {submitted && !localPublication.author && <small className="p-error">Author is required.</small>}
                    </div>

                    {/* Title */}
                    <div className="field col-12">
                        <label htmlFor="title" className="font-bold text-sm">Title</label>
                        <InputText
                            id="title"
                            value={localPublication.title || ''}
                            onChange={(e) => setLocalPublication({ ...localPublication, title: e.target.value })}
                            className={classNames({ 'p-invalid': submitted && !localPublication.title })}
                            placeholder="Full title of the publication"
                        />
                        {submitted && !localPublication.title && <small className="p-error">Title is required.</small>}
                    </div>

                    {/* Type & DOI in same row */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="type" className="font-bold text-sm">Type</label>
                        <Dropdown
                            id="type"
                            value={localPublication.type}
                            options={Object.values(PublicationType)}
                            onChange={(e) => setLocalPublication({ ...localPublication, type: e.value })}
                            placeholder="Select Type"
                            className={classNames({ 'p-invalid': submitted && !localPublication.type })}
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="doi" className="font-bold text-sm">DOI</label>
                        <InputText
                            id="doi"
                            value={localPublication.doi || ''}
                            onChange={(e) => setLocalPublication({ ...localPublication, doi: e.target.value })}
                            placeholder="e.g. 10.1000/xyz123"
                        />
                    </div>

                    {/* Abstract */}
                    <div className="field col-12">
                        <label htmlFor="abstract" className="font-bold text-sm">Abstract</label>
                        <InputTextarea
                            id="abstract"
                            value={localPublication.abstract || ''}
                            onChange={(e) => setLocalPublication({ ...localPublication, abstract: e.target.value })}
                            rows={3}
                            autoResize
                            placeholder="Brief summary..."
                        />
                    </div>

                    {/* URL */}
                    <div className="field col-12">
                        <label htmlFor="url" className="font-bold text-sm">Publication URL</label>
                        <InputText
                            id="url"
                            value={localPublication.url || ''}
                            onChange={(e) => setLocalPublication({ ...localPublication, url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    {/* Publisher & Publication ID in same row */}
                    <div className="field col-12 md:col-8">
                        <label htmlFor="publisher" className="font-bold text-sm">Publisher / Journal</label>
                        <InputText
                            id="publisher"
                            value={localPublication.publisher || ''}
                            onChange={(e) => setLocalPublication({ ...localPublication, publisher: e.target.value })}
                            placeholder="Name of journal or publishing house"
                        />
                    </div>

                    <div className="field col-12 md:col-4">
                        <label htmlFor="publicationId" className="font-bold text-sm">ID / ISBN</label>
                        <InputText
                            id="publicationId"
                            value={localPublication.publicationId || ''}
                            onChange={(e) => setLocalPublication({ ...localPublication, publicationId: e.target.value })}
                            placeholder="Volume/Issue/ISBN"
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SavePublicationDialog;