'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { HistoryRule } from '../models/history.model';
import { HistoryApi } from '../api/history.api';
import { Range, isValidRange } from '../models/composition.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveHistory: React.FC<EntitySaveDialogProps<HistoryRule>> = ({
  visible,
  item,
  onComplete,
  onHide
}) => {
  const toast = useRef<Toast>(null);
  const [localHistory, setLocalHistory] = useState<Partial<HistoryRule>>({ ...item });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLocalHistory({ ...item });
  }, [item]);

  const clearForm = () => {
    setSubmitted(false);
    setLocalHistory({ ...item });
  };

  const validate = (): { valid: boolean; message?: string } => {
    if (!localHistory.name || localHistory.name.trim().length === 0) {
      return { valid: false, message: 'Rule Name is required.' };
    }

    const metrics: { range?: Range; label: string }[] = [
      { range: localHistory.submitted, label: 'Submitted Projects' },
      { range: localHistory.rejected, label: 'Rejected Projects' },
      { range: localHistory.completed, label: 'Completed Projects' },
      { range: localHistory.granted, label: 'Granted Projects' }
    ];

    for (const metric of metrics) {
      if (metric.range) {
        const check = isValidRange(metric.range, metric.label);
        if (!check.valid) return check;
      }
    }

    return { valid: true };
  };

  const save = async () => {
    setSubmitted(true);
    const validation = validate();

    if (!validation.valid) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Error',
        detail: validation.message,
        life: 3000
      });
      return;
    }

    try {
      const saved = localHistory._id
        ? await HistoryApi.update(localHistory)
        : await HistoryApi.create(localHistory);

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'History rule saved successfully',
        life: 2000
      });

      if (onComplete) setTimeout(() => onComplete(saved), 800);
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to save history rule',
        life: 2500
      });
    }
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  const updateMetricRange = (
    field: 'submitted' | 'rejected' | 'completed' | 'granted',
    type: 'min' | 'max',
    value: number | null
  ) => {
    const currentRange = localHistory[field] || { min: 0, max: Infinity };

    setLocalHistory({
      ...localHistory,
      [field]: {
        ...currentRange,
        [type]: value === null
          ? (type === 'min' ? 0 : Infinity)
          : value
      }
    });
  };

  const footer = (
    <>
      <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
      <Button label="Save History Rule" icon="pi pi-check" onClick={save} />
    </>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: '680px' }}
        header={localHistory._id ? 'Edit History & Performance Rule' : 'Create History & Performance Rule'}
        modal
        className="p-fluid"
        footer={footer}
        onHide={hide}
      >
        {/* Name & Description */}
        <div className="field">
          <label htmlFor="name" className="font-semibold">
            Rule Name <span className="text-red-500">*</span>
          </label>
          <InputText
            id="name"
            value={localHistory.name || ''}
            onChange={(e) => setLocalHistory({ ...localHistory, name: e.target.value })}
            className={classNames({ 'p-invalid': submitted && !localHistory.name })}
            placeholder="e.g., Experienced Lead Researcher Profile"
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <InputTextarea
            id="description"
            rows={2}
            value={localHistory.description || ''}
            onChange={(e) => setLocalHistory({ ...localHistory, description: e.target.value })}
            placeholder="Details about grant/project history constraints..."
          />
        </div>

        {/* 🔹 Metric Range Grid */}
        <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
          <div className="font-semibold text-900 mb-3">Project Metric Restrictions</div>

          {/* Submissions */}
          <div className="formgrid grid mb-2">
            <div className="col-12 font-medium text-sm text-700">Submissions History</div>
            <div className="field col-6">
              <label className="text-xs">Min Submissions</label>
              <InputNumber
                value={localHistory.submitted?.min}
                onValueChange={(e) => updateMetricRange('submitted', 'min', e.value ?? null)}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="field col-6">
              <label className="text-xs">Max Submissions</label>
              <InputNumber
                value={localHistory.submitted?.max === Infinity ? null : localHistory.submitted?.max}
                onValueChange={(e) => updateMetricRange('submitted', 'max', e.value ?? null)}
                min={0}
                placeholder="Infinity (No Limit)"
              />
            </div>
          </div>

          {/* Completed */}
          <div className="formgrid grid mb-2">
            <div className="col-12 font-medium text-sm text-700">Completions History</div>
            <div className="field col-6">
              <label className="text-xs">Min Completed</label>
              <InputNumber
                value={localHistory.completed?.min}
                onValueChange={(e) => updateMetricRange('completed', 'min', e.value ?? null)}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="field col-6">
              <label className="text-xs">Max Completed</label>
              <InputNumber
                value={localHistory.completed?.max === Infinity ? null : localHistory.completed?.max}
                onValueChange={(e) => updateMetricRange('completed', 'max', e.value ?? null)}
                min={0}
                placeholder="Infinity (No Limit)"
              />
            </div>
          </div>

          {/* Granted */}
          <div className="formgrid grid mb-2">
            <div className="col-12 font-medium text-sm text-700">Granted Projects History</div>
            <div className="field col-6">
              <label className="text-xs">Min Grants Awarded</label>
              <InputNumber
                value={localHistory.granted?.min}
                onValueChange={(e) => updateMetricRange('granted', 'min', e.value ?? null)}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="field col-6">
              <label className="text-xs">Max Grants Awarded</label>
              <InputNumber
                value={localHistory.granted?.max === Infinity ? null : localHistory.granted?.max}
                onValueChange={(e) => updateMetricRange('granted', 'max', e.value ?? null)}
                min={0}
                placeholder="Infinity (No Limit)"
              />
            </div>
          </div>

          {/* Rejections */}
          <div className="formgrid grid">
            <div className="col-12 font-medium text-sm text-700">Rejections Threshold</div>
            <div className="field col-6">
              <label className="text-xs">Min Rejections</label>
              <InputNumber
                value={localHistory.rejected?.min}
                onValueChange={(e) => updateMetricRange('rejected', 'min', e.value ?? null)}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="field col-6">
              <label className="text-xs">Max Rejections Limit</label>
              <InputNumber
                value={localHistory.rejected?.max === Infinity ? null : localHistory.rejected?.max}
                onValueChange={(e) => updateMetricRange('rejected', 'max', e.value ?? null)}
                min={0}
                placeholder="Infinity (No Ceiling)"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default SaveHistory;