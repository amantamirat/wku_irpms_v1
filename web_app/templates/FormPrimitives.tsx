'use client';

import { ReactNode, useEffect, useId, useState } from 'react';

import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';


const STAT_COLORS = {
    green: { base: 'var(--green-500)', text: 'var(--green-600)' },
    blue: { base: 'var(--blue-500)', text: 'var(--blue-600)' }
} as const;

export const StatCard = ({
    icon,
    label,
    color,
    required,
    children
}: {
    icon: string;
    label: string;
    color: 'green' | 'blue';
    required?: boolean;
    children: ReactNode;
}) => {
    const { base, text } = STAT_COLORS[color];

    return (
        <div
            className="p-3 border-round-lg border-1 h-full"
            style={{
                background: `color-mix(in srgb, ${base} 12%, transparent)`,
                borderColor: `color-mix(in srgb, ${base} 35%, transparent)`
            }}
        >
            <div className="flex align-items-center gap-2 mb-3">
                <i className={classNames('pi', icon)} style={{ color: base }} />
                <span
                    className="text-sm font-semibold uppercase"
                    style={{ color: text }}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </span>
            </div>
            {children}
        </div>
    );
};


export const StatTile = ({
    icon,
    label,
    color,
    children
}: {
    icon: string;
    label: string;
    color: string;
    children: ReactNode;
}) => (
    <div className="surface-card border-1 surface-border border-round-xl p-3 h-full flex align-items-center gap-3">
        <div
            className={classNames(
                'flex align-items-center justify-content-center border-round-lg flex-shrink-0',
                `bg-${color}-50 text-${color}-600`
            )}
            style={{ width: '2.75rem', height: '2.75rem' }}
        >
            <i className={classNames('pi text-xl', icon)} />
        </div>
        <div className="min-w-0">
            <span className="block text-500 text-xs font-bold uppercase mb-1">{label}</span>
            <div className="text-lg font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                {children}
            </div>
        </div>
    </div>
);



export const SectionCard = ({
    step,
    icon,
    title,
    description,
    children,
    collapsible = true,
    defaultCollapsed = false,
    expandWhen = false
}: {
    step?: number;
    icon: string;
    title: string;
    description: string;
    children: ReactNode;
    /** Header becomes a clickable accordion toggle. */
    collapsible?: boolean;
    /** Start collapsed. */
    defaultCollapsed?: boolean;
    /** When this becomes true the section opens (e.g. it contains a validation error). */
    expandWhen?: boolean;
}) => {
    const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed);
    const contentId = useId();

    useEffect(() => {
        if (expandWhen) setCollapsed(false);
    }, [expandWhen]);

    const isCollapsed = collapsible && collapsed;

    const header = (
        <>
            <div
                className="flex align-items-center justify-content-center bg-primary text-white border-round-lg flex-shrink-0 relative"
                style={{ width: '2.75rem', height: '2.75rem' }}
            >
                <i className={classNames('pi text-xl', icon)} />

                {step != null && (
                    <span
                        className="absolute flex align-items-center justify-content-center surface-card text-primary font-bold border-circle border-1 border-primary"
                        style={{
                            width: '1.2rem',
                            height: '1.2rem',
                            fontSize: '0.65rem',
                            top: '-0.4rem',
                            right: '-0.4rem'
                        }}
                    >
                        {step}
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1 text-left">
                <h3 className="text-lg font-semibold m-0 text-color">{title}</h3>
                <p className="text-sm text-color-secondary m-0 mt-1">
                    {description}
                </p>
            </div>

            {collapsible && (
                <i
                    className="pi pi-chevron-down text-color-secondary flex-shrink-0"
                    style={{
                        transitionProperty: 'transform',
                        transitionDuration: '0.25s',
                        transitionTimingFunction: 'ease',
                        transform: isCollapsed
                            ? 'rotate(0deg)'
                            : 'rotate(180deg)'
                    }}
                />
            )}
        </>
    );

    const headerStyle = {
        // Theme-aware fade: primary tint -> card surface (works in light and dark)
        background:
            'linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 16%, var(--surface-card)) 0%, var(--surface-card) 100%)'
    };

    const headerClass = classNames(
        'flex align-items-center gap-3 px-4 py-3 w-full surface-border',
        { 'border-bottom-1': !isCollapsed }
    );

    return (
        <section className="surface-card border-1 surface-border border-round-xl shadow-1 overflow-hidden">
            {collapsible ? (
                <button
                    type="button"
                    className={classNames(headerClass, 'border-none cursor-pointer')}
                    style={{
                        ...headerStyle,
                        font: 'inherit',
                        color: 'inherit'
                    }}
                    aria-expanded={!isCollapsed}
                    aria-controls={contentId}
                    onClick={() => setCollapsed((prev) => !prev)}
                >
                    {header}
                </button>
            ) : (
                <div className={headerClass} style={headerStyle}>
                    {header}
                </div>
            )}

            {/* Animated collapse; children stay mounted so form state is preserved */}
            <div
                id={contentId}
                style={{
                    display: 'grid',
                    gridTemplateRows: isCollapsed ? '0fr' : '1fr',
                    visibility: isCollapsed ? 'hidden' : 'visible',
                    transitionProperty: 'grid-template-rows, visibility',
                    transitionDuration: '0.25s, 0s',
                    transitionTimingFunction: 'ease, linear',
                    // Visibility flips only after the closing animation finishes
                    transitionDelay: isCollapsed ? '0s, 0.25s' : '0s, 0s'
                }}
            >
                <div
                    style={{
                        minHeight: 0,
                        overflow: isCollapsed ? 'hidden' : 'visible'
                    }}
                >
                    <div className="p-4">{children}</div>
                </div>
            </div>
        </section>
    );
};


export const LockedField = ({ id, value }: { id: string; value: string }) => (
    <span className="p-input-icon-right w-full">
        <i className="pi pi-lock text-500" />
        <InputText id={id} value={value} disabled />
    </span>
);

export const FieldLabel = ({
    htmlFor,
    required,
    children
}: {
    htmlFor: string;
    required?: boolean;
    children: ReactNode;
}) => (
    <label htmlFor={htmlFor} className="font-medium text-900 mb-2 block">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

export const FieldError = ({
    show,
    children
}: {
    show: boolean;
    children: ReactNode;
}) =>
    show ? (
        <small className="p-error flex align-items-center gap-1 mt-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {children}
        </small>
    ) : null;


/* ------------------------------------------------------------------ */
/* Hints                                                               */
/* ------------------------------------------------------------------ */

/** Small neutral helper text with an icon, shown under a field. */
export const FieldHint = ({
    children,
    icon = 'pi-info-circle',
    className
}: {
    children: ReactNode;
    icon?: string;
    className?: string;
}) => (
    <small
        className={classNames(
            'text-color-secondary flex align-items-center gap-1 mt-2',
            className
        )}
    >
        <i className={classNames('pi text-xs', icon)} />
        {children}
    </small>
);