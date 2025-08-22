import { Dialog } from "primereact/dialog";
import { Call } from "../../calls/models/call.model";
import { FileUpload } from "primereact/fileupload";
import { useState } from "react";
import { Button } from "primereact/button";
import { Steps } from "primereact/steps";

interface ApplyWizardProps {
    visible: boolean;
    call: Call;
    onHide: () => void;
}

export default function ApplyWizard(props: ApplyWizardProps) {

    const { visible, call } = props;
    const [activeStep, setActiveStep] = useState(0);

    const items = [
        { label: 'Upload Document' },
        { label: 'Project Information' }
    ];

    const onHide = () => {
        //setSubmitted(false);
        //setErrorMessage(undefined);
        setActiveStep(0);
        props.onHide();
    };

    const nextStep = () => {
        setActiveStep(activeStep + 1);
    };

    const prevStep = () => {
        setActiveStep(activeStep - 1);
    }

    const footer = (
        <div className="flex justify-content-center gap-2">
            {activeStep > 0 && (
                <Button label="Back" icon="pi pi-angle-left" onClick={prevStep} outlined severity="secondary" />
            )}
            {activeStep === 0 && (
                <>
                    {activeStep === 0 && (
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            onClick={onHide}
                        />
                    )}
                    <Button label="Next" icon="pi pi-angle-right" onClick={nextStep} iconPos="right" outlined />
                </>
            )}
            {activeStep === 1 && (
                <Button label="Submit" icon="pi pi-check" outlined />
            )}
        </div>
    );




    return (

        <Dialog
            header="Apply for Call"
            visible={visible}
            style={{ width: '700px', height: '600px' }}
            footer={footer}
            onHide={onHide}
            maximizable >
            <>
                <h3>{call.title}</h3>
                <Steps model={items} activeIndex={activeStep} readOnly className="mb-4" />
                {activeStep === 0 &&
                    <>
                        <p>Please upload your application PDF:</p>
                        <FileUpload
                            name="application"
                            url="/api/upload" // replace with your backend API
                            accept=".pdf"
                            maxFileSize={10000000} // 10MB
                            chooseLabel="Select PDF"
                            uploadLabel="Upload"
                            mode="basic"
                        />
                    </>
                }
                {activeStep === 1 && <></>}

            </>
        </Dialog>
    )
}