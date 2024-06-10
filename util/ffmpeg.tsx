import { $ } from "bun";
import { log } from "./log"; // Import the log method

const BASE_PATH = "./";
const VIDEOS_PATH = `${BASE_PATH}videos/`;
const TRANSCODED_PATH = `${BASE_PATH}transcoded/`;

export async function transcodeVideoForDASH(videoFile: string) {
  const fileNameWithoutExtension = videoFile.split(".")[0];

  // Check if the video file exists
  if (!(await $`ls ${VIDEOS_PATH}${videoFile}`)) {
    log(`FILE_NOT_FOUND: ${videoFile}`);
    return "FILE_NOT_FOUND" as const;
  }

  // Create the transcoded folder if it does not exist
  await $`mkdir -p ${TRANSCODED_PATH}`;

  const lsResult = await $`ls ${TRANSCODED_PATH}`.quiet();
  // If the manifest already exists, return
  if (lsResult.stdout.includes(`${fileNameWithoutExtension}_manifest.mpd`)) {
    log(`MANIFEST_EXISTS: ${fileNameWithoutExtension}_manifest.mpd`);
    return "MANIFEST_EXISTS" as const;
  }

  // Simplified transcode video command
  const inputPath = `${VIDEOS_PATH}${videoFile}`;
  const outputPath = `${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd`;

  const ffmpegCommand = `ffmpeg -i ${inputPath} -c:v libx264 -c:a aac -b:v 1000k -b:a 128k -f dash ${outputPath}`;

  log(`FFmpeg Command: ${ffmpegCommand}`);

  // Execute the FFmpeg command
  const result =
    await $`ffmpeg -i ${inputPath} -c:v libx264 -c:a aac -b:v 1000k -b:a 128k -f dash ${outputPath}`.nothrow();
  log(`
    FFmpeg stdout: ${result.stdout}
    FFmpeg stderr: ${result.stderr} 
  `);

  return "TRANSCODED_VIDEO_SUCCESSFULLY" as const;
}
