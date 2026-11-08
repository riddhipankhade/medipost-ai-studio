/**
 * mount-support-chat.mjs
 *
 * Run from the repo root:
 *     node mount-support-chat.mjs
 *
 * Adds two lines to src/components/app-shell.tsx: the import, and
 * <SupportChat /> just after the shell's closing </main>.
 *
 * The import is placed after the LAST existing import line, found by scanning
 * rather than by matching a fixed anchor — so it works whatever your import
 * list currently looks like.
 *
 * SAFETY
 *   • The mount anchor must match exactly once, or nothing is written.
 *   • CRLF detected and preserved.
 *   • Timestamped .bak written first.
 *   • Re-running after success is a no-op.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SHELL = join(process.cwd(), "src", "components", "app-shell.tsx");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

function die(msg) {
  console.error(`\n  FAILED: ${msg}\n  Nothing was written.\n`);
  process.exit(1);
}

if (!existsSync(SHELL)) die(`Not found: ${SHELL}\n  Run from the repo root.`);

const raw = readFileSync(SHELL, "utf8");
const usesCRLF = raw.includes("\r\n");
const src = usesCRLF ? raw.replace(/\r\n/g, "\n") : raw;
const toFileEol = (s) => (usesCRLF ? s.replace(/\n/g, "\r\n") : s);

if (src.includes("<SupportChat />")) {
  console.log("\n  Already mounted — nothing to do.\n");
  process.exit(0);
}

// ── 1. The import, after the last existing import line ──────────

const lines = src.split("\n");
let lastImport = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^import\s/.test(lines[i])) lastImport = i;
}
if (lastImport === -1) die("No import statements found in app-shell.tsx — is this the right file?");

lines.splice(lastImport + 1, 0, `import { SupportChat } from "@/components/support-chat";`);
let next = lines.join("\n");

// ── 2. The mount, after the shell's closing </main> ─────────────

const MOUNT_ANCHOR = `      </main>
    </div>
  );
}`;

const MOUNT_NEW = `      </main>
      {/* Floating support chat. Inside the signed-in shell on purpose — the
          support-chat Edge Function needs the customer's session. */}
      <SupportChat />
    </div>
  );
}`;

let hits = 0, i = 0;
for (;;) {
  const at = next.indexOf(MOUNT_ANCHOR, i);
  if (at === -1) break;
  hits++;
  i = at + MOUNT_ANCHOR.length;
}

if (hits !== 1) {
  die(
    `The mount point matched ${hits} time(s), expected exactly 1.\n` +
    `  Expected to find this at the end of the component:\n\n` +
    MOUNT_ANCHOR.split("\n").map((l) => "      " + l).join("\n") +
    `\n\n  Send me app-shell.tsx and I'll adjust it.`,
  );
}

next = next.replace(MOUNT_ANCHOR, MOUNT_NEW);

copyFileSync(SHELL, `${SHELL}.${stamp}.bak`);
writeFileSync(SHELL, toFileEol(next), "utf8");

console.log(`
  Done.
  Import added after line ${lastImport + 1}; <SupportChat /> mounted after </main>.
  Line endings: ${usesCRLF ? "CRLF (preserved)" : "LF"}.

  Backup: app-shell.tsx.${stamp}.bak

  Next:
    npx tsc --noEmit
    npm run dev
`);
