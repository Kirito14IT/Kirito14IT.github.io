---
locale: "zh"
translationKey: "sfmambanet"
title: "SFMambaNet: Spectral-Frequency Correspondence Pruning"
date: 2025-09-01
summary: "用于高效视觉对应关系剪枝的谱频增强选择性状态空间模型。"
tags: ["计算机视觉", "状态空间模型", "Mamba", "对应关系剪枝", "频域", "图神经网络", "双视图几何", "相机位姿估计", "外点剔除"]
links:
  - label: "arXiv / DOI"
    url: "https://doi.org/10.48550/arXiv.2606.04493"
  - label: "IEEE TIP"
    url: "https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing"
featured: true
---

SFMambaNet 探索如何为对应关系剪枝高效建模全局上下文。

**论文评级：**第一作者；SCI 一区；CCF A；正在 IEEE Transactions on Image Processing（TIP）审稿。

![SFMambaNet 框架图](/figures/sfmambanet-framework.png)

该项目将谱频感知机制引入选择性状态空间架构，目标是在保留强大全局建模能力的同时，避免 Transformer 风格全局注意力的二次复杂度增长。

本研究在福州大学[福建省网络计算与智能信息处理重点实验室](https://ncip.fzu.edu.cn/xsdt.htm)科研实习期间完成，由刘一璋博士指导。论文正在 [IEEE Transactions on Image Processing（TIP）](https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing)审稿，并已发布 [arXiv 预印本](https://arxiv.org/abs/2606.04493)。
