import { downloadBlob, safeFilePart } from "./download";

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit += 1) {
      const lowest = crc & 1;
      crc >>>= 1;
      if (lowest) {
        crc ^= 0xedb88320;
      }
    }
  }
  return crc ^ 0xffffffff;
}

function u16(value: number): Uint8Array {
  const buffer = new Uint8Array(2);
  buffer[0] = value & 0xff;
  buffer[1] = (value >>> 8) & 0xff;
  return buffer;
}

function u32(value: number): Uint8Array {
  const buffer = new Uint8Array(4);
  buffer[0] = value & 0xff;
  buffer[1] = (value >>> 8) & 0xff;
  buffer[2] = (value >>> 16) & 0xff;
  buffer[3] = (value >>> 24) & 0xff;
  return buffer;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function buildUncompressedZip(files: Array<{ path: string; content: Uint8Array }>): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.path.replace(/\\/g, "/"));
    const data = file.content;
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    localParts.push(local);
    centralParts.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  }

  const locals = concat(localParts);
  const central = concat(centralParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(locals.length),
    u16(0),
  ]);
  return new Blob([concat([locals, central, end])], { type: "application/zip" });
}

export async function saveFilesToBranchFolder(
  branchName: string,
  files: Array<{ filename: string; content: Uint8Array }>,
): Promise<"folder" | "zip"> {
  const folderName = safeFilePart(branchName);
  const picker = (window as Window & { showDirectoryPicker?: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker;
  if (typeof picker === "function") {
    try {
      const root = await picker({ mode: "readwrite" });
      const branchDir = await root.getDirectoryHandle(folderName, { create: true });
      for (const file of files) {
        const handle = await branchDir.getFileHandle(file.filename, { create: true });
        const writable = await handle.createWritable();
        await writable.write(file.content);
        await writable.close();
      }
      return "folder";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
    }
  }
  const zip = buildUncompressedZip(
    files.map((file) => ({ path: `${folderName}/${file.filename}`, content: file.content })),
  );
  downloadBlob(zip, `${folderName}.zip`);
  return "zip";
}
