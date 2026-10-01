import React, { useState, useRef, useEffect } from "react";
import { useCurrentUser } from "../hooks/useAppHooks";
import { UserCheck, ChevronDown } from "lucide-react";

export const UserSwitcher: React.FC = () => {
  const { currentUser, allPersons, setCurrentUserId, userGroups } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button with Ring Avatar */}
      <button
        type="button"
        id="user-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-100 p-1.5 rounded-full ring-2 ring-amber-200 hover:ring-amber-300 transition-all cursor-pointer flex items-center gap-1.5 group"
        aria-label="Bytt testbruker"
        title="Klikk for å bytte testbruker"
      >
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs">
          {currentUser.name.charAt(0)}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="user-switcher-dropdown"
          className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Bytt testbruker (Mock)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Se hvordan oppgavene tilpasses brukerens grupper.
            </p>
          </div>

          <div className="space-y-1">
            {allPersons.map((person) => {
              const isSelected = person.id === currentUser.id;
              let groupHint = "";
              if (person.id === "person-1") groupHint = "Global Admin • Leder: Kirkekaffe";
              if (person.id === "person-2") groupHint = "Medlem • Leder: Lyd og bilde";
              if (person.id === "person-3") groupHint = "Medlem • Leder: Søndagsskole";

              return (
                <button
                  key={person.id}
                  type="button"
                  id={`select-user-${person.id}`}
                  onClick={() => {
                    setCurrentUserId(person.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-amber-50/80 border border-amber-200/70"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isSelected ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {person.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">{person.name}</span>
                      {isSelected && <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />}
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {groupHint}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1.5 bg-slate-50 rounded-lg text-[11px] text-slate-500">
            Aktiv bruker: <span className="font-semibold text-slate-700">{currentUser.name}</span>
            <br />
            Medlem i: <span className="text-slate-700 font-medium">{userGroups.map((g) => g.name).join(", ")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const UserQuickSwitcherBar: React.FC = () => {
  const { currentUser, allPersons, setCurrentUserId } = useCurrentUser();

  return (
    <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
        Bytt bruker (Mock)
      </span>
      <div className="flex gap-1.5">
        {allPersons.map((person) => {
          const isSelected = person.id === currentUser.id;
          const shortName = person.name.split(" ")[0];

          return (
            <button
              key={person.id}
              type="button"
              id={`quick-switch-${person.id}`}
              onClick={() => setCurrentUserId(person.id)}
              className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              {shortName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
