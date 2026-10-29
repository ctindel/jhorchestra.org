import React from 'react';

const COLORS = ['tandoor','saffron','cilantro','subway','jacaranda','hibiscus','roosevelt'];

const GEOMETRY = {
  rule: { h: 3,  g: 6, radius: '2px' },                       /* under a wordmark */
  bar:  { h: 4,  g: 3, radius: '0' },                         /* poster + IG masthead stripe */
  grid: { h: 40, g: 4, radius: 'var(--jho-radius-sm)' }       /* accent block */
};

export function MosaicRule({ variant = 'rule', height, gap, style, ...rest }) {
  const geo = GEOMETRY[variant] || GEOMETRY.rule;
  const h = height ?? geo.h;
  const g = gap ?? geo.g;
  return (
    <div style={{ display: 'flex', gap: g + 'px', height: h + 'px',
                  borderRadius: geo.radius, overflow: 'hidden', ...style }} aria-hidden="true" {...rest}>
      {COLORS.map(c => <i key={c} style={{ flex: 1, display: 'block', background: 'var(--jho-' + c + ')' }} />)}
    </div>
  );
}
