import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import packageJSON from "../package.json" with { type: "json" };
import { resolveTargetFromVersion } from "../src/shared/version";

const main = async () => {
  const gitBranch = process.env.BRANCH_NAME;
  if (!gitBranch) {
    console.log("no branch");
    return 
  }
  console.log(`gitBranch: ${gitBranch}`);
  const isDev = (gitBranch === "main");
  
  // console.log(packageJSON.version);
  const versionData = resolveTargetFromVersion(packageJSON.version, isDev);
  console.log(versionData);
  // @aws-sdk/client-s3
  // 
  // { currentVersionm: packageJSON.version }

  const s3 = new S3Client({
    region: "ap-northeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const key = `releases/${versionData}/win32/x64/RELEASE.json`;

  const body = JSON.stringify({
    currentVersion: packageJSON.version,
  });

  const BUCKET_NAME = "mulmocast-app-update";
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: "application/json",
  });

  try {
    await s3.send(putCommand);
    console.log(`✅ Uploaded release.json to s3://${BUCKET_NAME}/${key}`);
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
};

main();
