Seven-segment colour bar. Use it under a wordmark or as a section divider — it is the substitute for iconography and decoration in this brand.

Three variants, each with exact source geometry — don't improvise the numbers:

```jsx
<MosaicRule />                          {/* rule · 3px tall, 6px gaps — sits under a wordmark */}
<MosaicRule variant="bar" />            {/* bar  · 4px tall, 3px gaps — poster & IG masthead stripe */}
<MosaicRule variant="grid" />           {/* grid · 40px block of seven */}
```

The `rule` is the payoff of the logo rule: the wordmark is one colour, and the full palette
appears *underneath it* as the rainbow rule. Any wordmark lockup that needs a divider gets one.

Never reorder the colours, never use a subset, and never place the palette anywhere else all together.
