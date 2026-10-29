import React from 'react';

/* Verbatim single-path 24px glyphs from the JHO source. This brand has no icon
   font and no CDN icon set — these four are the entire icon inventory. */
export const SOCIAL_PATHS = {
  youtube:   'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z',
  facebook:  'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12z',
  instagram: 'M12 2.2c3.2 0 3.6 0 4.8.07 1.2.06 1.9.25 2.3.42.6.23 1 .5 1.5 1s.77.9 1 1.5c.17.4.36 1.1.42 2.3.05 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.06 1.2-.25 1.9-.42 2.3-.23.6-.5 1-1 1.5s-.9.77-1.5 1c-.4.17-1.1.36-2.3.42-1.2.05-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.2-.06-1.9-.25-2.3-.42-.6-.23-1-.5-1.5-1s-.77-.9-1-1.5c-.17-.4-.36-1.1-.42-2.3-.05-1.2-.07-1.6-.07-4.8s0-3.6.07-4.8c.06-1.2.25-1.9.42-2.3.23-.6.5-1 1-1.5s.9-.77 1.5-1c.4-.17 1.1-.36 2.3-.42C8.4 2.22 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.5 0-4.7.07-1.1.05-1.7.23-2.1.4-.5.2-.9.45-1.3.85s-.65.8-.85 1.3c-.16.4-.34 1-.4 2.1C2.62 8.5 2.6 8.8 2.6 12s0 3.5.07 4.7c.06 1.1.24 1.7.4 2.1.2.5.46.9.86 1.3s.8.66 1.3.86c.4.16 1 .34 2.1.4 1.2.06 1.5.07 4.7.07s3.5 0 4.7-.07c1.1-.06 1.7-.24 2.1-.4.5-.2.9-.46 1.3-.86s.66-.8.86-1.3c.16-.4.34-1 .4-2.1.06-1.2.07-1.5.07-4.7s0-3.5-.07-4.7c-.06-1.1-.24-1.7-.4-2.1-.2-.5-.46-.9-.86-1.3s-.8-.66-1.3-.86c-.4-.16-1-.34-2.1-.4C15.5 4 15.2 4 12 4zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06zm0 8.14A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm6.3-8.36a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z',
  x:         'M18.2 2H21l-6.4 7.3L22 22h-6.1l-4.8-6.3L5.6 22H2.8l6.9-7.9L2 2h6.2l4.3 5.7L18.2 2zm-1 18h1.7L7 4H5.2l12 16z'
};

const LABELS = { youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram', x: 'Twitter / X' };

export function SocialIcons({ networks = ['youtube','facebook','instagram','x'], size = 16, tone = 'light', gap = 8, style, ...rest }) {
  const color = tone === 'dark' ? 'var(--jho-paper)' : 'var(--jho-ink)';
  return (
    <div style={{ display: 'flex', gap: gap + 'px', alignItems: 'center', ...style }} {...rest}>
      {networks.map(n => (
        <a key={n} aria-label={LABELS[n]} href="#"
           style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '24px', height: '24px', color, opacity: 0.55,
                    transition: 'opacity var(--jho-dur-base) var(--jho-ease), color var(--jho-dur-base) var(--jho-ease)' }}
           onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--jho-tandoor)'; }}
           onMouseLeave={e => { e.currentTarget.style.opacity = 0.55; e.currentTarget.style.color = color; }}>
          <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size + 'px', height: size + 'px', fill: 'currentColor' }}>
            <path d={SOCIAL_PATHS[n]} />
          </svg>
        </a>
      ))}
    </div>
  );
}
