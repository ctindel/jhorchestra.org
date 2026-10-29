import React from 'react';

const tones = {
  tandoor: 'var(--jho-tandoor)',
  saffron: 'var(--jho-saffron)',
  subway:  'var(--jho-subway)',
  muted:   'var(--jho-muted)',
  ink:     'var(--jho-ink)',
  paper:   'rgba(250,246,238,0.6)'
};

export function Eyebrow({ tone = 'tandoor', size = 'md', as: Tag = 'div', children, style, ...rest }) {
  const sizes = { sm: '10px', md: '11px', lg: '13px' };
  return (
    <Tag style={{ fontFamily: 'var(--jho-font-text)', fontWeight: 600, fontSize: sizes[size],
                  textTransform: 'uppercase', letterSpacing: 'var(--jho-ls-eyebrow)',
                  color: tones[tone], lineHeight: 1.4, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
