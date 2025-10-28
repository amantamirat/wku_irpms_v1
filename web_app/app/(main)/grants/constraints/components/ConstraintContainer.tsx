import { TabView, TabPanel } from "primereact/tabview";
import { Grant } from "../../models/grant.model";
import { ConstraintType } from "../models/constraint.model";
import ConstraintManager from "./ConstraintManager";

interface ConstraintContainerProps {
    grant: Grant;
}
const ConstraintContainer = ({ grant }: ConstraintContainerProps) => {
    return (
        <div>
            <TabView>
                <TabPanel header="Project">
                    <ConstraintManager grant={grant} type={ConstraintType.PROJECT} />
                </TabPanel>
                <TabPanel header="Applicant">
                    <ConstraintManager grant={grant} type={ConstraintType.APPLICANT} />
                </TabPanel>
            </TabView>
        </div>
    );
}

export default ConstraintContainer;