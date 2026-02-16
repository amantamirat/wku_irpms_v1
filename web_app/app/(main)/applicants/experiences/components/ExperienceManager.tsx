'use client';
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { ExperienceApi } from "../api/experience.api";
import { Experience } from "../models/experience.model";
import SaveExperienceDialog from "./SaveExperienceDialog";

interface ExperienceManagerProps {
    applicant: Applicant;
}

const ExperienceManager = ({ applicant }: ExperienceManagerProps) => {

    const { getApplicant, hasPermission } = useAuth();

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
                const data = await ExperienceApi.getExperiences({ applicant });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch experiences. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchExperiences();
    }, [applicant]);



    // ✅ Save / update
    const onSaveComplete = (savedExperience: Experience) => {
        updateItem(savedExperience);
        hideSaveDialog();
    };

    const deleteExperience = async (row: Experience) => {
        const deleted = await ExperienceApi.delete(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setExperience(emptyExperience);
        setShowSaveDialog(false);
    };


    const columns = [
        { header: "Organization", field: "organization.name" }, // assumes organization populated
        { header: "Position", field: "position.name" },
        { header: "Rank", field: "rank.name" }, // assumes rank populated
        { header: "Start Date", field: "startDate", body: (row: Experience) => new Date(row.startDate!).toLocaleDateString() },
        { header: "End Date", field: "endDate", body: (row: Experience) => row.endDate ? new Date(row.endDate).toLocaleDateString() : "Current" },
        //{ header: "Current", field: "isCurrent", body: currentStatusTemplate },
        { header: "Employment Type", field: "employmentType" },
    ];

    return (
        <>
            <CrudManager
                headerTitle="Experience"
                items={experiences}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setExperience(emptyExperience); setShowSaveDialog(true); }}
                onEdit={(row) => { setExperience({ ...row }); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: (row.rank as any).name, onConfirmAsync: () => deleteExperience(row) })}
            />

            {
                showSaveDialog &&
                <SaveExperienceDialog
                    visible={showSaveDialog}
                    experience={experience}
                    onComplete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            }

        </>
    );
};

export default ExperienceManager;
