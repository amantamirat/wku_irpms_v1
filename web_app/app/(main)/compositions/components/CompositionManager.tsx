import React from "react";
import { createEntityManager } from "@/components/createEntityManager";
import { CompositionApi } from "../api/composition.api";
import SaveComposition from "./SaveComposition";
import { Composition } from "../models/composition.model";
import { HistoryRule } from "../models/history.model";
import { EligibilityProfile } from "../models/profile.model";
import { MemberRequirement } from "../models/requirement.model";

// Helper utilities to cleanly format referenced sub-entities inside table cells
const renderEntityName = (
  entity?: string | EligibilityProfile | HistoryRule,
  fallback = "None"
) => {
  if (!entity) return <span style={{ color: "var(--text-color-secondary)" }}>{fallback}</span>;
  if (typeof entity === "object" && entity.name) {
    return <span style={{ fontWeight: 500 }}>{entity.name}</span>;
  }
  return <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>{String(entity)}</span>;
};

const renderMemberRequirements = (requirements?: string[] | MemberRequirement[]) => {
  if (!requirements || requirements.length === 0) {
    return <span style={{ color: "var(--text-color-secondary)" }}>No member rules set</span>;
  }

  const count = requirements.length;
  const names = requirements
    .map((req) => (typeof req === "object" ? req.name : null))
    .filter(Boolean);

  return (
    <div>
      <span
        style={{
          fontSize: "0.8rem",
          backgroundColor: "var(--primary-color)",
          color: "var(--primary-color-text)",
          padding: "2px 8px",
          borderRadius: "12px",
          fontWeight: 600,
          marginRight: "6px"
        }}
      >
        {count} Rule{count > 1 ? "s" : ""}
      </span>
      {names.length > 0 && (
        <span style={{ fontSize: "0.85rem", color: "var(--text-color-secondary)" }}>
          ({names.join(", ")})
        </span>
      )}
    </div>
  );
};

const CompositionManager = () => {
  const Manager = createEntityManager<Composition>({
    title: "Manage Team Composition Specifications",
    itemName: "Composition Rule",
    api: CompositionApi,
    columns: [
      {
        field: "name",
        header: "Composition Name",
        sortable: true,
        body: (rowData: Composition) => (
          <div>
            <div style={{ fontWeight: 600 }}>{rowData.name}</div>
            {rowData.description && (
              <small style={{ color: "var(--text-color-secondary)" }}>
                {rowData.description}
              </small>
            )}
          </div>
        )
      },
      {
        field: "leadProfileRule",
        header: "Lead Profile Rule",
        sortable: true,
        body: (rowData: Composition) => renderEntityName(rowData.leadProfileRule)
      },
      {
        field: "leadHistoryRule",
        header: "Lead History Rule",
        sortable: true,
        body: (rowData: Composition) => renderEntityName(rowData.leadHistoryRule)
      },
      {
        field: "memberRequirements",
        header: "Member Requirements",
        body: (rowData: Composition) => renderMemberRequirements(rowData.memberRequirements)
      }
    ],
    createNew: () => ({
      name: "",
      description: "",
      memberRequirements: []
    }),
    query: () => undefined,
    SaveDialog: SaveComposition,
    permissionPrefix: "composition"
  });

  return <Manager />;
};

export default CompositionManager;