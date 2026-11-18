export const paper = {
  title: "CST: Lightweight Risk Triage with Source-Grounded Evidence for Web Discussions",
  arxiv: "https://arxiv.org/abs/2611.01710",
  pdf: "https://arxiv.org/pdf/2611.01710",
  github: "https://github.com/Kirito14IT/CST-MIL",
  url: "https://kirito14it.github.io/CST/",
  description: "CST helps moderators decide where to look, what to read, and how to check the evidence in the original discussion.",
  authors: [
    { name: "Zhihua Wang", affiliations: "1,2" },
    { name: "Yifeng Gao", affiliations: "1,†" },
    { name: "Yunhao Feng", affiliations: "3" },
    { name: "Rui Pan", affiliations: "1" },
    { name: "Baiheng Zhao", affiliations: "1" },
    { name: "Zixing Chen", affiliations: "1" },
    { name: "Nan Li", affiliations: "1" },
  ],
};

export const bibtex = [
  "@misc{wang2026cstlightweightrisktriage,",
  "  title={CST: Lightweight Risk Triage with Source-Grounded Evidence for Web Discussions},",
  "  author={Wang, Zhihua and Gao, Yifeng and Feng, Yunhao and Pan, Rui and",
  "          Zhao, Baiheng and Chen, Zixing and Li, Nan},",
  "  year={2026},",
  "  eprint={2611.01710},",
  "  archivePrefix={arXiv},",
  "  primaryClass={cs.CL},",
  "  url={https://arxiv.org/abs/2611.01710}",
  "}",
].join("\n");

export const traceStages = [
  { name: "Prioritize", title: "Find discussions to review", detail: "Character features, sentence embeddings and reply links inform the queue." },
  { name: "Select", title: "Group related evidence", detail: "The selected phrases keep their message IDs and original attack scores." },
  { name: "Verify", title: "Follow the link to the thread", detail: "Select a phrase to highlight it in context and inspect its reply path." },
];

export const traceMessages = [
  { id: "m8", parent: "m1", before: "What kinds of user flags are there and why are they not public?" },
  { id: "m9", parent: "m8", before: "It's just the ", phrase: "flagging", after: " you already have access to …", span: "m9[14,22)", score: "0.092" },
  { id: "m10", parent: "m9", before: "At some point you get the option to vouch for flagged posts as well." },
  { id: "m11", parent: "m10", before: ">30 ", phrase: "karma", after: ", same as flagging:", span: "m11[4,9)", score: "0.619" },
];

export const exampleMessages = [
  { id: "m1", topic: "team", text: "Leave the team." },
  { id: "m2", topic: "team", text: "Nobody wants you on the team." },
  { id: "m3", topic: "accent", text: "Your accent is ridiculous." },
];

export const selectors = ["Original order", "Risk order", "MMR", "Group round-robin"];
export const budgets = [1, 3, 5, 10];

// Figure 4. Each row corresponds to one selector and each column to one budget.
export const recall = {
  full: {
    label: "Full test set",
    scope: "136 discussions · 1,960 dangerous messages",
    rows: [
      [1.38, 4.13, 7.14, 14.49],
      [4.29, 11.43, 17.86, 31.12],
      [4.29, 11.48, 18.37, 32.14],
      [4.29, 12.55, 20.05, 34.39],
    ],
  },
  isolated: {
    label: "Isolated test set",
    scope: "40 discussions · 413 dangerous messages",
    rows: [
      [1.94, 4.36, 8.72, 21.55],
      [5.81, 16.46, 25.18, 42.62],
      [5.81, 16.71, 26.15, 44.55],
      [5.81, 17.92, 27.36, 46.25],
    ],
  },
};

// Table 3. AP in MiniLM + LR, fine-tuned XLM-R, CST order.
export const messageAP = [
  { task: "SCCD", label: "SCCD · attack", values: [0.597, 0.683, 0.712] },
  { task: "CONDA", label: "CONDA · attack", values: [0.694, 0.859, 0.887] },
  { task: "HateBR", label: "HateBR · offense", values: [0.951, 0.978, 0.986] },
  { task: "ToxiCN-A", label: "ToxiCN · attack", values: [0.758, 0.864, 0.893] },
  { task: "ToxiCN-H", label: "ToxiCN · hate", values: [0.735, 0.854, 0.879] },
  { task: "ScamSpot", label: "ScamSpot · spam and scam", values: [0.954, 0.972, 0.981] },
];

// Figure 6 and Section 5.7. Mean of three full service passes.
export const cpuTimes = [
  { label: "MiniLM + LR", value: 117.93 },
  { label: "XLM-R", value: 332.42 },
  { label: "CST", value: 126.69, accent: true },
];

export const figures = {
  context: { number: 1, name: "Reply context for moderation", width: 960, height: 1277 },
  controls: { number: 2, name: "Controlled evidence comparisons", width: 1050, height: 1483 },
  framework: { number: 3, name: "CST framework", width: 1800, height: 1013 },
  budget: { number: 4, name: "Recall across reading budgets", width: 1650, height: 451 },
  judges: { number: 5, name: "Judgments of evidence organization", width: 1250, height: 549 },
  "cpu-cost": { number: 6, name: "CPU service cost", width: 1150, height: 992 },
  "web-review": { number: 8, name: "Source-linked evidence review", width: 1440, height: 930 },
};
