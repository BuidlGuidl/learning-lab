import * as fs from "fs";

const buffer = Buffer.alloc(1024);
const bytesRead = fs.readSync(0, buffer, 0, 1024, null);
const answer = buffer.toString("utf8", 0, bytesRead).trim().toLowerCase();

process.exit(answer.startsWith("y") ? 0 : 1);
