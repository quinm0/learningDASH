import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";

const DEBUG_PATH = `./debug/`;
let currentDebugFilePath = `${DEBUG_PATH}${randomUUID()}.txt`;

async function ensureDebugFolderExists() {
  try {
    await mkdir(DEBUG_PATH, { recursive: true });
  } catch (error) {
    console.error(`Failed to create debug folder: ${error}`);
  }
}

export async function startNewDebugSession() {
  await ensureDebugFolderExists();
  currentDebugFilePath = `${DEBUG_PATH}${randomUUID()}.txt`;
  const startTime = new Date().toISOString();
  writeFile(currentDebugFilePath, `Debug session started at: ${startTime}\n`, {
    flag: "w",
  }).catch((error) => console.error(`Failed to write to debug file: ${error}`));
  console.log(
    `New debug session started: ${currentDebugFilePath} at ${startTime}`
  );
}

export function log(
  message: string,
  debugFilePath: string = currentDebugFilePath
) {
  ensureDebugFolderExists()
    .then(() => {
      // Add time to the message
      const time = new Date().toISOString();
      const messageWithTime = `[${time}] ${message}`;
      console.log(messageWithTime);
      writeFile(debugFilePath, messageWithTime + "\n", { flag: "a" }).catch(
        (error) => console.error(`Failed to append to debug file: ${error}`)
      );
    })
    .catch((error) =>
      console.error(`Failed to ensure debug folder exists: ${error}`)
    );
}
