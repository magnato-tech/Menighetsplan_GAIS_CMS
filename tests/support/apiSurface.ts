import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

/**
 * What the code offers to the rest of the code: every exported name per file, what the two contexts
 * hand out, and the routes. Read with the TypeScript compiler, so it needs no running app.
 */
export interface ApiSurface {
  exports: Record<string, string[]>;
  contexts: Record<string, string[]>;
  routes: string[];
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function parse(path: string) {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.ES2022, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function exportsOf(path: string): string[] {
  const names: string[] = [];
  parse(path).forEachChild((n) => {
    const mods = ts.canHaveModifiers(n) ? ts.getModifiers(n) : undefined;
    const exported = mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = mods?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (exported && ts.isVariableStatement(n)) n.declarationList.declarations.forEach((d) => names.push(d.name.getText()));
    else if (exported && (n as ts.NamedDeclaration).name) names.push(isDefault ? "default" : (n as ts.NamedDeclaration).name!.getText());
    else if (ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause)) n.exportClause.elements.forEach((e) => names.push(e.name.getText()));
    else if (ts.isExportAssignment(n)) names.push("default");
  });
  return names.sort();
}

function interfaceMembers(path: string, name: string): string[] {
  let members: string[] = [];
  parse(path).forEachChild((n) => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === name) members = n.members.map((m) => m.name?.getText() ?? "").filter(Boolean);
  });
  return members.sort();
}

export function readSurface(root: string): ApiSurface {
  const exports: Record<string, string[]> = {};
  for (const dir of ["src", "server"]) {
    for (const file of files(join(root, dir))) {
      const rel = relative(root, file).split("\\").join("/");
      if (rel.startsWith("src/tests/")) continue;
      exports[rel] = exportsOf(file);
    }
  }
  exports["server.ts"] = exportsOf(join(root, "server.ts"));

  const routeSources = ["src/App.tsx", "src/MinSideApp.tsx"].flatMap((f) => {
    try {
      return [readFileSync(join(root, f), "utf8")];
    } catch {
      return [];
    }
  });
  const routes = routeSources.flatMap((s) => [...s.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1])).sort();

  return {
    exports,
    contexts: {
      useFirebase: interfaceMembers(join(root, "src/context/FirebaseDataContext.tsx"), "FirebaseDataContextType"),
      useCms: interfaceMembers(join(root, "src/context/CmsContext.tsx"), "CmsContextValue"),
    },
    routes,
  };
}
