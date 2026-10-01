import React from "react";
import { useParams, Link } from "react-router-dom";
import { useCms } from "../../context/CmsContext";
import {
  ArrowLeft,
  Calendar,
  Heart,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  HelpCircle,
  Users,
  Shield,
  Sparkles,
} from "lucide-react";

interface PublicStaticPageProps {
  forcedSlug?: string;
}

export const PublicStaticPage: React.FC<PublicStaticPageProps> = ({ forcedSlug }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const { getPageBySlug, staff, settings } = useCms();

  const currentSlug = forcedSlug || paramSlug || "om-oss";
  const page = getPageBySlug(currentSlug);

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-black text-stone-900">Siden ble ikke funnet</h1>
        <p className="text-sm text-stone-600">
          Siden med adresse «/{currentSlug}» eksisterer ikke eller er ikke publisert ennå.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til forsiden</span>
        </Link>
      </div>
    );
  }

  // Render markdown-like sections cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl sm:text-2xl font-black text-stone-900 mt-6 mb-2">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-stone-900 mt-4 mb-1">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-stone-700 text-sm leading-relaxed my-1">
            {trimmed.replace("- ", "")}
          </li>
        );
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-stone-700 text-sm sm:text-base leading-relaxed my-1.5">
          {trimmed}
        </p>
      );
    });
  };

  const isAboutPage = currentSlug.includes("om-oss");
  const isContactPage = currentSlug.includes("kontakt");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-stone-200 pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til forsiden</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
          {page.title}
        </h1>
        {page.summary && (
          <p className="text-base sm:text-lg text-stone-600 max-w-2xl font-medium leading-relaxed">
            {page.summary}
          </p>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-10 shadow-xs space-y-4">
        {renderFormattedContent(page.content)}
      </div>

      {/* Lederskap & Stab (vises under Om oss) */}
      {isAboutPage && (
        <section className="space-y-6 pt-4">
          <div className="border-b border-stone-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-700" />
                <span>Lederskap & Stab</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Pastoren, ansatte i staben og menighetens valgte lederskap.
              </p>
            </div>
            <Link
              to="/lederskap"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-3.5 py-2 rounded-xl transition-colors"
            >
              <span>Se full oversikt over Stab & Lederskap</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {staff.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
                    {person.role}
                  </span>
                  <h3 className="font-bold text-stone-900 text-lg">{person.name}</h3>
                  {person.bio && <p className="text-xs text-stone-500 leading-relaxed">{person.bio}</p>}
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-col gap-1.5 text-xs text-stone-600">
                  {person.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <a href={`tel:${person.phone}`} className="hover:text-stone-900">
                        {person.phone}
                      </a>
                    </div>
                  )}
                  {person.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <a href={`mailto:${person.email}`} className="hover:text-stone-900 truncate">
                        {person.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Special highlight box for Contact Page */}
      {isContactPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-indigo-700" />
              <span>Givertjeneste & Skattefradrag</span>
            </h3>
            <p className="text-xs text-indigo-900/80 leading-relaxed">
              Vi setter stor pris på alle faste givere og enkeltgaver. Gaver over 500 kr i året rapporteres til Skatteetaten for fradrag dersom du oppgir fødselsnummer.
            </p>
            <div className="pt-2 text-xs font-bold text-indigo-950">
              Vipps: {settings.vippsNumber} · Konto: {settings.bankAccount}
            </div>
          </div>

          <div className="bg-stone-100 border border-stone-200 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-700" />
              <span>Kontortid & Samtaler</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pastoren og menighetens ledere er tilgjengelige for personlige samtaler, sjelesorg, bønn eller praktiske spørsmål. Ta kontakt via e-post eller telefon.
            </p>
            <div className="pt-2 text-xs font-bold text-stone-800">
              {settings.email} · Tlf {settings.phone}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
