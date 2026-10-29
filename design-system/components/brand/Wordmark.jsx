import React from 'react';

/* Set live in Playfair Display 900, exactly as the source deck sets it.
   NOT artwork: the exported PNGs are a lighter, wider didone and don't match.
   The wordmark is always ONE colour. */
const COLORS = {
  subway: 'var(--jho-subway)', tandoor: 'var(--jho-tandoor)', cilantro: 'var(--jho-cilantro)',
  saffron: 'var(--jho-saffron)', black: '#000000', white: '#FFFFFF',
  paper: 'var(--jho-paper)', ink: 'var(--jho-ink)'
};

/* Stacked lockup measures ~3.26x its font-size (3 lines at 1.06 + two 0.04em gaps);
   the horizontal lockup is a single line. `height` stays the public knob so call
   sites read in laid-out pixels; `size` overrides it with a raw font-size. */
export function Wordmark({ orientation = 'stacked', color = 'subway', height = 96, size, align = 'left', tagline, style, ...rest }) {
  const stacked = orientation !== 'horizontal';
  const fontSize = size ?? (stacked ? height / 3.26 : height);
  const fill = COLORS[color] || color;

  const shell = {
    display: 'inline-flex', fontFamily: 'var(--jho-font-display)', fontWeight: 900,
    letterSpacing: '-0.02em', color: fill, fontSize: fontSize + 'px', ...style
  };

  const tag = tagline ? (
    <span style={{ fontFamily: 'var(--jho-font-text)', fontWeight: 600, fontSize: '0.12em',
                   textTransform: 'uppercase', letterSpacing: '0.32em', lineHeight: 1, color: 'inherit',
                   opacity: stacked ? 0.9 : 0.7,
                   marginTop: stacked ? '0.4em' : 0, marginLeft: stacked ? 0 : '0.4em',
                   alignSelf: stacked ? 'auto' : 'center' }}>{tagline}</span>
  ) : null;

  if (stacked) {
    /* The source deck's .logo-stacked sets no align-items, so the three lines are
       flush left by default and that stays the faithful lockup. align="center"
       insets "Jackson" and "Heights" symmetrically inside "Orchestra" — needed
       when the mark is centred in a column (the posters). It has to be a PROP:
       x-import applies `style` to a display:contents mount, so a style
       declaration never reaches this shell. */
    const centered = align === 'center';
    return (
      <span role="img" aria-label="Jackson Heights Orchestra"
            style={{ ...shell, flexDirection: 'column', lineHeight: 1.06,
                     ...(centered ? { alignItems: 'center', textAlign: 'center' } : null),
                     ...style }} {...rest}>
        <span style={{ display: 'block' }}>Jackson</span>
        <span style={{ display: 'block', marginTop: '0.04em' }}>Heights</span>
        <span style={{ display: 'block', marginTop: '0.04em', lineHeight: 1.12 }}>Orchestra</span>
        {tag}
      </span>
    );
  }
  return (
    <span role="img" aria-label="Jackson Heights Orchestra"
          style={{ ...shell, alignItems: 'baseline', gap: '0.28em', lineHeight: 1, whiteSpace: 'nowrap' }} {...rest}>
      <span>Jackson</span><span>Heights</span><span>Orchestra</span>{tag}
    </span>
  );
}
