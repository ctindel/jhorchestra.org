import React from 'react';

/* The heritage griffin seal — a real drawn mark from the JHO sources.
   Never redraw, approximate, or REVERSE it: the line art breaks apart when
   inverted. On a dark ground, sit it on a light chip instead. */
export function GriffinSeal({ size = 56, base = '', alt = 'Jackson Heights Orchestra griffin seal', style, ...rest }) {
  return (
    <img src={base + 'assets/logos/griffin-seal.webp'} alt={alt}
         style={{ width: size + 'px', height: size + 'px', objectFit: 'contain', display: 'block',
                  flexShrink: 0, ...style }} {...rest} />
  );
}
