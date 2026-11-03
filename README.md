# Krico Academic Homepage

这是 Krico 的个人学术主页本地项目，使用 Astro 构建，目标免费部署到 GitHub Pages。

## 当前结论

- `krico.github.io` 不能直接使用，因为 `krico` 已经是另一个 GitHub 用户名。
- 你当前可用的 GitHub Pages 用户站点应使用 `Kirito14IT.github.io` 仓库名。
- 最终免费访问地址是 `https://kirito14it.github.io/`。
- 页面品牌、姓名和视觉展示仍然使用 `Krico`。

## 本地预览

在 PowerShell 中运行：

```powershell
cd E:\github\kirco\Kirito14IT.github.io
npm install
npm run validate
npm run build
npm run dev
```

然后浏览器打开终端显示的本地地址，一般是：

```text
http://localhost:4321/
```

## 部署流程

`main` 分支推送后，GitHub Actions 会构建并发布网站。中英文 PDF 简历由本地同步脚本自动更新。

如果你要自己部署：

```powershell
cd E:\github\kirco\Kirito14IT.github.io
git init
git branch -M main
git add .
git commit -m "feat: build krico academic homepage"
gh repo create Kirito14IT/Kirito14IT.github.io --public --source . --remote origin --push
```

然后进入 GitHub：

1. 打开 `https://github.com/Kirito14IT/Kirito14IT.github.io`
2. 进入 `Settings` -> `Pages`
3. `Build and deployment` 的 `Source` 选择 `GitHub Actions`
4. 打开 `Actions` 页面，等待 `Deploy to GitHub Pages` 运行成功
5. 访问 `https://kirito14it.github.io/`

## 验证清单

- 首页能看到打字/删除动画。
- 首页能看到 GitHub Commit Activity 贡献图。
- `/cv/`、`/projects/`、`/blog/` 都能打开。
- CV 页面主要展示英文版与简洁中文版 PDF；指定的详细中文版默认折叠，点击后才加载预览。
- 如果 GitHub 贡献图加载失败，页面会显示降级提示，不影响部署。

## 后续需要你补充

- 头像是否继续使用 GitHub 头像，还是换成正式照片或二次元风格头像。
- SafeCodeRL 和 SFMambaNet 的 arXiv 链接。
- 是否公开更多项目仓库链接。
- 是否继续使用当前公开邮箱 `2657751462@qq.com`，还是换成 Gmail 或学校邮箱。

## 中英文 PDF 简历

- 中文页面：https://kirito14it.github.io/zh/cv/
- English page: https://kirito14it.github.io/cv/
- 主要展示 `public/cv/ZhihuaWang_cv_en.pdf` 和 `public/cv/ZhihuaWang_cv_cn.pdf`，英文内容由简洁中文版翻译而来；详细版 `resume-zh_CN-detailed-20261101.pdf` 放在默认折叠区域。
- `public/cv/resume-manifest.json` 记录每份 PDF 的更新时间、页数和 SHA-256；预览地址使用内容哈希更新缓存。
- 本地源文件是 `D:\Resume\resume\ZhihuaWang_cv_en.tex`、`ZhihuaWang_cv_cn.tex` 与详细版源文件；自动编译和同步脚本及使用说明位于该目录的 `scripts` 文件夹。
- 本地保存修改后，由后台监测程序编译并提交对应 PDF；GitHub Pages 随后发布。电脑离线时保留待同步状态，联网后重试。
