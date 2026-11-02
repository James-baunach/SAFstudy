// Builds ../certified-forester-exams.html from app.html and the question bank, after checking the bank.
// Usage: node build.js          (check, then build)   — or npm run build
//        node build.js --check  (check only, list every flagged question) — or npm run check
// --check exits non-zero on errors, so CI can run it on every push.
const fs = require("fs");
const path = require("path");

const DOMAINS = ["meas", "silv", "eco", "mgmt", "prot", "harv", "multi", "policy"];
// Full-exam mix by SAF exam domain (field t). Keep in step with BLUEPRINT in app.html.
const BLUEPRINT = {ra: 40, sa: 30, mp: 45, ex: 35};
const bank = DOMAINS.flatMap(d => require(`./bank/${d}.js`));
const SCEN = require("./bank/scenarios.js");
const REFS = require("./bank/refs.js");
const RETIRED = new Set(require("./bank/retired.js"));
const checkOnly = process.argv.includes("--check");

// ---------- Checks ----------
const errors = [], cues = [];
const ids = new Set(), stems = new Map();
const stemKey = s => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const ABSOLUTE = /\b(only|always|never|every|all|none)\b/i;
let longest = 0, guessScore = 0;
bank.forEach(q => {
  const d = q.id.split("-")[0];
  if (ids.has(q.id)) errors.push(`${q.id}: duplicate id`);
  ids.add(q.id);
  if (RETIRED.has(q.id)) errors.push(`${q.id}: id was retired and can't be reused (saved progress may point at the old question)`);
  if (!DOMAINS.includes(d)) errors.push(`${q.id}: unknown domain prefix`);
  if (!BLUEPRINT[q.t]) errors.push(`${q.id}: missing or unknown SAF domain t "${q.t}"`);
  if (!q.q || !q.x) errors.push(`${q.id}: missing question or explanation`);
  if (q.q && !q.s){ const k = stemKey(q.q); if (stems.has(k)) cues.push(`${q.id}: same question text as ${stems.get(k)}`); else stems.set(k, q.id); }
  if (q.o !== undefined && !/^[A-Z][a-z]{2} \d{4}$/.test(q.o)) errors.push(`${q.id}: o should look like "Nov 2026"`);
  if (!Array.isArray(q.a) || q.a.length !== 4) errors.push(`${q.id}: needs exactly 4 answers`);
  else if (new Set(q.a).size !== 4) errors.push(`${q.id}: duplicate answers`);
  if (q.s && !SCEN[q.s]) errors.push(`${q.id}: unknown scenario "${q.s}"`);
  if (q.r && !REFS[q.r]) errors.push(`${q.id}: unknown reference "${q.r}"`);
  if (!Array.isArray(q.a)) return;
  // Answer-length cue: a test-taker who always picks the longest option.
  const len = q.a.map(s => s.length), max = Math.max(...len), ties = len.filter(l => l === max).length;
  if (len[0] === max) { guessScore += 1 / ties; if (ties === 1) longest++; }
  const next = Math.max(...len.slice(1));
  if (len[0] > next * 1.15 && len[0] - next >= 6) cues.push(`${q.id}: correct answer is ${len[0]} chars, next longest ${next}`);
  const abs = q.a.slice(1).filter(s => ABSOLUTE.test(s));
  if (abs.length >= 2) cues.push(`${q.id}: ${abs.length} distractors use absolute words`);
});

const count = {}, tcount = {};
bank.forEach(q => { const d = q.id.split("-")[0]; count[d] = (count[d] || 0) + 1; tcount[q.t] = (tcount[q.t] || 0) + 1; });
const applied = bank.filter(q => q.c || q.s).length;
console.log(`Questions: ${bank.length} (${bank.filter(q => q.c).length} calculation, ${bank.filter(q => q.s).length} in ${new Set(bank.map(q => q.s).filter(Boolean)).size} scenarios, ${(100 * applied / bank.length).toFixed(0)}% applied)`);
console.log("By SAF domain:");
console.log(Object.keys(BLUEPRINT).map(t => `  ${t.padEnd(7)} ${String(tcount[t] || 0).padStart(3)}  (full exam draws ${BLUEPRINT[t]}, ${((tcount[t] || 0) / BLUEPRINT[t]).toFixed(1)} forms)`).join("\n"));
console.log("By subject:");
console.log(DOMAINS.map(d => `  ${d.padEnd(7)} ${String(count[d] || 0).padStart(3)}`).join("\n"));
const thin = Object.keys(BLUEPRINT).filter(t => (tcount[t] || 0) < BLUEPRINT[t] * 2);
if (thin.length) cues.push(`fewer than two full exams' worth of questions in SAF domain(s): ${thin.join(", ")}`);
console.log(`Correct answer is the single longest: ${(100 * longest / bank.length).toFixed(0)}% (chance is 25%)`);
console.log(`Always picking the longest answer would score: ${(100 * guessScore / bank.length).toFixed(1)}%`);
console.log(`Length or wording cues flagged: ${cues.length}`);
if (checkOnly || cues.length <= 25) cues.forEach(c => console.log("  " + c));
if (errors.length) { console.error("\nErrors:\n  " + errors.join("\n  ")); process.exit(1); }
if (checkOnly) process.exit(0);

// ---------- Build ----------
const data = [
  "const SCEN = " + JSON.stringify(SCEN) + ";",
  "const REFS = " + JSON.stringify(REFS) + ";",
  "const BANK = [\n" + bank.map(q => JSON.stringify(q)).join(",\n") + "\n];"
].join("\n");
const tpl = fs.readFileSync(path.join(__dirname, "app.html"), "utf8");
if (!tpl.includes("/*@@DATA@@*/")) throw new Error("app.html is missing the /*@@DATA@@*/ marker");
const out = tpl.replace("/*@@DATA@@*/", () => data);
const dest = path.join(__dirname, "..", "certified-forester-exams.html");
fs.writeFileSync(dest, out);
console.log(`\nWrote ${dest} (${(out.length / 1024).toFixed(0)} KB)`);
// A complete document for opening straight from disk; the published artifact gets its skeleton at publish time.
const offline = path.join(__dirname, "..", "offline.html");
fs.writeFileSync(offline, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n${out}\n</body></html>\n`);
console.log(`Wrote ${offline}`);
