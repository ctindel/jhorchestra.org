/** The heritage griffin seal — a winged griffin over the Queens skyline, in a circular rule. Footer and print marks only. */
export interface GriffinSealProps {
  /** rendered edge in px — 56 is the legibility floor; 56–88 in footers, up to 140 on a program cover */
  size?: number;
  /** path prefix to the design-system root, e.g. "../../" */
  base?: string;
  alt?: string;
  style?: React.CSSProperties;
}
export declare function GriffinSeal(props: GriffinSealProps): JSX.Element;
