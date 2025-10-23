import { TabView, TabPanel } from "primereact/tabview";
import { Grant } from "../../models/grant.model";
import { BaseConstraintType } from "../models/constraint.model";
import ConstraintManager from "./ConstraintManager";

interface ConstraintContainerProps {
    grant: Grant;
}
const ConstraintContainer = ({ grant }: ConstraintContainerProps) => {
    return (
        <div>
            <TabView>
                <TabPanel header="Project">
                    <ConstraintManager grant={grant} type={BaseConstraintType.PROJECT} />
                </TabPanel>
                <TabPanel header="Applicant">
                    <ConstraintManager grant={grant} type={BaseConstraintType.APPLICANT} />
                </TabPanel>
            </TabView>
        </div>
    );
}

export default ConstraintContainer;