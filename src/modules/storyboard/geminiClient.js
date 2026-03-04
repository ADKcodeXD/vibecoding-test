const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const modelCandidates = ['gemini-2.5-flash-image-preview', 'gemini-2.0-flash-preview-image-generation']

const pickTargetPixels = (sizePreset) => {
  if (sizePreset === '2K') return 2048
  return 1024
}

const getDimensions = (ratioPreset, sizePreset) => {
  const targetPixels = pickTargetPixels(sizePreset)

  if (ratioPreset === '9:16') {
    return { width: Math.round(targetPixels * 0.56), height: targetPixels }
  }

  if (ratioPreset === '1:1') {
    return { width: targetPixels, height: targetPixels }
  }

  return { width: targetPixels, height: Math.round(targetPixels * 0.56) }
}

const buildPrompt = ({ projectName, projectPrompt, sceneName, scenePrompt, cutPrompt, ratioPreset, sizePreset }) => {
  const { width, height } = getDimensions(ratioPreset, sizePreset)

  return [
    'Generate a cinematic storyboard preview image.',
    `Target aspect ratio: ${ratioPreset}.`,
    `Preferred output size: around ${width}x${height}.`,
    'Keep composition and camera language faithful to the shot description.',
    `Project: ${projectName || 'Untitled project'}`,
    `Project fixed prompt: ${projectPrompt || 'N/A'}`,
    `Scene: ${sceneName || 'Untitled scene'}`,
    `Scene fixed prompt: ${scenePrompt || 'N/A'}`,
    `Cut details: ${cutPrompt}`,
    'No text overlay, no watermark.',
  ].join('\n')
}

const callGenerateApi = async ({ apiKey, model, prompt }) => {
  const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Gemini API request failed: ${response.status}`)
  }

  const json = await response.json()
  const parts =
    json?.candidates?.[0]?.content?.parts ||
    json?.candidates?.find((candidate) => candidate?.content?.parts?.some((part) => part.inlineData?.data))?.content
      ?.parts ||
    []

  const imagePart = parts.find((part) => part?.inlineData?.data)
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini 未返回图片数据，请调整提示词后重试。')
  }

  const mimeType = imagePart.inlineData.mimeType || 'image/png'
  return `data:${mimeType};base64,${imagePart.inlineData.data}`
}

export const generateCutPreview = async ({
  apiKey,
  projectName,
  projectPrompt,
  sceneName,
  scenePrompt,
  cutPrompt,
  ratioPreset,
  sizePreset,
}) => {
  if (!apiKey?.trim()) {
    throw new Error('请先在 Project 设置中填写 Gemini Banana Pro API Key。')
  }

  const prompt = buildPrompt({
    projectName,
    projectPrompt,
    sceneName,
    scenePrompt,
    cutPrompt,
    ratioPreset,
    sizePreset,
  })

  let lastError = null
  for (const model of modelCandidates) {
    try {
      return await callGenerateApi({ apiKey: apiKey.trim(), model, prompt })
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(lastError?.message || 'Gemini 生成失败，请检查 API Key 或网络后重试。')
}
