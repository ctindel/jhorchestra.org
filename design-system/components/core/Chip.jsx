import React from 'react';

const HUES = ['tandoor','saffron','cilantro','subway','jacaranda','hibiscus','roosevelt'];

export function Chip({ tone = 'subway', glyph, outline = false, muted = false, children, style, ...rest }) {
  if (muted) {
    return (
      <span style={{ fontFamily: 'var(--jho-font-text)', fontSize: '10px', fontStyle: 'italic',
                     color: 'var(--jho-muted)', letterSpacing: '0.02em', ...style }} {...rest}>{children}</span>
    );
  }
  const color = HUES.includes(tone) ? 'var(--jho-' + tone + ')' : tone;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
                   fontFamily: outline ? 'var(--jho-font-display)' : 'var(--jho-font-text)',
                   fontStyle: outline ? 'italic' : 'normal',
                   fontSize: outline ? '13px' : '10px',
                   fontWeight: outline ? 400 : 700,
                   letterSpacing: outline ? 0 : '0.08em',
                   textTransform: outline ? 'none' : 'uppercase',
                   padding: outline ? '4px 10px' : '6px 10px',
                   borderRadius: outline ? 'var(--jho-radius-pill)' : 'var(--jho-radius-xs)',
                   background: outline ? 'transparent' : 'var(--jho-tint-' + tone + ')',
                   border: outline ? '1px solid var(--jho-border-invert)' : 'none',
                   color: outline ? 'inherit' : color, ...style }} {...rest}>
      {glyph ? <span aria-hidden="true">{glyph}</span> : null}{children}
    </span>
  );
}
