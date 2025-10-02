import { Card } from "primereact/card";
import { Project } from "../../models/project.model";
import { Call } from "@/app/(main)/calls/models/call.model";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

interface ConfirmationProps {
    project: Project;
    call: any;
}
const Confirmation = ({ project, call }: ConfirmationProps) => {
    return (<>
        <div className="p-3">
            <h3 className="mb-3">Review Your Application</h3>

            <div className="grid">
                <div className="col-12 md:col-6">
                    <Card className="mb-3 shadow-1">
                        <h4>Call Information</h4>
                        <p><strong>Directorate:</strong> {call.directorate.name}</p>
                        <p><strong>Call:</strong> {call.title}</p>
                        <p><strong>Grant:</strong> {call.grant.title}</p>
                        <p><strong>Calendar:</strong> {call.calendar.year}</p>
                    </Card>
                </div>

                <div className="col-12 md:col-6">
                    <Card className="mb-3 shadow-1">
                        <h4>Project Information ({project.title === '' ? 'No Title' : project.title})</h4>
                        <p>
                            <strong>Collaborators:</strong>{" "}
                            {project.collaborators?.length || <Tag value="0" severity="warning" />}
                        </p>
                        <p>
                            <strong>Themes:</strong>{" "}
                            {project.themes?.length || <Tag value="0" severity="warning" />}
                        </p>
                        <p>
                            <strong>Phases:</strong>{" "}
                            {project.phases?.length || <Tag value="0" severity="warning" />}
                        </p>
                        <p>
                            <strong>File:</strong>{" "}
                            {project.file ? project.file.name : <Tag value="No file" severity="warning" />}
                        </p>
                    </Card>
                </div>
            </div>

            <Divider />
            <p>
                Please review the above information. If everything looks good, click{" "}
                <strong>Submit</strong> to finalize your application.
            </p>
        </div>

    </>);
}
export default Confirmation;