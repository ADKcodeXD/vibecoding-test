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
    lines.push(
      `Cut ${index + 1}`,
      `- 景别：${cut.shotSize || '（未填写）'}`,
      `- 构图：${cut.composition || '（未填写）'}`,
      `- 视角：${cut.perspective || '（未填写）'}`,
      `- 人物：${cut.character || '（未填写）'}`,
      `- 人物动作：${cut.action || '（未填写）'}`,
      `- 对白：${cut.dialogue || '（无）'}`,
      ''
    )
  })

  return lines.join('\n').trim()
}
