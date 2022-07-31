const UriToS3Key = require('./UriToS3Key')
const mockEvent = require('viewer-request-event')
const mockEventAvif = require('viewer-request-event-avif')
const mockEventSmall = require('viewer-request-event-small')
const mockEventMods = require('viewer-request-event-lowquality-enlarge')
const mockEventNoWidth = require('viewer-request-event-nowidth')

describe('UriToS3Key', () => {
  it('should match snapshot', async () => {
    const response = await UriToS3Key(mockEvent)
    expect(response).toMatchSnapshot()
  })
})

describe('UriToS3Key', () => {
  it('should match snapshot', async () => {
    const response = await UriToS3Key(mockEventAvif)
    expect(response).toMatchSnapshot()
  })
})

describe('UriToS3Key', () => {
  it('should match snapshot', async () => {
    const response = await UriToS3Key(mockEventSmall)
    expect(response).toMatchSnapshot()
  })
})

describe('UriToS3Key', () => {
  it('should match snapshot', async () => {
    const response = await UriToS3Key(mockEventMods)
    expect(response).toMatchSnapshot()
  })
})

describe('UriToS3Key', () => {
  it('should match snapshot', async () => {
    const response = await UriToS3Key(mockEventNoWidth)
    expect(response).toMatchSnapshot()
  })
})
