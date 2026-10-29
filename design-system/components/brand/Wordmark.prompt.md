The JHO wordmark, loaded from the real exported PNGs in `assets/logos/` (Playfair Display 900). Always one color; never recolor per-word, skew, or place it on a busy photo.

```jsx
<Wordmark color="subway" height={120} base="../../" />
<Wordmark orientation="horizontal" color="saffron" height={26} base="../../" />
```

Color rule: subway/tandoor/black on light grounds, cilantro/saffron/white on Ink. Minimum height 48px — below that, use `<Monogram />`. Clear space = half a "J" cap-height on all sides. Pair it with `<MosaicRule />` directly underneath — that is where the full palette lives.

Aspect ratios: stacked ≈ 1.28:1 (width ≈ 1.28 × height); horizontal ≈ 8.92:1. Set `base` to the relative path back to the design-system root (`../../` from a UI kit, `../` from `slides/`).

Stacked lines are flush left by default, exactly as the source deck's `.logo-stacked` sets them. Pass `align="center"` when the mark itself is centred in a column — the poster mastheads do — which insets "Jackson" and "Heights" symmetrically inside "Orchestra".

When mounting through `<x-import>`, alignment must go through this prop: `style` lands on a `display:contents` mount and never reaches the lockup.
