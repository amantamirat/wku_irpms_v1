'use client';

import { ReactNode, useMemo } from 'react';
import { Skeleton } from 'primereact/skeleton';

import { IResearcherReport } from '../models/report.types';

interface Props {
  data: IResearcherReport | null | undefined;
  loading?: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const num = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0;

const pct = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const tint = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

const PRIMARY = 'var(--primary-color)';

const COLORS = {
  active: '#22c55e',
  male: '#3b82f6',
  female: '#ec4899',
  unknown: '#cbd5e1',
  lead: '#8b5cf6',
  collaborating: '#06b6d4',
  withProjects: '#f59e0b',
  withoutProjects: '#cbd5e1',
};

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

interface Segment {
  label: string;
  value: number;
  color: string;
}

/** One bar split into proportional segments, with a legend. */
function SegmentBar({
  segments,
  onDark = false,
  height = '0.75rem',
}: {
  segments: Segment[];
  onDark?: boolean;
  height?: string;
}) {
  const sum = segments.reduce((s, x) => s + x.value, 0);
  const label = segments
    .map((s) => `${s.label}: ${s.value} (${pct(s.value, sum)}%)`)
    .join(', ');

  return (
    <div>
      <div
        role="img"
        aria-label={label}
        className="flex overflow-hidden"
        style={{
          height,
          borderRadius: height,
          gap: '2px',
          background: onDark ? 'rgba(255,255,255,0.18)' : 'var(--surface-200)',
        }}
      >
        {sum > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                title={`${s.label}: ${s.value}`}
                style={{
                  width: `${(s.value / sum) * 100}%`,
                  background: s.color,
                  transition: 'width 0.4s ease',
                }}
              />
            ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-3">
        {segments.map((s) => (
          <span
            key={s.label}
            className="flex align-items-center gap-2 text-sm"
            style={{ opacity: onDark ? 0.92 : 1 }}
          >
            <span
              className="border-circle inline-block"
              style={{ width: '0.6rem', height: '0.6rem', background: s.color }}
            />
            <span className={onDark ? '' : 'text-color-secondary'}>{s.label}</span>
            <span className={onDark ? 'font-semibold' : 'font-semibold text-900'}>
              {s.value.toLocaleString()}
              <span className="font-normal ml-1" style={{ opacity: 0.7 }}>
                {pct(s.value, sum)}%
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A single filled bar, value relative to a max. */
function FillBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div
      className="overflow-hidden"
      style={{ height: '0.55rem', borderRadius: '0.55rem', background: 'var(--surface-200)' }}
    >
      <div
        style={{
          width: `${max > 0 ? (value / max) * 100 : 0}%`,
          height: '100%',
          background: color,
          borderRadius: '0.55rem',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card border-1 surface-border border-round-2xl p-4 h-full">
      <h4 className="m-0 text-900 font-semibold text-lg">{title}</h4>
      {hint ? (
        <p className="m-0 mt-1 mb-4 text-sm text-color-secondary">{hint}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

function Empty({ text = 'No data available' }: { text?: string }) {
  return (
    <div className="flex flex-column align-items-center justify-content-center py-5 text-500">
      <i className="pi pi-inbox text-3xl mb-2" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-column gap-4">
      <Skeleton height="13rem" borderRadius="20px" />
      <div className="grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="col-12 lg:col-4">
            <Skeleton height="11rem" borderRadius="16px" />
          </div>
        ))}
      </div>
      <div className="grid">
        <div className="col-12 xl:col-7">
          <Skeleton height="20rem" borderRadius="16px" />
        </div>
        <div className="col-12 xl:col-5">
          <Skeleton height="20rem" borderRadius="16px" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

export function ResearcherWidget({ data, loading }: Props) {
  // Accept a wrapped response ({ data: {...} }) as well as a bare report
  const report = useMemo<IResearcherReport | null>(() => {
    const raw: any = data;
    const candidate =
      raw && typeof raw.totalResearchers !== 'number' && raw.data ? raw.data : raw;

    if (!candidate || typeof candidate.totalResearchers !== 'number') return null;
    return candidate as IResearcherReport;
  }, [data]);

  const colleges = useMemo(
    () =>
      [...(report?.byCollege ?? [])]
        .map((c) => ({ name: c.college || 'Unknown', count: num(c.count) }))
        .sort((a, b) => b.count - a.count),
    [report]
  );

  const specializations = useMemo(
    () =>
      [...(report?.bySpecialization ?? [])]
        .map((s) => ({ name: s.specialization || 'Unknown', count: num(s.count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 24),
    [report]
  );

  if (loading) return <LoadingState />;
  if (!report) return <Empty text="No researcher report data" />;

  const total = num(report.totalResearchers);
  const active = num(report.activeResearchers);
  const inactive = num(report.inactiveResearchers);
  const withProjects = num(report.researchersWithProjects);
  const withoutProjects = num(report.researchersWithoutProjects);
  const lead = num(report.leadResearchers);
  const collaborating = num(report.collaboratingResearchers);

  const maxCollege = Math.max(...colleges.map((c) => c.count), 1);
  const maxSpec = Math.max(...specializations.map((s) => s.count), 1);

  return (
    <div className="flex flex-column gap-4">
      {/* HERO */}
      <section
        className="border-round-2xl p-4 md:p-5 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${PRIMARY} 0%, color-mix(in srgb, ${PRIMARY} 55%, #0b1020) 100%)`,
        }}
      >
        {/* soft decorative rings */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: '-5rem',
            top: '-5rem',
            width: '18rem',
            height: '18rem',
            borderRadius: '50%',
            border: '2rem solid rgba(255,255,255,0.07)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: '6rem',
            bottom: '-7rem',
            width: '13rem',
            height: '13rem',
            borderRadius: '50%',
            border: '1.5rem solid rgba(255,255,255,0.05)',
          }}
        />

        <div className="relative flex flex-column lg:flex-row lg:align-items-end justify-content-between gap-4">
          <div>
            <span className="text-sm" style={{ opacity: 0.8 }}>
              Registered researchers
            </span>
            <div className="font-bold line-height-1 mt-2" style={{ fontSize: '4rem' }}>
              {total.toLocaleString()}
            </div>
            <span className="text-sm" style={{ opacity: 0.8 }}>
              across {colleges.length} {colleges.length === 1 ? 'college' : 'colleges'}
            </span>
          </div>

          <div className="flex flex-wrap gap-5">
            {[
              { value: active.toLocaleString(), label: 'On approved or granted projects' },
              { value: withProjects.toLocaleString(), label: 'Engaged in any project' },
              {
                value: num(report.averageProjectsPerResearcher).toFixed(2),
                label: 'Projects per researcher',
              },
            ].map((s) => (
              <div key={s.label} style={{ maxWidth: '10rem' }}>
                <div className="text-3xl font-semibold">{s.value}</div>
                <div className="text-sm mt-1" style={{ opacity: 0.8 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-5">
          <SegmentBar
            onDark
            height="0.9rem"
            segments={[
              { label: 'Active', value: active, color: COLORS.active },
              { label: 'Inactive', value: inactive, color: 'rgba(255,255,255,0.45)' },
            ]}
          />
        </div>
      </section>

      {/* WHO THEY ARE */}
      <div className="grid">
        <div className="col-12 lg:col-4">
          <Block title="Gender" hint="Share of all researchers">
            <SegmentBar
              height="1.1rem"
              segments={[
                { label: 'Male', value: num(report.maleResearchers), color: COLORS.male },
                { label: 'Female', value: num(report.femaleResearchers), color: COLORS.female },
                { label: 'Unknown', value: num(report.unknownGender), color: COLORS.unknown },
              ]}
            />
          </Block>
        </div>

        <div className="col-12 lg:col-4">
          <Block title="Role in projects" hint="A researcher can be both lead and collaborator">
            <div className="flex flex-column gap-4">
              {[
                { label: 'Lead', value: lead, color: COLORS.lead },
                { label: 'Collaborating', value: collaborating, color: COLORS.collaborating },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-content-between align-items-baseline mb-2">
                    <span className="text-700 font-medium">{r.label}</span>
                    <span className="text-900 font-semibold">
                      {r.value.toLocaleString()}
                      <span className="text-color-secondary font-normal text-sm ml-2">
                        {pct(r.value, total)}%
                      </span>
                    </span>
                  </div>
                  <FillBar value={r.value} max={total} color={r.color} />
                </div>
              ))}
            </div>
          </Block>
        </div>

        <div className="col-12 lg:col-4">
          <Block title="Project engagement" hint="Verified participation in filtered projects">
            <SegmentBar
              height="1.1rem"
              segments={[
                { label: 'With projects', value: withProjects, color: COLORS.withProjects },
                {
                  label: 'Without projects',
                  value: withoutProjects,
                  color: COLORS.withoutProjects,
                },
              ]}
            />
          </Block>
        </div>
      </div>

      {/* COLLEGES + SPECIALIZATIONS */}
      <div className="grid">
        <div className="col-12 xl:col-7">
          <Block title="Researchers by college" hint="Departments grouped under their college">
            {colleges.length === 0 ? (
              <Empty />
            ) : (
              <ol
                className="list-none m-0 p-0 pr-2"
                style={{ maxHeight: '30rem', overflowY: 'auto' }}
              >
                {colleges.map((c, i) => (
                  <li key={c.name} className="flex align-items-center gap-3 py-2">
                    <span
                      className="flex-shrink-0 text-right text-sm font-medium"
                      style={{
                        width: '1.75rem',
                        color: i === 0 ? PRIMARY : 'var(--text-color-secondary)',
                      }}
                    >
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-content-between align-items-baseline gap-3 mb-2">
                        <span
                          className="font-medium text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis"
                          title={c.name}
                        >
                          {c.name}
                        </span>
                        <span className="flex-shrink-0 text-900 font-semibold">
                          {c.count.toLocaleString()}
                          <span className="text-color-secondary font-normal text-sm ml-2">
                            {pct(c.count, total)}%
                          </span>
                        </span>
                      </div>
                      <FillBar
                        value={c.count}
                        max={maxCollege}
                        color={i === 0 ? PRIMARY : tint(PRIMARY, 55)}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Block>
        </div>

        <div className="col-12 xl:col-5">
          <Block title="Specializations" hint="Larger and darker means more researchers">
            {specializations.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-wrap gap-2 align-items-center">
                {specializations.map((s) => {
                  const weight = s.count / maxSpec;
                  return (
                    <span
                      key={s.name}
                      className="inline-flex align-items-center gap-2 border-round-3xl text-900"
                      title={`${s.name}: ${s.count}`}
                      style={{
                        fontSize: `${0.85 + weight * 0.55}rem`,
                        padding: `${0.3 + weight * 0.2}rem ${0.8 + weight * 0.3}rem`,
                        background: tint(PRIMARY, 8 + Math.round(weight * 24)),
                        border: `1px solid ${tint(PRIMARY, 20 + Math.round(weight * 30))}`,
                      }}
                    >
                      {s.name}
                      <span
                        className="font-semibold"
                        style={{ color: PRIMARY, fontSize: '0.8em' }}
                      >
                        {s.count}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </Block>
        </div>
      </div>
    </div>
  );
}