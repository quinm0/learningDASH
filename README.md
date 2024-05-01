# streamingtest

I all of a sudden wanted to figure out how streaming video works and how all these tools like ffmpeg and MP4Box work together.
I'm using bun to run things because they have their handy shell package and also I don't have to compile things.

#### Current issue

Right now most things are looking pretty good, but for some reason when I'm passing the audio and video file MP4Box is only using the first provided file. I checked the encoding and tracks of the provided files and they are correct. So not sure what the issue is right now.

## Running

To install dependencies:

- install ffmpeg
- install MP4Box

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
