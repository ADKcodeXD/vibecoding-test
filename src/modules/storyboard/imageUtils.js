const DEFAULT_MAX_WIDTH = 1600
const DEFAULT_MAX_HEIGHT = 1600
const DEFAULT_QUALITY = 0.82

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取图片失败，请重试。'))
    reader.readAsDataURL(file)
  })

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解码失败，请更换图片。'))
    image.src = dataUrl
  })

export const compressImageDataUrl = async (
  dataUrl,
  { maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT, quality = DEFAULT_QUALITY } = {}
) => {
  const image = await loadImage(dataUrl)
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
  const targetWidth = Math.max(1, Math.round(image.width * ratio))
  const targetHeight = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('浏览器不支持 Canvas，无法处理图片。')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL('image/jpeg', quality)
}

export const fileToCompressedDataUrl = async (file, options) => {
  const dataUrl = await fileToDataUrl(file)
  return compressImageDataUrl(dataUrl, options)
}

export const extractImagesFromClipboardEvent = async (event) => {
  const items = Array.from(event.clipboardData?.items || []).filter((item) => item.type.startsWith('image/'))
  if (!items.length) return []

  const files = items
    .map((item, index) => {
      const file = item.getAsFile()
      if (!file) return null
      return new File([file], file.name || `pasted-image-${index + 1}.png`, { type: file.type || 'image/png' })
    })
    .filter(Boolean)

  const dataUrls = []
  for (const file of files) {
    const dataUrl = await fileToCompressedDataUrl(file)
    dataUrls.push({ name: file.name || 'pasted-image.png', dataUrl })
  }

  return dataUrls
}
