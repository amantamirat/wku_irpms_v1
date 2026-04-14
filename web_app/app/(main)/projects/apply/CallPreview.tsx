'use client';
import React from 'react';
import { Divider } from 'primereact/divider';
import { Constraint } from '../../grants/constraints/models/constraint.model';
import { Call } from '../../calls/models/call.model';
import { constraintUIMap } from '../../grants/constraints/models/constraint.config';


interface CallPreviewProps {
    call: Call;
    constraints: Constraint[];
}

export const CallPreview = ({ call, constraints }: CallPreviewProps) => {
    return (
        <div className="call-preview">
            <h4 className="mt-0 mb-2 text-primary flex align-items-center">
                <i className="pi pi-info-circle mr-2"></i>
                About this Call
            </h4>
            <p className="text-sm line-height-3 text-600 mb-4">
                {call.description || "No specific description provided for this call."}
            </p>

            <Divider align="left">
                <span className="p-tag p-tag-info text-xs">SUBMISSION RULES</span>
            </Divider>

            <div className="flex flex-column gap-3">
                {constraints.length > 0 ? (
                    constraints.map((c) => {
                        const ui = constraintUIMap[c.constraint!];
                        if (!ui) return null;
                        return (
                            <div key={c._id} className="flex align-items-start p-2 border-round surface-50 border-1 border-200">
                                <i className={`${ui.icon} mr-3 mt-1 text-primary text-lg`} />
                                <div className="flex flex-column">
                                    <span className="text-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                                        {ui.label}
                                    </span>
                                    {ui.format && (
                                        <span className="text-900 text-sm font-semibold">
                                            {ui.format(c.min, c.max)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-3 bg-blue-50 text-blue-700 border-round text-xs italic">
                        No specific constraints are applied to this grant.
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border-left-3 border-yellow-500 border-round-right">
                <p className="m-0 text-xs text-yellow-800 line-height-2">
                    <strong>Note:</strong> Ensure your proposal data aligns with these rules to avoid automatic rejection.
                </p>
            </div>
        </div>
    );
};