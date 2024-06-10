import { transcodeVideoForDASH } from "./util/ffmpeg";

// delete "transcoded" folder on start
// await $`rm -rf ./transcoded`;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve the index.html file
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("./index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // if path is /transcode run
    if (url.pathname === "/transcode") {
      return new Response(await transcodeVideoForDASH("video.mp4"));
    }

    // Serve video files and the manifest for DASH streaming
    if (url.pathname.startsWith("/transcoded")) {
      return new Response(Bun.file(`.${url.pathname}`));
    }

    // Return a 404 for any other requests
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
console.log("Visit http://localhost:3000/transcode to transcode a video");
console.log(
  "Visit http://localhost:3000/videos/output.mp4 to download the transcoded video"
);
