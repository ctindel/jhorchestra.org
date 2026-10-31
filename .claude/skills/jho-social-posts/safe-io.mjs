/**
 * Shared helpers for the jho-social-posts scripts (make-social, discover, record):
 *   - writeSafely: the one write path. Refuses a symlink at the target or at the temp path, writes
 *     <file>.tmp in the same folder, then renames it over the target.
 *   - stableJson: the one JSON text for handles.json. Objects whose values are all scalars go on one
 *     line; anything else is expanded. The same value always gives the same bytes.
 *   - isEntryPoint: true when this module's file is the script Node was started with, comparing real
 *     paths on both sides so a symlinked run (/tmp vs /private/tmp) still counts.
 */
import { realpathSync } from 'node:fs';
import { lstat, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

async function lstatOrNull(p) {
  try {
    return await lstat(p);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Write text to a file, atomically: the text goes to `<file>.tmp` in the same folder, then is renamed
 * over `file`. Never writes through a symlink. Refuses an existing file unless `overwrite` is set.
 * @param {string} file
 * @param {string} text
 * @param {{overwrite?: boolean}} [opts]
 * @returns {Promise<string>} the file path
 */
export async function writeSafely(file, text, { overwrite = false } = {}) {
  const st = await lstatOrNull(file);
  if (st?.isSymbolicLink()) throw new Error(`${file} is a symlink; refusing to write through it`);
  if (st && !overwrite) throw new Error(`${file} already exists and was not overwritten (pass --force to replace it)`);

  const tmp = `${file}.tmp`;
  const tst = await lstatOrNull(tmp);
  if (tst?.isSymbolicLink()) throw new Error(`${tmp} is a symlink; refusing to write through it`);
  if (tst) await rm(tmp, { force: true });
  try {
    // flag "wx" fails if anything appeared at tmp in the meantime, including a symlink, so nothing is followed.
    await writeFile(tmp, text, { encoding: 'utf8', flag: 'wx' });
    await rename(tmp, file);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
  return file;
}

const isScalar = (v) => v === null || typeof v !== 'object';

/** One value as text. `depth` is the nesting level, used for indentation of expanded objects. */
function fmt(v, depth) {
  if (isScalar(v)) return JSON.stringify(v);
  const pad = '  '.repeat(depth + 1);
  const close = '  '.repeat(depth);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.every(isScalar)) return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`;
    return `[\n${v.map((x) => pad + fmt(x, depth + 1)).join(',\n')}\n${close}]`;
  }
  const entries = Object.entries(v);
  if (entries.length === 0) return '{}';
  if (entries.every(([, x]) => isScalar(x))) {
    return `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${JSON.stringify(x)}`).join(', ')} }`;
  }
  return `{\n${entries.map(([k, x]) => `${pad}${JSON.stringify(k)}: ${fmt(x, depth + 1)}`).join(',\n')}\n${close}}`;
}

/**
 * The canonical text for a JSON-compatible value, with a final newline. Key order is kept.
 * Formatting the parsed output again gives the same bytes.
 * @returns {string}
 */
export function stableJson(value) {
  return fmt(value, 0) + '\n';
}

/**
 * True when the script that Node was started with is the file that calls this. Both paths are
 * resolved with realpath, so a symlinked path to the script still matches.
 * @param {string} metaUrl pass import.meta.url
 */
export function isEntryPoint(metaUrl) {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  try {
    return realpathSync(argv1) === realpathSync(fileURLToPath(metaUrl));
  } catch {
    return false;
  }
}
