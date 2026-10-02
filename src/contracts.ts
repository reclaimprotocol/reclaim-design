/** Semantic states shared by framework-neutral Reclaim patterns. */
export type ReclaimState =
  | 'idle'
  | 'active'
  | 'selected'
  | 'preparing'
  | 'busy'
  | 'success'
  | 'warning'
  | 'error'
  | 'disabled';

/** Visual variants shared by controls and feedback surfaces. */
export type ReclaimVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'inline'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/** Dataset and ARIA attributes used by semantic Reclaim markup. */
export interface ReclaimStateAttributes {
  'data-state'?: ReclaimState;
  'data-variant'?: ReclaimVariant;
  'aria-busy'?: 'true' | 'false';
  'aria-invalid'?: 'true' | 'false';
  'aria-disabled'?: 'true' | 'false';
}

/** Detail emitted when a framework-neutral value changes. */
export interface ReclaimValueChangeDetail<Value extends string = string> {
  value: Value;
}

/** Detail emitted when a segmented choice changes. */
export interface ReclaimSegmentChangeDetail<Value extends string = string> {
  value?: Value;
  selected: boolean;
}

/** Detail emitted by Oat's tab element after activation. */
export interface OatTabChangeDetail {
  index: number;
  tab: HTMLElement;
}

/** Public DOM contract for the themed Oat tabs element. */
export interface OatTabsElement extends HTMLElement {
  activeIndex: number;
}

export type ReclaimValueChangeEvent<Value extends string = string> =
  CustomEvent<ReclaimValueChangeDetail<Value>>;
export type ReclaimSegmentChangeEvent<Value extends string = string> =
  CustomEvent<ReclaimSegmentChangeDetail<Value>>;
export type OatTabChangeEvent = CustomEvent<OatTabChangeDetail>;

declare global {
  interface HTMLElementEventMap {
    'ot-tab-change': OatTabChangeEvent;
    'reclaim:comboboxchange': ReclaimValueChangeEvent;
    'reclaim:segmentchange': ReclaimSegmentChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'ot-tabs': OatTabsElement;
  }
}
