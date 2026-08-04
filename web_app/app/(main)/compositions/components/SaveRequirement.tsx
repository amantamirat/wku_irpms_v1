'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { classNames } from 'primereact/utils';

import {
  MemberRequirement,
  AggregationMode
} from '../models/requirement.model';
import { EligibilityProfile } from '../models/profile.model';
import { HistoryRule } from '../models/history.model';
import { MemberRequirementApi } from '../api/requirement.api';
import { ProfileApi } from '../api/profile.api';
import { HistoryApi } from '../api/history.api';
import { isValidRange } from '../models/composition.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const modeOptions = Object.values(AggregationMode).map((m) => ({
  label: m,
  value: m
}));

const SaveRequirement: React.FC<EntitySaveDialogProps<MemberRequirement>> = ({
  visible,
  item,
  onComplete,
  onHide
}) => {
  const toast = useRef<Toast>(null);

  const [localRequirement, setLocalRequirement] = useState<Partial<MemberRequirement>>({
    ...item
  });
  const [submitted, setSubmitted] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Referenced lookup options
  const [profiles, setProfiles] = useState<EligibilityProfile[]>([]);
  const [historyRules, setHistoryRules] = useState<HistoryRule[]>([]);

  // 🔹 Fetch external profile and history rules on mount / dialog open
  useEffect(() => {
    if (!visible) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [profilesRes, historyRes] = await Promise.all([
          ProfileApi.getAll(),
          HistoryApi.getAll()
        ]);

        setProfiles(profilesRes || []);
        setHistoryRules(historyRes || []);
      } catch (err: any) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error Loading Options',
          detail: err.message || 'Failed to fetch reference options.',
          life: 3000
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [visible]);

  // 🔹 Sync local state when incoming item changes (extract populated objects to string IDs)
  useEffect(() => {
    setLocalRequirement({
      ...item,
      profile: typeof item.profile === 'object' ? item.profile?._id : item.profile,
      historyRule: typeof item.historyRule === 'object' ? item.historyRule?._id : item.historyRule,
      mode: item.mode || AggregationMode.COUNT,
      threshold: item.threshold || { min: 0, max: Infinity }
    });
  }, [item]);

  const clearForm = () => {
    setSubmitted(false);
    setLocalRequirement({ ...item });
  };

  const validate = (): { valid: boolean; message?: string } => {
    if (!localRequirement.name || localRequirement.name.trim().length === 0) {
      return { valid: false, message: 'Requirement Name is required.' };
    }

    if (!localRequirement.mode) {
      return { valid: false, message: 'Aggregation Mode is required.' };
    }

    if (!localRequirement.threshold) {
      return { valid: false, message: 'Threshold range is required.' };
    }

    const rangeCheck = isValidRange(localRequirement.threshold, 'Threshold');
    if (!rangeCheck.valid) return rangeCheck;

    if (localRequirement.mode === AggregationMode.RATIO) {
      const { min, max } = localRequirement.threshold;
      if (min > 1 || (max !== Infinity && max > 1)) {
        return { valid: false, message: 'Ratio thresholds must be between 0.0 and 1.0 (e.g. 0.40 for 40%).' };
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
      const payload: Partial<MemberRequirement> = {
        ...localRequirement,
        profile: typeof localRequirement.profile === 'object' ? (localRequirement.profile as EligibilityProfile)._id : localRequirement.profile,
        historyRule: typeof localRequirement.historyRule === 'object' ? (localRequirement.historyRule as HistoryRule)._id : localRequirement.historyRule
      };

      const saved = localRequirement._id
        ? await MemberRequirementApi.update(payload)
        : await MemberRequirementApi.create(payload);

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Member requirement saved successfully',
        life: 2000
      });

      if (onComplete) setTimeout(() => onComplete(saved), 800);
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to save member requirement',
        life: 2500
      });
    }
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  const profileOptions = profiles.map((p) => ({
    label: p.name + (p.description ? ` (${p.description})` : ''),
    value: p._id
  }));

  const historyOptions = historyRules.map((h) => ({
    label: h.name + (h.description ? ` (${h.description})` : ''),
    value: h._id
  }));

  const isRatio = localRequirement.mode === AggregationMode.RATIO;

  const footer = (
    <>
      <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
      <Button label="Save Requirement" icon="pi pi-check" onClick={save} disabled={loadingOptions} />
    </>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: '680px' }}
        header={localRequirement._id ? 'Edit Member Requirement' : 'Create Member Requirement'}
        modal
        className="p-fluid"
        footer={footer}
        onHide={hide}
      >
        {loadingOptions ? (
          <div className="flex flex-column align-items-center justify-content-center p-5">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
            <span className="mt-2 text-secondary">Loading profiles & history rules...</span>
          </div>
        ) : (
          <>
            {/* Name & Description */}
            <div className="field">
              <label htmlFor="name" className="font-semibold">
                Requirement Name <span className="text-red-500">*</span>
              </label>
              <InputText
                id="name"
                value={localRequirement.name || ''}
                onChange={(e) => setLocalRequirement({ ...localRequirement, name: e.target.value })}
                className={classNames({ 'p-invalid': submitted && !localRequirement.name })}
                placeholder="e.g. Minimum 2 PhD Members or 30% Women Researchers"
              />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <InputTextarea
                id="description"
                rows={2}
                value={localRequirement.description || ''}
                onChange={(e) => setLocalRequirement({ ...localRequirement, description: e.target.value })}
                placeholder="Specify the intent of this team member constraint..."
              />
            </div>

            {/* Reference Filter Selectors */}
            <div className="formgrid grid mt-3">
              <div className="field col-6">
                <label htmlFor="profile">Demographic Eligibility Filter</label>
                <Dropdown
                  id="profile"
                  value={localRequirement.profile}
                  options={profileOptions}
                  onChange={(e) => setLocalRequirement({ ...localRequirement, profile: e.value })}
                  placeholder="Select Profile (Optional)"
                  showClear
                  filter
                />
              </div>

              <div className="field col-6">
                <label htmlFor="historyRule">History Performance Filter</label>
                <Dropdown
                  id="historyRule"
                  value={localRequirement.historyRule}
                  options={historyOptions}
                  onChange={(e) => setLocalRequirement({ ...localRequirement, historyRule: e.value })}
                  placeholder="Select History Rule (Optional)"
                  showClear
                  filter
                />
              </div>
            </div>

            {/* Aggregation Mode & Threshold Config */}
            <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
              <div className="font-semibold text-900 mb-2">Aggregation Boundary Configuration</div>

              <div className="field">
                <label htmlFor="mode" className="font-medium">
                  Aggregation Mode <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="mode"
                  value={localRequirement.mode}
                  options={modeOptions}
                  onChange={(e) => setLocalRequirement({ ...localRequirement, mode: e.value as AggregationMode })}
                  placeholder="Select Mode"
                  className={classNames({ 'p-invalid': submitted && !localRequirement.mode })}
                />
                <small className="text-secondary block mt-1">
                  {isRatio
                    ? 'RATIO evaluates the proportion of team members matching criteria (0.00 to 1.00).'
                    : 'COUNT evaluates the exact number of matching team members.'}
                </small>
              </div>

              <div className="formgrid grid mt-3">
                <div className="field col-6">
                  <label className="font-medium">Min Threshold</label>
                  <InputNumber
                    value={localRequirement.threshold?.min}
                    onValueChange={(e) =>
                      setLocalRequirement({
                        ...localRequirement,
                        threshold: {
                          min: e.value ?? 0,
                          max: localRequirement.threshold?.max ?? Infinity
                        }
                      })
                    }
                    min={0}
                    max={isRatio ? 1 : undefined}
                    maxFractionDigits={isRatio ? 2 : 0}
                    placeholder={isRatio ? 'e.g. 0.30' : 'e.g. 2'}
                  />
                </div>

                <div className="field col-6">
                  <label className="font-medium">Max Threshold</label>
                  <InputNumber
                    value={
                      localRequirement.threshold?.max === Infinity
                        ? null
                        : localRequirement.threshold?.max
                    }
                    onValueChange={(e) =>
                      setLocalRequirement({
                        ...localRequirement,
                        threshold: {
                          min: localRequirement.threshold?.min ?? 0,
                          max: e.value ?? Infinity
                        }
                      })
                    }
                    min={0}
                    max={isRatio ? 1 : undefined}
                    maxFractionDigits={isRatio ? 2 : 0}
                    placeholder="Infinity (No Ceiling)"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
};

export default SaveRequirement;