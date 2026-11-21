import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const jobs = [
  ['public/stickers/bubu-dudu-box.jpeg', 'public/stickers/bubu-dudu-box.png'],
  ['public/stickers/bubu-dudu-phone.jpeg', 'public/stickers/bubu-dudu-phone.png'],
  ['public/stickers/bubu-dudu-cake.jpeg', 'public/stickers/bubu-dudu-cake.png'],
]

const isNearWhite = (data, offset) => data[offset] > 235 && data[offset + 1] > 235 && data[offset + 2] > 235

await mkdir('public/stickers', { recursive: true })

for (const [input, output] of jobs) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const visited = new Uint8Array(info.width * info.height)
  const queue = []

  const enqueueIfBackground = (x, y) => {
    const index = y * info.width + x
    if (visited[index]) return
    const offset = index * 4
    if (!isNearWhite(data, offset)) return
    visited[index] = 1
    queue.push(index)
  }

  for (let x = 0; x < info.width; x += 1) {
    enqueueIfBackground(x, 0)
    enqueueIfBackground(x, info.height - 1)
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueueIfBackground(0, y)
    enqueueIfBackground(info.width - 1, y)
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    const x = index % info.width
    const y = Math.floor(index / info.width)
    if (x > 0) enqueueIfBackground(x - 1, y)
    if (x < info.width - 1) enqueueIfBackground(x + 1, y)
    if (y > 0) enqueueIfBackground(x, y - 1)
    if (y < info.height - 1) enqueueIfBackground(x, y + 1)
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * 4 + 3] = 0
  }

  await sharp(data, { raw: info }).png().toFile(output)
  console.log(`created ${output}`)
}
