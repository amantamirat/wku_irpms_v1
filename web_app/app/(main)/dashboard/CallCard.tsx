import { useAuth } from "@/contexts/auth-context";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useState } from "react";
import { Calendar } from "../calendars/models/calendar.model";
import { Call } from "../calls/models/call.model";
import { Organization } from "../organizations/models/organization.model";
import { Collaborator, CollaboratorStatus } from "../projects/collaborators/models/collaborator.model";
import ApplyWizard from "./apply/ApplyWizard";
import { Project } from "../projects/models/project.model";
import CallViewDialog from "./CallViewDialog";

interface CallCardProps {
    call: Call;
}

export default function CallCard(props: CallCardProps) {

    const { call } = props;

    const { user } = useAuth();

    const emptyProject: Project = {
        title: "",
        call: call,
        collaborators: user?.linkedApplicant
            ? [
                {
                    applicant: user.linkedApplicant,
                    status:CollaboratorStatus.active,
                    isLeadPI: true,
                } as Collaborator,
            ]
            : [],
    };
    const [project, setProject] = useState<Project>(emptyProject);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);

    const header = <img alt="Call" src={call.poster || "/images/callcard.png"} />;

    const footer = (
        <div className="flex justify-content-between align-items-center">
            <div className="flex gap-2">
                <Button label="View" icon="pi pi-eye" severity="info"
                    rounded raised outlined
                    onClick={() => {
                        setShowViewDialog(true);
                    }}
                />
                <Button
                    label="Apply" icon="pi pi-check-circle" severity="success"
                    rounded raised outlined
                    onClick={() => {
                        setProject(emptyProject);
                        setShowApplyDialog(true);
                    }}
                    //disabled={new Date(call.deadline) < new Date()}
                />
            </div>
        </div>
    );

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <>
            <Card
                title={call.title}
                subTitle={
                    <div className="flex flex-column gap-1">
                        <span>{(call.directorate as Organization).name}</span>
                        <span>{(call.calendar as Calendar).year}</span>
                        <span>
                            <strong>
                                <span style={{ color: "red" }}>Deadline:</span>{" "}
                                {//new Date(call.deadline).toLocaleDateString()
                                }
                            </strong>
                        </span>
                    </div>
                }
                header={header}
                footer={footer}
                className="mb-3 h-full hover:shadow-lg transition-shadow duration-300"
            >
                <p className="m-0">
                    {truncateText(call.description || "", 100)}
                </p>
            </Card>

            {call && (
                <ApplyWizard
                    visible={showApplyDialog}
                    call={call}
                    onCancel={() => setShowApplyDialog(false)}
                    project={project} setProject={setProject}
                />
            )}

            {call && (
                <CallViewDialog
                    visible={showViewDialog}
                    call={call}
                    onHide={() => setShowViewDialog(false)}
                />
            )}
        </>
    )
}