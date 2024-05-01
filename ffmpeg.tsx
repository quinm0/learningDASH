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
      // { width: 640, height: 360 },
      // { width: 1280, height: 720 },
      // { width: 1920, height: 1080 },
    ];

    // Transcode video and audio separately
    for (const resolution of resolutions) {
      const videoOutputPath = `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_video.mp4`;
      const audioOutputPath = `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4`;

      // Transcode video
      await $`ffmpeg -i ${inputPath} -an -c:v libx264 -b:v 500k -s ${resolution.width}x${resolution.height} -profile:v main -level 3.1 ${videoOutputPath}`;

      // Transcode audio
      await $`ffmpeg -i ${inputPath} -vn -c:a aac -b:a 128k ${audioOutputPath}`;
    }

    const dashFiles = resolutions
      .map(
        (resolution) =>
          // Trying to figure out why these parameters for the MP4Box command are not working
          // `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_video.mp4#video:id=${resolution.height}p ${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4#audio:id=${resolution.height}p`
          `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4#audio:id=${resolution.height} ${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_video.mp4#video:id=${resolution.height}`
        // `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4`
        // `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_video.mp4#video ${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4#audio`
        // `-add ${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_video.mp4#video:id=${resolution.height}p:role=main -add ${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4#audio:id=${resolution.height}p:role=main`
        // `${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_video.mp4#video:id=${resolution.height}p:role=main ${TRANSCODED_PATH}${fileNameWithoutExtension}_${resolution.height}p_audio.mp4#audio:id=${resolution.height}p:role=main`
      )
      .join(" ");

    // Generate DASH manifest with non-multiplexed representations
    console.log(
      "RUNNING",
      `MP4Box -dash 4000 -rap -frag-rap -profile dashavc264:live -out ${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd ${dashFiles}`
    );
    await $`MP4Box -dash 4000 -rap -frag-rap -profile dashavc264:live -out ${TRANSCODED_PATH}${fileNameWithoutExtension}_manifest.mpd ${dashFiles}`;

    return "TRANSCODED_VIDEO_SUCCESSFULLY" as const;
  } catch (error) {
    return "ERROR_TRANSCODING_VIDEO" as const;
  }
}
