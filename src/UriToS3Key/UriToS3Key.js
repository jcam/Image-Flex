'use strict'

const { parse } = require('querystring')

const DEFAULT_EXTENSION = 'webp'
const BAD_JPG_EXTENSION = 'jpg'
const GOOD_JPG_EXTENSION = 'jpeg'

const UriToS3Key = event => {
  console.info("event\n" + event)

  const { request, request: { headers, querystring, uri } } = event.Records[0].cf

  console.info("headers\n" + headers)
  console.info("querystring\n" + querystring)
  console.info("uri\n" + uri)

  const { h: height, w: width, f: format = '' } = parse(querystring)

  if (!width || isNaN(parseInt(width, 10))) return request
  if (!height || isNaN(parseInt(width, 10))) return request

  // const [,prefix, imageName, prevExtension] = uri.match(/(.*)\/(.*)\.(\w*)/)
  const [,prefix, imageName] = uri.match(/(.*)\/(.*)/)
  const acceptHeader = Array.isArray(headers.accept)
    ? headers.accept[0].value
    : ''
  const nextExtension = !format ? '' : format
    // : prevExtension === BAD_JPG_EXTENSION
    //   ? GOOD_JPG_EXTENSION
    //   : prevExtension.toLowerCase()
  const dimensions = `${width}x${height}`
  const key = nextExtension == '' ? `${prefix}/${dimensions}/${imageName}` : `${prefix}/${dimensions}/${imageName}.${nextExtension}`

  request.uri = key
  request.querystring = [
    `nextExtension=${nextExtension}`,
    `height=${height}`,
    `sourceImage=${prefix}/${imageName}`,
    `width=${width}`
  ].join('&')

  return request
}

module.exports = UriToS3Key
