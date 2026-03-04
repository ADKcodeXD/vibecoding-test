import { useEffect, useMemo, useRef, useState } from 'react'
import { formatScenePrompt } from './promptFormatter'
import { generateCutPreview } from './geminiClient'
import { extractImagesFromClipboardEvent, fileToCompressedDataUrl } from './imageUtils'
import {
  CAMERA_MOVEMENTS,
  COMPOSITIONS,
  SHOT_SIZES,
  VIEW_ANGLES,
  createDefaultCut,
  createDefaultProject,
  createDefaultScene,
  createLocalId,
  loadStoryboardData,
  normalizeStoryboardData,
  saveStoryboardData,
} from './storyboardStore'

const PANEL_STATE_STORAGE_KEY = 'storyboard-panel-state-v1'
const CUSTOM_COMPOSITION_VALUE = '__custom_composition__'
const defaultPanelState = {
  isProjectPanelOpen: true,
  isScenePanelOpen: true,
  isPreviewOpen: true,
}

const IMAGE_RATIO_OPTIONS = ['16:9', '9:16', '1:1']
const IMAGE_SIZE_OPTIONS = ['1K', '2K']

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
  const [compositionDialog, setCompositionDialog] = useState({ cutId: null, value: '' })
  const [generatingCutId, setGeneratingCutId] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [imagePrefsByCutId, setImagePrefsByCutId] = useState({})
  const fileInputRefs = useRef({})
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

  const addProjectCustomField = () => {
    updateCurrentProject((project) => ({
      ...project,
      customFields: [...(project.customFields || []), { id: createLocalId(), key: '', value: '' }],
    }))
  }

  const updateProjectCustomField = (fieldId, patch) => {
    updateCurrentProject((project) => ({
      ...project,
      customFields: (project.customFields || []).map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
    }))
  }

  const removeProjectCustomField = (fieldId) => {
    updateCurrentProject((project) => ({
      ...project,
      customFields: (project.customFields || []).filter((field) => field.id !== fieldId),
    }))
  }

  const openCompositionDialog = (cut) => {
    setCompositionDialog({
      cutId: cut.id,
      value: cut.customComposition || '',
    })
  }

  const saveCompositionDialog = () => {
    const trimmed = compositionDialog.value.trim()
    if (!compositionDialog.cutId) return
    if (!trimmed) {
      setStatusMessage('自定义构图不能为空。')
      return
    }

    updateCut(compositionDialog.cutId, {
      customComposition: trimmed,
      composition: CUSTOM_COMPOSITION_VALUE,
    })
    setCompositionDialog({ cutId: null, value: '' })
    setStatusMessage('已保存自定义构图。')
  }

  const handleCompositionSelect = (cut, value) => {
    if (value === CUSTOM_COMPOSITION_VALUE) {
      openCompositionDialog(cut)
      return
    }
    updateCut(cut.id, {
      composition: value,
      customComposition: '',
    })
  }

  const triggerFilePicker = (cutId) => {
    fileInputRefs.current[cutId]?.click()
  }

  const appendCutImages = (cutId, images) => {
    if (!images.length) return

    updateCurrentScene((scene) => ({
      ...scene,
      cuts: scene.cuts.map((cut) => {
        if (cut.id !== cutId) return cut
        const nextImages = [
          ...(cut.images || []),
          ...images.map((image) => ({ id: createLocalId(), name: image.name, dataUrl: image.dataUrl, createdAt: Date.now() })),
        ]
        return { ...cut, images: nextImages }
      }),
    }))
  }

  const onCutFileChange = async (cutId, files) => {
    try {
      const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'))
      const images = []
      for (const file of imageFiles) {
        const dataUrl = await fileToCompressedDataUrl(file)
        images.push({ name: file.name, dataUrl })
      }
      appendCutImages(cutId, images)
      if (images.length) {
        setStatusMessage(`已添加 ${images.length} 张图片。`)
      }
    } catch (error) {
      setStatusMessage(error.message || '图片处理失败，请重试。')
    }
  }

  const onCutPaste = async (event, cutId) => {
    try {
      const images = await extractImagesFromClipboardEvent(event)
      if (!images.length) return
      event.preventDefault()
      appendCutImages(cutId, images)
      setStatusMessage(`已粘贴 ${images.length} 张图片。`)
    } catch (error) {
      setStatusMessage(error.message || '粘贴图片失败，请重试。')
    }
  }

  const removeCutImage = (cutId, imageId) => {
    updateCurrentScene((scene) => ({
      ...scene,
      cuts: scene.cuts.map((cut) => {
        if (cut.id !== cutId) return cut
        return {
          ...cut,
          images: (cut.images || []).filter((image) => image.id !== imageId),
        }
      }),
    }))
  }

  const getImagePrefs = (cutId) => imagePrefsByCutId[cutId] || { ratio: '16:9', size: '1K' }

  const setImagePref = (cutId, patch) => {
    setImagePrefsByCutId((prev) => ({
      ...prev,
      [cutId]: {
        ...getImagePrefs(cutId),
        ...patch,
      },
    }))
  }

  const buildCutPromptText = (cut) => {
    const shotSize = resolveCutValue(cut.customShotSize, cut.shotSize)
    const composition = resolveCutValue(cut.customComposition, cut.composition)
    const perspective = resolveCutValue(cut.customPerspective, cut.perspective)
    const movement = resolveCutValue(cut.customCameraMovement, cut.cameraMovement)

    return [
      `景别: ${shotSize || '未填写'}`,
      `构图: ${composition || '未填写'}`,
      `视角: ${perspective || '未填写'}`,
      `镜头运镜: ${movement || '未填写'}`,
      `人物: ${cut.character || '未填写'}`,
      `动作: ${cut.action || '未填写'}`,
      `详细描述: ${cut.detailedDescription || '未填写'}`,
      `对白: ${cut.dialogue || '无'}`,
    ].join(' | ')
  }

  const generatePreview = async (cut) => {
    const key = normalizedData.settings?.geminiApiKey || ''
    if (!key.trim()) {
      setStatusMessage('请先在 Project 设置填写 Gemini Banana Pro API Key。')
      return
    }

    const prefs = getImagePrefs(cut.id)
    setGeneratingCutId(cut.id)
    setStatusMessage('正在调用 Gemini 生成预览图，请稍候...')

    try {
      const dataUrl = await generateCutPreview({
        apiKey: key,
        projectName: currentProject?.name,
        projectPrompt: currentProject?.fixedPrompt,
        sceneName: currentScene?.name,
        scenePrompt: currentScene?.fixedPrompt,
        cutPrompt: buildCutPromptText(cut),
        ratioPreset: prefs.ratio,
        sizePreset: prefs.size,
      })

      updateCut(cut.id, { latestGeneratedImage: dataUrl })
      setStatusMessage('预览图生成成功。')
    } catch (error) {
      setStatusMessage(error.message || '生成失败，请检查 API Key 和网络。')
    } finally {
      setGeneratingCutId(null)
    }
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

                    <label>
                      Gemini Banana Pro API Key（仅本地存储）
                      <input
                        type="password"
                        placeholder="粘贴 API Key"
                        value={normalizedData.settings?.geminiApiKey || ''}
                        onChange={(event) =>
                          setData((prev) => ({
                            ...prev,
                            settings: {
                              ...(prev.settings || {}),
                              geminiApiKey: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>

                    <div className="custom-fields-wrap">
                      <div className="panel-head">
                        <strong>Project 自定义字段</strong>
                        <button onClick={addProjectCustomField}>+ 添加字段</button>
                      </div>

                      {(currentProject.customFields || []).map((field) => (
                        <div key={field.id} className="kv-row">
                          <input
                            placeholder="字段名（key）"
                            value={field.key}
                            onChange={(event) => updateProjectCustomField(field.id, { key: event.target.value })}
                          />
                          <input
                            placeholder="字段值（value）"
                            value={field.value}
                            onChange={(event) => updateProjectCustomField(field.id, { value: event.target.value })}
                          />
                          <button className="tiny danger" onClick={() => removeProjectCustomField(field.id)}>
                            删
                          </button>
                        </div>
                      ))}
                    </div>
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

                {currentScene.cuts.map((cut, index) => {
                  const imagePrefs = getImagePrefs(cut.id)
                  const compositionSelectValue = COMPOSITIONS.includes(cut.composition)
                    ? cut.composition
                    : CUSTOM_COMPOSITION_VALUE

                  return (
                    <div key={cut.id} className="cut-card" onPaste={(event) => onCutPaste(event, cut.id)}>
                      <div className="cut-title-row">
                        <div>
                          <h4>Cut {index + 1}</h4>
                          <div className="cut-meta">
                            {(resolveCutValue(cut.customShotSize, cut.shotSize) || '景别可留空')} ·{' '}
                            {resolveCutValue(cut.customComposition, cut.composition)} ·{' '}
                            {resolveCutValue(cut.customPerspective, cut.perspective)} ·{' '}
                            {resolveCutValue(cut.customCameraMovement, cut.cameraMovement)}
                          </div>
                        </div>
                        <button className="tiny danger" onClick={() => deleteCut(cut.id)}>
                          删除
                        </button>
                      </div>

                      <div className="cut-grid">
                        <label>
                          景别（可留空）
                          <div className="mixed-input">
                            <select
                              value={cut.shotSize || ''}
                              onChange={(event) => updateCut(cut.id, { shotSize: event.target.value, customShotSize: '' })}
                            >
                              <option value="">（留空）</option>
                              {SHOT_SIZES.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                            <input
                              placeholder="自定义景别（可选）"
                              value={cut.customShotSize || ''}
                              onChange={(event) => updateCut(cut.id, { customShotSize: event.target.value })}
                            />
                          </div>
                        </label>

                        <label>
                          构图
                          <div className="mixed-input composition-field">
                            <select value={compositionSelectValue} onChange={(event) => handleCompositionSelect(cut, event.target.value)}>
                              {COMPOSITIONS.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                              <option value={CUSTOM_COMPOSITION_VALUE}>自定义...</option>
                            </select>
                            <button type="button" onClick={() => openCompositionDialog(cut)}>
                              {cut.customComposition ? '编辑自定义' : '添加自定义'}
                            </button>
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
                          详细描述
                          <textarea
                            rows={3}
                            value={cut.detailedDescription || ''}
                            onChange={(event) => updateCut(cut.id, { detailedDescription: event.target.value })}
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

                      <div className="images-panel">
                        <div className="panel-head">
                          <strong>Cut 图片</strong>
                          <div className="inline-actions">
                            <button type="button" onClick={() => triggerFilePicker(cut.id)}>
                              上传图片
                            </button>
                            <span className="muted tiny-text">支持 Ctrl/Cmd + V 粘贴</span>
                          </div>
                        </div>

                        <input
                          ref={(node) => {
                            fileInputRefs.current[cut.id] = node
                          }}
                          className="hidden-file-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            onCutFileChange(cut.id, event.target.files)
                            event.target.value = ''
                          }}
                        />

                        {!!cut.images?.length && (
                          <div className="image-grid">
                            {cut.images.map((image) => (
                              <div key={image.id} className="image-item">
                                <img src={image.dataUrl} alt={image.name} />
                                <button className="tiny danger" type="button" onClick={() => removeCutImage(cut.id, image.id)}>
                                  删除
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="generate-row">
                        <div className="generate-options">
                          <select value={imagePrefs.ratio} onChange={(event) => setImagePref(cut.id, { ratio: event.target.value })}>
                            {IMAGE_RATIO_OPTIONS.map((ratio) => (
                              <option key={ratio} value={ratio}>
                                比例 {ratio}
                              </option>
                            ))}
                          </select>
                          <select value={imagePrefs.size} onChange={(event) => setImagePref(cut.id, { size: event.target.value })}>
                            {IMAGE_SIZE_OPTIONS.map((size) => (
                              <option key={size} value={size}>
                                尺寸 {size}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button type="button" onClick={() => generatePreview(cut)} disabled={generatingCutId === cut.id}>
                          {generatingCutId === cut.id ? '生成中...' : '一键生成预览图'}
                        </button>
                      </div>

                      {cut.latestGeneratedImage && (
                        <div className="generated-preview">
                          <img src={cut.latestGeneratedImage} alt={`Cut ${index + 1} 预览图`} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>

              {statusMessage && <div className="status-banner">{statusMessage}</div>}
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

      {compositionDialog.cutId && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="自定义构图">
            <h3>自定义构图</h3>
            <textarea
              rows={4}
              value={compositionDialog.value}
              placeholder="输入自定义构图"
              onChange={(event) => setCompositionDialog((prev) => ({ ...prev, value: event.target.value }))}
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setCompositionDialog({ cutId: null, value: '' })}>
                取消
              </button>
              <button type="button" onClick={saveCompositionDialog}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
