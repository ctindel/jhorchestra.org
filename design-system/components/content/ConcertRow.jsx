import React from 'react';
import { Chip } from '../core/Chip.jsx';

export function ConcertRow({ day, month, year, title, venue, works, media = [], style, ...rest }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: '24px',
                  padding: '18px 22px', background: 'var(--jho-white)',
                  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--jho-radius-md)',
                  alignItems: 'center', ...style }} {...rest}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontFamily: 'var(--jho-font-display)', fontWeight: 900, fontSize: '36px',
                       lineHeight: 0.95, letterSpacing: '-0.02em', color: 'var(--jho-ink)' }}>{day}</span>
        <span style={{ fontFamily: 'var(--jho-font-text)', fontSize: '10px', fontWeight: 700,
                       letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--jho-tandoor)' }}>{month}</span>
        <span style={{ fontFamily: 'var(--jho-font-text)', fontSize: '10px', letterSpacing: '0.18em',
                       color: 'var(--jho-muted)', fontWeight: 600 }}>{year}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <h4 style={{ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: '18px',
                     lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0, color: 'var(--jho-ink)' }}>{title}</h4>
        <p style={{ margin: 0, fontFamily: 'var(--jho-font-text)', fontSize: '12px',
                    color: 'var(--jho-muted)', lineHeight: 1.45 }}>{venue}</p>
        {works ? (
          <div style={{ fontFamily: 'var(--jho-font-display)', fontStyle: 'italic', fontSize: '12px',
                        color: 'var(--jho-ink)', lineHeight: 1.4, marginTop: '2px' }}>{works}</div>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '320px' }}>
        {media.length
          ? media.map((m, i) => <Chip key={i} tone={m.tone} glyph={m.glyph} muted={m.muted}>{m.label}</Chip>)
          : <Chip muted>no archive yet</Chip>}
      </div>
    </div>
  );
}
