import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// The page scrolls inside the layout's content container (between the sticky
// header and the footer), not the browser window — window.scrollTo alone
// has no effect on this app.
const getScrollContainer = () => document.getElementById('main-scroll-container');

export default function ScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const scrollPositions = useRef(new Map());
  const prevPathname = useRef(null);

  useEffect(() => {
    const container = getScrollContainer();
    const prev = prevPathname.current;

    // Save the scroll position of the page we are leaving (the container
    // keeps its offset across route changes, so reading it now is safe).
    if (prev && container) {
      scrollPositions.current.set(prev, container.scrollTop);
    }

    if (location.hash) {
      // In-page anchor link: scroll to the target element instead
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView();
    } else if (navType === 'POP' && scrollPositions.current.has(location.pathname)) {
      // Back/forward: return the user to where they were on that page
      const top = scrollPositions.current.get(location.pathname);
      container?.scrollTo({ top });
      window.scrollTo(0, top);
    } else {
      // Regular navigation (link click, redirect): land at the top
      container?.scrollTo({ top: 0 });
      window.scrollTo(0, 0);
    }

    prevPathname.current = location.pathname;
  }, [location, navType]);

  return null;
}