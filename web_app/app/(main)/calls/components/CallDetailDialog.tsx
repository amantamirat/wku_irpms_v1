import { Dialog } from "primereact/dialog";
import { Call } from "../models/call.model";
import { Grant } from "../../grants/models/grant.model";
import { useEffect, useState } from "react";
import { Constraint, BaseConstraintType, ProjectConstraintType, ApplicantConstraintType, OperationMode } from "../../grants/constraints/models/constraint.model";
import { GrantApi } from "../../grants/api/grant.api";
import { ConstraintApi } from "../../grants/constraints/api/constraint.api";

interface CallDetailDialogProps {
  visible: boolean;
  call: Call;
  onHide: () => void;
}

export default function CallDetailDialog({ visible, call, onHide }: CallDetailDialogProps) {
  const [grant, setGrant] = useState<Grant | null>(null);
  const [projectConstraints, setProjectConstraints] = useState<Constraint[]>([]);
  const [applicantConstraints, setApplicantConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!call || !visible) return;
    setLoading(true);
    const fetchDetails = async () => {
      try {
  // Fetch grant details
  const grantList = await GrantApi.getGrants({});
  const grantData = grantList.find(g => g._id === (typeof call.grant === 'object' ? call.grant._id : call.grant));
  setGrant(grantData || null);
  // Fetch constraints
  const allConstraints = await ConstraintApi.getConstraints({ grant: typeof call.grant === 'object' ? call.grant._id : call.grant });
  setProjectConstraints(allConstraints.filter(c => c.type === BaseConstraintType.PROJECT));
  setApplicantConstraints(allConstraints.filter(c => c.type === BaseConstraintType.APPLICANT));
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [call, visible]);

  return (
    <Dialog header={call.title} visible={visible} style={{ width: '50vw' }} onHide={onHide} modal>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <h4>Description</h4>
          <p>{call.description}</p>
          <h4>Grant</h4>
          <p>{grant ? grant.title : 'N/A'}</p>
          <h4>Constraints</h4>
          <div>
            <strong>Project Constraints:</strong>
            <ul>
              {projectConstraints.length === 0 ? <li>None</li> : projectConstraints.map((c, i) => (
                <li key={i}>{c.constraint}: min {c.min}, max {c.max}</li>
              ))}
            </ul>
            <strong>Applicant Constraints:</strong>
            <ul>
              {applicantConstraints.length === 0 ? <li>None</li> : applicantConstraints.map((c, i) => (
                <li key={i}>{c.constraint} ({c.mode}): min {c.min}, max {c.max}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Dialog>
  );
}
