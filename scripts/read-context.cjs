// Minimal reader for the versioned Contexto workbooks. It reads cached cell values;
// it does not execute formulas, macros or external links. No runtime Excel dependency.
const fs = require("node:fs");
const zlib = require("node:zlib");
const path = require("node:path");
function unzip(file) {
  const data = fs.readFileSync(file);
  let end = data.length - 22;
  while (
    end >= Math.max(0, data.length - 65557) &&
    data.readUInt32LE(end) !== 0x06054b50
  )
    end--;
  if (end < 0) throw new Error("Invalid workbook ZIP");
  let pos = data.readUInt32LE(end + 16);
  const entries = {};
  for (let i = 0; i < data.readUInt16LE(end + 10); i++) {
    if (data.readUInt32LE(pos) !== 0x02014b50)
      throw new Error("Invalid ZIP directory");
    const method = data.readUInt16LE(pos + 10),
      size = data.readUInt32LE(pos + 20),
      nameLength = data.readUInt16LE(pos + 28),
      extra = data.readUInt16LE(pos + 30),
      comment = data.readUInt16LE(pos + 32),
      offset = data.readUInt32LE(pos + 42);
    const name = data.toString("utf8", pos + 46, pos + 46 + nameLength),
      start =
        offset +
        30 +
        data.readUInt16LE(offset + 26) +
        data.readUInt16LE(offset + 28);
    const compressed = data.subarray(start, start + size);
    if (method === 0 || method === 8)
      entries[name] = (
        method === 8 ? zlib.inflateRawSync(compressed) : compressed
      ).toString("utf8");
    pos += 46 + nameLength + extra + comment;
  }
  return entries;
}
function decode(value) {
  return value.replace(
    /&#x([0-9a-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi,
    (_, hex, num, named) =>
      hex
        ? String.fromCodePoint(parseInt(hex, 16))
        : num
          ? String.fromCodePoint(Number(num))
          : { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[named],
  );
}
const text = (xml) =>
  [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((m) => decode(m[1]))
    .join("");
const attrs = (xml) =>
  Object.fromEntries(
    [...xml.matchAll(/([\w:]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]),
  );
function readFile(file) {
  const entries = unzip(file);
  const shared = [
    ...(entries["xl/sharedStrings.xml"] || "").matchAll(
      /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g,
    ),
  ].map((m) => text(m[1]));
  const rels = Object.fromEntries(
    [
      ...(entries["xl/_rels/workbook.xml.rels"] || "").matchAll(
        /<Relationship\s([^>]+)\/?\s*>/g,
      ),
    ].map((m) => {
      const a = attrs(m[1]);
      return [
        a.Id,
        a.Target.startsWith("/")
          ? a.Target.slice(1)
          : path.posix.join("xl", a.Target),
      ];
    }),
  );
  const Sheets = {},
    SheetNames = [];
  for (const m of entries["xl/workbook.xml"].matchAll(
    /<sheet\s([^>]+)\/?\s*>/g,
  )) {
    const a = attrs(m[1]),
      xml = entries[rels[a["r:id"]]],
      rows = [];
    for (const row of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
      const values = [];
      for (const cell of row[1].matchAll(
        /<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
      )) {
        const c = attrs(cell[1]),
          body = cell[2] || "",
          raw = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1];
        let column = 0;
        for (const ch of c.r.match(/^[A-Z]+/)[0])
          column = column * 26 + ch.charCodeAt(0) - 64;
        if (c.t === "inlineStr") values[column - 1] = text(body);
        else if (raw !== undefined)
          values[column - 1] =
            c.t === "s"
              ? shared[Number(raw)]
              : c.t === "str"
                ? decode(raw)
                : c.t === "b"
                  ? raw === "1"
                  : Number(raw);
      }
      if (values.length) rows.push(values);
    }
    SheetNames.push(a.name);
    Sheets[a.name] = rows;
  }
  return { Sheets, SheetNames };
}
module.exports = {
  readFile,
  utils: { sheet_to_json: (sheet) => sheet },
  SSF: {
    parse_date_code: (n) => {
      const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
      return {
        y: d.getUTCFullYear(),
        m: d.getUTCMonth() + 1,
        d: d.getUTCDate(),
      };
    },
  },
};
