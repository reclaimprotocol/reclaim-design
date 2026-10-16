import {milliseconds} from './core.js';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';
export type ToastPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastOptions {
  title?: string;
  tone?: ToastTone;
  /** Milliseconds before the toast closes. Use 0 to keep it until dismissed. */
  duration?: number;
  placement?: ToastPlacement;
  dismissLabel?: string;
}

const regionSelector = '.toast-container[popover][data-placement]';

function region(placement: ToastPlacement): HTMLElement {
  const existing = [
    ...document.querySelectorAll<HTMLElement>(regionSelector),
  ].find(element => element.dataset.placement === placement);
  if (existing) {
    return existing;
  }
  const element = document.createElement('div');
  element.className = 'toast-container';
  element.setAttribute('popover', 'manual');
  element.setAttribute('aria-live', 'polite');
  element.dataset.placement = placement;
  document.body.append(element);
  return element;
}

function close(toast: HTMLElement, container: HTMLElement) {
  if (toast.hasAttribute('data-exiting')) {
    return;
  }
  toast.setAttribute('data-exiting', '');
  const finish = () => {
    toast.remove();
    if (!container.children.length && container.matches(':popover-open')) {
      container.hidePopover();
    }
  };
  toast.addEventListener('transitionend', finish, {once: true});
  const duration = getComputedStyle(toast).getPropertyValue('--transition');
  window.setTimeout(finish, milliseconds(duration.trim() || '300ms'));
}

/**
 * Show a toast in the top layer. The region is a child of `document.body`, so
 * it follows the theme through the document-level token selectors. Text is set
 * with `textContent`; pass plain strings only.
 */
export function showToast(
  message: string,
  options: ToastOptions = {},
): HTMLElement {
  const {
    title,
    tone = 'info',
    duration = 5000,
    placement = 'bottom-right',
    dismissLabel = 'Dismiss notification',
  } = options;
  const container = region(placement);
  const toast = document.createElement('output');
  toast.className = 'toast';
  if (tone !== 'info') {
    toast.dataset.variant = tone;
  }
  if (title) {
    const heading = document.createElement('div');
    heading.className = 'toast-title';
    heading.textContent = title;
    toast.append(heading);
  }
  const text = document.createElement('div');
  text.className = 'toast-message';
  text.textContent = message;
  toast.append(text);
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('data-close', '');
  button.setAttribute('aria-label', dismissLabel);
  button.textContent = '×';
  button.addEventListener('click', () => close(toast, container));
  toast.append(button);

  let timer: number | undefined;
  const start = () => {
    if (duration > 0) {
      timer = window.setTimeout(() => close(toast, container), duration);
    }
  };
  toast.addEventListener('mouseenter', () => window.clearTimeout(timer));
  toast.addEventListener('mouseleave', start);

  toast.setAttribute('data-entering', '');
  container.append(toast);
  if (!container.matches(':popover-open')) {
    container.showPopover();
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => toast.removeAttribute('data-entering')),
  );
  start();
  return toast;
}

/** Remove every toast, or only those in one placement. */
export function clearToasts(placement?: ToastPlacement) {
  document.querySelectorAll<HTMLElement>(regionSelector).forEach(element => {
    if (!placement || element.dataset.placement === placement) {
      element.replaceChildren();
      if (element.matches(':popover-open')) {
        element.hidePopover();
      }
    }
  });
}
