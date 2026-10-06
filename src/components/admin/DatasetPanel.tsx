import React, { useRef, useState } from "react";
import { AlertTriangle, Download, FileUp, Loader2, Package, Upload } from "lucide-react";
import { useCms } from "../../context/CmsContext";
import { clearDatabase, databaseHasContent, exportDataset, importDataset } from "../../services/datasetService";
import { DATA_PARTS, DATA_PART_CONTENTS, DATA_PART_LABELS, countByPart, keepParts, type DataPart } from "../../utils/dataParts";
import {
  collectionLabel,
  countDataset,
  datasetFileName,
  parseDataset,
  serializeDataset,
  totalDocuments,
  type ParsedDataset,
} from "../../utils/dataset";
import type { ShowFeedback } from "../../pages/admin/studio";
import { studioInputFull, studioPrimaryButton, studioSecondaryButton } from "../../pages/admin/studioTheme";
import { DatasetImportDialog } from "./DatasetImportDialog";

interface DatasetPanelProps {
  showFeedback: ShowFeedback;
}

/** Hands the text to the browser as a file to save. */
function saveAsFile(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** The collections by the names the admin uses, e.g. «Bilder» og «Personer». */
const quoted = (collectionNames: string[]): string => collectionNames.map((name) => `«${collectionLabel(name)}»`).join(" og ");

const madeOn = (isoString: string): string => {
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
};

/** «nettsiden» or «planleggeren» when one part is chosen, otherwise «databasen». */
const scopeOf = (parts: readonly DataPart[]): string =>
  parts.length === 1 ? DATA_PART_LABELS[parts[0]].toLowerCase() : "databasen";
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const checkboxClass =
  "w-4 h-4 rounded text-indigo-600 bg-[var(--studio-panel-bg)] border-[var(--studio-border)] cursor-pointer disabled:cursor-not-allowed";

/**
 * Downloads the database as one file, and brings such a file in again: all of it, or only the
 * website or only the planner (see utils/dataParts.ts). This is how the content is swapped,
 * for instance the demo website for a congregation's own while the test persons stay.
 */
export const DatasetPanel: React.FC<DatasetPanelProps> = ({ showFeedback }) => {
  const { settings } = useCms();
  const [name, setName] = useState("");
  const [exportParts, setExportParts] = useState<DataPart[]>([...DATA_PARTS]);
  const [importParts, setImportParts] = useState<DataPart[]>([...DATA_PARTS]);
  const [working, setWorking] = useState<"export" | "check" | "import" | "replace" | null>(null);
  const [asking, setAsking] = useState(false);
  // What the replace is doing right now, shown in the dialog while it runs
  const [step, setStep] = useState<string | null>(null);
  const [chosen, setChosen] = useState<{ fileName: string; parsed: ParsedDataset } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const toggle = (parts: DataPart[], part: DataPart): DataPart[] =>
    DATA_PARTS.filter((p) => (p === part ? !parts.includes(p) : parts.includes(p)));

  const handleExport = async () => {
    setWorking("export");
    try {
      const { dataset, unreadable } = await exportDataset(name.trim() || settings.churchName, "", new Date(), exportParts);
      const total = totalDocuments(dataset);
      if (total === 0) {
        showFeedback(`${capitalized(scopeOf(exportParts))} er tom. Det er ingenting å laste ned.`, "error");
        return;
      }
      saveAsFile(datasetFileName(dataset), serializeDataset(dataset));
      const leftOut = unreadable.length > 0 ? ` ${quoted(unreadable)} kunne ikke leses fra databasen og er ikke med.` : "";
      showFeedback(`Datasettet «${dataset.name}» er lastet ned (${total} dokumenter).${leftOut}`);
    } catch (error) {
      showFeedback(`Datasettet ble ikke lastet ned: ${error instanceof Error ? error.message : "ukjent feil"}`, "error");
    } finally {
      setWorking(null);
    }
  };

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so that choosing the same file again is noticed
    event.target.value = "";
    if (!file) return;
    const parsed = parseDataset(await file.text());
    setChosen({ fileName: file.name, parsed });
    // Every part the file has content for is brought in, until the admin unticks one
    if (parsed.ok) {
      const inFile = countByPart(parsed.dataset.collections);
      setImportParts(DATA_PARTS.filter((part) => inFile[part] > 0));
    }
  };

  const parsed = chosen?.parsed;
  const inFile = parsed?.ok ? countByPart(parsed.dataset.collections) : null;
  // What is brought in: the parts of the file the admin has left ticked
  const selected = parsed?.ok ? { ...parsed.dataset, collections: keepParts(parsed.dataset.collections, importParts) } : null;
  const selectedTotal = selected ? totalDocuments(selected) : 0;
  const scope = scopeOf(importParts);

  /**
   * The database is emptied only by an explicit yes, and with nothing in the parts concerned there
   * is nothing to ask about. The database itself is asked, not the counters on screen, which read
   * zero while the page is still loading. If it cannot say, the question is put anyway: asking
   * once too often costs a click, while not asking would mix the content unannounced.
   */
  const handleImportClicked = async () => {
    setWorking("check");
    const hasContent = await databaseHasContent(importParts).catch(() => true);
    setWorking(null);
    if (hasContent) setAsking(true);
    else await addDataset();
  };

  /** Copy, empty, bring in: the three steps of a yes, each named on screen while it runs. */
  const replaceWithDataset = async () => {
    if (!selected) return;
    const describe = (error: unknown) => (error instanceof Error ? error.message : "ukjent feil");
    let copyNote = "";
    let emptied = false;
    setWorking("replace");
    try {
      // The copy is of everything, also the part that is not being replaced
      setStep("Laster ned en sikkerhetskopi av det som ligger i databasen …");
      const backup = await exportDataset(`Sikkerhetskopi ${settings.churchName}`);
      if (totalDocuments(backup.dataset) > 0) {
        const backupFile = datasetFileName(backup.dataset);
        saveAsFile(backupFile, serializeDataset(backup.dataset));
        copyNote = ` Sikkerhetskopien heter ${backupFile}.`;
      }

      setStep(`Sletter alt i ${scope} …`);
      const cleared = await clearDatabase(importParts);
      if (cleared.failures.length > 0) {
        const named = cleared.failures.map((f) => f.collection).filter(Boolean);
        const what = named.length > 0 ? `${quoted(named)} kunne ikke slettes` : "Databasen kunne ikke leses, så ingenting er slettet";
        showFeedback(
          `${capitalized(scope)} ble ikke tømt helt, og datasettet er ikke hentet inn. ${what}: ${cleared.failures[0].message}.${copyNote}`,
          "error"
        );
        return;
      }
      emptied = true;

      setStep(`Henter inn «${selected.name}» …`);
      const result = await importDataset(selected);
      if (result.failures.length > 0) {
        showFeedback(
          `${capitalized(scope)} er tømt, men datasettet ble ikke hentet inn i sin helhet. ${quoted(result.failures.map((f) => f.collection))} ble ikke lagret: ${result.failures[0].message}.${copyNote}`,
          "error"
        );
      } else {
        showFeedback(
          `${capitalized(scope)} er tømt (${cleared.deleted} dokumenter slettet), og «${selected.name}» er hentet inn (${result.total} dokumenter).${copyNote}`
        );
        setChosen(null);
      }
    } catch (error) {
      showFeedback(
        emptied
          ? `${capitalized(scope)} er tømt, men datasettet ble ikke hentet inn: ${describe(error)}.${copyNote}`
          : copyNote
          ? `Slettingen ble avbrutt, og datasettet er ikke hentet inn: ${describe(error)}.${copyNote}`
          : `Sikkerhetskopien kunne ikke lages, så ingenting er slettet eller hentet inn: ${describe(error)}`,
        "error"
      );
    } finally {
      setWorking(null);
      setStep(null);
      setAsking(false);
    }
  };

  /** Brings the dataset in on top of what is there. Nothing is deleted. */
  const addDataset = async () => {
    if (!selected) return;
    setAsking(false);
    setWorking("import");
    try {
      const result = await importDataset(selected);
      if (result.failures.length > 0) {
        showFeedback(
          `Datasettet ble ikke hentet inn i sin helhet. ${quoted(result.failures.map((f) => f.collection))} ble ikke lagret: ${result.failures[0].message}`,
          "error"
        );
      } else {
        showFeedback(`Datasettet «${selected.name}» er hentet inn (${result.total} dokumenter).`);
        setChosen(null);
      }
    } catch (error) {
      showFeedback(`Datasettet ble ikke hentet inn: ${error instanceof Error ? error.message : "ukjent feil"}`, "error");
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] space-y-4">
      <div>
        <h3 className="text-base font-bold text-[var(--studio-text)] flex items-center gap-2">
          <Package className="w-4 h-4 text-[var(--studio-icon)]" />
          <span>Datasett</span>
        </h3>
        <p className="text-xs text-[var(--studio-muted)] mt-0.5 max-w-3xl leading-relaxed">
          Et datasett er innholdet samlet i én fil. Databasen har to deler som kan lastes ned og hentes inn hver for seg:
          <strong className="text-[var(--studio-text)]"> nettsiden</strong> ({DATA_PART_CONTENTS.website}) og
          <strong className="text-[var(--studio-text)]"> planleggeren</strong> ({DATA_PART_CONTENTS.planner}). Slik kan
          menighetens egen nettside ligge inne mens planleggeren fylles med testpersoner, eller omvendt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <span className="font-bold text-[var(--studio-text)] text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[var(--studio-icon)]" />
              <span>Last ned det som ligger i databasen</span>
            </span>
            <div>
              <label htmlFor="dataset-name" className="block text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">
                Navn på datasettet
              </label>
              <input
                id="dataset-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={settings.churchName}
                className={studioInputFull}
              />
            </div>
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1.5">
              <legend className="text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">Ta med</legend>
              {DATA_PARTS.map((part) => (
                <label key={part} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--studio-text)]">
                  <input
                    type="checkbox"
                    checked={exportParts.includes(part)}
                    onChange={() => setExportParts(toggle(exportParts, part))}
                    className={checkboxClass}
                  />
                  <span>{DATA_PART_LABELS[part]}</span>
                </label>
              ))}
            </fieldset>
            <p className="text-[11px] text-[var(--studio-muted)] leading-relaxed">
              Planleggeren inneholder navn, telefon og e-post til personene i registeret. Ta vare på filen deretter. Bilder
              som er lastet opp, ligger ikke i filen; den viser til dem der de er lagret.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={working !== null || exportParts.length === 0}
            className={`${studioPrimaryButton} px-4 py-2 text-xs flex items-center gap-2 self-start disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {working === "export" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {working === "export" ? "Laster ned…" : "Last ned datasett"}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <span className="font-bold text-[var(--studio-text)] text-xs flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[var(--studio-icon)]" />
              <span>Hent inn et datasett fra fil</span>
            </span>
            <p className="text-[11px] text-[var(--studio-muted)] leading-relaxed">
              Du velger hvilke deler av filen som hentes inn. Har den delen av databasen innhold fra før, blir du spurt om
              den skal tømmes først. Det anbefales når du bytter innhold, så gammelt og nytt ikke blandes. Den andre delen
              røres ikke.
            </p>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChosen}
            aria-label="Datasettfil"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={working !== null}
            className={`${studioSecondaryButton} py-2 flex items-center gap-2 self-start disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <FileUp className="w-3.5 h-3.5" />
            {chosen ? "Velg en annen fil" : "Velg fil"}
          </button>
        </div>
      </div>

      {chosen && parsed && !parsed.ok && (
        <p role="alert" className="text-xs font-bold text-[var(--studio-warn)] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {chosen.fileName}: {parsed.error}
          </span>
        </p>
      )}

      {chosen && parsed?.ok && selected && inFile && (
        <div className="p-4 rounded-xl bg-[var(--studio-accent-bg)] border border-[var(--studio-accent-border)] space-y-3">
          <div>
            <p className="text-sm font-bold text-[var(--studio-text)]">{parsed.dataset.name}</p>
            <p className="text-[11px] text-[var(--studio-muted)]">
              {[chosen.fileName, madeOn(parsed.dataset.createdAt) && `laget ${madeOn(parsed.dataset.createdAt)}`, `${parsed.total} dokumenter`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {parsed.dataset.description && (
              <p className="text-xs text-[var(--studio-muted)] mt-1.5 leading-relaxed">{parsed.dataset.description}</p>
            )}
          </div>

          <fieldset className="flex flex-wrap gap-x-5 gap-y-1.5">
            <legend className="text-[11px] font-bold text-[var(--studio-muted)] mb-1.5">Hent inn</legend>
            {DATA_PARTS.map((part) => (
              <label
                key={part}
                className={`flex items-center gap-2 text-xs font-semibold text-[var(--studio-text)] ${inFile[part] > 0 ? "cursor-pointer" : "opacity-60"}`}
              >
                <input
                  type="checkbox"
                  checked={importParts.includes(part)}
                  disabled={inFile[part] === 0 || working !== null}
                  onChange={() => setImportParts(toggle(importParts, part))}
                  className={checkboxClass}
                />
                <span>
                  {DATA_PART_LABELS[part]} ({inFile[part] > 0 ? `${inFile[part]} dokumenter` : "ikke i filen"})
                </span>
              </label>
            ))}
          </fieldset>

          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {countDataset(selected).map((entry) => (
              <li
                key={entry.collection}
                className="px-3 py-2 rounded-lg bg-[var(--studio-surface)] border border-[var(--studio-border)]"
              >
                <span className="block text-base font-black text-[var(--studio-text)]">{entry.count}</span>
                <span className="block text-[11px] text-[var(--studio-muted)]">{entry.label}</span>
              </li>
            ))}
          </ul>

          {parsed.skipped.length > 0 && (
            <p className="text-[11px] font-bold text-[var(--studio-warn)]">
              Filen har innhold denne utgaven av Menighetsplan ikke kjenner. Det hentes ikke inn.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleImportClicked}
              disabled={working !== null || selectedTotal === 0}
              className={`${studioPrimaryButton} px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {working === "import" || working === "check" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {working === "import" ? "Henter inn…" : "Hent inn datasettet"}
            </button>
            <button
              type="button"
              onClick={() => setChosen(null)}
              disabled={working !== null}
              className={`${studioSecondaryButton} py-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {asking && selected && (
        <DatasetImportDialog
          datasetName={selected.name}
          datasetTotal={selectedTotal}
          scope={scope}
          scopeContents={importParts.map((part) => DATA_PART_CONTENTS[part]).join(", og ")}
          untouched={importParts.length === 1 ? DATA_PART_LABELS[DATA_PARTS.find((part) => part !== importParts[0])!].toLowerCase() : undefined}
          step={step}
          onReplace={replaceWithDataset}
          onAdd={addDataset}
          onCancel={() => setAsking(false)}
        />
      )}
    </section>
  );
};
