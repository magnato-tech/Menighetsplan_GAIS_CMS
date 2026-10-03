import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../../../context/CmsContext";
import { CmsSettings } from "../../../data/cmsData";
import {
  MapPin,
  Building2,
  Heart,
  Save,
  Palette,
  ArrowRight,
} from "lucide-react";

export const SiteSettingsTab: React.FC = () => {
  const { settings, saveSettings } = useCms();

  const [settingsForm, setSettingsForm] = useState<CmsSettings>({ ...settings });

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(settingsForm);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-white">Nettside-innstillinger</h2>
        <p className="text-xs text-slate-400">
          Oppdater menighetens faste informasjon, Vipps-nummer, bankkonto, adresse og sosiale medier.
        </p>
      </div>

      {/* Design System Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0">
            <Palette className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Menighetens Designsystem & Fargetema</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Globale fargeprofiler, typografi, overflater og spacing administreres sentralt under fanen «Tema & Designsystem».
            </p>
          </div>
        </div>
        <Link
          to="/admin?tab=cms-design"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
        >
          <span>Åpne Tema & Design</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Menighet & Merkevare */}
        <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Menighet & Merkevare</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Menighetens offisielle navn</label>
              <input
                type="text"
                value={settingsForm.churchName}
                onChange={(e) => setSettingsForm({ ...settingsForm, churchName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Plattformnavn</label>
              <input
                type="text"
                value={settingsForm.appName}
                onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Slagord / Visjon</label>
            <input
              type="text"
              value={settingsForm.tagline}
              onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Hovedoverskrift på forsiden (Hero)</label>
            <input
              type="text"
              value={settingsForm.welcomeHeadline}
              onChange={(e) => setSettingsForm({ ...settingsForm, welcomeHeadline: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Ingresstekst på forsiden</label>
            <textarea
              rows={2}
              value={settingsForm.welcomeSubtext}
              onChange={(e) => setSettingsForm({ ...settingsForm, welcomeSubtext: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Gaver & Vipps */}
        <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Givertjeneste & Vipps</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Vipps-nummer</label>
              <input
                type="text"
                value={settingsForm.vippsNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, vippsNumber: e.target.value })}
                placeholder="#12345"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Bankkontonummer</label>
              <input
                type="text"
                value={settingsForm.bankAccount}
                onChange={(e) => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })}
                placeholder="1503.xx.xxxxx"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Organisasjonsnummer</label>
              <input
                type="text"
                value={settingsForm.orgNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, orgNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Kontaktinformasjon & Adresse */}
        <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Adresse & Kontakt</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Besøksadresse</label>
              <input
                type="text"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Telefon</label>
              <input
                type="text"
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">E-post</label>
              <input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Kontortid</label>
              <input
                type="text"
                value={settingsForm.officeHours}
                onChange={(e) => setSettingsForm({ ...settingsForm, officeHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lagre alle innstillinger</span>
          </button>
        </div>
      </form>
    </div>
  );
};
