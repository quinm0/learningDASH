import { $ } from "bun";
import { log, startNewDebugSession } from "./log"; // Import the log method

const BASE_PATH = "./";
const VIDEOS_PATH = `${BASE_PATH}videos/`;
const TRANSCODED_PATH = `${BASE_PATH}transcoded/`;

const resolutions: {
  width: number;
  height: number;
  bitrateV: string;
  bitrateA: string;
}[] = [
  { width: 160, height: 90, bitrateV: "50k", bitrateA: "8k" },
  // { width: 320, height: 180, bitrateV: "100k", bitrateA: "32k" },
  // { width: 640, height: 360, bitrateV: "500k", bitrateA: "64k" },
  // { width: 1280, height: 720, bitrateV: "1000k", bitrateA: "128k" },
  // { width: 1920, height: 1080, bitrateV: "3000k", bitrateA: "192k" },
];

export async function transcodeVideoForDASH(videoFile: string) {
  startNewDebugSession();
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

  // Build the FFmpeg command for multiple resolutions
  const inputPath = `${VIDEOS_PATH}${videoFile}`;
  let ffmpegCommand = `ffmpeg -re -i ${inputPath} -c:v libx264 -c:a aac`;

  resolutions.forEach((res, index) => {
    const resolutionAmmendment = ` -b:v:${index} ${res.bitrateV} -s:v:${index} ${res.width}x${res.height} -map 0:v -map 0:a`;
    ffmpegCommand += resolutionAmmendment;
  });

  ffmpegCommand += ` -profile:v:1 baseline -profile:v:0 main -bf 1 -keyint_min 120 -g 120 -sc_threshold 0 -b_strategy 0 -ar:a:1 22050 -use_timeline 1 -use_template 1 -adaptation_sets "id=0,streams=v id=1,streams=a" -f dash ${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd`;

  log(`\nFFmpeg Command: "${ffmpegCommand}"`);

  // Execute the FFmpeg command
  const result = await $`bash -c "${ffmpegCommand}"`.nothrow();
  log(`
    FFmpeg stdout: ${result.stdout}
    FFmpeg stderr: ${result.stderr} 
  `);

  return "TRANSCODED_VIDEO_SUCCESSFULLY" as const;
}
