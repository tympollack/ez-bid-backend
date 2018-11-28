const shareable = module.parent.shareable
const productPicturesBucketConfig = shareable.config.datastore.buckets.productPictures
const bucketRef = shareable.functions.storage.bucket(productPicturesBucketConfig.name)
const thumbPrefix = '' + productPicturesBucketConfig.thumbPrefix

const { tmpdir } = require('os')
const { join, dirname } = require('path')

const sharp = require('sharp')
const fs = require('fs-extra')

exports.resize = bucketRef.object().onFinalize(async object => {
    const filePath = object.name
    const fileName = filePath.split('/').pop()

    if (fileName.includes(thumbPrefix) || !object.contentType.includes('image')) {
        console.log('exiting function')
        return false
    }

    const bucketDir = dirname(filePath)
    const workingDir = join(tmpdir(), 'thumbs')
    const tmpFilePath = join(workingDir, 'source.png')

    // 1. Ensure thumbnail dir exists
    await fs.ensureDir(workingDir)

    // 2. Download Source File
    await bucketRef.file(filePath).download({ destination: tmpFilePath })

    // 3. Resize the images and define an array of upload promises
    const sizes = [64, 128, 256]

    const uploadPromises = sizes.map(async size => {
        const thumbName = `${thumbPrefix}${size}_${fileName}`
        const thumbPath = join(workingDir, thumbName)

        // Resize source image
        await sharp(tmpFilePath).resize(size, size).toFile(thumbPath)

        // Upload to GCS
        return bucketRef.upload(thumbPath, { destination: join(bucketDir, thumbName) })
    })

    // 4. Run the upload operations
    await Promise.all(uploadPromises)

    // 5. Cleanup remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir)
})