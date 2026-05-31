# GitHub Actions 自动部署说明

PromptArc 现在已经包含仓库级自动部署工作流：

- [deploy-pages.yml](C:/Users/Administrator/Documents/AI网站90天/.github/workflows/deploy-pages.yml)

## 作用

当你把代码推到 `main` 分支时，GitHub Actions 会自动：

1. 检出仓库
2. 检查关键静态文件是否存在
3. 打包整个静态站点
4. 自动发布到 GitHub Pages

以后不需要再在本地手动双击部署脚本来“上线页面内容”。

## 你只需要做一次的设置

### 1. 推送这次代码到 GitHub

把当前仓库内容推到 `main` 分支。

### 2. 打开 GitHub Pages

在仓库设置中：

- `Settings`
- `Pages`
- `Source` 选择 `GitHub Actions`

### 3. 保持 `CNAME`

仓库根目录已有：

- [CNAME](C:/Users/Administrator/Documents/AI网站90天/CNAME)

内容应保持为：

```txt
www.promptarc.cc
```

### 4. Cloudflare DNS 只需要配一次

确保这些记录存在：

- `www.promptarc.cc` -> `luckjackyer.github.io` 的 `CNAME`
- `promptarc.cc` -> GitHub Pages 四个 `A` 记录

之后页面内容更新只靠 GitHub Actions 自动发布，不需要再重复手工部署静态文件。

## 这解决了什么

解决的是“网站内容上线自动化”：

- 你改代码
- 推到 GitHub
- GitHub 自动发布到 Pages

## 这没有解决什么

它不会自动替你：

- 创建 GitHub 仓库
- 初次打开 Pages
- 初次配置 Cloudflare DNS

这些只需要做一次。做完后，后续就是自动化。
