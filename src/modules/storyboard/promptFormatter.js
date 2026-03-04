const resolveCutField = (customValue, presetValue) => {
  const trimmedCustom = (customValue || '').trim()
  if (trimmedCustom) return trimmedCustom
  return presetValue || ''
}

export const formatScenePrompt = (project, scene) => {
  if (!project || !scene) return ''

  const lines = [
    `【Project】${project.name}`,
    '【Project 固定提示词】',
    project.fixedPrompt || '（未填写）',
    '',
    `【Scene】${scene.name}`,
    '【Scene 固定提示词】',
    scene.fixedPrompt || '（未填写）',
    '',
    '【Cut 明细】',
  ]

  scene.cuts.forEach((cut, index) => {
    const shotSize = resolveCutField(cut.customShotSize, cut.shotSize)
    const composition = resolveCutField(cut.customComposition, cut.composition)
    const perspective = resolveCutField(cut.customPerspective, cut.perspective)
    const cameraMovement = resolveCutField(cut.customCameraMovement, cut.cameraMovement)

    lines.push(
      `Cut ${index + 1}`,
      `- 景别：${shotSize || '（未填写）'}`,
      `- 构图：${composition || '（未填写）'}`,
      `- 视角：${perspective || '（未填写）'}`,
      `- 镜头运镜：${cameraMovement || '（未填写）'}`,
      `- 人物：${cut.character || '（未填写）'}`,
      `- 人物动作：${cut.action || '（未填写）'}`,
      `- 对白：${cut.dialogue || '（无）'}`,
      ''
    )
  })

  return lines.join('\n').trim()
}
