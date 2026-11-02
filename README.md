# Certified Forester practice exams

A free, single-page practice tool for the Society of American Foresters (SAF) **Certified Forester (CF)** exam. It includes:

- Original multiple-choice questions, each tagged by **SAF's four exam domains** and by forestry subject.
- **Full 150-question timed exams** drawn across the domains, with pace tracking and a question map.
- **Spaced review** (Leitner boxes) that brings missed and guessed questions back until they stick.
- Scenario sets that keep related questions together, from Pacific Northwest Douglas-fir to Lake States aspen.
- A searchable **formula sheet** and a degree-mode **calculator**.
- Readiness tracking by domain and subject, plus progress export and import.

It is one self-contained HTML file and works offline.

> These are original practice questions, not official exam items. This project is not affiliated with or endorsed by the Society of American Foresters.

## What the exam looks like (as of Nov 2026)

| | |
|---|---|
| Questions | 150, multiple choice |
| Domains | Resource Assessment · Stakeholder Analysis and Relations · Management Planning · Execution of Management Plans (from SAF's 2021 job/task analysis) |
| Passing | A scaled score of 75. The raw percentage that takes varies by exam form. |
| Provided | A formula sheet and scratch paper. Only non-programmable calculators are allowed. |
| Delivery | Computer-based, at a test centre or remotely proctored |

**Sources:**
- SAF CF FAQ and requirements pages at [eforester.org](https://www.eforester.org/Main/Certification/).
- SC Board of Registration for Foresters.

Always check SAF's current **Certification Handbook**, which is the authority on all of the above.

**Two things here are estimates:**
- **Questions per domain:** set in `BLUEPRINT` in both `src/app.html` and `src/build.js`. SAF publishes the real weights in *CF Exam Domains & Knowledge Areas* (Handbook Appendix A). Update both copies once you have them.
- **Time limit:** SAF doesn't publish it publicly. The practice default is 3 hours.

## Build

You need Node 18 or newer. There are no dependencies.

```bash
npm run check   # validate the question bank and print coverage stats
npm run build   # check, then write certified-forester-exams.html and offline.html
```

The build writes two files:

| File | Use it for |
|---|---|
| `certified-forester-exams.html` | Publishing as a Claude artifact. The viewer supplies the page skeleton, and progress syncs to the viewer's Claude account when available. |
| `offline.html` | A complete standalone document: open it from disk or host it anywhere. |

Neither file is committed. CI builds both on every push and attaches them to the run.

## Project layout

```
src/
  app.html          UI, styles, and logic; the build injects the question bank at /*@@DATA@@*/
  build.js          checks the bank, then builds the two HTML files
  bank/
    meas.js silv.js eco.js mgmt.js prot.js harv.js multi.js policy.js   questions by subject
    scenarios.js    shared scenario text
    refs.js         reference list keyed by `r`
    retired.js      deleted ids that must never be reused
```

## Writing questions

Each question is one line in its subject file:

```js
{id:"silv-074",t:"mp",q:"Question text",a:["correct answer","wrong","wrong","wrong"],x:"Why the answer is right.",r:"ps"}
```

| Field | Meaning |
|---|---|
| `id` | Permanent. Saved progress is keyed by id, so never renumber or reuse one. Add deleted ids to `retired.js`. |
| `t` | SAF domain: `ra`, `sa`, `mp` or `ex`. |
| `a` | Four distinct answers, correct one **first**. The app shuffles them. |
| `x` | Explanation. |
| `r` | Reference key from `refs.js`. |
| `c` | `1` for calculation questions. |
| `s` | Scenario key from `scenarios.js`. |
| `o` | "Accurate as of" date such as `"Nov 2026"`. Use it for law, tax, program, or protocol facts that change. |

`npm run check` fails on:
- missing fields
- duplicate or retired ids
- unknown scenario or reference keys
- answer sets that aren't four distinct options

It also flags these without failing:
- a correct answer that is noticeably the longest
- distractors that lean on absolute words
- repeated question text
- SAF domains with too few questions for two full exams

## License

[MIT](LICENSE). This covers the code and the question bank.
