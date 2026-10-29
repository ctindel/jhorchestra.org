/**
 * Pill button. Ink for the main action, Tandoor for donate/CTA, outlined for secondary.
 * @startingPoint section="Core" subtitle="Pill buttons in every variant and size" viewport="700x160"
 */
export interface ButtonProps {
  /** ink fill | tandoor fill | outlined on light | outlined on ink */
  variant?: 'primary' | 'donate' | 'secondary' | 'ghostDark';
  size?: 'sm' | 'md' | 'lg';
  /** renders an <a> instead of a <button> */
  href?: string;
  /** append the house forward arrow "→" */
  arrow?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
