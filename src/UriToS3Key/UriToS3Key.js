'use strict'

const { parse } = require('querystring')

const DEFAULT_EXTENSION = 'webp'
const BAD_JPG_EXTENSION = 'jpg'
const GOOD_JPG_EXTENSION = 'jpeg'

const UriToS3Key = event => {
  const { request, request: { headers, querystring, uri } } = event.Records[0].cf
  const { height: height = '', width: width = '', quality: quality = 95, withoutEnlargement: withoutEnlargement = 'true', format: format = 'dynamic', fit: fit = 'outside' } = parse(querystring)

  //if (!width || isNaN(parseInt(width, 10))) return request

  const [,prefix, imageName, prevExtension] = uri.match(/(.*)\/(.*)\.(\w*)/)

  if (prevExtension !== 'jpg'
      && prevExtension !== 'jpeg'
      && prevExtension !== 'webp'
      && prevExtension !== 'png'
      && prevExtension !== 'avif'
      && prevExtension !== 'tif'
      && prevExtension !== 'tiff'
      && prevExtension !== 'gif')
    return request

  const acceptHeader = Array.isArray(headers.accept)
    ? headers.accept[0].value
    : ''
  const nextExtension = format !== 'dynamic'
    ? format
    : acceptHeader.indexOf(DEFAULT_EXTENSION) !== -1
      ? DEFAULT_EXTENSION
      : prevExtension === BAD_JPG_EXTENSION
        ? GOOD_JPG_EXTENSION
        : prevExtension.toLowerCase()
  const dimensions = width === '' && height === ''
    ? 'original'
    : height
      ? width
        ? `${width}x${height}`
        : `${height}h`
      : width
  let mods = ''
  if (quality != 95)
    mods = `${mods}-${quality}`
  if (fit !== 'outside')
    mods = `${mods}-${fit}`
  if (withoutEnlargement !== 'true')
    mods = `${mods}-enlarge`
  const key = `${prefix}/${dimensions}${mods}/${imageName}.${nextExtension}`

  if (width === 'original')
    width = ''

  request.uri = key
  request.querystring = [
    `nextExtension=${nextExtension}`,
    `height=${height}`,
    `sourceImage=${prefix}/${imageName}.${prevExtension}`,
    `width=${width}`,
    `quality=${quality}`,
    `withoutEnlargement=${withoutEnlargement}`,
    `fit=${fit}`
  ].join('&')

  return request
}

module.exports = UriToS3Key
