'use strict'

const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const AWS = require('aws-sdk')
const AdmZip = require('adm-zip')
const dayjs = require('dayjs')

// ENVIRONMENT VARIABLES
const dumpOptions = process.env.MONGODUMP_OPTIONS
const bucketName = process.env.S3_BUCKET
const s3bucket = new AWS.S3({ params: { Bucket: bucketName } })
const s3StorageClass = process.env.S3_STORAGE_CLASS || 'STANDARD'
const zipFilename = process.env.ZIP_FILENAME || 'mongodb_backup'
const folderPrefix = process.env.FOLDER_PREFIX || 'mongodb_backups'
const dateFormat = process.env.DATE_FORMAT || 'YYYYMMDD_HHmmss'

exports.handler = async function (_event, _context) {
  console.info(`MongoDB backup to S3 bucket '${bucketName}' is starting`)

  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
  const fileName = zipFilename + '_' + dayjs().format(dateFormat)
  const folderName = `/tmp/${fileName}/`
  let zipBuffer = null

  try {
    await exec(`mongodump ${dumpOptions} --out ${folderName}`)
  } catch (err) {
    throw new Error('mongodump command failed: ', err)
  }

  try {
		const zip = new AdmZip()
    zip.addLocalFolder(folderName)
    zipBuffer = zip.toBuffer()
	} catch (err) {
		throw new Error('archive creation failed: ', err)
	}

  try {
    await s3bucket.upload({
      Key: `${folderPrefix}/${fileName}.zip`,
      Body: zipBuffer,
      ContentType: 'application/zip',
      ServerSideEncryption: 'AES256',
      StorageClass: s3StorageClass
    }).promise()
  } catch (err) {
    throw new Error('upload to S3 failed: ', err)
  }

  console.info('Backup completed successfully')
}
