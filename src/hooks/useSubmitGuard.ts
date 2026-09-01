import { useRef } from "react";

/**
 * A synchronous, ref-backed guard against double-submitting an async action
 * (Generate) from two click events that both start before React's own
 * `loading` state has re-rendered the button's `disabled` attribute.
 * `useState` alone isn't a sufficient guard here: a `setState` call inside a
 * click handler doesn't take effect in the DOM until React's next commit,
 * so two click events queued close enough together (a fast double-click, a
 * stuck key/tap) can both read the same stale "not loading" value and both
 * begin the async handler before either commit lands. A ref mutation, by
 * contrast, takes effect immediately and is visible to every subsequent
 * invocation in the same tab -- no render/commit cycle involved.
 *
 * Not a global lock: each `useSubmitGuard()` call creates its own private
 * ref, scoped to the one component instance (and therefore the one Generate
 * action) that called it. It shares no state with any other component's
 * guard, and it cannot protect against two independent browser tabs/devices
 * submitting the same request -- only the credit RPC itself could do that,
 * and this hook does not attempt to change or replace it.
 *
 * Usage: call `tryAcquire()` as the very first line of the handler and bail
 * out immediately if it returns false (a call is already in flight); call
 * `release()` in a `finally` block that wraps the entire handler body so
 * every exit path -- an early validation return, success, or a thrown
 * error -- frees it again for the next intentional click.
 */
export function useSubmitGuard() {
  const inFlight = useRef(false);
  return {
    tryAcquire: () => {
      if (inFlight.current) return false;
      inFlight.current = true;
      return true;
    },
    release: () => {
      inFlight.current = false;
    },
  };
}
