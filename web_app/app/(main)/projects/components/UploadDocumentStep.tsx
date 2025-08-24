import { FileUpload } from "primereact/fileupload";

interface UploadDocumentStepProps {
    onUpload?: (file: File) => void;
}

export default function UploadDocumentStep({ onUpload }: UploadDocumentStepProps) {
    return (
        <div>
            <p>Please upload your application PDF:</p>
            <FileUpload
                name="application"
                url="/api/upload" // replace with your backend API
                accept=".pdf"
                maxFileSize={10000000} // 10MB
                chooseLabel="Select PDF"
                uploadLabel="Upload"
                mode="basic"
                customUpload
                uploadHandler={(e) => {
                    if (onUpload && e.files?.length) {
                        onUpload(e.files[0]);
                    }
                }}
            />
        </div>
    );
}
