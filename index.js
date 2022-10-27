'use strict'

const AWS = require('aws-sdk')
const fs = require('fs')
const archiver = require('archiver')
const dayjs = require('dayjs')
const exec = require('child_process').exec

// ENVIRONMENT VARIABLES
const dumpOptions = process.env.MONGODUMP_OPTIONS
const bucketName = process.env.S3_BUCKET
const s3bucket = new AWS.S3({ params: { Bucket: bucketName } })
const s3StorageClass = process.env.S3_STORAGE_CLASS || 'STANDARD'
const zipFilename = process.env.ZIP_FILENAME || 'mongodb_backup'
const folderPrefix = process.env.FOLDER_PREFIX || 'mongodb_backups';
const dateFormat = process.env.DATE_FORMAT || 'YYYYMMDD_HHmmss'

module.exports.handler = function(_event, _context, _cb) {

  console.log(`MongoDB backup to S3 bucket '${bucketName}' is starting`)
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
  const fileName = zipFilename + '_' + dayjs().format(dateFormat)
  const folderName = `/tmp/${fileName}/`
  const filePath = `/tmp/${fileName}.zip`

  exec(`mongodump ${dumpOptions} --out ${folderName}`, (error, _stdout, _stderr) => {

      if (error) {
        console.log('Mongodump failed: ', error)
        return
      }

      const output = fs.createWriteStream(filePath)
      const zipArchive = archiver('zip')

      zipArchive.on('warning', function(err) {
        console.log('ZIP warning: ', err)
      })
       
      zipArchive.on('error', function(err) {
        console.log('ZIP error: ', err)
        return
      })

      output.on('close', function() {
        fs.readFile(filePath, function(err, data) {
          if (err) {
            console.log('readFile failed: ', err)
            return
          }
          s3bucket.upload({
            Key: `${folderPrefix}/${fileName}.zip`,
            Body: data,
            ContentType: 'application/zip',
            ServerSideEncryption: 'AES256',
            StorageClass: s3StorageClass
          }, function(err, _data) {
            fs.unlink(filePath, function(err) {
              if (err) {
                console.log('Could not delete temp file: ', err)
              }
            })
            if (err) {
              console.log('Upload to S3 failed: ', err)
            } else {
              console.log('Backup completed successfully')
            }
          })
        })
      })

      zipArchive.pipe(output)
      zipArchive.directory(folderName, false)
      zipArchive.finalize()

    })

}
