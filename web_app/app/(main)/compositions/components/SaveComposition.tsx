'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { classNames } from 'primereact/utils';

import {
  Composition,
  validateComposition,
  sanitizeComposition
} from '../models/composition.model';
import { CompositionApi } from '../api/composition.api';
import { ProfileApi } from '../api/profile.api';
import { HistoryApi } from '../api/history.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { MemberRequirementApi } from '../api/requirement.api';
import { HistoryRule } from '../models/history.model';
import { EligibilityProfile } from '../models/profile.model';
import { MemberRequirement } from '../models/requirement.model';

const SaveComposition: React.FC<EntitySaveDialogProps<Composition>> = ({
  visible,
  item,
  onComplete,
  onHide
}) => {
  const toast = useRef<Toast>(null);
  
  const [localComposition, setLocalComposition] = useState<Partial<Composition>>({ ...item });
  const [submitted, setSubmitted] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Referenced lookup options
  const [profiles, setProfiles] = useState<EligibilityProfile[]>([]);
  const [historyRules, setHistoryRules] = useState<HistoryRule[]>([]);
  const [memberRequirements, setMemberRequirements] = useState<MemberRequirement[]>([]);

  // 🔹 Fetch external profile, history, and requirement rules on mount / dialog open
  useEffect(() => {
    if (!visible) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [profilesRes, historyRes, requirementsRes] = await Promise.all([
          ProfileApi.getAll(),
          HistoryApi.getAll(),
          MemberRequirementApi.getAll()
        ]);

        setProfiles(profilesRes || []);
        setHistoryRules(historyRes || []);
        setMemberRequirements(requirementsRes || []);
      } catch (err: any) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error Loading Options',
          detail: err.message || 'Failed to fetch reference rules.',
          life: 3000
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [visible]);

  // 🔹 Sync local state when incoming item changes (map populated objects down to string IDs)
  useEffect(() => {
    setLocalComposition({
      ...item,
      leadProfileRule: typeof item.leadProfileRule === 'object' ? item.leadProfileRule?._id : item.leadProfileRule,
      leadHistoryRule: typeof item.leadHistoryRule === 'object' ? item.leadHistoryRule?._id : item.leadHistoryRule,
      memberRequirements: Array.isArray(item.memberRequirements)
        ? item.memberRequirements.map((mr) => (typeof mr === 'object' ? mr._id : mr)).filter(Boolean) as string[]
        : []
    });
  }, [item]);

  const clearForm = () => {
    setSubmitted(false);
    setLocalComposition({ ...item });
  };

  const save = async () => {
    setSubmitted(true);
    try {
      const validation = validateComposition(localComposition as Composition);
      if (!validation.valid) throw new Error(validation.message);

      const payload = sanitizeComposition(localComposition);

      const saved = localComposition._id
        ? await CompositionApi.update(payload)
        : await CompositionApi.create(payload);

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Composition saved successfully',
        life: 2000
      });

      if (onComplete) setTimeout(() => onComplete(saved), 800);
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to save composition',
        life: 2500
      });
    }
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  // 🔹 Form dropdown options mapping
  const profileOptions = profiles.map((p) => ({
    label: p.name + (p.description ? ` (${p.description})` : ''),
    value: p._id
  }));

  const historyOptions = historyRules.map((h) => ({
    label: h.name + (h.description ? ` (${h.description})` : ''),
    value: h._id
  }));

  const requirementOptions = memberRequirements.map((r) => ({
    label: `${r.name} [Mode: ${r.mode}]`,
    value: r._id
  }));

  const footer = (
    <>
      <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
      <Button label="Save Composition" icon="pi pi-check" onClick={save} disabled={loadingOptions} />
    </>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: '700px' }}
        header={localComposition._id ? 'Edit Team Composition Rule' : 'Create Team Composition Rule'}
        modal
        className="p-fluid"
        footer={footer}
        onHide={hide}
      >
        {loadingOptions ? (
          <div className="flex flex-column align-items-center justify-content-center p-5">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
            <span className="mt-2 text-secondary">Loading criteria options...</span>
          </div>
        ) : (
          <Accordion multiple activeIndex={[0, 1, 2]}>
            {/* 🔹 Basic Information */}
            <AccordionTab header="Basic Information">
              <div className="field">
                <label htmlFor="name" className="font-semibold">
                  Composition Name <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="name"
                  value={localComposition.name || ''}
                  onChange={(e) => setLocalComposition({ ...localComposition, name: e.target.value })}
                  className={classNames({ 'p-invalid': submitted && !localComposition.name })}
                  placeholder="e.g. Standard Multidisciplinary Research Team"
                />
              </div>

              <div className="field">
                <label htmlFor="description">Description</label>
                <InputTextarea
                  id="description"
                  rows={3}
                  value={localComposition.description || ''}
                  onChange={(e) => setLocalComposition({ ...localComposition, description: e.target.value })}
                  placeholder="Summarize the purpose or bounds of this team structure..."
                />
              </div>
            </AccordionTab>

            {/* 🔹 Team Lead Rules */}
            <AccordionTab header="Team Lead Rules (PI Constraints)">
              <div className="field mb-3">
                <label htmlFor="leadProfileRule">Lead Eligibility Profile</label>
                <Dropdown
                  id="leadProfileRule"
                  value={localComposition.leadProfileRule}
                  options={profileOptions}
                  onChange={(e) => setLocalComposition({ ...localComposition, leadProfileRule: e.value })}
                  placeholder="Select Lead Eligibility Profile"
                  showClear
                  filter
                />
              </div>

              <div className="field">
                <label htmlFor="leadHistoryRule">Lead History / Performance Rule</label>
                <Dropdown
                  id="leadHistoryRule"
                  value={localComposition.leadHistoryRule}
                  options={historyOptions}
                  onChange={(e) => setLocalComposition({ ...localComposition, leadHistoryRule: e.value })}
                  placeholder="Select Lead History Rule"
                  showClear
                  filter
                />
              </div>
            </AccordionTab>

            {/* 🔹 Member Requirements */}
            <AccordionTab header="Team Member Requirements & Aggregations">
              <div className="field">
                <label htmlFor="memberRequirements">Member Requirements</label>
                <MultiSelect
                  id="memberRequirements"
                  value={(localComposition.memberRequirements as string[]) || []}
                  options={requirementOptions}
                  onChange={(e) => setLocalComposition({ ...localComposition, memberRequirements: e.value })}
                  placeholder="Select Member Requirement Rules"
                  display="chip"
                  filter
                />
              </div>
            </AccordionTab>
          </Accordion>
        )}
      </Dialog>
    </>
  );
};

export default SaveComposition;