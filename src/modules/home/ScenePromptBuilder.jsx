import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'scene-prompt-builder-v1'

const SHOT_SIZES = ['特写', '近景', '半身', '中景', '全景', '大全景']
const CAMERA_MOVEMENTS = ['横摇', '纵摇', '推镜', '拉镜', '跟随人物', '手持晃动', '固定']
const COMPOSITIONS = ['左三分之一', '正反打', '过肩', '三角构图', '对角线构图', '居中对称']

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const createDefaultCut = () => ({
  id: createId(),
  shotSize: '中景',
  cameraMovement: '固定',
  composition: '居中对称',
  character: '',
  action: '',
  dialogue: '',
})

const createDefaultScene = (name = '新场景') => ({
  id: createId(),
  name,
  fixedPrompt: '',
  cuts: [createDefaultCut()],
})

const createDefaultProject = (name = '新项目') => ({
  id: createId(),
  name,
  globalPrompt: '写实电影感，光影自然，色调统一。',
  scenes: [createDefaultScene('Scene 1')],
})

const initialData = {
  projects: [createDefaultProject('Project 1')],
  selectedProjectId: null,
  selectedSceneId: null,
}

export default function ScenePromptBuilder() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return initialData
      const parsed = JSON.parse(raw)
      return {
        ...initialData,
        ...parsed,
      }
    } catch {
      return initialData
    }
  })
  const [copyLabel, setCopyLabel] = useState('复制')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const normalizedData = useMemo(() => {
    if (!data.projects.length) {
      return { ...data, selectedProjectId: null, selectedSceneId: null }
    }

    let selectedProjectId = data.selectedProjectId
    if (!selectedProjectId || !data.projects.some((p) => p.id === selectedProjectId)) {
      selectedProjectId = data.projects[0].id
    }

    const project = data.projects.find((p) => p.id === selectedProjectId)
    if (!project?.scenes?.length) {
      return { ...data, selectedProjectId, selectedSceneId: null }
    }

    let selectedSceneId = data.selectedSceneId
    if (!selectedSceneId || !project.scenes.some((s) => s.id === selectedSceneId)) {
      selectedSceneId = project.scenes[0].id
    }

    return { ...data, selectedProjectId, selectedSceneId }
  }, [data])

  useEffect(() => {
    if (
      normalizedData.selectedProjectId !== data.selectedProjectId ||
      normalizedData.selectedSceneId !== data.selectedSceneId
    ) {
      setData(normalizedData)
    }
  }, [normalizedData, data])

  const currentProject = normalizedData.projects.find((p) => p.id === normalizedData.selectedProjectId) || null
  const currentScene =
    currentProject?.scenes.find((s) => s.id === normalizedData.selectedSceneId) || null

  const updateCurrentProject = (updater) => {
    if (!currentProject) return
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === currentProject.id ? updater(p) : p)),
    }))
  }

  const updateCurrentScene = (updater) => {
    if (!currentProject || !currentScene) return
    updateCurrentProject((project) => ({
      ...project,
      scenes: project.scenes.map((scene) => (scene.id === currentScene.id ? updater(scene) : scene)),
    }))
  }

  const addProject = () => {
    const projectName = `Project ${normalizedData.projects.length + 1}`
    const project = createDefaultProject(projectName)
    setData((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
      selectedProjectId: project.id,
      selectedSceneId: project.scenes[0].id,
    }))
  }

  const addScene = () => {
    if (!currentProject) return
    const sceneName = `Scene ${currentProject.scenes.length + 1}`
    const scene = createDefaultScene(sceneName)
    updateCurrentProject((project) => ({ ...project, scenes: [...project.scenes, scene] }))
    setData((prev) => ({ ...prev, selectedSceneId: scene.id }))
  }

  const deleteScene = (sceneId) => {
    if (!currentProject || currentProject.scenes.length <= 1) return

    const remaining = currentProject.scenes.filter((s) => s.id !== sceneId)
    const nextSelected = remaining[0]?.id || null

    updateCurrentProject((project) => ({
      ...project,
      scenes: project.scenes.filter((s) => s.id !== sceneId),
    }))

    setData((prev) => ({ ...prev, selectedSceneId: nextSelected }))
  }

  const addCut = () => {
    updateCurrentScene((scene) => ({
      ...scene,
      cuts: [...scene.cuts, createDefaultCut()],
    }))
  }

  const deleteCut = (cutId) => {
    if (!currentScene || currentScene.cuts.length <= 1) return
    updateCurrentScene((scene) => ({
      ...scene,
      cuts: scene.cuts.filter((cut) => cut.id !== cutId),
    }))
  }

  const updateCut = (cutId, patch) => {
    updateCurrentScene((scene) => ({
      ...scene,
      cuts: scene.cuts.map((cut) => (cut.id === cutId ? { ...cut, ...patch } : cut)),
    }))
  }

  const exportText = useMemo(() => {
    if (!currentProject || !currentScene) return ''

    const lines = [
      `【项目】${currentProject.name}`,
      '',
      '【整体风格（Project 级固定提示词）】',
      currentProject.globalPrompt || '（未填写）',
      '',
      `【场景】${currentScene.name}`,
      '【场景关系/场景固定提示词】',
      currentScene.fixedPrompt || '（未填写）',
      '',
      '【分镜逐条】',
    ]

    currentScene.cuts.forEach((cut, index) => {
      lines.push(
        `Cut ${index + 1}:`,
        `- 镜头景别：${cut.shotSize || '（未填写）'}`,
        `- 镜头运动：${cut.cameraMovement || '（未填写）'}`,
        `- 构图：${cut.composition || '（未填写）'}`,
        `- 人物：${cut.character || '（未填写）'}`,
        `- 人物动作：${cut.action || '（未填写）'}`,
        `- 对白：${cut.dialogue || '（无）'}`,
        ''
      )
    })

    return lines.join('\n').trim()
  }, [currentProject, currentScene])

  const copyExportText = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopyLabel('已复制')
      setTimeout(() => setCopyLabel('复制'), 1500)
    } catch {
      setCopyLabel('复制失败')
      setTimeout(() => setCopyLabel('复制'), 1500)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Projects</h2>
          <button onClick={addProject}>+ 新建</button>
        </div>

        <div className="project-list">
          {normalizedData.projects.map((project) => (
            <div key={project.id} className="project-block">
              <button
                className={`project-item ${project.id === currentProject?.id ? 'active' : ''}`}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    selectedProjectId: project.id,
                    selectedSceneId: project.scenes[0]?.id || null,
                  }))
                }
              >
                {project.name}
              </button>

              {project.id === currentProject?.id && (
                <div className="scene-list">
                  {project.scenes.map((scene) => (
                    <div key={scene.id} className="scene-row">
                      <button
                        className={`scene-item ${scene.id === currentScene?.id ? 'active' : ''}`}
                        onClick={() => setData((prev) => ({ ...prev, selectedSceneId: scene.id }))}
                      >
                        {scene.name}
                      </button>
                      <button className="tiny danger" onClick={() => deleteScene(scene.id)}>
                        删
                      </button>
                    </div>
                  ))}
                  <button className="scene-add" onClick={addScene}>
                    + 新建 Scene
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        {currentProject && currentScene ? (
          <>
            <section className="panel">
              <h3>Project 设置</h3>
              <label>
                Project 名称
                <input
                  value={currentProject.name}
                  onChange={(e) =>
                    updateCurrentProject((project) => ({ ...project, name: e.target.value }))
                  }
                />
              </label>
              <label>
                Project 级固定提示词（全局风格）
                <textarea
                  rows={3}
                  value={currentProject.globalPrompt}
                  onChange={(e) =>
                    updateCurrentProject((project) => ({ ...project, globalPrompt: e.target.value }))
                  }
                />
              </label>
            </section>

            <section className="panel">
              <h3>Scene 设置</h3>
              <label>
                Scene 名称
                <input
                  value={currentScene.name}
                  onChange={(e) => updateCurrentScene((scene) => ({ ...scene, name: e.target.value }))}
                />
              </label>
              <label>
                Scene 级固定提示词
                <textarea
                  rows={3}
                  value={currentScene.fixedPrompt}
                  onChange={(e) =>
                    updateCurrentScene((scene) => ({ ...scene, fixedPrompt: e.target.value }))
                  }
                />
              </label>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h3>Cut 列表</h3>
                <button onClick={addCut}>+ 添加 Cut</button>
              </div>
              {currentScene.cuts.map((cut, index) => (
                <div key={cut.id} className="cut-card">
                  <div className="cut-title-row">
                    <h4>Cut {index + 1}</h4>
                    <button className="tiny danger" onClick={() => deleteCut(cut.id)}>
                      删除
                    </button>
                  </div>

                  <div className="cut-grid">
                    <label>
                      镜头景别
                      <select
                        value={cut.shotSize}
                        onChange={(e) => updateCut(cut.id, { shotSize: e.target.value })}
                      >
                        {SHOT_SIZES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      镜头运动
                      <select
                        value={cut.cameraMovement}
                        onChange={(e) => updateCut(cut.id, { cameraMovement: e.target.value })}
                      >
                        {CAMERA_MOVEMENTS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      构图
                      <select
                        value={cut.composition}
                        onChange={(e) => updateCut(cut.id, { composition: e.target.value })}
                      >
                        {COMPOSITIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      人物
                      <input
                        value={cut.character}
                        onChange={(e) => updateCut(cut.id, { character: e.target.value })}
                      />
                    </label>

                    <label>
                      人物动作
                      <input
                        value={cut.action}
                        onChange={(e) => updateCut(cut.id, { action: e.target.value })}
                      />
                    </label>

                    <label className="full-row">
                      对白
                      <textarea
                        rows={2}
                        value={cut.dialogue}
                        onChange={(e) => updateCut(cut.id, { dialogue: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h3>导出当前 Scene 完整提示词</h3>
                <button onClick={copyExportText}>{copyLabel}</button>
              </div>
              <textarea className="export-box" rows={14} readOnly value={exportText} />
            </section>
          </>
        ) : (
          <p>暂无项目，请先创建。</p>
        )}
      </main>
    </div>
  )
}
