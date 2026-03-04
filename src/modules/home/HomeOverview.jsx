import { useMemo } from 'react'
import { loadStoryboardData, normalizeStoryboardData } from '../storyboard/storyboardStore'

export default function HomeOverview({ onNavigateStoryboard }) {
  const summary = useMemo(() => {
    const data = normalizeStoryboardData(loadStoryboardData())
    const projects = data.projects || []
    const sceneCount = projects.reduce((count, project) => count + (project.scenes?.length || 0), 0)
    const cutCount = projects.reduce(
      (count, project) =>
        count +
        (project.scenes || []).reduce((sceneTotal, scene) => sceneTotal + (scene.cuts?.length || 0), 0),
      0
    )

    return {
      projectCount: projects.length,
      sceneCount,
      cutCount,
      latestProject: projects[0]?.name || '暂无项目',
    }
  }, [])

  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="home-kicker">Scene Prompt Builder</p>
        <h1>欢迎回来，开始你的分镜提示词工作流</h1>
        <p>
          首页用于查看项目概况和入口导航。进入 Storyboard 页面后可进行完整编辑（左侧编辑区 + 右侧 Prompt
          预览区）。
        </p>
        <button className="hero-cta" onClick={onNavigateStoryboard}>
          进入 Storyboard 工作台
        </button>
      </section>

      <section className="home-grid">
        <article className="home-card nav-card">
          <h2>导航</h2>
          <p>直接进入完整编辑器，继续编写项目、场景与镜头设置。</p>
          <button onClick={onNavigateStoryboard}>打开 Storyboard Editor</button>
        </article>

        <article className="home-card stats-card">
          <h2>简要统计</h2>
          <div className="stats-list">
            <div>
              <span>项目</span>
              <strong>{summary.projectCount}</strong>
            </div>
            <div>
              <span>场景</span>
              <strong>{summary.sceneCount}</strong>
            </div>
            <div>
              <span>镜头 Cut</span>
              <strong>{summary.cutCount}</strong>
            </div>
          </div>
          <p className="muted">最近项目：{summary.latestProject}</p>
        </article>

        <article className="home-card tips-card">
          <h2>使用建议</h2>
          <ul>
            <li>先定义 Project 风格，再补充 Scene 固定提示词。</li>
            <li>按 Cut 逐条填写景别、构图、动作和对白。</li>
            <li>在右侧 Prompt Preview 中一键复制完整提示词。</li>
          </ul>
        </article>
      </section>
    </main>
  )
}
