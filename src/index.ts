import { PicGo } from 'picgo'
import convert from 'heic-convert'

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

const handle = async (ctx: PicGo): Promise<any> => {
  const removeExif = ctx.getConfig('settings.remove-exif')
  if (removeExif) {
    ctx.emit('notification', {
      title: 'Error',
      body: 'convert-heic is not compatibile with remove-exif currently, please help me improve the plugin if you can do it.'
    })
    await sleep(10000)
    throw new Error('convert-heic conflict with remove-exif')
  }
  const heicPattern = /\.(heic)$/gi
  const jobs = ctx.output.map(async outputi => {
    if (heicPattern.test(outputi.extname.toLowerCase())) {
      ctx.log.info(`> Uploading HEIC picture, converting to JPEG: ${outputi.fileName}`)
      const fileNameOrignal = outputi.fileName
      const b = outputi.buffer
      try {
        outputi.buffer = await convert({
          buffer: b, // the HEIC file buffer
          format: 'JPEG', // output format
          quality: 1 // the jpeg compression quality, between 0 and 1
        })
      } catch (err) {
        ctx.emit('notification', {
          title: `Converting HEIC to JPEG ERROR: ${outputi.fileName}`,
          body: err
        })
        ctx.log.error(`Converting HEIC to JPEG ERROR: ${outputi.fileName}`)
        ctx.log.error(err)
      }
      outputi.extname = '.jpg'
      outputi.fileName = outputi.fileName.replace(heicPattern, '.jpg')
      ctx.log.info(`> Converting HEIC to JPEG success: ${fileNameOrignal} -> ${outputi.fileName}`)
    } else {
      ctx.log.info(`> Uploading non-HEIC picture, won't convert: ${outputi.fileName}`)
    }
    return outputi
  })
  ctx.output = await Promise.all(jobs)
  ctx.output = ctx.output.filter(Boolean)
  return ctx
}

export = (ctx: PicGo) => {
  const register = (): any => {
    ctx.helper.beforeUploadPlugins.register('convert-heic', { handle })
  }
  return {
    register
  }
}
