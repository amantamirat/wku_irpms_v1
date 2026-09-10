'use client';

import React, { useEffect, useState } from "react";
import { EntityApi, StateTransition } from "@/api/EntityApi";
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import { useAuth } from "@/contexts/auth-context";
import { useCrudList } from "@/hooks/useCrudList";
import { useTableActions } from "@/hooks/useTableActions";
import { ActionButton } from "@/hooks/useDefaultActions";
import { TransitionMap } from "@/hooks/useStateTransitionActions";

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
  permissionPrefix: string;//will be renamed to rescource
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

  extraActions?: ActionButton<T>[];
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

    const refresh = async () => {
      try {
        setLoading(true);
        const query = config.query ? config.query() : undefined;
        const data = await config.api.getAll(query);
        setAll(data ?? []);
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
      const ok = await config.api.delete(row);
      if (ok) {
        removeItem(row);
      }
    };

    const handleTransition = async (id: string, transition: StateTransition) => {
      if (!config.api.transitionState) return;
      const updated = await config.api.transitionState(id, transition);
      if (updated) {
        updateItem(updated);
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

    return (
      <>
        <ItemDataTable
          headerTitle={config.title}
          itemName={config.itemName}
          items={items}
          columns={config.columns}
          actions={actions}
          loading={loading}
          enableSearch={!config.hideSearch}
          onCreate={canCreate ? handleCreate : undefined}
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