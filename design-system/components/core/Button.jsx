import React from 'react';

const base = {
  fontFamily: "var(--jho-font-text)", fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.18em', borderRadius: 'var(--jho-radius-pill)', border: '1.5px solid transparent',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
  textDecoration: 'none', lineHeight: 1, whiteSpace: 'nowrap',
  transition: 'background var(--jho-dur-base) var(--jho-ease), color var(--jho-dur-base) var(--jho-ease), opacity var(--jho-dur-base) var(--jho-ease)'
};

const sizes = {
  sm: { fontSize: '11px', padding: '9px 16px' },
  md: { fontSize: '12px', padding: '12px 24px' },
  lg: { fontSize: '13px', padding: '14px 30px' }
};

const variants = {
  primary:   { background: 'var(--jho-ink)',     color: 'var(--jho-paper)' },
  donate:    { background: 'var(--jho-tandoor)', color: 'var(--jho-paper)' },
  secondary: { background: 'transparent', color: 'var(--jho-ink)', borderColor: 'var(--jho-ink)' },
  ghostDark: { background: 'transparent', color: 'var(--jho-paper)', borderColor: 'var(--jho-border-invert)' }
};

export function Button({ variant = 'primary', size = 'md', href, arrow = false, disabled = false, children, style, ...rest }) {
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      disabled={!href && disabled ? true : undefined}
      style={{ ...base, ...sizes[size], ...variants[variant], opacity: disabled ? 0.45 : 1,
               pointerEvents: disabled ? 'none' : undefined, ...style }}
      {...rest}
    >
      {children}{arrow ? <span aria-hidden="true">→</span> : null}
    </Tag>
  );
}
