import { $ } from "bun";

const BASE_PATH = "./";
const VIDEOS_PATH = `${BASE_PATH}videos/`;
const TRANSCODED_PATH = `${BASE_PATH}transcoded/`;

export async function transcodeVideoForDASH(videoFile: string) {
  const fileNameWithoutExtension = videoFile.split(".")[0];

  // Check if the video file exists
  if (!(await $`ls ${VIDEOS_PATH}${videoFile}`)) {
    return "FILE_NOT_FOUND" as const;
  }

  // Create the transcoded folder if it does not exist
  await $`mkdir -p ${TRANSCODED_PATH}`;

  const lsResult = await $`ls ${TRANSCODED_PATH}`.quiet();
  // If the manifest already exists, return
  if (lsResult.stdout.includes(`${fileNameWithoutExtension}_manifest.mpd`)) {
    return "MANIFEST_EXISTS" as const;
  }

  // Transcode video into separate video and audio files
  try {
    const inputPath = `${VIDEOS_PATH}${videoFile}`;
    const resolutions = [
      { width: 426, height: 240 },
      // Additional resolutions can be uncommented or added here
    ];

    // Dynamically construct FFmpeg command parts for each resolution
    const resolutionCommands = resolutions
      .map((resolution, index) => {
        const { width, height } = resolution;
        const bitrate = 8000 / 2 ** index; // Adjust bitrate dynamically based on index
        return `-b:v:${index} ${bitrate}k -s ${width}x${height}`;
      })
      .join(" ");

    const varStreamMap = resolutions
      .map((_, index) => `v:${index},a:0`)
      .join(" ");

    console.log(
      `ffmpeg -i ${inputPath} -map 0:v -map 0:a -c:v libx264 -c:a aac ${resolutionCommands} -b:a 128k -var_stream_map "${varStreamMap}" -f dash ${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd`
    );

    await $`ffmpeg -i ${inputPath} -map 0:v -map 0:a -c:v libx264 -c:a aac ${resolutionCommands} -b:a 128k -var_stream_map "${varStreamMap}" -f dash ${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd`;

    return "TRANSCODED_VIDEO_SUCCESSFULLY" as const;
  } catch (error) {
    console.error("Error transcoding video:", error);
    return "ERROR_TRANSCODING_VIDEO" as const;
  }
}
