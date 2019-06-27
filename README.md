# Lambda MongoDB cluster database backup to S3

Back up a **MongoDB Atlas** cluster database with replica set to **AWS S3** through a simple **AWS Lambda** function. Result is a ZIP archive with .bson and .metadata.json files for each collection.

If you have a Mongo URI in the form:
```
mongodb://[user]:[pw]@[shards]/[database]?ssl=true&replicaSet=[replSet]&authSource=admin
```

Adapted from [alonhar/lambda-mongodb-s3-backup](https://github.com/alonhar/lambda-mongodb-s3-backup) to make it work with MongoDB Atlas cluster databases.

`mongodump` binary is version 4.0.5 (linux-x86_64-amazon).

This will write its logs to CloudWatch and can optionally also write to slack (see Environment Variables below).  

___

## Setup instructions

1. Clone repository and run `npm install`
2. ZIP contents of the folder (not the folder itself, and be sure not to include the .git folder)
3. Create AWS Lambda function
   - Choose Node.js 8.10 runtime
   - Choose an existing role or create a new one and make sure it has write permissions to the S3 bucket that you want to back up to
   - Upload the ZIP file (no need to upload it to S3 first, as it is small enough to be uploaded directly in Lambda)
   - Set environment variables (see table below)
   - Increase timeout from 3sec to 30sec
   - Configure a trigger. With CloudWatch Event rules for instance, you can set up a cron schedule

## Environment variables

| Variable | Description | Required? |
| --- | --- | --- |
| MONGO_DB_NAME | Name of the database | Yes |
| MONGO_USER | Username | Yes |
| MONGO_PW | Password | Yes |
| MONGO_AUTH_DB | Name of the auth database | No. Default is `admin` |
| MONGO_PORT | Database port | No. Default is `27017` |
| MONGO_REPLICA_SET | Name of the replica set in the form `clustername-shard-0` | Yes |
| MONGO_CLUSTER_SHARD | Name of the cluster shards in the form `clustername-shard-00-00-xxxxx.mongodb.net,clustername-shard-00-01-xxxxx.mongodb.net,clustername-shard-00-02-xxxxx.mongodb.net` | Yes |
| S3_BUCKET | Name of the S3 bucket | Yes |
| S3_STORAGE_CLASS | S3 storage class | No, default is Standard |
| DATE_FORMAT | Backup file name is in the format `[MONGO_DB_NAME]_[DATE_FORMAT]`. For possible date formatting options, refer to [DAY.JS](https://github.com/iamkun/dayjs/blob/master/docs/en/API-reference.md#format) | No. Default is `YYYYMMDD_HHmmss` |
| SLACK_KEY | A slack API key obtained from your slack account (looks like xoxp-xxxxxxxxxxx-xxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx) | No |
| SLACK_CHANNEL | The slack channel to write to | No |
