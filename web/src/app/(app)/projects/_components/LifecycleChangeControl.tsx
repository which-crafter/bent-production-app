/**
 * Lifecycle change control component - manages project lifecycle state transitions.
 * 
 * Module 2 — Portion D: Project Detail Page
 * 
 * Enforces forward-only transitions by default, supports Hold semantics,
 * and allows override transitions with required override reason.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LifecycleState } from "@/app/ops/types";
import { updateProjectLifecycleState } from "@/app/ops/actions";

interface LifecycleChangeControlProps {
  projectId: string;
  currentState: LifecycleState;
  prevLifecycleState?: LifecycleState;
}

/**
 * Helper: Get the next state in the forward chain.
 * Forward chain: quote -> awarded -> released -> active -> closed
 */
function getNextState(currentState: LifecycleState): LifecycleState | null {
  const forwardChain: Record<LifecycleState, LifecycleState | null> = {
    quote: "awarded",
    awarded: "released",
    released: "active",
    active: "closed",
    closed: null, // closed is terminal
    hold: null, // hold is special, not in forward chain
  };
  return forwardChain[currentState] || null;
}

/**
 * Formats lifecycle state for display.
 * Capitalizes first letter for better readability.
 */
function formatLifecycleState(state: LifecycleState): string {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

/**
 * All lifecycle states in order.
 */
const ALL_STATES: LifecycleState[] = [
  "quote",
  "awarded",
  "released",
  "active",
  "closed",
  "hold",
];

/**
 * Lifecycle change control component.
 * 
 * Manages lifecycle state transitions with:
 * - Forward-only transitions by default
 * - Hold entry from any state (optional hold reason)
 * - Hold resume only to prev_lifecycle_state
 * - Override mode requiring explicit action + override reason
 */
export function LifecycleChangeControl({
  projectId,
  currentState,
  prevLifecycleState,
}: LifecycleChangeControlProps) {
  const router = useRouter();
  const [overrideMode, setOverrideMode] = useState(false);
  const [showHoldReason, setShowHoldReason] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nextState = getNextState(currentState);
  const isInHold = currentState === "hold";

  /**
   * Handles lifecycle state transition.
   */
  const handleTransition = async (targetState: LifecycleState) => {
    setIsTransitioning(true);
    setError(null);
    setSuccess(false);

    // Determine if we need hold reason or override reason
    const needsHoldReason = targetState === "hold" && showHoldReason;
    const needsOverrideReason = overrideMode;

    const result = await updateProjectLifecycleState({
      projectId,
      targetState,
      override: overrideMode,
      overrideReason: needsOverrideReason ? overrideReason : undefined,
      holdReason: needsHoldReason ? holdReason : undefined,
    });

    if (result.ok) {
      setSuccess(true);
      setOverrideMode(false);
      setShowHoldReason(false);
      setHoldReason("");
      setOverrideReason("");
      setTimeout(() => {
        setSuccess(false);
        // Refresh the page to show updated state
        router.refresh();
      }, 1000);
    } else {
      setError(result.error || "Failed to update lifecycle state");
    }

    setIsTransitioning(false);
  };

  /**
   * Gets available transitions based on current state and mode.
   */
  const getAvailableTransitions = (): LifecycleState[] => {
    if (overrideMode) {
      // Override mode: allow any transition except current state
      return ALL_STATES.filter((state) => state !== currentState);
    }

    if (isInHold) {
      // In Hold: only allow resume to prev_lifecycle_state
      if (prevLifecycleState) {
        return [prevLifecycleState];
      }
      return [];
    }

    // Normal mode: forward-only transitions + Hold
    const transitions: LifecycleState[] = [];
    if (nextState) {
      transitions.push(nextState);
    }
    // Hold is always available from any non-hold state
    transitions.push("hold");
    return transitions;
  };

  const availableTransitions = getAvailableTransitions();

  return (
    <div className="space-y-4">
      {/* Current State Display */}
      <div>
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Current: {formatLifecycleState(currentState)}
          </span>
          {isInHold && prevLifecycleState && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              (Resume to: {formatLifecycleState(prevLifecycleState)})
            </span>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            Lifecycle state updated successfully
          </p>
        </div>
      )}

      {/* Override Mode Toggle */}
      {!isInHold && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="override-mode"
            checked={overrideMode}
            onChange={(e) => {
              setOverrideMode(e.target.checked);
              setOverrideReason("");
              setError(null);
            }}
            className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="override-mode"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Enable Override Mode (allows any transition)
          </label>
        </div>
      )}

      {/* Override Reason Input */}
      {overrideMode && (
        <div>
          <label
            htmlFor="override-reason"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Override Reason *
          </label>
          <textarea
            id="override-reason"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Required: Explain why this non-forward transition is needed"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>
      )}

      {/* Hold Reason Input */}
      {showHoldReason && (
        <div>
          <label
            htmlFor="hold-reason"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Hold Reason (Optional)
          </label>
          <textarea
            id="hold-reason"
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            placeholder="Optional: Reason for placing project on hold"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
      )}

      {/* Transition Buttons */}
      <div className="flex flex-wrap gap-2">
        {availableTransitions.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isInHold && !prevLifecycleState
              ? "Cannot resume: previous state is missing"
              : "No available transitions"}
          </p>
        ) : (
          availableTransitions.map((targetState) => {
            const isHold = targetState === "hold";
            const isResume = isInHold && targetState === prevLifecycleState;
            const needsOverrideReason = overrideMode && !overrideReason.trim();
            const isDisabled = isTransitioning || needsOverrideReason;

            return (
              <button
                key={targetState}
                onClick={() => {
                  if (isHold && !showHoldReason) {
                    // Show hold reason input first
                    setShowHoldReason(true);
                    return;
                  }
                  handleTransition(targetState);
                }}
                disabled={isDisabled}
                className={`
                  px-4 py-2 text-sm font-medium rounded transition-colors
                  ${
                    isHold
                      ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800"
                      : isResume
                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isResume
                  ? `Resume to ${formatLifecycleState(targetState)}`
                  : isHold
                  ? showHoldReason
                    ? "Place on Hold"
                    : "Place on Hold..."
                  : `Transition to ${formatLifecycleState(targetState)}`}
              </button>
            );
          })
        )}
      </div>

      {/* Cancel Hold Reason */}
      {showHoldReason && (
        <button
          onClick={() => {
            setShowHoldReason(false);
            setHoldReason("");
          }}
          className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
