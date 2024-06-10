import { $ } from "bun";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";

const BASE_PATH = "./";
const VIDEOS_PATH = `${BASE_PATH}videos/`;
const TRANSCODED_PATH = `${BASE_PATH}transcoded/`;
const DEBUG_PATH = `${BASE_PATH}debug/`;

async function logToFileAndConsole(
  message: string,
  debugFilePath: string = DEBUG_PATH,
  isDebug: boolean = true
) {
  console.log(message);
  if (isDebug) {
    await writeFile(debugFilePath, message + "\n", { flag: "a" });
  }
}

export async function transcodeVideoForDASH(videoFile: string) {
  const fileNameWithoutExtension = videoFile.split(".")[0];
  const debugId = randomUUID();
  const debugFilePath = `${DEBUG_PATH}${debugId}.log`;

  // Create the debug folder if it does not exist
  await $`mkdir -p ${DEBUG_PATH}`;

  // Check if the video file exists
  if (!(await $`ls ${VIDEOS_PATH}${videoFile}`)) {
    await logToFileAndConsole(
      `FILE_NOT_FOUND: ${videoFile}`,
      debugFilePath,
      true
    );
    return "FILE_NOT_FOUND" as const;
  }

  // Create the transcoded folder if it does not exist
  await $`mkdir -p ${TRANSCODED_PATH}`;

  const lsResult = await $`ls ${TRANSCODED_PATH}`.quiet();
  // If the manifest already exists, return
  if (lsResult.stdout.includes(`${fileNameWithoutExtension}_manifest.mpd`)) {
    await logToFileAndConsole(
      `MANIFEST_EXISTS: ${fileNameWithoutExtension}_manifest.mpd`,
      debugFilePath,
      true
    );
    return "MANIFEST_EXISTS" as const;
  }

  // Simplified transcode video command
  const inputPath = `${VIDEOS_PATH}${videoFile}`;
  const outputPath = `${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd`;

  const ffmpegCommand = `ffmpeg -i ${inputPath} -c:v libx264 -c:a aac -b:v 1000k -b:a 128k -f dash ${outputPath}`;

  await logToFileAndConsole(
    `FFmpeg Command: ${ffmpegCommand}`,
    debugFilePath,
    true
  );

  // Execute the FFmpeg command
  const result =
    await $`ffmpeg -i ${inputPath} -c:v libx264 -c:a aac -b:v 1000k -b:a 128k -f dash ${outputPath}`;
  await logToFileAndConsole(
    `
        FFmpeg stdout: ${result.stdout}
        FFmpeg stderr: ${result.stderr} 
      `,
    debugFilePath,
    true
  );

  return "TRANSCODED_VIDEO_SUCCESSFULLY" as const;
}
