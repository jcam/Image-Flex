'use strict'

const AWS = require('aws-xray-sdk').captureAWS(require('aws-sdk'))
const Sharp = require('sharp')
const { parse } = require('querystring')

const S3 = new AWS.S3()

const GetOrCreateImage = async event => {
  const {
    cf: {
      request: {
        origin: {
          s3: {
            domainName,
            path
          }
        },
        querystring,
        uri
      },
      response,
      response: {
        status
      }
    }
  } = event.Records[0]

  if (!['403', '404'].includes(status)) return response

  let { nextExtension, height, sourceImage, width, quality, withoutEnlargement, fit } = parse(querystring)

  if (!sourceImage) return response

  const [bucket] = domainName.match(/.+(?=\.s3\.amazonaws\.com)/i)
  const contentType = 'image/' + nextExtension
  const key = path
    ? path.replace(/^\//, '') + '/' + uri.replace(/^\//, '')
    : uri.replace(/^\//, '')
  const sourceKey = path
    ? path.replace(/^\//, '') + '/' + sourceImage.replace(/^\//, '')
    : sourceImage.replace(/^\//, '')

  height = parseInt(height, 10) || null
  width = parseInt(width, 10) || null
  quality = parseInt(quality, 10) || 95

  //if (!width) return response

  return S3.getObject({ Bucket: bucket, Key: sourceKey })
    .promise()
    .then(imageObj => {
      let resizedImage
      const errorMessage = `Error while resizing "${sourceKey}" to "${key}":`

      // Required try/catch because Sharp.catch() doesn't seem to actually catch anything. 
      try {
        if (!width && !height) {
          resizedImage = Sharp(imageObj.Body, {
            animated: true
          })
            .toFormat(nextExtension, {
              /**
               * @see https://sharp.pixelplumbing.com/api-output#webp for a list of options.
               */
              quality: quality
            })
            .withMetadata()
            .toBuffer()
            .catch(error => {
              throw new Error(`${errorMessage} ${error}`)
            })
        } else {
          resizedImage = Sharp(imageObj.Body, {
            animated: true
          })
            .resize(width, height, {
              withoutEnlargement: withoutEnlargement !== 'false' ? true : false,
              fit: fit
            })
            .toFormat(nextExtension, {
              /**
               * @see https://sharp.pixelplumbing.com/api-output#webp for a list of options.
               */
              quality: quality
            })
            .withMetadata()
            .toBuffer()
            .catch(error => {
              throw new Error(`${errorMessage} ${error}`)
            })
        }
      } catch(error) {
        console.error(`${errorMessage} ${error}`)
        console.error('Image resizing failed, returning original')
        return imageObj.Body
      }
      return resizedImage
    })
    .then(async imageBuffer => {
      await S3.putObject({
        Body: imageBuffer,
        Bucket: bucket,
        ContentType: contentType,
        Key: key,
        StorageClass: 'STANDARD'
      })
        .promise()
        .catch(error => {
          throw new Error(`Error while putting resized image '${uri}' into bucket: ${error}`)
        })

      return {
        ...response,
        status: 200,
        statusDescription: 'Found',
        body: imageBuffer.toString('base64'),
        bodyEncoding: 'base64',
        headers: {
          ...response.headers,
          'content-type': [{ key: 'Content-Type', value: contentType }]
        }
      }
    })
    .catch(error => {
      const errorMessage = `Error while getting source image object "${sourceKey}": ${error}`

      return {
        ...response,
        status: 404,
        statusDescription: 'Not Found',
        body: errorMessage,
        bodyEncoding: 'text',
        headers: {
          ...response.headers,
          'content-type': [{ key: 'Content-Type', value: 'text/plain' }]
        }
      }
    })
}

module.exports = GetOrCreateImage
