# 项目添加规范

项目采用“一项目一目录”的结构：

```text
src/content/projects/<slug>/
  project.json
  poster.webp
  gallery-02.webp
  gallery-03.webp
```

页面会自动读取这些目录，按 `order` 排序并生成 `01`、`02` 等展示编号。新增项目不需要修改 `src/data/projects.ts`，也不需要手动导入图片。

## 准备信息

每个项目至少需要：

- 项目名称，中英文可以相同
- 项目年份
- 项目地址，例如公开 GitHub 仓库
- 1 句简短介绍
- 1 段项目说明
- 个人职责
- 项目成果
- 1 至 3 个标签
- 至少 1 张主海报

推荐提供 3 至 6 张图片。第一张会同时作为项目归档页主海报和详情页轮播第一张。

## 图片规范

- 推荐比例：`4:3`
- 推荐源文件尺寸：`2400×1800`
- 最低建议尺寸：`1600×1200`
- 支持输入：JPG、PNG、WebP、AVIF、TIFF
- 输出格式：WebP
- 输出上限：`1600×1200`
- 轮播间隔：4 秒

脚本会保留原始构图并自动旋转、缩放和压缩。非 `4:3` 图片会显示警告，但不会被强制裁切。

## 添加命令

1. 以 [project-intake.example.json](../scripts/project-intake.example.json) 为模板准备临时登记文件。
2. 将图片文件名按照展示顺序写入 `images`。
3. 执行：

```powershell
npm run project:add -- --input ".project-intake.json" --images "C:\path\to\posters"
```

需要插入指定位置时：

```powershell
npm run project:add -- --input ".project-intake.json" --images "C:\path\to\posters" --position 2
```

脚本会自动：

1. 校验中英文内容、链接、颜色、标签和图片路径。
2. 将第一张图片命名为 `poster.webp`。
3. 将后续图片命名为 `gallery-02.webp`、`gallery-03.webp`。
4. 创建项目目录和 `project.json`。
5. 调整后续项目顺序，页面编号自动更新。

只验证、不写入：

```powershell
npm run project:add -- --input ".project-intake.json" --images "C:\path\to\posters" --dry-run
```

检查全部现有项目：

```powershell
npm run project:check
```

添加完成后运行：

```powershell
npm run build
npm run test:e2e
```
