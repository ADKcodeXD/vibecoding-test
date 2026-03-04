# Scene Prompt Builder

一个基于 **Vite + React** 的分镜提示词编辑器，支持：

- 多 Project 管理
- 每个 Project 下多 Scene 管理
- 每个 Scene 下多 Cut 增删改
- Project / Scene 两级固定提示词
- 当前 Scene 一键导出完整提示词（含分镜逐条）并复制
- 数据持久化到浏览器 `localStorage`

## 本地运行

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 构建

```bash
npm run build
```

## 导出格式说明

导出文本结构：

1. 项目名称
2. 整体风格（Project 级固定提示词）
3. 场景名称
4. 场景关系/场景固定提示词
5. 分镜逐条（Cut 1, Cut 2...）
   - 镜头景别
   - 镜头运动
   - 构图
   - 人物
   - 人物动作
   - 对白
