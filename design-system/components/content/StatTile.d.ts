/** Filled colour tile leading with a big Playfair numeral. Used in the "About" band. */
export interface StatTileProps {
  /** the numeral, e.g. "50+" */
  value?: string;
  label?: string;
  /** lowercase continuation sentence under the label */
  note?: string;
  color?: 'tandoor' | 'saffron' | 'cilantro' | 'subway' | 'jacaranda' | 'hibiscus' | 'roosevelt';
  style?: React.CSSProperties;
}
export declare function StatTile(props: StatTileProps): JSX.Element;
