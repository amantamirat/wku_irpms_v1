'use client';
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { ExperienceApi } from "../api/experience.api";
import { Experience, GetExperiencesOptions } from "../models/experience.model";
import { useCrudList } from "@/hooks/useCrudList";
import ListSkeleton from "@/components/ListSkeleton";

interface ExperienceManagerProps {
    applicant?: Applicant;
}

const ExperienceManager = ({ applicant }: ExperienceManagerProps) => {

    const { getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    //const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    
    const confirm = useConfirmDialog();

    const emptyExperience: Experience = {
        applicant: applicant,
    };

    // ✅ Permissions    
    const canCreate = hasPermission([PERMISSIONS.EXPERIENCE.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.EXPERIENCE.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.EXPERIENCE.DELETE]);

    // ✅ State + CRUD Hook
    const {
        items: experiences,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Experience>();

    const [experience, setExperience] = useState<Experience>(emptyExperience);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    //const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // ✅ Fetch experiences
    useEffect(() => {
        const fetchExperiences = async () => {
            try {
                setLoading(true);
                const options: GetExperiencesOptions = {
                    applicant: applicant,
                };
                const data = await ExperienceApi.getExperiences(options);
                setAll(
                    data.map(r => ({
                        ...r,
                        applicant: applicant ?? r.applicant
                    }))
                );
            } catch (err: any) {
                setError("Failed to fetch experiences. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchExperiences();
    }, [applicant]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    // ✅ Save / update
    const onSaveComplete = (savedExperience: Experience) => {
        updateItem(savedExperience);
        hideSaveDialog();
    };

    const deleteExperience = async (row: Experience) => {
        const deleted = await ExperienceApi.deleteExperience(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setExperience(emptyExperience);
        setShowSaveDialog(false);
    };


    const columns = [
        // { header: "Applicant", field: "applicant.name" }, // assumes applicant is populated with name
        //  { header: "Organization", field: "organization.name" }, // assumes organization populated
        { header: "Job Title", field: "jobTitle" },
        //  { header: "Rank", field: "rank.title" }, // assumes rank populated
        { header: "Start Date", field: "startDate", body: (row: Experience) => new Date(row.startDate!).toLocaleDateString() },
        { header: "End Date", field: "endDate", body: (row: Experience) => row.endDate ? new Date(row.endDate).toLocaleDateString() : "Current" },
        //{ header: "Current", field: "isCurrent", body: currentStatusTemplate },
        { header: "Employment Type", field: "employmentType" },
    ];

    return (
        <>
            <CrudManager
                title="Experience"
                items={experiences}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setExperience(emptyExperience); setShowSaveDialog(true); }}
                onEdit={(row) => { setExperience(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: row.jobTitle, onConfirmAsync: () => deleteExperience(row) })}
            //expandedRows={expandedRows}
            //onRowToggle={(e) => setExpandedRows(e.data)}
            //rowExpansionTemplate={resultExpansionTemplate}
            />

            {
                /**
                 * {experience && projectStage && (
                            <SaveExperienceDialog
                                visible={showSaveDialog}
                                experience={experience}
                                onCompelete={onSaveComplete}
                                onHide={hideSaveDialog}
                            />
                        )}
                 */
            }

        </>
    );
};

export default ExperienceManager;
