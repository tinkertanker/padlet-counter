// Builds the Chrome Web Store upload: a zip holding only the files the
// extension loads, named after the manifest version.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { crc32, deflateRawSync } from "node:zlib";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
if (manifest.version !== pkg.version) {
  throw new Error(`manifest.json version ${manifest.version} does not match package.json ${pkg.version}`);
}

const files = new Set(["manifest.json"]);
for (const script of manifest.content_scripts) script.js.forEach((file) => files.add(file));
Object.values(manifest.icons).forEach((file) => files.add(file));

// DOS timestamp fixed at 1980-01-01 so identical sources give identical zips.
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

const locals = [];
const centrals = [];
let offset = 0;
for (const name of [...files].sort()) {
  const data = await readFile(new URL(name, root));
  const compressed = deflateRawSync(data, { level: 9 });
  const nameBytes = Buffer.from(name, "utf8");
  const fields = (header, signature) => {
    header.writeUInt32LE(signature, 0);
    return header;
  };
  const local = fields(Buffer.alloc(30), 0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc32(data), 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);

  const central = fields(Buffer.alloc(46), 0x02014b50);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  local.copy(central, 8, 6, 28);
  central.writeUInt32LE(offset, 42);

  locals.push(local, nameBytes, compressed);
  centrals.push(central, nameBytes);
  offset += local.length + nameBytes.length + compressed.length;
}

const directory = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.size, 8);
end.writeUInt16LE(files.size, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);

const out = new URL("build/", root);
await rm(out, { recursive: true, force: true });
await mkdir(out);
const zip = new URL(`section-counter-for-padlet-${manifest.version}.zip`, out);
await writeFile(zip, Buffer.concat([...locals, directory, end]));
console.log(`Wrote build/section-counter-for-padlet-${manifest.version}.zip (${[...files].join(", ")})`);
