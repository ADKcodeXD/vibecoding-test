import { useEffect, useMemo, useState } from 'react'
import { formatScenePrompt } from './promptFormatter'
import {
  CAMERA_MOVEMENTS,
  COMPOSITIONS,
  SHOT_SIZES,
  VIEW_ANGLES,
  createDefaultCut,
  createDefaultProject,
  createDefaultScene,
  loadStoryboardData,
  normalizeStoryboardData,
  saveStoryboardData,
} from './storyboardStore'

const PANEL_STATE_STORAGE_KEY = 'storyboard-panel-state-v1'
const defaultPanelState = {
  isProjectPanelOpen: true,
  isScenePanelOpen: true,
  isPreviewOpen: true,
}

const loadPanelState = () => {
  try {
    const raw = localStorage.getItem(PANEL_STATE_STORAGE_KEY)
    if (!raw) return defaultPanelState
    const parsed = JSON.parse(raw)

    return {
      isProjectPanelOpen:
        typeof parsed?.isProjectPanelOpen === 'boolean' ? parsed.isProjectPanelOpen : defaultPanelState.isProjectPanelOpen,
      isScenePanelOpen:
        typeof parsed?.isScenePanelOpen === 'boolean' ? parsed.isScenePanelOpen : defaultPanelState.isScenePanelOpen,
      isPreviewOpen: typeof parsed?.isPreviewOpen === 'boolean' ? parsed.isPreviewOpen : defaultPanelState.isPreviewOpen,
    }
  } catch {
    return defaultPanelState
  }
}

export default function StoryboardEditor() {
  const [data, setData] = useState(loadStoryboardData)
  const [copyLabel, setCopyLabel] = useState('复制 Prompt')
  const [panelState, setPanelState] = useState(loadPanelState)
  const { isProjectPanelOpen, isScenePanelOpen, isPreviewOpen } = panelState

  useEffect(() => {
    saveStoryboardData(data)
  }, [data])

  useEffect(() => {
    localStorage.setItem(PANEL_STATE_STORAGE_KEY, JSON.stringify(panelState))
  }, [panelState])

  const normalizedData = useMemo(() => normalizeStoryboardData(data), [data])

  useEffect(() => {
    if (
      normalizedData.selectedProjectId !== data.selectedProjectId ||
      normalizedData.selectedSceneId !== data.selectedSceneId
    ) {
      setData(normalizedData)
    }
  }, [data, normalizedData])

  const currentProject = normalizedData.projects.find((item) => item.id === normalizedData.selectedProjectId) || null
  const currentScene = currentProject?.scenes.find((scene) => scene.id === normalizedData.selectedSceneId) || null

  const updateCurrentProject = (updater) => {
    if (!currentProject) return
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((item) => (item.id === currentProject.id ? updater(item) : item)),
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
    const projectName = `Storyboard Project ${normalizedData.projects.length + 1}`
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
    const scene = createDefaultScene(`Scene ${currentProject.scenes.length + 1}`)

    updateCurrentProject((project) => ({ ...project, scenes: [...project.scenes, scene] }))
    setData((prev) => ({ ...prev, selectedSceneId: scene.id }))
  }

  const deleteScene = (sceneId) => {
    if (!currentProject || currentProject.scenes.length <= 1) return

    const remainingScenes = currentProject.scenes.filter((scene) => scene.id !== sceneId)
    updateCurrentProject((project) => ({
      ...project,
      scenes: remainingScenes,
    }))
    setData((prev) => ({ ...prev, selectedSceneId: remainingScenes[0]?.id || null }))
  }

  const addCut = () => {
    updateCurrentScene((scene) => ({ ...scene, cuts: [...scene.cuts, createDefaultCut()] }))
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

  const resolveCutValue = (customValue, presetValue) => {
    const trimmedCustom = (customValue || '').trim()
    if (trimmedCustom) return trimmedCustom
    return presetValue || ''
  }

  const scenePrompt = useMemo(() => formatScenePrompt(currentProject, currentScene), [currentProject, currentScene])

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(scenePrompt)
      setCopyLabel('已复制')
      setTimeout(() => setCopyLabel('复制 Prompt'), 1400)
    } catch {
      setCopyLabel('复制失败')
      setTimeout(() => setCopyLabel('复制 Prompt'), 1400)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <section className="panel sidebar-panel">
          <button
            className="panel-toggle"
            onClick={() => setPanelState((prev) => ({ ...prev, isProjectPanelOpen: !prev.isProjectPanelOpen }))}
            aria-expanded={isProjectPanelOpen}
          >
            <span>新建项目</span>
            <span>{isProjectPanelOpen ? '−' : '+'}</span>
          </button>

          {isProjectPanelOpen && (
            <>
              <div className="sidebar-header">
                <h2>Storyboard Projects</h2>
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
            </>
          )}
        </section>
      </aside>

      <main className="main-content">
        {currentProject && currentScene ? (
          <div className="editor-layout">
            <div className="editor-primary">
              <section className="panel">
                <button
                  className="panel-toggle"
                  onClick={() => setPanelState((prev) => ({ ...prev, isProjectPanelOpen: !prev.isProjectPanelOpen }))}
                  aria-expanded={isProjectPanelOpen}
                >
                  <span>Project 设置</span>
                  <span>{isProjectPanelOpen ? '−' : '+'}</span>
                </button>

                {isProjectPanelOpen && (
                  <>
                    <label>
                      Project 名称
                      <input
                        value={currentProject.name}
                        onChange={(event) =>
                          updateCurrentProject((project) => ({ ...project, name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Project 固定提示词
                      <textarea
                        rows={3}
                        value={currentProject.fixedPrompt}
                        onChange={(event) =>
                          updateCurrentProject((project) => ({ ...project, fixedPrompt: event.target.value }))
                        }
                      />
                    </label>
                  </>
                )}
              </section>

              <section className="panel">
                <button
                  className="panel-toggle"
                  onClick={() => setPanelState((prev) => ({ ...prev, isScenePanelOpen: !prev.isScenePanelOpen }))}
                  aria-expanded={isScenePanelOpen}
                >
                  <span>Scene 设置</span>
                  <span>{isScenePanelOpen ? '−' : '+'}</span>
                </button>

                {isScenePanelOpen && (
                  <>
                    <label>
                      Scene 名称
                      <input
                        value={currentScene.name}
                        onChange={(event) => updateCurrentScene((scene) => ({ ...scene, name: event.target.value }))}
                      />
                    </label>
                    <label>
                      Scene 固定提示词
                      <textarea
                        rows={3}
                        value={currentScene.fixedPrompt}
                        onChange={(event) =>
                          updateCurrentScene((scene) => ({ ...scene, fixedPrompt: event.target.value }))
                        }
                      />
                    </label>
                  </>
                )}
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>Cut 列表</h3>
                  <button onClick={addCut}>+ 添加 Cut</button>
                </div>

                {currentScene.cuts.map((cut, index) => (
                  <div key={cut.id} className="cut-card">
                    <div className="cut-title-row">
                      <div>
                        <h4>Cut {index + 1}</h4>
                        <div className="cut-meta">
                          {resolveCutValue(cut.customShotSize, cut.shotSize)} · {resolveCutValue(cut.customComposition, cut.composition)} · {resolveCutValue(cut.customPerspective, cut.perspective)} · {resolveCutValue(cut.customCameraMovement, cut.cameraMovement)}
                        </div>
                      </div>
                      <button className="tiny danger" onClick={() => deleteCut(cut.id)}>
                        删除
                      </button>
                    </div>

                    <div className="cut-grid">
                      <label>
                        景别
                        <div className="mixed-input">
                          <select
                            value={cut.shotSize}
                            onChange={(event) => updateCut(cut.id, { shotSize: event.target.value })}
                          >
                            {SHOT_SIZES.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="自定义"
                            value={cut.customShotSize || ''}
                            onChange={(event) => updateCut(cut.id, { customShotSize: event.target.value })}
                          />
                        </div>
                      </label>

                      <label>
                        构图
                        <div className="mixed-input">
                          <select
                            value={cut.composition}
                            onChange={(event) => updateCut(cut.id, { composition: event.target.value })}
                          >
                            {COMPOSITIONS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="自定义"
                            value={cut.customComposition || ''}
                            onChange={(event) => updateCut(cut.id, { customComposition: event.target.value })}
                          />
                        </div>
                      </label>

                      <label>
                        视角
                        <div className="mixed-input">
                          <select
                            value={cut.perspective}
                            onChange={(event) => updateCut(cut.id, { perspective: event.target.value })}
                          >
                            {VIEW_ANGLES.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="自定义"
                            value={cut.customPerspective || ''}
                            onChange={(event) => updateCut(cut.id, { customPerspective: event.target.value })}
                          />
                        </div>
                      </label>

                      <label>
                        镜头运镜
                        <div className="mixed-input">
                          <select
                            value={cut.cameraMovement || '固定机位'}
                            onChange={(event) => updateCut(cut.id, { cameraMovement: event.target.value })}
                          >
                            {CAMERA_MOVEMENTS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="自定义"
                            value={cut.customCameraMovement || ''}
                            onChange={(event) => updateCut(cut.id, { customCameraMovement: event.target.value })}
                          />
                        </div>
                      </label>

                      <label>
                        人物
                        <input
                          value={cut.character}
                          onChange={(event) => updateCut(cut.id, { character: event.target.value })}
                        />
                      </label>

                      <label>
                        人物动作
                        <input
                          value={cut.action}
                          onChange={(event) => updateCut(cut.id, { action: event.target.value })}
                        />
                      </label>

                      <label className="full-row">
                        对白
                        <textarea
                          rows={2}
                          value={cut.dialogue}
                          onChange={(event) => updateCut(cut.id, { dialogue: event.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <aside className="preview-column">
              <section className="panel preview-panel">
                <button
                  className="panel-toggle"
                  onClick={() => setPanelState((prev) => ({ ...prev, isPreviewOpen: !prev.isPreviewOpen }))}
                  aria-expanded={isPreviewOpen}
                >
                  <span>Prompt 预览</span>
                  <span>{isPreviewOpen ? '−' : '+'}</span>
                </button>

                {isPreviewOpen && (
                  <>
                    <div className="panel-head">
                      <h3>导出当前 Scene 完整 Prompt</h3>
                      <button onClick={copyPrompt}>{copyLabel}</button>
                    </div>
                    <textarea className="export-box" rows={20} readOnly value={scenePrompt} />
                  </>
                )}
              </section>
            </aside>
          </div>
        ) : (
          <p>暂无项目，请先创建。</p>
        )}
      </main>
    </div>
  )
}
