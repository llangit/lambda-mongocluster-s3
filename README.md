# Lambda MongoDB cluster database backup to S3

Back up a **MongoDB Atlas** cluster database with replica set to **AWS S3** through a simple **AWS Lambda** function.

If you have a Mongo URI in the form:
```
mongodb://[user]:[pw]@[shards]/[database]?ssl=true&replicaSet=[replSet]&authSource=admin
```

Adapted from [alonhar/lambda-mongodb-s3-backup](https://github.com/alonhar/lambda-mongodb-s3-backup) to make it work with MongoDB Atlas cluster databases.

___

## Setup instructions

1. Clone repository and run `npm install`
2. ZIP contents of the folder (not the folder itself)
3. Create AWS Lambda function
   - Choose Node.js 8.10 runtime
   - Choose an existing role or create a new one and make sure it has write permissions to the S3 bucket that you want to back up to
   - Upload the ZIP file (no need to upload it to S3 first, as it is small enough to be uploaded directly in Lambda)
   - Set environment variables (see table below)
   - Increase timeout from 3sec to 30sec
   - Configure a trigger. With CloudWatch Event rules for instance, you can set up a cron schedule

## Environment variables

| Variable | Description | Required? |
| --- | --- |
| MONGO_DB_NAME | Name of the database | Yes |
| MONGO_USER | Username | Yes |
| MONGO_PW | Password | Yes |
| MONGO_AUTH_DB | Name of the auth database | No. Default is `admin` |
| MONGO_PORT | Database port | No (default is `27017`) |
| MONGO_REPLICA_SET | Name of the replica set in the form `clustername-shard-0` | Yes |
| MONGO_CLUSTER_SHARD | Name of the cluster shards in the form `clustername-shard-00-00-xxxxx.mongodb.net,clustername-shard-00-01-xxxxx.mongodb.net,clustername-shard-00-02-xxxxx.mongodb.net` | Yes |
| S3_BUCKET | Name of S3 bucket | Yes |
| DATE_FORMAT | Backup file name is in the format `[MONGO_DB_NAME]_[DATE_FORMAT]`. For possible date formatting options, refer to [DAY.JS](https://github.com/iamkun/dayjs) | No. Default is `YYYYMMDD_HHmmss` |
