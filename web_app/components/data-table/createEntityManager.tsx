'use client';

import React, { useEffect, useState } from "react";
import { EntityApi, StateTransition } from "@/api/EntityApi";
import {
  ItemDataTable,
  RowActionButton,
  ToolBarActionButton,
} from "@/components/data-table/ItemDataTable";
import { useAuth } from "@/contexts/auth-context";
import {
  TransitionMap,
  useStateTransitionActions,
} from "@/hooks/useStateTransitionActions";
import { useCrudList } from "@/hooks/useCrudList";
import { useCrudActions } from "@/hooks/useCrudActions";
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

  permissionPrefix: string;

  api: EntityApi<T, TQuery>;

  columns: any[];

  createNew?: () => T;

  SaveDialog?: React.ComponentType<EntitySaveDialogProps<T>>;

  initialItems?: T[];

  query?: () => TQuery;

  // Explicitly choose to use lookup instead of getAll
  useLookup?: boolean;

  workflow?: {
    statusField: keyof T;
    transitions: TransitionMap;
  };

  expandable?: {
    template: (
      row: T,
      actions: {
        updateItem: (item: T) => void;
      }
    ) => React.ReactNode;

    allow?: (row: T) => boolean;
  };

  disableEditRow?: (row: T) => boolean;
  disableDeleteRow?: (row: T) => boolean;

  hideDefaultActions?: boolean;
  hideCreateAction?: boolean;
  hideEditAction?: boolean;
  hideDeleteAction?: boolean;

  extraToolBarActions?: ToolBarActionButton[];
  extraRowActions?: RowActionButton<T>[];

  hideSearch?: boolean;
  enableColumnToggle?: boolean;
  defaultHiddenFields?: string[];
}

export function createEntityManager<
  T extends Record<string, any>,
  TQuery = undefined
>(config: CreateEntityManagerConfig<T, TQuery>) {
  return function EntityManager() {
    const { hasPermission } = useAuth();

    const {
      items,
      setAll,
      getById,
      updateItem,
      removeItem,
      loading,
      setLoading,
    } = useCrudList<T>({
      initialItems: config.initialItems ?? [],
    });

    const [item, setItem] = useState<T | null>(null);
    const [showDialog, setShowDialog] = useState(false);

    /**
     * true  = editing
     * false = creating
     */
    const [editing, setEditing] = useState(false);

    const [error, setError] = useState<
      ApiError | string | null
    >(null);

    /*
     * -----------------------------------------
     * READ PERMISSION
     * -----------------------------------------
     */

    const canRead = hasPermission([
      `${config.permissionPrefix}:read`,
      `${config.permissionPrefix}:lookup`,
    ]);

    /*
     * -----------------------------------------
     * REFRESH
     * -----------------------------------------
     */

    const refresh = async () => {
      setError(null);

      /*
       * External data source.
       *
       * The manager does not fetch or overwrite
       * the local CRUD state.
       */
      if (config.initialItems !== undefined) {
        return;
      }

      if (!canRead) {
        setError(
          new ApiError(
            "You do not have permission to view this resource.",
            {
              status: 403,
              code: "FORBIDDEN",
            }
          )
        );

        return;
      }

      try {
        setLoading(true);

        const query = config.query
          ? config.query()
          : undefined;

        let data: T[];
        // Use lookup if explicitly requested in config, otherwise fall back to getAll
        if (config.useLookup && typeof config.api.lookup === "function") {
          data = await config.api.lookup(query);
        } else if (typeof config.api.getAll === "function") {
          data = await config.api.getAll(query);
        } else {
          data = [];
        }

        setAll(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(
          "[EntityManager] Fetch failed:",
          err
        );

        setError(
          err instanceof ApiError
            ? err
            : String(err)
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      refresh();
    }, []);

    /*
     * -----------------------------------------
     * CREATE
     * -----------------------------------------
     */

    const handleCreate = () => {
      if (!config.createNew) {
        return;
      }

      setItem(config.createNew());

      setEditing(false);

      setShowDialog(true);
    };

    /*
     * -----------------------------------------
     * EDIT
     * -----------------------------------------
     */

    const handleEdit = (row: T) => {
      setItem({ ...row });

      setEditing(true);

      setShowDialog(true);
    };

    /*
     * -----------------------------------------
     * DELETE
     * -----------------------------------------
     */

    const handleDelete = async (row: T) => {
      try {
        const ok =
          await config.api.delete(row);

        if (ok) {
          removeItem(row);
        }
      } catch (err) {
        console.error(
          "[EntityManager] Delete failed:",
          err
        );

        throw err;
      }
    };

    /*
     * -----------------------------------------
     * TRANSITION
     * -----------------------------------------
     */

    const handleTransition = async (
      id: string,
      transition: StateTransition
    ) => {
      if (!config.api.transitionState) {
        return;
      }

      try {
        const updated =
          await config.api.transitionState(
            id,
            transition
          );

        if (!updated) {
          return;
        }

        const prev = getById(id);

        if (!prev) {
          return;
        }

        const statusField =
          config.workflow?.statusField;

        if (statusField) {
          updateItem({
            ...prev,
            [statusField]:
              updated[statusField],
          });
        } else {
          updateItem(updated);
        }
      } catch (err) {
        console.error(
          "[EntityManager] Transition failed:",
          err
        );

        throw err;
      }
    };

    /*
     * -----------------------------------------
     * SAVE COMPLETE
     * -----------------------------------------
     */

    const handleSaveComplete = (
      saved: T
    ) => {
      /*
       * Your useCrudList.updateItem is already
       * an upsert:
       *
       * - existing item -> update
       * - new item      -> add
       *
       * Therefore we can simply use updateItem.
       */
      updateItem(saved);

      setShowDialog(false);
      setItem(null);
      setEditing(false);
    };

    /*
     * -----------------------------------------
     * DIALOG HIDE
     * -----------------------------------------
     */

    const handleDialogHide = () => {
      setShowDialog(false);
      setItem(null);
      setEditing(false);
    };

    /*
     * -----------------------------------------
     * CRUD ACTIONS
     * -----------------------------------------
     */

    const {
      toolbarActions,
      rowActions: crudRowActions,
    } = useCrudActions<T>({
      resource:
        config.permissionPrefix,

      itemName:
        config.itemName,

      onCreate:
        config.createNew
          ? handleCreate
          : undefined,

      onEdit:
        handleEdit,

      onDelete:
        handleDelete,

      hideDefaultActions:
        config.hideDefaultActions,

      hideCreateAction:
        config.hideCreateAction,

      hideEditAction:
        config.hideEditAction,

      hideDeleteAction:
        config.hideDeleteAction,

      disableEditRow:
        config.disableEditRow,

      disableDeleteRow:
        config.disableDeleteRow,
    });

    /*
     * -----------------------------------------
     * STATE TRANSITION ACTIONS
     * -----------------------------------------
     */

    const transitionActions =
      useStateTransitionActions<T>({
        resource:
          config.permissionPrefix,

        statusField:
          config.workflow?.statusField,

        transitions:
          config.workflow?.transitions,

        onTransition:
          handleTransition,
      });

    /*
     * -----------------------------------------
     * ROW ACTIONS
     * -----------------------------------------
     */

    const rowActions:
      RowActionButton<T>[] = [
        ...transitionActions,
        ...(config.extraRowActions ?? []),
        ...crudRowActions,
      ];

    /*
     * -----------------------------------------
     * ERROR
     * -----------------------------------------
     */

    if (error && !loading) {
      return (
        <ErrorState
          title={
            config.title
              ? `${config.title} Unavailable`
              : undefined
          }
          error={error}
          onRetry={
            canRead
              ? refresh
              : undefined
          }
        />
      );
    }

    /*
     * -----------------------------------------
     * RENDER
     * -----------------------------------------
     */

    return (
      <>
        <ItemDataTable
          headerTitle={config.title}

          items={items}

          columns={config.columns}

          rowActions={rowActions}

          toolBarActions={[
            ...toolbarActions,
            ...(config.extraToolBarActions ?? []),
          ]}

          loading={loading}

          enableSearch={
            !config.hideSearch
          }

          expandable={
            config.expandable
              ? {
                allow:
                  config.expandable.allow,

                template: (
                  row: T
                ) =>
                  config.expandable!.template(
                    row,
                    {
                      updateItem,
                    }
                  ),
              }
              : undefined
          }

          defaultHiddenFields={
            config.defaultHiddenFields
          }

          enableColumnToggle={
            config.enableColumnToggle
          }
        />

        {item &&
          showDialog &&
          config.SaveDialog && (
            <config.SaveDialog
              visible={showDialog}

              item={item}

              onComplete={
                handleSaveComplete
              }

              onHide={
                handleDialogHide
              }
            />
          )}
      </>
    );
  };
}