/** One programmed work: composer in serif bold, title in serif italic, optional premiere tag. */
export interface WorkListingProps {
  /** surname-first, e.g. "F. Mendelssohn" */
  composer?: string;
  /** the work title, set in italic */
  work?: string;
  /** small all-caps flag, e.g. "World Premiere" */
  tag?: string;
  /** italic ordinal shown to the left, e.g. "01" */
  number?: string;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}
export declare function WorkListing(props: WorkListingProps): JSX.Element;
