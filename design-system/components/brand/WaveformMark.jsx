import React from 'react';

const BARS = [
  ['saffron',60],['saffron',80],['saffron',45],['saffron',90],['saffron',35],
  ['cilantro',70],['cilantro',95],['cilantro',50],['cilantro',75],
  ['subway',40],['subway',85],['subway',60],['subway',30]
];

export function WaveformMark({ height = 42, showWord = true, color, style, ...rest }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px', ...style }} {...rest}>
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: height + 'px', width: '100%' }}>
        {BARS.map(([c, h], i) => (
          <span key={i} style={{ flex: 1, minWidth: 0, borderRadius: '2px', display: 'block',
                                 height: h + '%', background: color ? color : 'var(--jho-' + c + ')' }} />
        ))}
      </span>
      {showWord ? (
        <span style={{ fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: '22px',
                       lineHeight: 1, letterSpacing: '-0.01em', color: 'inherit' }}>
          Jackson Heights Orchestra
        </span>
      ) : null}
    </span>
  );
}
