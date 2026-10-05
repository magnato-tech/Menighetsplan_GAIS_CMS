import React from "react";
import { isChunkLoadError } from "../utils/lazyImport";

interface StudioTabErrorBoundaryProps {
  children: React.ReactNode;
}

interface StudioTabErrorBoundaryState {
  error: unknown | null;
}

/**
 * Admin tab panel: never auto-reloads (would discard drafts in other tabs).
 * Offers a manual reload when a stale chunk fails to load.
 */
export class StudioTabErrorBoundary extends React.Component<
  StudioTabErrorBoundaryProps,
  StudioTabErrorBoundaryState
> {
  state: StudioTabErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): StudioTabErrorBoundaryState {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      if (!isChunkLoadError(error)) throw error;
      return (
        <div className="p-8 rounded-2xl border border-slate-700 bg-slate-800/50 text-sm text-slate-300 space-y-3 max-w-md">
          <p>Siden er oppdatert siden du åpnet studioet. Last på nytt for å åpne denne fanen.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
          >
            Last på nytt
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
