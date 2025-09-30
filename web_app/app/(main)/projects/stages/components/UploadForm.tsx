import { ProjectStage } from "../models/stage.model";
import { FileUpload } from "primereact/fileupload";

interface UploadFormProps {
    projectStage: ProjectStage;
    setProjectStage: (projectStage: ProjectStage) => void;
}

export default function UploadProjectForm({ projectStage, setProjectStage }: UploadFormProps) {

    const updateFile = (field: keyof ProjectStage, value: any) => {
        setProjectStage({ ...projectStage, [field]: value });
    };

    return (

        <div className="field">
            <label htmlFor="upload">Please upload your application PDF:</label>
            <FileUpload
                id="upload"
                name="document"
                accept=".pdf"
                maxFileSize={10000000} // 10MB
                chooseLabel="Select PDF"
                uploadOptions={{ style: { display: "none" } }}
                mode="advanced"
                customUpload
                onSelect={(event) =>
                    updateFile("file", event.files[0])
                }
                emptyTemplate={<p className="m-0">Drag and drop files to here to upload.</p>}
            />
        </div>


    );
}
