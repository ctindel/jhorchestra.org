import React from 'react';

export function StatTile({ value, label, note, color = 'tandoor', style, ...rest }) {
  return (
    <div style={{ background: 'var(--jho-' + color + ')', color: 'var(--jho-paper)',
                  borderRadius: 'var(--jho-radius-lg)', padding: '28px 26px',
                  display: 'flex', flexDirection: 'column', gap: '14px', ...style }} {...rest}>
      <div style={{ fontFamily: 'var(--jho-font-display)', fontWeight: 900, fontSize: '54px',
                    lineHeight: 0.9, letterSpacing: '-0.03em' }}>{value}</div>
      <div>
        <h4 style={{ margin: 0, fontFamily: 'var(--jho-font-text)', fontWeight: 700, fontSize: '16px',
                     letterSpacing: '-0.01em' }}>{label}</h4>
        {note ? (
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--jho-font-text)', fontSize: '13px',
                      lineHeight: 1.45, color: 'rgba(250,246,238,0.8)' }}>{note}</p>
        ) : null}
      </div>
    </div>
  );
}
