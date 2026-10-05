import React from "react";
import { isChunkLoadError, tryAutoReloadForStaleChunk } from "../utils/lazyImport";

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
}

interface ChunkErrorBoundaryState {
  error: unknown | null;
}

/**
 * Catches stale dynamic-import failures on lazy routes.
 * Reloads once, then shows a manual retry if the chunk is still missing.
 */
export class ChunkErrorBoundary extends React.Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  state: ChunkErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) {
      tryAutoReloadForStaleChunk();
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      if (!isChunkLoadError(error)) throw error;
      return (
        <div className="p-6 text-sm text-slate-600 space-y-3">
          <p>En ny versjon av løsningen er tilgjengelig, men denne fanen har ikke lastet den ennå.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Last siden på nytt
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
