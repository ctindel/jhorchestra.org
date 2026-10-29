import React from 'react';

const levels = {
  hero:    { fontSize: 'var(--jho-size-hero)',    lineHeight: 'var(--jho-lh-hero)',    letterSpacing: 'var(--jho-ls-hero)',    fontWeight: 900 },
  display: { fontSize: 'var(--jho-size-display)', lineHeight: 'var(--jho-lh-display)', letterSpacing: 'var(--jho-ls-display)', fontWeight: 900 },
  h1:      { fontSize: 'var(--jho-size-h1)',      lineHeight: 'var(--jho-lh-h1)',      letterSpacing: 'var(--jho-ls-h1)',      fontWeight: 600 },
  h2:      { fontSize: 'var(--jho-size-h2)',      lineHeight: 'var(--jho-lh-h2)',      letterSpacing: 'var(--jho-ls-h2)',      fontWeight: 500 },
  h3:      { fontSize: 'var(--jho-size-h3)',      lineHeight: 'var(--jho-lh-h3)',      letterSpacing: 'var(--jho-ls-h3)',      fontWeight: 700 },
  h4:      { fontSize: 'var(--jho-size-h4)',      lineHeight: 'var(--jho-lh-h4)',      letterSpacing: 'var(--jho-ls-h4)',      fontWeight: 700 }
};

export function Headline({ level = 'h1', as, italic = false, color, children, style, ...rest }) {
  const Tag = as || (level === 'hero' || level === 'display' ? 'h1' : level === 'h4' ? 'h4' : level);
  return (
    <Tag style={{ fontFamily: 'var(--jho-font-display)', margin: 0, color: color || 'inherit',
                  fontStyle: italic ? 'italic' : 'normal',
                  ...levels[level], ...(italic ? { fontWeight: 500 } : null), ...style }} {...rest}>
      {children}
    </Tag>
  );
}
