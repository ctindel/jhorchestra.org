/**
 * The primary JHO mark — real exported PNG artwork set in Playfair Display 900, one color at a time.
 * @startingPoint section="Brand" subtitle="Stacked and horizontal wordmark, six colorways" viewport="700x220"
 */
export interface WordmarkProps {
  /** stacked is primary (use ~80% of the time); horizontal for tight vertical space */
  orientation?: 'stacked' | 'horizontal';
  /** subway/tandoor/black on light · cilantro/saffron/white on ink */
  color?: 'subway' | 'tandoor' | 'cilantro' | 'saffron' | 'black' | 'white';
  /** stacked only: flush-left as the source deck sets it, or the three lines
   *  centred on each other (for a mark centred in its own column, e.g. posters) */
  align?: 'left' | 'center';
  /** rendered height in px — never below 48 */
  height?: number;
  /** path prefix to the design-system root, e.g. "../../" */
  base?: string;
  alt?: string;
  style?: React.CSSProperties;
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;
