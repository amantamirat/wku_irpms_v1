import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useEffect, useState } from "react";
import { Calendar } from "../calendars/models/calendar.model";
import { Organization } from "../organizations/models/organization.model";
import ApplyWizard from "./apply/ApplyWizard";
import CallViewDialog from "./CallViewDialog";
import { Call } from "../calls/models/call.model";
import { Stage } from "../calls/stages/models/stage.model";
import { StageApi } from "../calls/stages/api/stage.api";

interface CallCardProps {
    call: Call;
}

const CallCard = ({ call }: CallCardProps) => {

    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);

    const [stages, setStages] = useState<Stage[]>([]);

    useEffect(() => {
        const fetchStages = async () => {
            try {
                const data = await StageApi.getStages({ call });
                setStages(data);
            } catch (err: any) {
                //setError("Failed to fetch stages. " + (err.message ?? ""));
            } finally {
                //setLoading(false);
            }
        };
        fetchStages();
    }, [call]);

    const header = (
        <div className="relative overflow-hidden border-round-top-lg">
            <img
                alt="Call Poster"
                src={"/images/call-card-1.png"}
                className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
            />
        </div>
    );

    const footer = (
        <div className="flex justify-content-between align-items-center mt-3">
            <Button
                label="View"
                icon="pi pi-eye"
                severity="info"
                rounded
                outlined
                disabled
                onClick={() => setShowViewDialog(true)}
            />
            <Button
                label="Apply"
                icon="pi pi-check-circle"
                severity="success"
                rounded
                outlined
                onClick={() => {
                    //setProject(emptyProject);
                    setShowApplyDialog(true);
                }}
            />
        </div>
    );

    const truncate = (text: string, max: number) =>
        text.length <= max ? text : text.substring(0, max) + '…';

    return (
        <>
            <Card
                title={<span className="font-semibold text-lg">{truncate(call.title, 45)}</span>}
                subTitle={
                    <div className="flex flex-column gap-1 text-sm text-600">
                        <span>{(call.directorate as Organization).name}</span>
                        <span>{(call.calendar as Calendar).year}</span>
                        <span>
                            <strong className="text-red-500">Deadlines:</strong>
                            <div className="mt-1 space-y-1">
                                {stages.map((stage) => (
                                    stage.deadline && (
                                        <div key={stage._id}>
                                            <span className="font-medium">{stage.name}:</span>{" "}
                                            {new Date(stage.deadline).toLocaleDateString()}
                                        </div>
                                    )
                                ))}
                            </div>
                        </span>
                    </div>
                }
                header={header}
                footer={footer}
                className="h-full shadow-1 hover:shadow-4 transition-shadow duration-300 border-round-lg overflow-hidden"
            >
                <p className="text-sm text-700 line-height-3">
                    {truncate(call.description || "", 110)}
                </p>
            </Card>

            {call && (
                <ApplyWizard
                    visible={showApplyDialog}
                    call={call}
                    onCancel={() => setShowApplyDialog(false)}
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
    );
}

export default CallCard;
