import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Reusable unsaved-changes protection.
 *
 * - Blocks in-app React Router navigation while `isDirty` is true
 *   (requires the app's data router — see src/App.jsx).
 * - Registers the window `beforeunload` handler (refresh / tab close) while dirty.
 * - `markClean()` synchronously disarms the guard — call it right before an
 *   intentional navigation (after a successful save/submit, or a cancel/discard).
 *
 * @param {boolean|function} isDirty recomputed on every render
 * @returns {{ blocker: object, markClean: () => void }}
 */
export function useUnsavedChanges(isDirty) {
  const getDirtyRef = useRef(() => false);
  getDirtyRef.current = () => (typeof isDirty === "function" ? !!isDirty() : !!isDirty);

  const overrideRef = useRef(false);
  const prevDirtyRef = useRef(false);

  // Re-arm the override whenever a new editing session starts (false -> true)
  const dirty = getDirtyRef.current();
  if (dirty && !prevDirtyRef.current) overrideRef.current = false;
  prevDirtyRef.current = dirty;

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !overrideRef.current &&
    getDirtyRef.current() &&
    (currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search));

  // Browser refresh / tab close
  useEffect(() => {
    const handler = (e) => {
      if (!overrideRef.current && getDirtyRef.current()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const markClean = () => {
    overrideRef.current = true;
  };

  return { blocker, markClean };
}