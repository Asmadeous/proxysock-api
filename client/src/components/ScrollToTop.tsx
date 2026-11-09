import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    // Run after the destination renders, including lazy-loaded routes.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // The full-height body with overflow-x: hidden is also a scroll container.
    // Its vertical position is independent of window.scrollY.
    document.querySelectorAll<HTMLElement>('html, body, [data-page-scroll]').forEach((container) => {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [pathname]);

  return null;
}
