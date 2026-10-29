import React from 'react';

const tones = {
  newsprint: { background: 'var(--jho-newsprint)', color: 'var(--jho-ink)',  border: 'none' },
  ink:       { background: 'var(--jho-ink)',       color: 'var(--jho-paper)', border: 'none' },
  accent:    { background: 'var(--jho-tandoor)',   color: 'var(--jho-paper)', border: 'none' },
  raised:    { background: 'var(--jho-white)',     color: 'var(--jho-ink)',  border: '1px solid rgba(0,0,0,0.08)' }
};

export function Card({ tone = 'newsprint', radius = 'lg', padding = 28, children, style, ...rest }) {
  const t = tones[tone];
  return (
    <div style={{ background: t.background, color: t.color, border: t.border,
                  borderRadius: 'var(--jho-radius-' + radius + ')',
                  padding: typeof padding === 'number' ? padding + 'px' : padding,
                  boxShadow: 'none', ...style }} {...rest}>
      {children}
    </div>
  );
}
