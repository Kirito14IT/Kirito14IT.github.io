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

我不会自动执行 `git commit`、`git push` 或创建远程仓库，除非你明确确认。

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
- 页面不展示手机号、精确住址、绩点、具体排名、具体课程分数。
- 如果 GitHub 贡献图加载失败，页面会显示降级提示，不影响部署。

## 后续需要你补充

- 头像是否继续使用 GitHub 头像，还是换成正式照片或二次元风格头像。
- SafeCodeRL 和 SFMambaNet 的 arXiv 链接。
- 是否公开更多项目仓库链接。
- 是否继续使用当前公开邮箱 `2657751462@qq.com`，还是换成 Gmail 或学校邮箱。
