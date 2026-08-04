'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { EligibilityProfile } from '../models/profile.model';
import { ProfileApi } from '../api/profile.api';
import { genderOptions, Gender, Accessibility } from '@/app/(main)/users/models/user.model';
import { AcademicLevel } from '@/app/(main)/organizations/models/organization.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const academicLevelOptions = Object.values(AcademicLevel).map((level) => ({
  label: level,
  value: level
}));

const accessibilityOptions = Object.values(Accessibility).map((acc) => ({
  label: acc,
  value: acc
}));

const SaveProfile: React.FC<EntitySaveDialogProps<EligibilityProfile>> = ({
  visible,
  item,
  onComplete,
  onHide
}) => {
  const toast = useRef<Toast>(null);
  const [localProfile, setLocalProfile] = useState<Partial<EligibilityProfile>>({ ...item });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLocalProfile({ ...item });
  }, [item]);

  const clearForm = () => {
    setSubmitted(false);
    setLocalProfile({ ...item });
  };

  const validate = (): { valid: boolean; message?: string } => {
    if (!localProfile.name || localProfile.name.trim().length === 0) {
      return { valid: false, message: 'Profile Name is required.' };
    }

    if (localProfile.age) {
      const { min, max } = localProfile.age;
      if (min < 0 || max < 0) return { valid: false, message: 'Age bounds cannot be negative.' };
      if (min > max) return { valid: false, message: 'Min Age cannot be greater than Max Age.' };
    }

    if (localProfile.experienceYears) {
      const { min, max } = localProfile.experienceYears;
      if (min < 0 || max < 0) return { valid: false, message: 'Experience years cannot be negative.' };
      if (min > max) return { valid: false, message: 'Min Experience cannot be greater than Max Experience.' };
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
      const saved = localProfile._id
        ? await ProfileApi.update(localProfile)
        : await ProfileApi.create(localProfile);

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Eligibility profile saved successfully',
        life: 2000
      });

      if (onComplete) setTimeout(() => onComplete(saved), 800);
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to save eligibility profile',
        life: 2500
      });
    }
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  const footer = (
    <>
      <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
      <Button label="Save Profile" icon="pi pi-check" onClick={save} />
    </>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: '650px' }}
        header={localProfile._id ? 'Edit Eligibility Profile' : 'Create Eligibility Profile'}
        modal
        className="p-fluid"
        footer={footer}
        onHide={hide}
      >
        {/* Name & Description */}
        <div className="field">
          <label htmlFor="name" className="font-semibold">
            Profile Name <span className="text-red-500">*</span>
          </label>
          <InputText
            id="name"
            value={localProfile.name || ''}
            onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
            className={classNames({ 'p-invalid': submitted && !localProfile.name })}
            placeholder="e.g., Senior Academic / Female Researcher Criteria"
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <InputTextarea
            id="description"
            rows={2}
            value={localProfile.description || ''}
            onChange={(e) => setLocalProfile({ ...localProfile, description: e.target.value })}
            placeholder="Purpose or demographic scope for this profile..."
          />
        </div>

        {/* Gender Selection */}
        <div className="field">
          <label htmlFor="gender">Gender Target</label>
          <Dropdown
            id="gender"
            value={localProfile.gender}
            options={genderOptions}
            onChange={(e) => setLocalProfile({ ...localProfile, gender: e.value as Gender })}
            placeholder="Select Specific Gender Target (Optional)"
            showClear
          />
        </div>

        {/* Age Bounds Range */}
        <div className="formgrid grid mt-2">
          <div className="field col-6">
            <label className="font-medium">Min Age</label>
            <InputNumber
              value={localProfile.age?.min}
              onValueChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  age: {
                    min: e.value ?? 0,
                    max: localProfile.age?.max ?? 120
                  }
                })
              }
              min={0}
              placeholder="e.g. 25"
            />
          </div>
          <div className="field col-6">
            <label className="font-medium">Max Age</label>
            <InputNumber
              value={localProfile.age?.max}
              onValueChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  age: {
                    min: localProfile.age?.min ?? 0,
                    max: e.value ?? 120
                  }
                })
              }
              min={0}
              placeholder="e.g. 65"
            />
          </div>
        </div>

        {/* Experience Years Range */}
        <div className="formgrid grid mt-2">
          <div className="field col-6">
            <label className="font-medium">Min Experience (Years)</label>
            <InputNumber
              value={localProfile.experienceYears?.min}
              onValueChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  experienceYears: {
                    min: e.value ?? 0,
                    max: localProfile.experienceYears?.max ?? 50
                  }
                })
              }
              min={0}
              placeholder="e.g. 3"
            />
          </div>
          <div className="field col-6">
            <label className="font-medium">Max Experience (Years)</label>
            <InputNumber
              value={localProfile.experienceYears?.max}
              onValueChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  experienceYears: {
                    min: localProfile.experienceYears?.min ?? 0,
                    max: e.value ?? 50
                  }
                })
              }
              min={0}
              placeholder="e.g. 30"
            />
          </div>
        </div>

        {/* Academic Level */}
        <div className="field mt-3">
          <label className="font-semibold">Academic Levels Required</label>
          <MultiSelect
            value={localProfile.academicLevels || []}
            options={academicLevelOptions}
            onChange={(e) => setLocalProfile({ ...localProfile, academicLevels: e.value })}
            placeholder="Select Academic Levels"
            display="chip"
            filter
          />
        </div>

        {/* Accessibility Features */}
        <div className="field mt-3">
          <label className="font-semibold">Accessibility Target Requirements</label>
          <MultiSelect
            value={localProfile.accessibility || []}
            options={accessibilityOptions}
            onChange={(e) => setLocalProfile({ ...localProfile, accessibility: e.value })}
            placeholder="Select Accessibility Criteria"
            display="chip"
            filter
          />
        </div>
      </Dialog>
    </>
  );
};

export default SaveProfile;