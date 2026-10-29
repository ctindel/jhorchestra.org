import React from 'react';

export function Portrait({ src, name, role, size = 96, shape = 'square', tone = 'light', layout = 'inline', nameSize, roleSize, style, ...rest }) {
  const stacked = layout === 'stacked';
  const radius = shape === 'round' ? '50%' : 'var(--jho-radius-xs)';
  const img = src
    ? <img src={src} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    : <span style={{ display: 'block', width: '100%', height: '100%',
                     background: 'linear-gradient(135deg, var(--jho-subway) 0%, var(--jho-roosevelt) 100%)' }} />;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: stacked ? '10px' : '12px',
                   flexDirection: stacked ? 'column' : 'row', ...style }} {...rest}>
      <span style={{ width: size + 'px', height: size + 'px', borderRadius: radius,
                     overflow: 'hidden', flexShrink: 0, display: 'block' }}>{img}</span>
      {name ? (
        <span style={{ display: 'flex', flexDirection: 'column', textAlign: stacked ? 'center' : 'left' }}>
          <span style={{ fontFamily: 'var(--jho-font-display)', fontWeight: 700,
                         fontSize: (nameSize ?? (stacked ? Math.max(15, Math.round(size * 0.13))
                                                         : Math.max(15, Math.round(size * 0.16)))) + 'px',
                         lineHeight: 1.15, whiteSpace: 'nowrap',
                         color: tone === 'dark' ? 'var(--jho-paper)' : 'var(--jho-ink)' }}>{name}</span>
          {role ? (
            <span style={{ fontFamily: 'var(--jho-font-text)', fontWeight: 600,
                           fontSize: (roleSize ?? (stacked ? 10 : 9)) + 'px',
                           letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: '3px',
                           color: tone === 'dark' ? 'rgba(250,246,238,0.6)' : 'var(--jho-tandoor)' }}>{role}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
