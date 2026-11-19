import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

let openDialogs = 0;
let previousBodyOverflow = '';

export default function AdminDialog({ children, onClose, label, className = '', ...props }) {
  const panel = useRef(null);
  const close = useRef(onClose);
  const id = useId();
  close.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    if (openDialogs === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogs += 1;
    panel.current?.focus();

    const onKeyDown = event => {
      const dialogs = document.querySelectorAll('[data-admin-dialog]');
      if (dialogs[dialogs.length - 1] !== panel.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current?.();
      }
      if (event.key !== 'Tab') return;
      const controls = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(element => element.getClientRects().length > 0);
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === controls[0] || document.activeElement === panel.current)) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
        event.preventDefault();
        controls[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, []);

  return createPortal(
    <div
      {...props}
      ref={panel}
      data-admin-dialog={id}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className={`font-shop text-sm leading-relaxed text-shop-ink outline-none ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}
