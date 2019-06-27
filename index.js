'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const url = require('url');
const dayjs = require('dayjs');
const ZipFolder = require('zip-a-folder');
const exec = require('child_process').exec;
const { WebClient } = require("@slack/web-api");

// ENVIRONMENT VARIABLES
// Mongo
const dbName = process.env.MONGO_DB_NAME;
const username = process.env.MONGO_USER;
const password = process.env.MONGO_PW;
const authDB = process.env.MONGO_AUTH_DB || 'admin';
const port = process.env.MONGO_PORT || '27017';
const replicaSet = process.env.MONGO_REPLICA_SET;
const clusterShard = process.env.MONGO_CLUSTER_SHARD;
// S3
const bucketName = process.env.S3_BUCKET;
const storageClass = process.env.S3_STORAGE_CLASS || "STANDARD";
const s3bucket = new AWS.S3({ params: { Bucket: bucketName, StorageClass: storageClass } });
// Slack
const slackKey = process.env.SLACK_KEY;
const slackChannel = process.env.SLACK_CHANNEL;

const dateFormat = process.env.DATE_FORMAT || 'YYYYMMDD_HHmmss';

module.exports.handler = function(event, context, cb) {

  console.log(`Backup of database '${dbName}' to S3 bucket '${bucketName}' is starting`);
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
  let fileName = dbName + '_' + dayjs().format(dateFormat);
  let folderName = `/tmp/${fileName}/`;
  let filePath = `/tmp/${fileName}.zip`;

  exec(`mongodump -d ${dbName} -u ${username} -p ${password} -o ${folderName} --authenticationDatabase ${authDB} --ssl --port ${port} -h "${replicaSet}/${clusterShard}"`, (error, stdout, stderr) => {

      if (error) {
        logMessage('Mongodump failed: ' + error)
        return;
      }

      ZipFolder.zipFolder(folderName, filePath, function(err) {
        if (err) {
          logMessage('ZIP failed: ', err);
        } else {
          fs.readFile(filePath, function(err, data) {
            s3bucket.upload({ Key: fileName + '.zip', Body: data, ContentType: 'application/zip' }, function(err, data) {
              fs.unlink(filePath, function(err) {
                if (err) {
                  logMessage('Could not delete temp file: ' + err);
                }
              });
              if (err) {
                logMessage('Upload to S3 failed: ' + err)
              } else {
                logMessage('Backup completed successfully');
              }
            });
          });
        }
      });

    });

};

const logMessage = async (message) => {
  try {
    console.log(message)

    if (slackKey && slackChannel) {
      const web = new WebClient(slackKey);
      return await web.chat.postMessage({
        channel: slackChannel,
        text: message,
        icon_emoji: ":cat:",
        as_user: false,
        username: "MongoBackupBot"
      });
    }
  } catch (err) {
    console.log(err);
  }
};
