/**
 * The seven-colour mosaic bar — the brand's only ornament, and the only place
 * the full palette appears together.
 * @startingPoint section="Brand" subtitle="Seven-voice mosaic rule and grid" viewport="700x150"
 */
export interface MosaicRuleProps {
  /** rule: 3px/6px gap under a wordmark · bar: 4px/3px gap poster+IG masthead stripe · grid: 40px accent block */
  variant?: 'rule' | 'bar' | 'grid';
  /** px height — defaults 3 (rule) / 4 (bar) / 40 (grid) */
  height?: number;
  /** px gap between segments — defaults 6 (rule) / 3 (bar) / 4 (grid) */
  gap?: number;
  style?: React.CSSProperties;
}
export declare function MosaicRule(props: MosaicRuleProps): JSX.Element;
