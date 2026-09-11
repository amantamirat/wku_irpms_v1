'use client';

import React, { useEffect, useState, useMemo } from "react";
import { EntityApi, StateTransition } from "@/api/EntityApi";
import {
  ItemDataTable,
  RowActionButton,
  TopActionButton,
} from "@/components/data-table/ItemDataTable";
import { useAuth } from "@/contexts/auth-context";
import { useCrudList } from "@/hooks/useCrudList";
import { useTableActions } from "@/hooks/useTableActions";
import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { ApiError } from "@/api/ApiError";
import ErrorState from "../ErrorState";

export interface EntitySaveDialogProps<T> {
  visible: boolean;
  item: T;
  onComplete: (item: T) => void;
  onHide: () => void;
}

export interface CreateEntityManagerConfig<
  T extends Record<string, any>,
  TQuery = undefined
> {
  title?: string;
  itemName?: string;
  permissionPrefix: string; // will be renamed to resource
  api: EntityApi<T, TQuery>;
  columns: any[];
  createNew?: () => T;
  SaveDialog?: React.ComponentType<EntitySaveDialogProps<T>>;
  query?: () => TQuery;

  workflow?: {
    statusField: keyof T;
    transitions: TransitionMap;
  };

  expandable?: {
    template: (
      row: T,
      actions: { updateItem: (item: T) => void }
    ) => React.ReactNode;
    allow?: (row: T) => boolean;
  };

  extraActions?: RowActionButton<T>[];
  topActions?: TopActionButton[];
  disableEditRow?: (row: T) => boolean;
  disableDeleteRow?: (row: T) => boolean;
  hideDefaultActions?: boolean;
  hideEditAction?: boolean;
  hideDeleteAction?: boolean;
  hideSearch?: boolean;
}

export function createEntityManager<
  T extends Record<string, any>,
  TQuery = undefined
>(config: CreateEntityManagerConfig<T, TQuery>) {
  return function EntityManager() {
    const { hasPermission } = useAuth();
    const { items, setAll, updateItem, removeItem, loading, setLoading } =
      useCrudList<T>();

    const [item, setItem] = useState<T | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [error, setError] = useState<ApiError | string | null>(null);

    const canRead = hasPermission([
      `${config.permissionPrefix}:read`,
      `${config.permissionPrefix}:read:own`,
    ]);

    const refresh = async () => {
      setError(null);

      if (!canRead) {
        setError(
          new ApiError("You do not have permission to view this resource.", {
            status: 403,
            code: "FORBIDDEN",
          })
        );
        return;
      }

      try {
        setLoading(true);
        const query = config.query ? config.query() : undefined;
        const data = await config.api.getAll(query);
        setAll(data ?? []);
      } catch (err) {
        console.error("[EntityManager] Fetch failed:", err);
        setError(err instanceof ApiError ? err : String(err));
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      refresh();
    }, []);

    const handleCreate = () => {
      if (config.createNew) {
        setItem(config.createNew());
        setShowDialog(true);
      }
    };

    const handleEdit = (row: T) => {
      setItem({ ...row });
      setShowDialog(true);
    };

    const handleDelete = async (row: T) => {
      try {
        const ok = await config.api.delete(row);
        if (ok) {
          removeItem(row);
        }
      } catch (err) {
        console.error("[EntityManager] Delete failed:", err);
      }
    };

    const handleTransition = async (id: string, transition: StateTransition) => {
      if (!config.api.transitionState) return;
      try {
        const updated = await config.api.transitionState(id, transition);
        if (updated) {
          updateItem(updated);
        }
      } catch (err) {
        console.error("[EntityManager] Transition failed:", err);
      }
    };

    const actions = useTableActions<T>({
      resource: config.permissionPrefix,
      itemName: config.itemName,
      hideDefaultActions: config.hideDefaultActions,
      hideEditAction: config.hideEditAction,
      hideDeleteAction: config.hideDeleteAction,
      disableEditRow: config.disableEditRow,
      disableDeleteRow: config.disableDeleteRow,
      onEdit: handleEdit,
      onDelete: handleDelete,
      workflow: config.workflow
        ? {
          statusField: config.workflow.statusField,
          transitions: config.workflow.transitions,
          onTransition: handleTransition,
        }
        : undefined,
      extraActions: config.extraActions,
    });

    const canCreate =
      !!config.createNew &&
      hasPermission([
        `${config.permissionPrefix}:create`,
        `${config.permissionPrefix}:create:own`,
      ]);

    // Build top action buttons with typed TopActionButton[]
    const combinedTopActions = useMemo(() => {
      const actions: TopActionButton[] = [];

      if (canCreate) {
        actions.push({
          label: `Create ${config.itemName || ""}`,
          icon: "pi pi-plus",
          severity: "success",
          onClick: handleCreate,
        });
      }

      if (config.topActions) {
        actions.push(...config.topActions);
      }

      return actions;
    }, [canCreate, config.itemName, config.topActions]);

    if (error && !loading) {
      return (
        <ErrorState
          title={config.title ? `${config.title} Unavailable` : undefined}
          error={error}
          onRetry={canRead ? refresh : undefined}
        />
      );
    }

    return (
      <>
        <ItemDataTable
          headerTitle={config.title}
          items={items}
          columns={config.columns}
          rowActions={actions as RowActionButton<T>[]}
          topActions={combinedTopActions}
          loading={loading}
          enableSearch={!config.hideSearch}
          expandable={
            config.expandable
              ? {
                allow: config.expandable.allow,
                template: (row: T) =>
                  config.expandable!.template(row, { updateItem }),
              }
              : undefined
          }
        />

        {item && showDialog && config.SaveDialog && (
          <config.SaveDialog
            visible={showDialog}
            item={item}
            onComplete={(saved: T) => {
              updateItem(saved);
              setShowDialog(false);
            }}
            onHide={() => setShowDialog(false)}
          />
        )}
      </>
    );
  };
}