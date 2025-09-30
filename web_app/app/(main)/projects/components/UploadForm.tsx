import { FileUpload } from "primereact/fileupload";

interface UploadFormProps {
    onUpload?: (file: File) => void;
    file?: File;
}

export default function UploadForm({ onUpload, file }: UploadFormProps) {
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
                onSelect={(e) => {
                    if (onUpload && e.files?.length) {
                        onUpload(e.files[0]);
                    }
                }}
                emptyTemplate={
                    file ? (
                        <p className="m-0 text-green-600">
                            Selected File: {file.name}
                        </p>
                    ) : (
                        <p className="m-0">
                            Drag and drop files here to upload.
                        </p>
                    )
                }
            />
        </div>
    );
}
