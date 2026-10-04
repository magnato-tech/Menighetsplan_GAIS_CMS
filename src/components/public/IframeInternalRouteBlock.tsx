import { Link } from "react-router-dom";

/** Shown inside iframe when navigation reaches a non-public route (fallback). */
export function IframeInternalRouteBlock() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-16 text-center space-y-4">
      <h1 className="text-xl font-bold text-stone-900">Ikke tilgjengelig i forhåndsvisning</h1>
      <p className="text-sm text-stone-600 max-w-md">
        Admin og Min side åpnes utenfor forhåndsvisningsrammen. Fortsett redigeringen i CMS-vinduet.
      </p>
      <Link
        to="/?preview=true&embedded=1"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-700 text-white text-sm font-bold"
      >
        Tilbake til nettsiden
      </Link>
    </div>
  );
}
