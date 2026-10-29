/* @ds-bundle: {"format":4,"namespace":"JacksonHeightsOrchestraDesignSystem_6e3e82","components":[{"name":"GriffinSeal","sourcePath":"components/brand/GriffinSeal.jsx"},{"name":"Monogram","sourcePath":"components/brand/Monogram.jsx"},{"name":"WaveformMark","sourcePath":"components/brand/WaveformMark.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"ConcertRow","sourcePath":"components/content/ConcertRow.jsx"},{"name":"Portrait","sourcePath":"components/content/Portrait.jsx"},{"name":"StatTile","sourcePath":"components/content/StatTile.jsx"},{"name":"WorkListing","sourcePath":"components/content/WorkListing.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"Headline","sourcePath":"components/core/Headline.jsx"},{"name":"MosaicRule","sourcePath":"components/core/MosaicRule.jsx"},{"name":"SOCIAL_PATHS","sourcePath":"components/media/SocialIcons.jsx"},{"name":"SocialIcons","sourcePath":"components/media/SocialIcons.jsx"}],"sourceHashes":{"components/brand/GriffinSeal.jsx":"dda131210d44","components/brand/Monogram.jsx":"beb22d6ff6c4","components/brand/WaveformMark.jsx":"b89aeef9464a","components/brand/Wordmark.jsx":"a76557b68f13","components/content/ConcertRow.jsx":"2f8cb8cc5a74","components/content/Portrait.jsx":"c919d67495e9","components/content/StatTile.jsx":"04aad1ae34d3","components/content/WorkListing.jsx":"f1769fd57e0c","components/core/Button.jsx":"f1099e216e30","components/core/Card.jsx":"efb694fadf42","components/core/Chip.jsx":"6dbec877d0ea","components/core/Eyebrow.jsx":"2618bae408cc","components/core/Headline.jsx":"2d52bf3e91fa","components/core/MosaicRule.jsx":"d380750db5a4","components/media/SocialIcons.jsx":"de40bf914ad0","ui_kits/print_social/Poster.jsx":"6d07f1a2da24","ui_kits/print_social/Social.jsx":"85c96d4eb17a","ui_kits/website/Home.jsx":"2ef2d582c722","ui_kits/website/Nav.jsx":"e0533405785f","ui_kits/website/Schedule.jsx":"7cd6aab7f78e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.JacksonHeightsOrchestraDesignSystem_6e3e82 = window.JacksonHeightsOrchestraDesignSystem_6e3e82 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/GriffinSeal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The heritage griffin seal — a real drawn mark from the JHO sources.
   Never redraw, approximate, or REVERSE it: the line art breaks apart when
   inverted. On a dark ground, sit it on a light chip instead. */
function GriffinSeal({
  size = 56,
  base = '',
  alt = 'Jackson Heights Orchestra griffin seal',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    src: base + 'assets/logos/griffin-seal.webp',
    alt: alt,
    style: {
      width: size + 'px',
      height: size + 'px',
      objectFit: 'contain',
      display: 'block',
      flexShrink: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { GriffinSeal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/GriffinSeal.jsx", error: String((e && e.message) || e) }); }

// components/brand/Monogram.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const WORDS = [['J', 'Jackson'], ['H', 'Heights'], ['O', 'Orchestra']];
function Monogram({
  color = 'subway',
  size = 56,
  showWords = true,
  tone = 'light',
  style,
  ...rest
}) {
  const fill = 'var(--jho-' + color + ')';
  const text = tone === 'dark' ? 'var(--jho-paper)' : 'var(--jho-ink)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-grid',
      gridTemplateColumns: showWords ? 'auto auto' : 'auto',
      gap: '6px 16px',
      alignItems: 'center',
      fontFamily: 'var(--jho-font-display)',
      ...style
    }
  }, rest), WORDS.map(([letter, word]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: letter
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: size + 'px',
      height: size + 'px',
      borderRadius: 'var(--jho-radius-sm)',
      background: fill,
      color: 'var(--jho-paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      fontSize: Math.round(size * 0.61) + 'px',
      letterSpacing: '-0.02em',
      lineHeight: 1
    }
  }, letter), showWords ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: Math.round(size * 0.61) + 'px',
      letterSpacing: '-0.015em',
      lineHeight: 0.95,
      color: text
    }
  }, word) : null)));
}
Object.assign(__ds_scope, { Monogram });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Monogram.jsx", error: String((e && e.message) || e) }); }

// components/brand/WaveformMark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BARS = [['saffron', 60], ['saffron', 80], ['saffron', 45], ['saffron', 90], ['saffron', 35], ['cilantro', 70], ['cilantro', 95], ['cilantro', 50], ['cilantro', 75], ['subway', 40], ['subway', 85], ['subway', 60], ['subway', 30]];
function WaveformMark({
  height = 42,
  showWord = true,
  color,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '6px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '3px',
      height: height + 'px',
      width: '100%'
    }
  }, BARS.map(([c, h], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      minWidth: 0,
      borderRadius: '2px',
      display: 'block',
      height: h + '%',
      background: color ? color : 'var(--jho-' + c + ')'
    }
  }))), showWord ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '22px',
      lineHeight: 1,
      letterSpacing: '-0.01em',
      color: 'inherit'
    }
  }, "Jackson Heights Orchestra") : null);
}
Object.assign(__ds_scope, { WaveformMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/WaveformMark.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Set live in Playfair Display 900, exactly as the source deck sets it.
   NOT artwork: the exported PNGs are a lighter, wider didone and don't match.
   The wordmark is always ONE colour. */
const COLORS = {
  subway: 'var(--jho-subway)',
  tandoor: 'var(--jho-tandoor)',
  cilantro: 'var(--jho-cilantro)',
  saffron: 'var(--jho-saffron)',
  black: '#000000',
  white: '#FFFFFF',
  paper: 'var(--jho-paper)',
  ink: 'var(--jho-ink)'
};

/* Stacked lockup measures ~3.26x its font-size (3 lines at 1.06 + two 0.04em gaps);
   the horizontal lockup is a single line. `height` stays the public knob so call
   sites read in laid-out pixels; `size` overrides it with a raw font-size. */
function Wordmark({
  orientation = 'stacked',
  color = 'subway',
  height = 96,
  size,
  align = 'left',
  tagline,
  style,
  ...rest
}) {
  const stacked = orientation !== 'horizontal';
  const fontSize = size ?? (stacked ? height / 3.26 : height);
  const fill = COLORS[color] || color;
  const shell = {
    display: 'inline-flex',
    fontFamily: 'var(--jho-font-display)',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: fill,
    fontSize: fontSize + 'px',
    ...style
  };
  const tag = tagline ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: '0.12em',
      textTransform: 'uppercase',
      letterSpacing: '0.32em',
      lineHeight: 1,
      color: 'inherit',
      opacity: stacked ? 0.9 : 0.7,
      marginTop: stacked ? '0.4em' : 0,
      marginLeft: stacked ? 0 : '0.4em',
      alignSelf: stacked ? 'auto' : 'center'
    }
  }, tagline) : null;
  if (stacked) {
    /* The source deck's .logo-stacked sets no align-items, so the three lines are
       flush left by default and that stays the faithful lockup. align="center"
       insets "Jackson" and "Heights" symmetrically inside "Orchestra" — needed
       when the mark is centred in a column (the posters). It has to be a PROP:
       x-import applies `style` to a display:contents mount, so a style
       declaration never reaches this shell. */
    const centered = align === 'center';
    return /*#__PURE__*/React.createElement("span", _extends({
      role: "img",
      "aria-label": "Jackson Heights Orchestra",
      style: {
        ...shell,
        flexDirection: 'column',
        lineHeight: 1.06,
        ...(centered ? {
          alignItems: 'center',
          textAlign: 'center'
        } : null),
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block'
      }
    }, "Jackson"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        marginTop: '0.04em'
      }
    }, "Heights"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        marginTop: '0.04em',
        lineHeight: 1.12
      }
    }, "Orchestra"), tag);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": "Jackson Heights Orchestra",
    style: {
      ...shell,
      alignItems: 'baseline',
      gap: '0.28em',
      lineHeight: 1,
      whiteSpace: 'nowrap'
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, "Jackson"), /*#__PURE__*/React.createElement("span", null, "Heights"), /*#__PURE__*/React.createElement("span", null, "Orchestra"), tag);
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/content/Portrait.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Portrait({
  src,
  name,
  role,
  size = 96,
  shape = 'square',
  tone = 'light',
  layout = 'inline',
  nameSize,
  roleSize,
  style,
  ...rest
}) {
  const stacked = layout === 'stacked';
  const radius = shape === 'round' ? '50%' : 'var(--jho-radius-xs)';
  const img = src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name || '',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, var(--jho-subway) 0%, var(--jho-roosevelt) 100%)'
    }
  });
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: stacked ? '10px' : '12px',
      flexDirection: stacked ? 'column' : 'row',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: size + 'px',
      height: size + 'px',
      borderRadius: radius,
      overflow: 'hidden',
      flexShrink: 0,
      display: 'block'
    }
  }, img), name ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      textAlign: stacked ? 'center' : 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: (nameSize ?? (stacked ? Math.max(15, Math.round(size * 0.13)) : Math.max(15, Math.round(size * 0.16)))) + 'px',
      lineHeight: 1.15,
      whiteSpace: 'nowrap',
      color: tone === 'dark' ? 'var(--jho-paper)' : 'var(--jho-ink)'
    }
  }, name), role ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: (roleSize ?? (stacked ? 10 : 9)) + 'px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginTop: '3px',
      color: tone === 'dark' ? 'rgba(250,246,238,0.6)' : 'var(--jho-tandoor)'
    }
  }, role) : null) : null);
}
Object.assign(__ds_scope, { Portrait });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Portrait.jsx", error: String((e && e.message) || e) }); }

// components/content/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatTile({
  value,
  label,
  note,
  color = 'tandoor',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--jho-' + color + ')',
      color: 'var(--jho-paper)',
      borderRadius: 'var(--jho-radius-lg)',
      padding: '28px 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 900,
      fontSize: '54px',
      lineHeight: 0.9,
      letterSpacing: '-0.03em'
    }
  }, value), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 700,
      fontSize: '16px',
      letterSpacing: '-0.01em'
    }
  }, label), note ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--jho-font-text)',
      fontSize: '13px',
      lineHeight: 1.45,
      color: 'rgba(250,246,238,0.8)'
    }
  }, note) : null));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/content/WorkListing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function WorkListing({
  composer,
  work,
  tag,
  number,
  tone = 'light',
  size = 'md',
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  const sizes = {
    sm: [15, 13],
    md: [19, 15],
    lg: [22, 17]
  }[size];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: number ? 'grid' : 'block',
      gridTemplateColumns: number ? '40px 1fr' : undefined,
      gap: '14px',
      ...style
    }
  }, rest), number ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontWeight: 500,
      fontSize: '22px',
      color: 'var(--jho-tandoor)',
      lineHeight: 1
    }
  }, number) : null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: sizes[0] + 'px',
      letterSpacing: '-0.01em',
      lineHeight: 1.15,
      color: dark ? 'var(--jho-paper)' : 'var(--jho-ink)'
    }
  }, composer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: sizes[1] + 'px',
      lineHeight: 1.25,
      marginTop: '2px',
      display: 'flex',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      gap: '8px',
      color: dark ? 'rgba(250,246,238,0.75)' : 'var(--jho-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, work), tag ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontStyle: 'normal',
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-tandoor)',
      fontWeight: 700,
      background: 'var(--jho-tint-tandoor)',
      padding: '3px 8px',
      borderRadius: '3px',
      whiteSpace: 'nowrap'
    }
  }, tag) : null)));
}
Object.assign(__ds_scope, { WorkListing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/WorkListing.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  fontFamily: "var(--jho-font-text)",
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  borderRadius: 'var(--jho-radius-pill)',
  border: '1.5px solid transparent',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  transition: 'background var(--jho-dur-base) var(--jho-ease), color var(--jho-dur-base) var(--jho-ease), opacity var(--jho-dur-base) var(--jho-ease)'
};
const sizes = {
  sm: {
    fontSize: '11px',
    padding: '9px 16px'
  },
  md: {
    fontSize: '12px',
    padding: '12px 24px'
  },
  lg: {
    fontSize: '13px',
    padding: '14px 30px'
  }
};
const variants = {
  primary: {
    background: 'var(--jho-ink)',
    color: 'var(--jho-paper)'
  },
  donate: {
    background: 'var(--jho-tandoor)',
    color: 'var(--jho-paper)'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--jho-ink)',
    borderColor: 'var(--jho-ink)'
  },
  ghostDark: {
    background: 'transparent',
    color: 'var(--jho-paper)',
    borderColor: 'var(--jho-border-invert)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  href,
  arrow = false,
  disabled = false,
  children,
  style,
  ...rest
}) {
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    disabled: !href && disabled ? true : undefined,
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      opacity: disabled ? 0.45 : 1,
      pointerEvents: disabled ? 'none' : undefined,
      ...style
    }
  }, rest), children, arrow ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2192") : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  newsprint: {
    background: 'var(--jho-newsprint)',
    color: 'var(--jho-ink)',
    border: 'none'
  },
  ink: {
    background: 'var(--jho-ink)',
    color: 'var(--jho-paper)',
    border: 'none'
  },
  accent: {
    background: 'var(--jho-tandoor)',
    color: 'var(--jho-paper)',
    border: 'none'
  },
  raised: {
    background: 'var(--jho-white)',
    color: 'var(--jho-ink)',
    border: '1px solid rgba(0,0,0,0.08)'
  }
};
function Card({
  tone = 'newsprint',
  radius = 'lg',
  padding = 28,
  children,
  style,
  ...rest
}) {
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: t.background,
      color: t.color,
      border: t.border,
      borderRadius: 'var(--jho-radius-' + radius + ')',
      padding: typeof padding === 'number' ? padding + 'px' : padding,
      boxShadow: 'none',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const HUES = ['tandoor', 'saffron', 'cilantro', 'subway', 'jacaranda', 'hibiscus', 'roosevelt'];
function Chip({
  tone = 'subway',
  glyph,
  outline = false,
  muted = false,
  children,
  style,
  ...rest
}) {
  if (muted) {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        fontFamily: 'var(--jho-font-text)',
        fontSize: '10px',
        fontStyle: 'italic',
        color: 'var(--jho-muted)',
        letterSpacing: '0.02em',
        ...style
      }
    }, rest), children);
  }
  const color = HUES.includes(tone) ? 'var(--jho-' + tone + ')' : tone;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontFamily: outline ? 'var(--jho-font-display)' : 'var(--jho-font-text)',
      fontStyle: outline ? 'italic' : 'normal',
      fontSize: outline ? '13px' : '10px',
      fontWeight: outline ? 400 : 700,
      letterSpacing: outline ? 0 : '0.08em',
      textTransform: outline ? 'none' : 'uppercase',
      padding: outline ? '4px 10px' : '6px 10px',
      borderRadius: outline ? 'var(--jho-radius-pill)' : 'var(--jho-radius-xs)',
      background: outline ? 'transparent' : 'var(--jho-tint-' + tone + ')',
      border: outline ? '1px solid var(--jho-border-invert)' : 'none',
      color: outline ? 'inherit' : color,
      ...style
    }
  }, rest), glyph ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, glyph) : null, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/content/ConcertRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ConcertRow({
  day,
  month,
  year,
  title,
  venue,
  works,
  media = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: '90px 1fr auto',
      gap: '24px',
      padding: '18px 22px',
      background: 'var(--jho-white)',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 'var(--jho-radius-md)',
      alignItems: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 900,
      fontSize: '36px',
      lineHeight: 0.95,
      letterSpacing: '-0.02em',
      color: 'var(--jho-ink)'
    }
  }, day), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--jho-tandoor)'
    }
  }, month), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontSize: '10px',
      letterSpacing: '0.18em',
      color: 'var(--jho-muted)',
      fontWeight: 600
    }
  }, year)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '18px',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      margin: 0,
      color: 'var(--jho-ink)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-text)',
      fontSize: '12px',
      color: 'var(--jho-muted)',
      lineHeight: 1.45
    }
  }, venue), works ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontSize: '12px',
      color: 'var(--jho-ink)',
      lineHeight: 1.4,
      marginTop: '2px'
    }
  }, works) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      maxWidth: '320px'
    }
  }, media.length ? media.map((m, i) => /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    key: i,
    tone: m.tone,
    glyph: m.glyph,
    muted: m.muted
  }, m.label)) : /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    muted: true
  }, "no archive yet")));
}
Object.assign(__ds_scope, { ConcertRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ConcertRow.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  tandoor: 'var(--jho-tandoor)',
  saffron: 'var(--jho-saffron)',
  subway: 'var(--jho-subway)',
  muted: 'var(--jho-muted)',
  ink: 'var(--jho-ink)',
  paper: 'rgba(250,246,238,0.6)'
};
function Eyebrow({
  tone = 'tandoor',
  size = 'md',
  as: Tag = 'div',
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: '10px',
    md: '11px',
    lg: '13px'
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: sizes[size],
      textTransform: 'uppercase',
      letterSpacing: 'var(--jho-ls-eyebrow)',
      color: tones[tone],
      lineHeight: 1.4,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/Headline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const levels = {
  hero: {
    fontSize: 'var(--jho-size-hero)',
    lineHeight: 'var(--jho-lh-hero)',
    letterSpacing: 'var(--jho-ls-hero)',
    fontWeight: 900
  },
  display: {
    fontSize: 'var(--jho-size-display)',
    lineHeight: 'var(--jho-lh-display)',
    letterSpacing: 'var(--jho-ls-display)',
    fontWeight: 900
  },
  h1: {
    fontSize: 'var(--jho-size-h1)',
    lineHeight: 'var(--jho-lh-h1)',
    letterSpacing: 'var(--jho-ls-h1)',
    fontWeight: 600
  },
  h2: {
    fontSize: 'var(--jho-size-h2)',
    lineHeight: 'var(--jho-lh-h2)',
    letterSpacing: 'var(--jho-ls-h2)',
    fontWeight: 500
  },
  h3: {
    fontSize: 'var(--jho-size-h3)',
    lineHeight: 'var(--jho-lh-h3)',
    letterSpacing: 'var(--jho-ls-h3)',
    fontWeight: 700
  },
  h4: {
    fontSize: 'var(--jho-size-h4)',
    lineHeight: 'var(--jho-lh-h4)',
    letterSpacing: 'var(--jho-ls-h4)',
    fontWeight: 700
  }
};
function Headline({
  level = 'h1',
  as,
  italic = false,
  color,
  children,
  style,
  ...rest
}) {
  const Tag = as || (level === 'hero' || level === 'display' ? 'h1' : level === 'h4' ? 'h4' : level);
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: 'var(--jho-font-display)',
      margin: 0,
      color: color || 'inherit',
      fontStyle: italic ? 'italic' : 'normal',
      ...levels[level],
      ...(italic ? {
        fontWeight: 500
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Headline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Headline.jsx", error: String((e && e.message) || e) }); }

// components/core/MosaicRule.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const COLORS = ['tandoor', 'saffron', 'cilantro', 'subway', 'jacaranda', 'hibiscus', 'roosevelt'];
const GEOMETRY = {
  rule: {
    h: 3,
    g: 6,
    radius: '2px'
  },
  /* under a wordmark */
  bar: {
    h: 4,
    g: 3,
    radius: '0'
  },
  /* poster + IG masthead stripe */
  grid: {
    h: 40,
    g: 4,
    radius: 'var(--jho-radius-sm)'
  } /* accent block */
};
function MosaicRule({
  variant = 'rule',
  height,
  gap,
  style,
  ...rest
}) {
  const geo = GEOMETRY[variant] || GEOMETRY.rule;
  const h = height ?? geo.h;
  const g = gap ?? geo.g;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: g + 'px',
      height: h + 'px',
      borderRadius: geo.radius,
      overflow: 'hidden',
      ...style
    },
    "aria-hidden": "true"
  }, rest), COLORS.map(c => /*#__PURE__*/React.createElement("i", {
    key: c,
    style: {
      flex: 1,
      display: 'block',
      background: 'var(--jho-' + c + ')'
    }
  })));
}
Object.assign(__ds_scope, { MosaicRule });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/MosaicRule.jsx", error: String((e && e.message) || e) }); }

// components/media/SocialIcons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Verbatim single-path 24px glyphs from the JHO source. This brand has no icon
   font and no CDN icon set — these four are the entire icon inventory. */
const SOCIAL_PATHS = {
  youtube: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z',
  facebook: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12z',
  instagram: 'M12 2.2c3.2 0 3.6 0 4.8.07 1.2.06 1.9.25 2.3.42.6.23 1 .5 1.5 1s.77.9 1 1.5c.17.4.36 1.1.42 2.3.05 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.06 1.2-.25 1.9-.42 2.3-.23.6-.5 1-1 1.5s-.9.77-1.5 1c-.4.17-1.1.36-2.3.42-1.2.05-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.2-.06-1.9-.25-2.3-.42-.6-.23-1-.5-1.5-1s-.77-.9-1-1.5c-.17-.4-.36-1.1-.42-2.3-.05-1.2-.07-1.6-.07-4.8s0-3.6.07-4.8c.06-1.2.25-1.9.42-2.3.23-.6.5-1 1-1.5s.9-.77 1.5-1c.4-.17 1.1-.36 2.3-.42C8.4 2.22 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.5 0-4.7.07-1.1.05-1.7.23-2.1.4-.5.2-.9.45-1.3.85s-.65.8-.85 1.3c-.16.4-.34 1-.4 2.1C2.62 8.5 2.6 8.8 2.6 12s0 3.5.07 4.7c.06 1.1.24 1.7.4 2.1.2.5.46.9.86 1.3s.8.66 1.3.86c.4.16 1 .34 2.1.4 1.2.06 1.5.07 4.7.07s3.5 0 4.7-.07c1.1-.06 1.7-.24 2.1-.4.5-.2.9-.46 1.3-.86s.66-.8.86-1.3c.16-.4.34-1 .4-2.1.06-1.2.07-1.5.07-4.7s0-3.5-.07-4.7c-.06-1.1-.24-1.7-.4-2.1-.2-.5-.46-.9-.86-1.3s-.8-.66-1.3-.86c-.4-.16-1-.34-2.1-.4C15.5 4 15.2 4 12 4zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06zm0 8.14A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm6.3-8.36a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z',
  x: 'M18.2 2H21l-6.4 7.3L22 22h-6.1l-4.8-6.3L5.6 22H2.8l6.9-7.9L2 2h6.2l4.3 5.7L18.2 2zm-1 18h1.7L7 4H5.2l12 16z'
};
const LABELS = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'Twitter / X'
};
function SocialIcons({
  networks = ['youtube', 'facebook', 'instagram', 'x'],
  size = 16,
  tone = 'light',
  gap = 8,
  style,
  ...rest
}) {
  const color = tone === 'dark' ? 'var(--jho-paper)' : 'var(--jho-ink)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: gap + 'px',
      alignItems: 'center',
      ...style
    }
  }, rest), networks.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    "aria-label": LABELS[n],
    href: "#",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      color,
      opacity: 0.55,
      transition: 'opacity var(--jho-dur-base) var(--jho-ease), color var(--jho-dur-base) var(--jho-ease)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = 1;
      e.currentTarget.style.color = 'var(--jho-tandoor)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = 0.55;
      e.currentTarget.style.color = color;
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    style: {
      width: size + 'px',
      height: size + 'px',
      fill: 'currentColor'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: SOCIAL_PATHS[n]
  })))));
}
Object.assign(__ds_scope, { SOCIAL_PATHS, SocialIcons });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/SocialIcons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/print_social/Poster.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Wordmark,
  MosaicRule,
  WorkListing,
  Portrait,
  Headline
} = window.JacksonHeightsOrchestraDesignSystem_6e3e82;
const CONCERT = {
  presents: 'The Jackson Heights Beautification Group Presents',
  title: '100 Years of Trinity Lutheran',
  dayname: 'Wednesday',
  date: 'May 20',
  year: '2026',
  iso: '2026-05-20',
  /* sortable stamp for generated file names */
  time: '7:30 PM',
  doors: 'Doors 7:00 PM',
  venue: 'Trinity Lutheran Church',
  address: '31-18 37th St, Astoria (parking available)',
  admission: 'Free admission',
  suggested: '$20 suggested donation',
  works: [{
    composer: 'Fanny Mendelssohn-Hensel',
    work: 'Overture in C'
  }, {
    composer: 'Michael A. Lee',
    work: 'Cognōscent',
    tag: 'World Premiere'
  }, {
    composer: 'Felix Mendelssohn',
    work: 'Symphony No. 5 "Reformation"'
  }],
  people: [{
    src: '../../assets/photos/alex-wen.jpg',
    name: 'Alex Wen',
    role: 'Conductor'
  }, {
    src: '../../assets/photos/michael-lee.jpg',
    name: 'Michael A. Lee',
    role: 'Composer'
  }, {
    src: '../../assets/photos/nicholas-pappone.jpeg',
    name: 'Nicholas Pappone',
    role: 'Violin'
  }]
};

/* ── Poster geometry, single source of truth ───────────────────────────────
   The wordmark is sized as a FRACTION OF SHEET WIDTH, not absolute px, so the
   560px kit preview and the 816px print templates (templates/concert-poster/,
   templates/concert-poster-duo/) stay visually identical.
     0.1176 × 816 ≈ 96px  ·  0.1176 × 560 ≈ 66px
   Solo and Duo share the masthead — the conductor sits beside the wordmark in
   both — so there is only one ratio. A second artist goes beside the PROGRAMME,
   not the masthead. */
const SHEET_W = 560;
const MARK_RATIO = 0.1176;
const markSize = () => Math.round(SHEET_W * MARK_RATIO);
const sheet = {
  width: SHEET_W + 'px',
  height: '725px',
  boxSizing: 'border-box',
  flexShrink: 0,
  background: 'var(--jho-paper)',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'var(--jho-font-text)',
  color: 'var(--jho-ink)',
  boxShadow: 'var(--jho-shadow-sheet)',
  borderRadius: 'var(--jho-radius-paper)'
};

/* ── Finishes ───────────────────────────────────────────────────────────────
   One artwork, three outputs. Because every element in Layout A paints from a
   CSS custom property, a finish is just a token override on the sheet root —
   no forked markup, so the three can never drift apart.

     online       Paper ground (#FAF6EE). Web, email, social. The default.
     print-color  White ground. Same color artwork, for a commercial printer.
     print-bw     White ground, every text token forced to pure black, photos
                  and the mosaic bar desaturated. For newspaper listings.

   print-bw leaves NO grey text: ink, muted, tandoor and subway all collapse to
   #000, so captions and role labels print solid black rather than as a screen. */
const FINISH = {
  online: {
    label: 'Online',
    note: 'Paper ground · web, email, social',
    qr: 'paper',
    vars: null
  },
  'print-color': {
    label: 'Print · Color',
    note: 'White ground · commercial print',
    qr: 'paper',
    vars: {
      '--jho-paper': '#FFFFFF',
      '--jho-newsprint': '#FFFFFF'
    }
  },
  'print-bw': {
    label: 'Print · B&W',
    note: 'White ground · newspaper listings',
    qr: 'bw',
    vars: {
      '--jho-paper': '#FFFFFF',
      '--jho-newsprint': '#FFFFFF',
      '--jho-ink': '#000000',
      '--jho-muted': '#000000',
      '--jho-tandoor': '#000000',
      '--jho-subway': '#000000',
      '--jho-border': 'rgba(0,0,0,0.35)',
      '--jho-tint-tandoor': 'rgba(0,0,0,0.08)'
    }
  }
};

/* Descendant filters can't be written inline, so the one class the finishes need
   is injected once. Photos and the mosaic bar carry hue no token override can
   reach — grayscale() takes each to its own luminance, which is what a
   newspaper's press would do anyway. */
function FinishStyles() {
  return /*#__PURE__*/React.createElement("style", null, `
.jho-bw img{filter:grayscale(1) contrast(1.08)}
.jho-bw .jho-mosaic{background:#000!important;height:4px}
.jho-bw .jho-mosaic > *{display:none!important}
`);
}

/* Export filename for a rendered poster, e.g.
     JHO_2026-05-20_Poster-Duo_Print-BW.png
   Purpose lives in the name so an online JPEG and a newsprint file can't be
   confused in a shared folder or sent to the wrong vendor. */
function posterFileName(variant, finish, ext = 'png') {
  const slug = {
    online: 'Online',
    'print-color': 'Print-Color',
    'print-bw': 'Print-BW'
  }[finish];
  return 'JHO_' + CONCERT.iso + '_Poster-' + variant + '_' + slug + '.' + ext;
}

/* Donate QR — real scannable code for jhorchestra.org/donate. Online uses the
   ink-on-paper code; both print finishes use the pure black-on-white one. */
function DonateQR({
  tone = 'light',
  finish = 'online',
  size = 53.5,
  style
}) {
  const file = finish === 'online' ? 'donate-on-' + (tone === 'dark' ? 'ink' : 'paper') : 'donate-print-bw';
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: '../../assets/qr/' + file + '.png',
    alt: "Scan to donate",
    style: {
      width: size + 'px',
      height: size + 'px',
      display: 'block',
      imageRendering: 'pixelated'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 700,
      fontSize: '8.9px',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color: dark ? 'rgba(250,246,238,0.8)' : 'var(--jho-muted)'
    }
  }, "Donate \u2192"));
}

/* Footer: URL + handle left, donate QR centre, admission terms + griffin right. */
function Footer({
  finish = 'online'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '11.7px 32.3px 15.1px',
      borderTop: '1px solid var(--jho-border)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: '16.5px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '17.2px',
      letterSpacing: '-0.01em'
    }
  }, "jhorchestra.org", /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '8.9px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      marginTop: '2px'
    }
  }, "@jhorchestra")), /*#__PURE__*/React.createElement(DonateQR, {
    finish: finish
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '11px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '15.1px',
      color: 'var(--jho-tandoor)',
      lineHeight: 1.1
    }
  }, "Free Admission"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: '8.9px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      marginTop: '2px',
      whiteSpace: 'nowrap'
    }
  }, "$20 Suggested Donation")), /*#__PURE__*/React.createElement("img", {
    className: "jho-seal",
    src: "../../assets/logos/griffin-seal.webp",
    alt: "Jackson Heights Orchestra griffin seal",
    style: {
      width: '42.5px',
      height: '42.5px',
      objectFit: 'contain',
      flexShrink: 0
    }
  })));
}

/* Layout A — Big Type. A true scale model of templates/concert-poster*: every
   size is the template's value × 560/816, so this contact sheet and the print
   artwork are the same design at two resolutions. */
function PosterA({
  soloists = 1,
  finish = 'online'
}) {
  const c = CONCERT;
  const guests = c.people.slice(1, soloists);
  const solo = guests.length === 0;
  const f = FINISH[finish];
  return /*#__PURE__*/React.createElement("div", {
    className: finish === 'print-bw' ? 'jho-bw' : undefined,
    style: {
      ...sheet,
      ...(f.vars || {}),
      boxShadow: finish === 'online' ? sheet.boxShadow : '0 0 0 1px rgba(0,0,0,0.18)',
      borderRadius: finish === 'online' ? sheet.borderRadius : 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(FinishStyles, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8.9px 32.3px',
      textAlign: 'center',
      borderBottom: '1px solid var(--jho-ink)',
      flexShrink: 0,
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: '11px',
      lineHeight: 1.2,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      whiteSpace: 'nowrap'
    }
  }, c.presents), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '17.8px 32.3px',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '20.6px',
      alignItems: 'center',
      justifyItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    color: "subway",
    align: "center",
    size: 60.4
  }), /*#__PURE__*/React.createElement(Portrait, _extends({}, c.people[0], {
    size: 137.3,
    layout: "stacked",
    nameSize: 18.5,
    roleSize: 9.6
  }))), /*#__PURE__*/React.createElement(MosaicRule, {
    variant: "bar",
    className: "jho-mosaic",
    style: {
      margin: '0 32.3px',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: '15.1px 39.8px',
      padding: '13px 32.3px 11.7px',
      borderBottom: '1px solid var(--jho-border)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: '0 0 4.1px',
      fontSize: '8.9px',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      color: 'var(--jho-muted)',
      fontWeight: 600
    }
  }, "When"), /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '17.2px',
      letterSpacing: '-0.01em',
      color: 'var(--jho-ink)',
      marginBottom: '2px',
      lineHeight: 1.2,
      whiteSpace: 'nowrap'
    }
  }, c.dayname, " \xB7 ", c.date), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-text)',
      fontSize: '11px',
      fontWeight: 500,
      lineHeight: 1.3,
      color: 'var(--jho-muted)',
      whiteSpace: 'nowrap'
    }
  }, c.time, " \xB7 ", c.doors)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: '0 0 4.1px',
      fontSize: '8.9px',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      color: 'var(--jho-muted)',
      fontWeight: 600
    }
  }, "Where"), /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '17.2px',
      letterSpacing: '-0.01em',
      color: 'var(--jho-ink)',
      marginBottom: '2px',
      lineHeight: 1.2,
      whiteSpace: 'nowrap'
    }
  }, c.venue), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-text)',
      fontSize: '10.6px',
      fontWeight: 500,
      lineHeight: 1.3,
      color: 'var(--jho-muted)',
      whiteSpace: 'nowrap'
    }
  }, c.address))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12.4px 32.3px',
      display: 'grid',
      gridTemplateColumns: solo ? '1fr' : '1fr auto',
      gap: '24.7px',
      flex: '1 1 auto',
      minHeight: 0,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10.3px',
      minWidth: 0,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: solo ? '22px' : '19.9px',
      letterSpacing: '-0.02em',
      color: 'var(--jho-tandoor)',
      lineHeight: 1.05
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: solo ? '13px' : '11.7px',
      color: 'var(--jho-muted)',
      lineHeight: 1.3,
      marginTop: '4.1px'
    }
  }, "A centennial concert for the church on 37th Street.")), c.works.map(w => /*#__PURE__*/React.createElement(WorkListing, _extends({
    key: w.work
  }, w, {
    size: solo ? 'md' : 'sm'
  })))), guests.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '17.8px',
      alignSelf: 'center',
      flexShrink: 0
    }
  }, guests.map(g => /*#__PURE__*/React.createElement(Portrait, _extends({
    key: g.name
  }, g, {
    size: 102.9,
    layout: "inline",
    nameSize: 13,
    roleSize: 8.2
  })))) : null), /*#__PURE__*/React.createElement(Footer, {
    finish: finish
  }));
}

/* Layout B — Color block */
function PosterB() {
  const c = CONCERT;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...sheet,
      display: 'grid',
      gridTemplateRows: '330px 1fr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--jho-subway)',
      color: 'var(--jho-paper)',
      padding: 36,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: '-60px',
      top: '-60px',
      width: '260px',
      height: '260px',
      borderRadius: '50%',
      background: 'var(--jho-tandoor)',
      opacity: 0.7
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: '20px',
      top: '60px',
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'var(--jho-saffron)',
      opacity: 0.9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      lineHeight: 1.5,
      color: 'rgba(250,246,238,0.8)',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      fontWeight: 500,
      maxWidth: '340px',
      position: 'relative',
      zIndex: 2
    }
  }, c.presents), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    color: "white",
    height: 150
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
      marginTop: 20,
      position: 'relative',
      zIndex: 2
    }
  }, [['When', c.dayname + ' · ' + c.date], ['Time', c.time], ['Where', c.venue]].map(([h, v]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: '0 0 2px',
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: 'rgba(250,246,238,0.7)',
      fontWeight: 600
    }
  }, h), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '15px',
      letterSpacing: '-0.01em',
      lineHeight: 1.2
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '30px 36px',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-tandoor)',
      fontWeight: 700,
      marginBottom: 10
    }
  }, c.title), c.works.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w.work,
    style: {
      padding: '12px 0',
      borderTop: '1px solid rgba(20,26,42,0.2)',
      borderBottom: i === c.works.length - 1 ? '1px solid rgba(20,26,42,0.2)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(WorkListing, {
    number: '0' + (i + 1),
    composer: w.composer,
    work: w.work,
    size: "sm"
  })))), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/griffin-seal.webp",
    alt: "Jackson Heights Orchestra griffin seal",
    style: {
      width: '56px',
      height: '56px',
      objectFit: 'contain'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '9px',
      lineHeight: 1.35,
      color: 'var(--jho-muted)',
      maxWidth: '160px'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '14px',
      color: 'var(--jho-tandoor)',
      marginBottom: '2px'
    }
  }, "Free Admission"), "$20 Suggested Donation")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '16px',
      letterSpacing: '-0.01em',
      textAlign: 'right'
    }
  }, "jhorchestra.org", /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '9px',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      marginTop: '2px'
    }
  }, "@jhorchestra")))));
}

/* Layout C — Editorial */
function PosterC() {
  const c = CONCERT;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...sheet,
      padding: '26px 36px',
      display: 'grid',
      gridTemplateRows: 'auto auto auto minmax(0,1fr) auto',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: 'var(--jho-muted)',
      fontWeight: 600,
      lineHeight: 1.35,
      maxWidth: '280px'
    }
  }, c.presents), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-tandoor)',
      fontWeight: 700
    }
  }, c.dayname), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 900,
      fontSize: '34px',
      lineHeight: 0.9,
      letterSpacing: '-0.02em'
    }
  }, c.date), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      letterSpacing: '0.2em',
      marginTop: '2px',
      color: 'var(--jho-muted)',
      fontWeight: 600
    }
  }, c.year))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '8px 0',
      borderTop: '2px solid var(--jho-ink)',
      borderBottom: '2px solid var(--jho-ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.3em',
      color: 'var(--jho-muted)',
      fontWeight: 600,
      marginBottom: 4
    }
  }, "Presenting"), /*#__PURE__*/React.createElement(Wordmark, {
    color: "tandoor",
    height: 96,
    style: {
      margin: '0 auto'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: '15px',
      lineHeight: 1.3,
      padding: '2px 40px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '22px',
      color: 'var(--jho-tandoor)',
      marginRight: '2px'
    }
  }, "\u201C"), c.title, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '22px',
      color: 'var(--jho-tandoor)',
      marginLeft: '2px'
    }
  }, "\u201D")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
      padding: '9px 0',
      borderTop: '1px solid rgba(20,26,42,0.25)',
      borderBottom: '1px solid rgba(20,26,42,0.25)',
      marginBottom: 10
    }
  }, [['Where', c.venue, c.address], ['When', c.time, c.admission + ', ' + c.suggested]].map(([h, a, b]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: '0 0 4px',
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-tandoor)',
      fontWeight: 700
    }
  }, h), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-display)',
      fontSize: '13px',
      lineHeight: 1.35
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontWeight: 800,
      fontSize: '15px',
      marginBottom: '2px'
    }
  }, a), b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.3em',
      color: 'var(--jho-muted)',
      fontWeight: 600,
      textAlign: 'center'
    }
  }, "The programme"), c.works.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.work,
    style: {
      textAlign: 'center',
      padding: '2px 0'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 2px',
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '13px',
      letterSpacing: '0.02em',
      textTransform: 'uppercase'
    }
  }, w.composer), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontSize: '12px',
      color: 'var(--jho-muted)',
      fontWeight: 400
    }
  }, w.work))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTop: '1px solid var(--jho-ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '15px',
      letterSpacing: '-0.01em'
    }
  }, "jhorchestra.org", /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '9px',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      marginTop: '2px'
    }
  }, "@jhorchestra")), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/griffin-seal.webp",
    alt: "Jackson Heights Orchestra griffin seal",
    style: {
      width: '56px',
      height: '56px',
      objectFit: 'contain'
    }
  })));
}

/* Named templates off the same layout — pick by how many artists front the concert,
   then by where the file is going. Finish never forks the markup. */
function PosterSolo({
  finish
}) {
  return /*#__PURE__*/React.createElement(PosterA, {
    soloists: 1,
    finish: finish
  });
}
function PosterDuo({
  finish
}) {
  return /*#__PURE__*/React.createElement(PosterA, {
    soloists: 2,
    finish: finish
  });
}
function PosterTrio({
  finish
}) {
  return /*#__PURE__*/React.createElement(PosterA, {
    soloists: 3,
    finish: finish
  });
}
Object.assign(window, {
  PosterA,
  PosterSolo,
  PosterDuo,
  PosterTrio,
  PosterB,
  PosterC,
  DonateQR,
  JHO_FINISH: FINISH,
  jhoPosterFileName: posterFileName,
  JHO_CONCERT: CONCERT
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/print_social/Poster.jsx", error: String((e && e.message) || e) }); }

// ui_kits/print_social/Social.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Wordmark,
  MosaicRule,
  Portrait,
  Chip
} = window.JacksonHeightsOrchestraDesignSystem_6e3e82;
const C = () => window.JHO_CONCERT;

/* Instagram square 1:1 — concert announcement */
function IGConcert({
  scale = 1
}) {
  const c = C();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 700 * scale + 'px',
      height: 700 * scale + 'px',
      transform: scale !== 1 ? undefined : undefined,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--jho-radius-xs)',
      boxShadow: 'var(--jho-shadow-tile)',
      fontFamily: 'var(--jho-font-text)',
      color: 'var(--jho-ink)',
      background: 'var(--jho-paper)',
      padding: '34px 40px 26px',
      display: 'grid',
      gridTemplateRows: 'auto minmax(0,1fr) auto auto',
      gap: 12,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '15px',
      color: 'var(--jho-muted)',
      lineHeight: 1.3,
      fontWeight: 600,
      marginBottom: 14,
      textTransform: 'uppercase',
      letterSpacing: '0.23em',
      whiteSpace: 'nowrap'
    }
  }, c.presents), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 24,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    color: "subway",
    height: 190,
    style: {
      margin: '0 auto',
      alignItems: 'center'
    }
  }), /*#__PURE__*/React.createElement(Portrait, _extends({}, c.people[0], {
    size: 145,
    layout: "stacked",
    style: {
      height: '190px',
      justifyContent: 'space-between',
      gap: 0
    }
  }))), /*#__PURE__*/React.createElement(MosaicRule, {
    variant: "bar",
    style: {
      marginTop: 10
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 18,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-tandoor)',
      fontWeight: 700,
      lineHeight: 1.5
    }
  }, c.title), c.works.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.work,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1px',
      paddingTop: 6,
      borderTop: '1px solid rgba(20,26,42,0.12)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '18px'
    }
  }, w.composer), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontSize: '15px',
      color: 'var(--jho-muted)',
      lineHeight: 1.3
    }
  }, w.work, w.tag ? /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'normal',
      color: 'var(--jho-tandoor)',
      fontWeight: 600,
      letterSpacing: '0.02em'
    }
  }, " \xB7 ", w.tag) : null)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignSelf: 'center'
    }
  }, c.people.slice(1, 2).map(p => /*#__PURE__*/React.createElement(Portrait, _extends({
    key: p.name
  }, p, {
    size: 145,
    layout: "stacked"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 28,
      paddingTop: 12,
      borderTop: '2px solid var(--jho-ink)'
    }
  }, [['When', c.dayname + ' · ' + c.date, c.time], ['Where', c.venue, c.address]].map(([h, a, b]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: '0 0 4px',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-tandoor)',
      fontWeight: 700
    }
  }, h), /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '18px',
      letterSpacing: '-0.01em',
      lineHeight: 1.1
    }
  }, a), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontSize: '11px',
      color: 'var(--jho-muted)',
      lineHeight: 1.3
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 20,
      paddingTop: 10,
      borderTop: '1px solid var(--jho-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '20px',
      letterSpacing: '-0.01em'
    }
  }, "jhorchestra.org", /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '11px',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      marginTop: '3px'
    }
  }, "@jhorchestra")), /*#__PURE__*/React.createElement(window.DonateQR, {
    size: 58
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '20px',
      letterSpacing: '-0.01em',
      color: 'var(--jho-tandoor)',
      lineHeight: 1.1
    }
  }, c.admission), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: '11px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      marginTop: '3px'
    }
  }, c.suggested))));
}

/* Instagram square — brand / season card, reversed */
function IGBrand() {
  const season = [['Dec 9', 'Wed · 2026', 'Season Opener', 'Queens · 7:30 PM'], ['Mar 7 & 10', '2027', 'Winter Concert', 'Mar 7 Manhattan · Mar 10 Queens'], ['May 19', 'Wed · 2027', 'Spring Concert', 'Queens · 7:30 PM'], ['Jul 11', 'Sun · 2027', 'Summer Pops', 'Travers Park · Outdoor · 6pm']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '700px',
      height: '700px',
      background: 'var(--jho-ink)',
      color: 'var(--jho-paper)',
      padding: '34px 48px',
      display: 'grid',
      gridTemplateRows: 'auto minmax(0,1fr) auto',
      position: 'relative',
      overflow: 'hidden',
      gap: 20,
      borderRadius: 'var(--jho-radius-xs)',
      boxShadow: 'var(--jho-shadow-tile)',
      fontFamily: 'var(--jho-font-text)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      right: 0,
      display: 'grid',
      gridTemplateColumns: '54px 54px 54px',
      gridTemplateRows: '54px 54px 54px',
      opacity: 0.9
    }
  }, ['tandoor', 'saffron', 'cilantro', 'subway', 'jacaranda', 'hibiscus', 'roosevelt', 'tandoor', 'subway'].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: '54px',
      height: '54px',
      background: 'var(--jho-' + c + ')'
    }
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      fontWeight: 600,
      color: 'rgba(250,246,238,0.6)',
      maxWidth: '400px'
    }
  }, "Community Orchestra \xB7 Queens, New York"), /*#__PURE__*/React.createElement(Wordmark, {
    color: "tandoor",
    height: 180,
    style: {
      marginTop: '12px',
      alignItems: 'center'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontSize: '20px',
      lineHeight: 1.35,
      maxWidth: '480px',
      fontWeight: 400,
      marginTop: '14px'
    }
  }, "An orchestra as many voices \u2014 tuned to the rhythm of Jackson Heights.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 14,
      borderTop: '1px solid var(--jho-border-invert)'
    }
  }, season.map(([d, meta, t, v], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'grid',
      gridTemplateColumns: '152px 1fr',
      gap: 16,
      alignItems: 'baseline',
      padding: '7px 0',
      borderBottom: i < season.length - 1 ? '1px solid rgba(250,246,238,0.14)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '19px',
      letterSpacing: '-0.01em',
      color: 'var(--jho-saffron)',
      lineHeight: 1.1
    }
  }, d, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: '9px',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'rgba(250,246,238,0.5)',
      marginTop: '2px'
    }
  }, meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '16px',
      lineHeight: 1.2
    }
  }, t, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '11px',
      letterSpacing: '0.04em',
      color: 'rgba(250,246,238,0.65)',
      marginTop: '2px'
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 20,
      paddingTop: 14,
      borderTop: '1px solid var(--jho-border-invert)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '18px'
    }
  }, "jhorchestra.org"), /*#__PURE__*/React.createElement(window.DonateQR, {
    tone: "dark",
    size: 50
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      color: 'var(--jho-saffron)',
      fontWeight: 600,
      textAlign: 'right'
    }
  }, "@jhorchestra")));
}

/* 9:16 stories */
const storyBase = {
  width: '340px',
  height: '604px',
  borderRadius: 'var(--jho-radius-sm)',
  overflow: 'hidden',
  boxShadow: 'var(--jho-shadow-tile)',
  position: 'relative',
  padding: '36px 28px',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  gap: 16,
  fontFamily: 'var(--jho-font-text)',
  boxSizing: 'border-box'
};
function StoryConcert() {
  const c = C();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...storyBase,
      background: 'var(--jho-paper)',
      color: 'var(--jho-ink)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.25em',
      color: 'var(--jho-muted)',
      fontWeight: 600
    }
  }, "Next concert"), /*#__PURE__*/React.createElement(Wordmark, {
    color: "subway",
    height: 132,
    style: {
      marginTop: '14px'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontStyle: 'italic',
      fontWeight: 500,
      fontSize: '22px',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      marginTop: '18px'
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      paddingTop: 12,
      borderTop: '1px solid rgba(20,26,42,0.2)'
    }
  }, c.works.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.work,
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '14px',
      lineHeight: 1.35
    }
  }, w.composer, " ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      fontWeight: 400,
      color: 'var(--jho-muted)'
    }
  }, w.work))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1.5px solid var(--jho-ink)',
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '12px',
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '16px',
      display: 'block',
      marginBottom: '2px'
    }
  }, c.dayname, " \xB7 ", c.date, " \xB7 ", c.time), c.venue, " \xB7 ", c.address, /*#__PURE__*/React.createElement("br", null), c.admission, ", ", c.suggested)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      marginTop: 14,
      background: 'var(--jho-tandoor)',
      color: 'var(--jho-paper)',
      fontSize: '11px',
      fontWeight: 700,
      padding: '9px 16px',
      borderRadius: 'var(--jho-radius-pill)',
      textTransform: 'uppercase',
      letterSpacing: '0.15em'
    }
  }, "Learn more")));
}
function StoryArtistSpotlight() {
  const p = C().people[1];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...storyBase,
      background: 'var(--jho-newsprint)',
      color: 'var(--jho-ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.25em',
      color: 'var(--jho-muted)',
      fontWeight: 600
    }
  }, "World premiere"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '88px',
      height: '88px',
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: p.src,
    alt: p.name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '22px',
      lineHeight: 1.1,
      letterSpacing: '-0.01em'
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--jho-tandoor)'
    }
  }, p.role))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 900,
      fontSize: '44px',
      lineHeight: 0.98,
      letterSpacing: '-0.03em'
    }
  }, "A new work, ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--jho-tandoor)'
    }
  }, "Cogn\u014Dscent"), ", premieres May 20.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1.5px solid var(--jho-ink)',
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '12px',
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '16px',
      display: 'block',
      marginBottom: '2px'
    }
  }, "Wed \xB7 May 20 \xB7 7:30 PM"), "Trinity Lutheran Church, Astoria")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      marginTop: 14,
      background: 'var(--jho-tandoor)',
      color: 'var(--jho-paper)',
      fontSize: '11px',
      fontWeight: 700,
      padding: '9px 16px',
      borderRadius: 'var(--jho-radius-pill)',
      textTransform: 'uppercase',
      letterSpacing: '0.15em'
    }
  }, "Read the notes")));
}
function StorySeason() {
  const rows = [['May 20', '2026', '100 Years of Trinity Lutheran', 'Astoria'], ['Jul 05', '2026', 'Summer Pops', 'Travers Park'], ['Dec 09', '2026', 'Winter Dreams', 'East Elmhurst'], ['Mar 17', '2027', 'Spring in Forest Hills', 'Forest Hills']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...storyBase,
      background: 'var(--jho-ink)',
      color: 'var(--jho-paper)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.25em',
      color: 'rgba(250,246,238,0.6)',
      fontWeight: 600
    }
  }, "Season 26\u201327"), /*#__PURE__*/React.createElement(Wordmark, {
    color: "saffron",
    height: 132,
    style: {
      marginTop: '14px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid var(--jho-border-invert)'
    }
  }, rows.map(([d, y, t, v], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'grid',
      gridTemplateColumns: '78px 1fr',
      gap: 10,
      alignItems: 'baseline',
      padding: '7px 0',
      borderBottom: i < rows.length - 1 ? '1px solid rgba(250,246,238,0.12)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 800,
      fontSize: '15px',
      color: 'var(--jho-saffron)',
      lineHeight: 1.15
    }
  }, d, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 600,
      fontSize: '8px',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'rgba(250,246,238,0.45)',
      marginTop: '1px'
    }
  }, y)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '13px',
      lineHeight: 1.2
    }
  }, t, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '9px',
      color: 'rgba(250,246,238,0.6)',
      marginTop: '1px'
    }
  }, v))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1.5px solid rgba(250,246,238,0.4)',
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '12px',
      lineHeight: 1.4,
      color: 'rgba(250,246,238,0.85)'
    }
  }, "Four concerts. Always free, pay what you can.")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      marginTop: 14,
      background: 'var(--jho-saffron)',
      color: 'var(--jho-ink)',
      fontSize: '11px',
      fontWeight: 700,
      padding: '9px 16px',
      borderRadius: 'var(--jho-radius-pill)',
      textTransform: 'uppercase',
      letterSpacing: '0.15em'
    }
  }, "See the season")));
}
Object.assign(window, {
  IGConcert,
  IGBrand,
  StoryConcert,
  StoryArtistSpotlight,
  StorySeason
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/print_social/Social.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
const {
  Headline,
  Eyebrow,
  Button,
  StatTile,
  Chip,
  Card
} = window.JacksonHeightsOrchestraDesignSystem_6e3e82;
function Hero({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '80px 60px 70px',
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 60,
      alignItems: 'center',
      background: 'var(--jho-paper)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: '14px',
      letterSpacing: '0.28em'
    }
  }, "Community Orchestra \xB7 Queens, NY"), /*#__PURE__*/React.createElement(Headline, {
    level: "hero",
    style: {
      marginBottom: '18px',
      color: 'var(--jho-ink)'
    }
  }, "A neighborhood ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--jho-tandoor)'
    }
  }, "chord"), ", played in Jackson Heights."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '17px',
      lineHeight: 1.55,
      color: 'var(--jho-muted)',
      maxWidth: '480px',
      margin: '0 0 26px'
    }
  }, "Since 2013, a community orchestra of Queens neighbors has been performing for free, or pay-what-you-can, across some of the most beloved venues in the borough."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate('schedule');
    }
  }, "Upcoming Concert"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    href: "#"
  }, "About the Orchestra"))), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1/1',
      borderRadius: 'var(--jho-radius-lg)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      gap: 6,
      padding: 6,
      background: 'var(--jho-newsprint)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 2',
      gridRow: 'span 2',
      borderRadius: 'var(--jho-radius-sm)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photos/orchestra.jpg",
    alt: "The orchestra in performance",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--jho-radius-sm)',
      background: 'var(--jho-saffron)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--jho-radius-sm)',
      background: 'var(--jho-cilantro)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--jho-radius-sm)',
      background: 'var(--jho-subway)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--jho-radius-sm)',
      background: 'var(--jho-tandoor)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--jho-radius-sm)',
      background: 'var(--jho-jacaranda)'
    }
  })));
}
function NextConcert({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '70px 60px',
      background: 'var(--jho-ink)',
      color: 'var(--jho-paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 34
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "saffron",
    size: "sm",
    style: {
      marginBottom: '6px',
      letterSpacing: '0.3em'
    }
  }, "Next up"), /*#__PURE__*/React.createElement(Headline, {
    level: "h2",
    italic: true
  }, "Wed \xB7 May 20 \xB7 7:30 PM")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate('schedule');
    },
    style: {
      color: 'var(--jho-saffron)',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      fontWeight: 700,
      textDecoration: 'none',
      borderBottom: '1px solid var(--jho-saffron)',
      paddingBottom: '2px'
    }
  }, "All concerts \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '140px 1fr auto',
      gap: 40,
      alignItems: 'center',
      padding: '30px 0',
      borderTop: '1px solid var(--jho-border-invert)',
      borderBottom: '1px solid var(--jho-border-invert)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--jho-saffron)',
      fontWeight: 700
    }
  }, "May"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 900,
      fontSize: '66px',
      lineHeight: 0.9,
      letterSpacing: '-0.03em'
    }
  }, "20"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      letterSpacing: '0.22em',
      color: 'rgba(250,246,238,0.5)',
      fontWeight: 600
    }
  }, "2026")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Headline, {
    level: "h3",
    style: {
      marginBottom: '4px'
    }
  }, "100 Years of Trinity Lutheran"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '13px',
      color: 'rgba(250,246,238,0.75)',
      lineHeight: 1.5,
      margin: 0
    }
  }, "Trinity Lutheran Church \xB7 31-18 37th St, Astoria \xB7 Free admission, $20 suggested donation."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    outline: true
  }, "Mendelssohn-Hensel \u2014 Overture in C"), /*#__PURE__*/React.createElement(Chip, {
    outline: true
  }, "Michael A. Lee \u2014 Cogn\u014Dscent (Premiere)"), /*#__PURE__*/React.createElement(Chip, {
    outline: true
  }, "F. Mendelssohn \u2014 Sym. 5 \"Reformation\""))), /*#__PURE__*/React.createElement(Button, {
    variant: "donate",
    arrow: true,
    href: "#"
  }, "Learn more")));
}
function AboutBand() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '70px 60px',
      background: 'var(--jho-paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 60,
      alignItems: 'flex-end',
      marginBottom: 34
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: '10px',
      letterSpacing: '0.28em'
    }
  }, "The Orchestra"), /*#__PURE__*/React.createElement(Headline, {
    level: "h1"
  }, "Seven ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--jho-tandoor)'
    }
  }, "voices"), ", one community.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '15px',
      lineHeight: 1.55,
      color: 'var(--jho-muted)',
      margin: 0
    }
  }, "Jackson Heights is one of the most linguistically diverse places on earth. Our orchestra reflects that \u2014 amateurs, pros, first-chair students, retired pit musicians \u2014 everyone who wants to play.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: "50+",
    label: "Musicians",
    note: "from across Queens & Brooklyn.",
    color: "tandoor"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "4",
    label: "Concerts a year",
    note: "always free or pay-what-you-can.",
    color: "subway"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "13",
    label: "Years",
    note: "making music in the neighborhood.",
    color: "cilantro"
  })));
}
function Home({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Hero, {
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(NextConcert, {
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(AboutBand, null));
}
Object.assign(window, {
  Home,
  Hero,
  NextConcert,
  AboutBand
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Nav.jsx
try { (() => {
const {
  Wordmark,
  SocialIcons,
  Button,
  MosaicRule
} = window.JacksonHeightsOrchestraDesignSystem_6e3e82;
function Nav({
  active,
  onNavigate
}) {
  const links = ['About', 'Join', 'Schedule', 'Media', 'Contact'];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 60px',
      background: 'var(--jho-white)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate('home');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(MosaicRule, {
    variant: "bar",
    height: 22,
    gap: 2,
    style: {
      width: '34px',
      borderRadius: '1px'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 900,
      fontSize: '22px',
      letterSpacing: '-0.01em',
      color: 'var(--jho-ink)'
    }
  }, "JHO")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      alignItems: 'center'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate(l === 'Schedule' ? 'schedule' : 'home');
    },
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontSize: '12px',
      fontWeight: 600,
      textDecoration: 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.16em',
      color: l === 'Schedule' && active === 'schedule' ? 'var(--jho-tandoor)' : 'var(--jho-ink)'
    }
  }, l)), /*#__PURE__*/React.createElement(Button, {
    variant: "donate",
    size: "sm",
    href: "#"
  }, "Donate")), /*#__PURE__*/React.createElement(SocialIcons, null)), /*#__PURE__*/React.createElement(MosaicRule, null));
}
function Footer() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--jho-ink)',
      color: 'var(--jho-paper)',
      padding: '44px 60px'
    }
  }, /*#__PURE__*/React.createElement(MosaicRule, {
    style: {
      marginBottom: '28px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 40,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-display)',
      fontWeight: 700,
      fontSize: '22px',
      letterSpacing: '-0.01em'
    }
  }, "Jackson Heights Orchestra", /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      fontFamily: 'var(--jho-font-text)',
      fontWeight: 500,
      fontSize: '11px',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'rgba(250,246,238,0.6)',
      marginTop: '6px'
    }
  }, "Queens, New York \xB7 501(c)(3)")), /*#__PURE__*/React.createElement(SocialIcons, {
    tone: "dark"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontSize: '12px',
      color: 'rgba(250,246,238,0.6)'
    }
  }, "\xA9 2026 Jackson Heights Orchestra \xB7 jhorchestra.org \xB7 @jhorchestra")));
}
Object.assign(window, {
  Nav,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Nav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Schedule.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Headline,
  Eyebrow,
  Button,
  Chip,
  ConcertRow
} = window.JacksonHeightsOrchestraDesignSystem_6e3e82;
const PAST = [{
  day: '18',
  month: 'Mar',
  year: '2026',
  title: 'Spring in Forest Hills',
  venue: 'Wed · 7:30 PM · Our Lady Queen of Martyrs, Forest Hills',
  works: 'Mozart, Concerto for Flute & Harp · Brahms, Symphony No. 2',
  media: [{
    glyph: '▦',
    tone: 'subway',
    label: 'Poster'
  }, {
    glyph: '⛁',
    tone: 'tandoor',
    label: 'Program (PDF)'
  }, {
    glyph: '▶',
    tone: 'hibiscus',
    label: '2 videos'
  }, {
    glyph: '◉',
    tone: 'jacaranda',
    label: 'Photos (28)'
  }]
}, {
  day: '10',
  month: 'Dec',
  year: '2025',
  title: 'Winter Dreams',
  venue: 'Wed · 7:30 PM · Lexington School, East Elmhurst',
  works: 'Haydn No. 26 · Tchaikovsky "Winter Dreams" · Handel "Hallelujah"',
  media: [{
    glyph: '▦',
    tone: 'subway',
    label: 'Poster'
  }, {
    glyph: '⛁',
    tone: 'tandoor',
    label: 'Program'
  }, {
    glyph: '✎',
    tone: 'roosevelt',
    label: 'Program notes'
  }]
}, {
  day: '06',
  month: 'Jul',
  year: '2025',
  title: 'Summer Pops · Travers Park',
  venue: 'Sun · 6:00 PM · 76-09 34th Ave, Jackson Heights · Outdoor',
  works: 'Movie themes, pops classics, neighborhood favorites',
  media: [{
    glyph: '◉',
    tone: 'jacaranda',
    label: 'Photos (54)'
  }, {
    muted: true,
    label: 'no recording'
  }]
}, {
  day: '21',
  month: 'May',
  year: '2025',
  title: 'Bernstein & Beethoven',
  venue: 'Wed · 7:30 PM · Trinity Lutheran Church, Astoria',
  works: 'Bernstein, Candide Overture · Beethoven, Symphony No. 7',
  media: [{
    glyph: '⛁',
    tone: 'tandoor',
    label: 'Program'
  }, {
    glyph: '♪',
    tone: 'cilantro',
    label: 'Audio (3)'
  }]
}, {
  day: '12',
  month: 'Mar',
  year: '2025',
  title: 'French Connections',
  venue: 'Wed · 7:30 PM · Trinity Lutheran Church, Astoria',
  works: "Debussy, Petite Suite · Ravel, Pavane · Bizet, L'Arlésienne",
  media: [{
    glyph: '▦',
    tone: 'subway',
    label: 'Poster'
  }, {
    glyph: '⛁',
    tone: 'tandoor',
    label: 'Program'
  }, {
    glyph: '▶',
    tone: 'hibiscus',
    label: '4 videos'
  }, {
    glyph: '◉',
    tone: 'jacaranda',
    label: 'Photos'
  }]
}, {
  day: '11',
  month: 'Dec',
  year: '2024',
  title: 'Mostly Brahms',
  venue: 'Wed · 7:30 PM · Our Lady Queen of Martyrs, Forest Hills',
  works: 'Brahms, Academic Festival Overture · Sym. No. 1',
  media: []
}];
const TABS = ['Upcoming', 'Season 25–26', 'Season 24–25', 'Season 23–24', '2022 & earlier'];
function SectionLabel({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--jho-muted)',
      margin: '0 0 14px',
      ...style
    }
  }, children);
}
function Schedule() {
  const [tab, setTab] = React.useState('Upcoming');
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '60px 60px 28px',
      background: 'var(--jho-paper)',
      borderBottom: '1px solid rgba(0,0,0,0.08)'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: '8px',
      letterSpacing: '0.28em'
    }
  }, "Schedule \xB7 Concerts"), /*#__PURE__*/React.createElement(Headline, {
    level: "display",
    style: {
      margin: '0 0 14px'
    }
  }, "Every concert, ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--jho-tandoor)'
    }
  }, "past & present"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 22px',
      fontSize: '16px',
      lineHeight: 1.55,
      color: 'var(--jho-muted)',
      maxWidth: '640px'
    }
  }, "Four concerts a year across Queens. Free admission, $20 suggested donation. Each past concert keeps an archive of whatever was recorded \u2014 programs, photos, video, audio \u2014 when we have them."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      paddingTop: 14
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      fontFamily: 'var(--jho-font-text)',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '9px 16px',
      borderRadius: 'var(--jho-radius-pill)',
      cursor: 'pointer',
      transition: 'background var(--jho-dur-base) var(--jho-ease)',
      border: '1px solid ' + (tab === t ? 'var(--jho-subway)' : 'rgba(0,0,0,0.15)'),
      background: tab === t ? 'var(--jho-subway)' : 'transparent',
      color: tab === t ? 'var(--jho-paper)' : 'var(--jho-ink)'
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '36px 60px 60px',
      background: 'var(--jho-paper)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Next on the calendar"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: 40,
      padding: 28,
      background: 'var(--jho-ink)',
      color: 'var(--jho-paper)',
      borderRadius: '14px',
      alignItems: 'center',
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--jho-paper)',
      aspectRatio: '8.5/11',
      borderRadius: 'var(--jho-radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--jho-shadow-thumb)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/reference/20260520-poster-color.png",
    alt: "May 20 concert poster",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "saffron",
    size: "sm",
    style: {
      marginBottom: '6px',
      letterSpacing: '0.28em'
    }
  }, "Wed \xB7 May 20, 2026 \xB7 7:30 PM"), /*#__PURE__*/React.createElement(Headline, {
    level: "h3",
    style: {
      margin: '0 0 4px'
    }
  }, "100 Years of Trinity Lutheran"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '13px',
      color: 'rgba(250,246,238,0.75)',
      lineHeight: 1.5,
      margin: 0
    }
  }, "Trinity Lutheran Church \xB7 31-18 37th St, Astoria \xB7 Free, $20 suggested donation"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      margin: '14px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "donate",
    size: "sm",
    arrow: true,
    href: "#"
  }, "Help sponsor"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghostDark",
    size: "sm",
    href: "#"
  }, "Directions")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    outline: true
  }, "Mendelssohn-Hensel \u2014 Overture in C"), /*#__PURE__*/React.createElement(Chip, {
    outline: true
  }, "Michael A. Lee \u2014 Cogn\u014Dscent (Premiere)"), /*#__PURE__*/React.createElement(Chip, {
    outline: true
  }, "F. Mendelssohn \u2014 Sym. 5 \"Reformation\"")))), /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginTop: 8
    }
  }, "Recent concerts"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, PAST.map(c => /*#__PURE__*/React.createElement(ConcertRow, _extends({
    key: c.title
  }, c))))));
}
Object.assign(window, {
  Schedule
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Schedule.jsx", error: String((e && e.message) || e) }); }

__ds_ns.GriffinSeal = __ds_scope.GriffinSeal;

__ds_ns.Monogram = __ds_scope.Monogram;

__ds_ns.WaveformMark = __ds_scope.WaveformMark;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.ConcertRow = __ds_scope.ConcertRow;

__ds_ns.Portrait = __ds_scope.Portrait;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.WorkListing = __ds_scope.WorkListing;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Headline = __ds_scope.Headline;

__ds_ns.MosaicRule = __ds_scope.MosaicRule;

__ds_ns.SOCIAL_PATHS = __ds_scope.SOCIAL_PATHS;

__ds_ns.SocialIcons = __ds_scope.SocialIcons;

})();
