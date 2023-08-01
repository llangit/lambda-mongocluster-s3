# Back up MongoDB (Atlas) to S3 through Lambda

Back up a MongoDB database to AWS S3 through a simple AWS Lambda function by using the mongodump binary.
Result is a ZIP archive with .bson and .metadata.json files for each collection.

For a **MongoDB Atlas cluster database** backup, specify the URI command option like this:

`--uri "mongodb+srv://[user]:[pass]@[host]/[name]"`

Adapted from [alonhar/lambda-mongodb-s3-backup](https://github.com/alonhar/lambda-mongodb-s3-backup).

`mongodump` binary is version 100.7.4 (mongodb-database-tools-amazon2-x86_64-100.7.4)

___

## Setup instructions

1. Clone and install dependencies
2. ZIP contents of the folder (not the folder itself)
3. Create an AWS Lambda function
   - Select 'Author from scratch', enter your function name and select Node.js 18.x
   - Choose an existing role or create a new one and make sure it has a policy with `s3:PutObject` and `s3:ListBucket` permissions for the S3 bucket that you want to back up to, as well as the `AWSLambdaBasicExecutionRole` policy
   - Upload the ZIP file
   - Under the Configuration tab, set the environment variables (see table below) and increase the timeout (e.g. 1min), ephemeral storage (e.g. 1024 MB) and memory (e.g. 512 MB) (depending on the size of your database, you may need to adjust these settings)
   - Configure a trigger. For instance, with EventBridge you can set up a cron schedule

## Environment variables

| Variable | Description | Required? |
| --- | --- | --- |
| MONGODUMP_OPTIONS | Your mongodump command options separated by a space (without `mongodump` at the beginning), for instance `--uri "mongodb+srv://[user]:[pass]@[host]/[name]"` Refer to the [mongodump docs](https://docs.mongodb.com/database-tools/mongodump/) for a list of available options. Important: do not include the `--out` or `-o` option. | Yes |
| S3_BUCKET | Name of the S3 bucket | Yes |
| S3_STORAGE_CLASS | S3 storage class for the backup. Refer to the [S3 SDK docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html) for a list of available options. | No. Default is `STANDARD` |
| ZIP_FILENAME | Name of the ZIP archive | No. Default is `mongodb_backup` |
| FOLDER_PREFIX | Name of the Parent folder | No. Default is `mongodb_backups` |
| DATE_FORMAT | Will be appended to `ZIP_FILENAME` with a `_` separator. Refer to the [DayJS docs](https://day.js.org/docs/en/display/format) for a list of available formatting options. | No. Default is `YYYYMMDD_HHmmss` |

## Changelog

**v2.0.0**
- Rewritten using async/await
- Use of adm-zip instead of archiver
- Improved error handling and logging
- Updated mongodump to 100.7.4
- Updated dependencies
- Updated docs

**v1.2.0**
- Updated mongodump from 4.0.5 to 100.1.1
- The Mongo connection string is no longer fixed at a certain format. You now have the flexibility to specify the URI or host in the format you need, as well as other mongodump command options.
- There is a new env variable through which you can specify the ZIP filename (it is no longer the database name)
- The uploaded archive is now automatically AES256 encrypted on S3
- The S3 storage class is now defined on the file level instead of the bucket level
- Replaced 'zip-a-folder' by 'archiver'
- Updated docs
