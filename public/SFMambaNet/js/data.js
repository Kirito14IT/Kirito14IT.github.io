/* SFMambaNet project page — every number on the page, copied from the paper (arXiv 2606.04493 v2).
   Sources are named next to each block. */
window.SFM = {
  /* Table 1 · relative pose estimation without RANSAC (mAP, %). SIFT columns are mAP@5°; SuperPoint is YFCC100M.
     null = "--" (not available). MatchMamba† is the retrained MatchMamba (gray, not ranked in the paper). */
  pose: {
    cols: [
      { key: "yk", label: "YFCC100M · Known", desc: "SIFT · mAP@5°" },
      { key: "yu", label: "YFCC100M · Unknown", desc: "SIFT · mAP@5°" },
      { key: "sk", label: "SUN3D · Known", desc: "SIFT · mAP@5°" },
      { key: "su", label: "SUN3D · Unknown", desc: "SIFT · mAP@5°" },
      { key: "pk5", label: "SuperPoint · Known", desc: "YFCC100M · mAP@5°" },
      { key: "pu5", label: "SuperPoint · Unknown", desc: "YFCC100M · mAP@5°" },
    ],
    rows: [
      ["RANSAC", 5.81, 16.88, 4.73, 3.26, 12.85, 17.47],
      ["PointNet++", 10.49, 16.48, 10.58, 8.10, null, null],
      ["LFGC", 13.81, 23.95, 13.78, 11.40, 12.18, 24.25],
      ["OANet++", 32.57, 38.95, 20.86, 16.18, 29.52, 35.27],
      ["ACNe", 29.17, 33.06, 18.86, 14.12, 26.72, 32.98],
      ["SuperGlue", 35.00, 48.12, 22.50, 17.11, null, null],
      ["T-Net", 44.49, 52.28, 24.96, 19.71, 34.97, 40.65],
      ["CLNet", 39.00, 54.05, 20.62, 16.95, 27.56, 39.19],
      ["MS²DG-Net", 38.36, 49.13, 22.20, 17.84, 31.15, 39.19],
      ["PGFNet", 44.20, 53.70, 23.66, 19.32, null, null],
      ["U-Match", 46.78, 60.22, 24.99, 18.13, 35.01, 44.29],
      ["NCMNet", 52.39, 63.52, 25.72, 20.82, 38.92, 48.20],
      ["GCTNet", null, null, null, null, 37.86, 47.17],
      ["MGNet", 49.67, 63.63, 25.66, 20.70, 39.04, 48.10],
      ["MSGSA", 54.94, 64.95, 25.28, 20.41, null, null],
      ["BCLNet", 52.62, 66.08, 24.59, 19.96, 40.56, 48.07],
      ["MatchMamba", 60.09, 70.23, 27.23, 21.37, 44.12, 52.19],
      ["MatchMamba†", 60.09, 67.60, 25.70, 20.97, null, null],
      ["SFMambaNet", 62.28, 73.83, 28.74, 21.97, 50.20, 58.82],
    ],
    sp20: { known: 70.10, unknown: 81.04, mmKnown: 64.43, mmUnknown: 77.71 },   // SuperPoint mAP@20°
  },

  /* Appendix J, Table S-efficiency · YFCC100M Unknown, SIFT: mAP@5° (%), Params (M), FLOPs (G), ART / AIT (ms) */
  efficiency: [
    { name: "CLNet", venue: "ICCV", map: 54.05, params: 0.95, flops: 1.92, art: 181.87, ait: 4.13 },
    { name: "MS²DG-Net", venue: "CVPR", map: 49.13, params: 2.53, flops: 5.32, art: 396.19, ait: 9.35 },
    { name: "NCMNet", venue: "CVPR", map: 63.52, params: 4.49, flops: 8.72, art: 855.14, ait: 15.58 },
    { name: "GCTNet", venue: "AAAI", map: 63.80, params: 4.09, flops: 10.33, art: 428.80, ait: 5.86 },
    { name: "BCLNet", venue: "AAAI", map: 66.08, params: 6.65, flops: 10.93, art: 687.15, ait: 10.53 },
    { name: "MatchMamba", venue: "TCSVT", map: 70.23, params: 2.08, flops: 5.15, art: 383.31, ait: 5.03 },
    { name: "SFMambaNet", venue: "ours", map: 73.83, params: 2.01, flops: 5.01, art: 370.42, ait: 4.80 },
  ],

  /* Figure: outlier removal with SIFT — precision, recall, F-score (%) on YFCC100M and SUN3D */
  outlier: {
    cols: ["P", "R", "F", "P", "R", "F"],
    rows: [
      ["RANSAC", 41.83, 57.08, 48.28, 44.11, 46.42, 45.24],
      ["OANet++", 55.65, 85.80, 67.51, 46.54, 83.43, 59.74],
      ["CLNet", 74.89, 76.79, 75.83, 59.97, 84.55, 64.73],
      ["MS²DG-Net", 59.11, 88.40, 70.85, 46.95, 84.55, 60.37],
      ["U-Match", 60.30, 90.63, 72.42, 47.59, 85.59, 61.17],
      ["NCMNet", 77.26, 78.57, 77.91, 61.00, 68.93, 64.78],
      ["GCTNet", 77.00, 79.02, 78.00, 61.12, 69.34, 64.31],
      ["BCLNet", 78.49, 82.56, 80.10, 77.39, 79.77, 78.31],
      ["MatchMamba", 80.53, 84.27, 82.36, 78.27, 80.04, 79.15],
      ["SFMambaNet", 82.49, 85.37, 83.16, 80.05, 83.49, 81.51],
    ],
  },

  /* Figure: homography estimation on HPatches — accuracy (%) at corner error below 3 / 5 / 10 px (trained on YFCC100M, SIFT) */
  homography: [
    ["PointCN", 67.93, 82.59, 92.76],
    ["OANet++", 69.66, 82.93, 91.90],
    ["CLNet", 69.83, 81.55, 90.69],
    ["MS²DG-Net", 65.00, 78.97, 88.45],
    ["NCMNet", 70.69, 81.90, 91.03],
    ["BCLNet", 70.92, 82.87, 91.57],
    ["MatchMamba", 71.55, 84.66, 92.23],
    ["SFMambaNet", 73.00, 85.47, 92.81],
  ],

  /* Table · component additions on YFCC100M (mAP, %; five-seed mean ± SD) */
  ablation: {
    cols: ["Known · 5°", "Known · 20°", "Unknown · 5°", "Unknown · 20°"],
    rows: [
      ["Baseline", [40.42, .57], [61.18, .36], [55.87, .48], [75.13, .31]],
      ["+ LSGA", [54.63, .33], [74.88, .45], [64.71, .39], [83.32, .26]],
      ["+ LSGA + SIGM", [62.17, .43], [79.36, .28], [73.64, .37], [87.08, .19]],
    ],
  },

  /* Figure · gate controls on unknown splits (mAP@5°, %; five-seed mean ± SD) */
  gates: [
    { name: "Identity", params: "1.912M", y: [70.48, .41], s: [20.69, .24] },
    { name: "Fixed low-pass", params: "1.912M", y: [72.03, .29], s: [21.22, .21] },
    { name: "Point-wise MLP", params: "2.010M", y: [71.16, .46], s: [20.94, .31] },
    { name: "Learned spectral", params: "2.010M", y: [73.64, .37], s: [21.89, .27] },
  ],

  /* Table · encoding control under identical LGA and learned gates (five-seed mAP@5°, %) */
  encoding: [
    { name: "None explicit", din: "–", params: 1.944, y: [70.83, .43], s: [20.76, .30] },
    { name: "Raw-coordinate MLP", din: "4", params: 2.010, y: [71.63, .34], s: [21.17, .23] },
    { name: "Linear lift + MLP", din: "128", params: 2.010, y: [71.72, .39], s: [21.11, .28] },
    { name: "Fourier + MLP", din: "128", params: 2.010, y: [73.64, .37], s: [21.89, .27] },
  ],

  /* Appendix · what the trained gate does (isolated first-stage gate) */
  gateEnergy: { lowKept: 58, highKept: 13, apNoGate: 2.21, apRestoreHF: 1.84, apRescale: 0.06, inlierLowRatio: 1.61, outlierHighRatio: 2.19 },
};
