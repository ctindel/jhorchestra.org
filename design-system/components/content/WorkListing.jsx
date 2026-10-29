import React from 'react';

export function WorkListing({ composer, work, tag, number, tone = 'light', size = 'md', style, ...rest }) {
  const dark = tone === 'dark';
  const sizes = { sm: [15, 13], md: [19, 15], lg: [22, 17] }[size];
  return (
    <div style={{ display: number ? 'grid' : 'block',
                  gridTemplateColumns: number ? '40px 1fr' : undefined, gap: '14px', ...style }} {...rest}>
      {number ? (
        <span style={{ fontFamily: 'var(--jho-font-display)', fontStyle: 'italic', fontWeight: 500,
                       fontSize: '22px', color: 'var(--jho-tandoor)', lineHeight: 1 }}>{number}</span>
      ) : null}
      <div>
        <div style={{ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: sizes[0] + 'px',
                      letterSpacing: '-0.01em', lineHeight: 1.15,
                      color: dark ? 'var(--jho-paper)' : 'var(--jho-ink)' }}>{composer}</div>
        <div style={{ fontFamily: 'var(--jho-font-display)', fontStyle: 'italic', fontWeight: 400,
                      fontSize: sizes[1] + 'px', lineHeight: 1.25, marginTop: '2px',
                      display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px',
                      color: dark ? 'rgba(250,246,238,0.75)' : 'var(--jho-muted)' }}>
          <span>{work}</span>
          {tag ? (
            <span style={{ fontFamily: 'var(--jho-font-text)', fontStyle: 'normal',
                           fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.22em',
                           color: 'var(--jho-tandoor)', fontWeight: 700, background: 'var(--jho-tint-tandoor)',
                           padding: '3px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{tag}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
