'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Publication, PublicationType, validatePublication } from '../models/publication.model';
import { useAuth } from '@/contexts/auth-context';
import { Applicant } from '../../models/applicant.model';
import { ApplicantApi } from '../../api/applicant.api';
import { PublicationApi } from '../api/publication.api';

interface SavePublicationDialogProps {
    visible: boolean;
    publication: Publication;
    applicantProvided: boolean;
    onHide: () => void;
    onComplete?: (savedPublication: Publication) => void;
}

const SavePublicationDialog = ({ visible, publication, applicantProvided, onHide, onComplete }: SavePublicationDialogProps) => {

    const { hasPermission } = useAuth();
    const [localPublication, setLocalPublication] = useState<Publication>({ ...publication });
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    // Fetch applicants for dropdown
    useEffect(() => {
        if (applicantProvided) {
            return;
        }
        const fetchApplicants = async () => {
            try {
                const appData = await ApplicantApi.getApplicants({});
                setApplicants(appData);
            } catch (err) {
                console.error('Failed to fetch applicant data:', err);
            }
        };
        fetchApplicants();
    }, [applicantProvided]);

    // Reset localPublication when prop changes
    useEffect(() => {
        setLocalPublication({ ...publication });
    }, [publication]);

    // Clear form when dialog closes
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalPublication({ ...publication });
    };

    const savePublication = async () => {
        try {
            setSubmitted(true);
            const validation = validatePublication(localPublication);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Publication;
            if (localPublication._id) {
                saved = await PublicationApi.update(localPublication);
            } else {
                saved = await PublicationApi.create(localPublication);
            }

            saved = { ...localPublication, _id: saved._id };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Publication saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save publication',
                detail: err.message || 'An error occurred',
                life: 2000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={savePublication} />
        </>
    );

    const isEdit = !!localPublication._id;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={isEdit ? 'Edit Publication' : 'New Publication'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximized
            >
                {/* Applicant */}
                {
                    !applicantProvided &&
                    <div className="field">
                        <label htmlFor="applicant">Applicant</label>
                        <Dropdown
                            id="applicant"
                            value={localPublication.applicant}
                            options={applicants}
                            optionLabel="name"
                            dataKey="_id"
                            onChange={(e) => setLocalPublication({ ...localPublication, applicant: e.value })}
                            placeholder="Select Applicant"
                            className={classNames({ 'p-invalid': submitted && !localPublication.applicant })}
                        />
                        {submitted && !localPublication.applicant && <small className="p-invalid">Applicant is required.</small>}
                    </div>
                }

                {/* Title */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localPublication.title || ''}
                        onChange={(e) => setLocalPublication({ ...localPublication, title: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localPublication.title })}
                        placeholder="Enter publication title"
                    />
                    {submitted && !localPublication.title && <small className="p-invalid">Title is required.</small>}
                </div>

                {/* Type */}
                <div className="field">
                    <label htmlFor="type">Type</label>
                    <Dropdown
                        id="type"
                        value={localPublication.type}
                        options={Object.values(PublicationType)}
                        onChange={(e) => setLocalPublication({ ...localPublication, type: e.value })}
                        placeholder="Select Publication Type"
                        className={classNames({ 'p-invalid': submitted && !localPublication.type })}
                    />
                    {submitted && !localPublication.type && <small className="p-invalid">Publication type is required.</small>}
                </div>

                {/* Abstract */}
                <div className="field">
                    <label htmlFor="abstract">Abstract</label>
                    <InputTextarea
                        id="abstract"
                        value={localPublication.abstract || ''}
                        onChange={(e) => setLocalPublication({ ...localPublication, abstract: e.target.value })}
                        rows={4}
                        placeholder="Enter abstract"
                    />
                </div>

                {/* DOI */}
                <div className="field">
                    <label htmlFor="doi">DOI</label>
                    <InputText
                        id="doi"
                        value={localPublication.doi || ''}
                        onChange={(e) => setLocalPublication({ ...localPublication, doi: e.target.value })}
                        placeholder="Enter DOI"
                    />
                </div>

                {/* URL */}
                <div className="field">
                    <label htmlFor="url">URL</label>
                    <InputText
                        id="url"
                        value={localPublication.url || ''}
                        onChange={(e) => setLocalPublication({ ...localPublication, url: e.target.value })}
                        placeholder="Enter URL"
                    />
                </div>

                {/* Publisher */}
                <div className="field">
                    <label htmlFor="publisher">Publisher</label>
                    <InputText
                        id="publisher"
                        value={localPublication.publisher || ''}
                        onChange={(e) => setLocalPublication({ ...localPublication, publisher: e.target.value })}
                        placeholder="Enter Publisher Name"
                    />
                </div>

                {/* Publication ID */}
                <div className="field">
                    <label htmlFor="publicationId">Publication ID</label>
                    <InputText
                        id="publicationId"
                        value={localPublication.publicationId || ''}
                        onChange={(e) => setLocalPublication({ ...localPublication, publicationId: e.target.value })}
                        placeholder="Enter Publication ID / ISBN / Patent Number"
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SavePublicationDialog;
