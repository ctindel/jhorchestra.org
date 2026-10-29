import React from 'react';

const WORDS = [['J','Jackson'],['H','Heights'],['O','Orchestra']];

export function Monogram({ color = 'subway', size = 56, showWords = true, tone = 'light', style, ...rest }) {
  const fill = 'var(--jho-' + color + ')';
  const text = tone === 'dark' ? 'var(--jho-paper)' : 'var(--jho-ink)';
  return (
    <span style={{ display: 'inline-grid',
                   gridTemplateColumns: showWords ? 'auto auto' : 'auto',
                   gap: '6px 16px', alignItems: 'center',
                   fontFamily: 'var(--jho-font-display)', ...style }} {...rest}>
      {WORDS.map(([letter, word]) => (
        <React.Fragment key={letter}>
          <span style={{ width: size + 'px', height: size + 'px', borderRadius: 'var(--jho-radius-sm)',
                         background: fill, color: 'var(--jho-paper)', display: 'flex',
                         alignItems: 'center', justifyContent: 'center', fontWeight: 900,
                         fontSize: Math.round(size * 0.61) + 'px', letterSpacing: '-0.02em', lineHeight: 1 }}>{letter}</span>
          {showWords ? (
            <span style={{ fontWeight: 800, fontSize: Math.round(size * 0.61) + 'px',
                           letterSpacing: '-0.015em', lineHeight: 0.95, color: text }}>{word}</span>
          ) : null}
        </React.Fragment>
      ))}
    </span>
  );
}
