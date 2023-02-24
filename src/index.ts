import { PicGo } from 'picgo'
import convert from 'heic-convert'

const handle = async (ctx: PicGo): Promise<any> => {
  const heicPattern = /\.(heic)$/gi
  const jobs = ctx.output.map(async outputi => {
    try {
      if (heicPattern.test(outputi.extname.toLowerCase())) {
        ctx.log.info(`> Uploading HEIC picture, converting to JPEG: ${outputi.fileName}`)
        const fileNameOrignal = outputi.fileName
        outputi.extname = '.jpg'
        const b = outputi.buffer
        outputi.buffer = await convert({
          buffer: b, // the HEIC file buffer
          format: 'JPEG', // output format
          quality: 1 // the jpeg compression quality, between 0 and 1
        })
        ctx.log.info(`> Converting HEIC to JPEG success: ${fileNameOrignal} -> ${outputi.fileName}`)
      } else {
        ctx.log.info(`> Uploading non-HEIC picture, won't convert: ${outputi.fileName}`)
      }
      return outputi
    } catch (err) {
      ctx.emit('notification', {
        title: `Converting HEIC to JPEG ERROR: ${outputi.fileName}`,
        body: err
      })
      ctx.log.error(`Converting HEIC to JPEG ERROR: ${outputi.fileName}`)
      ctx.log.error(err)
    }
  })
  ctx.output = await Promise.all(jobs)
  ctx.output = ctx.output.filter(Boolean)
  return ctx
}

export = (ctx: PicGo) => {
  const register = (): any => {
    ctx.helper.beforeUploadPlugins.register('heic-to-jpeg', { handle })
  }
  return {
    register
  }
}
