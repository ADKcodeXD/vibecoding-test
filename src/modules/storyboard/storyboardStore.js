export const STORYBOARD_STORAGE_KEY = 'storyboard-editor-v1'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const VIEW_ANGLES = ['平视', '俯视', '仰视', '侧视', '背视']
export const SHOT_SIZES = ['特写', '近景', '半身', '中景', '全景', '大全景']
export const COMPOSITIONS = ['左三分之一', '居中对称', '对角线构图', '前景遮挡', '过肩']
export const CAMERA_MOVEMENTS = ['固定机位', '推镜', '拉镜', '摇镜', '移镜', '跟拍']

const normalizeCutFields = (cut = {}) => ({
  ...cut,
  shotSize: cut.shotSize ?? '中景',
  customShotSize: cut.customShotSize ?? '',
  composition: cut.composition ?? '居中对称',
  customComposition: cut.customComposition ?? '',
  perspective: cut.perspective ?? '平视',
  customPerspective: cut.customPerspective ?? '',
  cameraMovement: cut.cameraMovement ?? '固定机位',
  customCameraMovement: cut.customCameraMovement ?? '',
  character: cut.character ?? '',
  action: cut.action ?? '',
  dialogue: cut.dialogue ?? '',
})

export const createDefaultCut = () =>
  normalizeCutFields({
    id: createId(),
  })

export const createDefaultScene = (name = 'Scene 1') => ({
  id: createId(),
  name,
  fixedPrompt: '保持角色造型和光线连续性。',
  cuts: [createDefaultCut()],
})

export const createDefaultProject = (name = 'Storyboard Project 1') => ({
  id: createId(),
  name,
  fixedPrompt: '电影感叙事，统一色调，真实材质细节，连贯时空。',
  scenes: [createDefaultScene('Scene 1')],
})

export const initialStoryboardData = {
  projects: [createDefaultProject()],
  selectedProjectId: null,
  selectedSceneId: null,
}

export const loadStoryboardData = () => {
  try {
    const raw = localStorage.getItem(STORYBOARD_STORAGE_KEY)
    if (!raw) return initialStoryboardData
    const parsed = JSON.parse(raw)
    return {
      ...initialStoryboardData,
      ...parsed,
    }
  } catch {
    return initialStoryboardData
  }
}

export const saveStoryboardData = (data) => {
  localStorage.setItem(STORYBOARD_STORAGE_KEY, JSON.stringify(data))
}

export const normalizeStoryboardData = (data) => {
  const projects = (data.projects || []).map((project) => ({
    ...project,
    scenes: (project.scenes || []).map((scene) => ({
      ...scene,
      cuts: (scene.cuts || []).map((cut) => normalizeCutFields(cut)),
    })),
  }))

  if (!projects.length) {
    return { ...data, projects, selectedProjectId: null, selectedSceneId: null }
  }

  let selectedProjectId = data.selectedProjectId
  if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
    selectedProjectId = projects[0].id
  }

  const project = projects.find((item) => item.id === selectedProjectId)
  if (!project?.scenes?.length) {
    return { ...data, projects, selectedProjectId, selectedSceneId: null }
  }

  let selectedSceneId = data.selectedSceneId
  if (!selectedSceneId || !project.scenes.some((scene) => scene.id === selectedSceneId)) {
    selectedSceneId = project.scenes[0].id
  }

  return { ...data, projects, selectedProjectId, selectedSceneId }
}
