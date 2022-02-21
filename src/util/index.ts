import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Iterates through a folder and calls back on every .js found.
 * @param folder The path to check
 * @param callback The function to call on each file found
 * @param extension The extension to look for
 */
export async function iterateFolder(
  folder: string,
  callback: (path: string) => Promise<any>,
  extension = '.js'
): Promise<any> {
  const files = fs.readdirSync(folder);
  return Promise.all(
    files.map(async (file) => {
      const filePath = path.join(folder, file);
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        const realPath = fs.readlinkSync(filePath);
        if (stat.isFile() && file.endsWith(extension)) {
          return callback(realPath);
        } else if (stat.isDirectory()) {
          return iterateFolder(realPath, callback);
        }
      } else if (stat.isFile() && file.endsWith(extension)) return callback(filePath);
      else if (stat.isDirectory()) return iterateFolder(filePath, callback);
    })
  );
}

/**
 * Escapes a string from regex.
 * @param str The string to escape
 */
export function escapeRegex(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

/**
 * Truncates string into a limit, appending an ellipsis when truncated.
 * @param text The text to truncate
 * @param limit The length to truncate at
 */
export function truncate(text: string, limit = 2000) {
  return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
}

/**
 * Iterates an object's keys and runs a function with a key and value
 * @param obj The object to iterate
 * @param func The function to run each key
 */
export function keyValueForEach(obj: any, func: (key: string, value: any) => void) {
  Object.keys(obj).map((key) => func(key, obj[key]));
}

/** Options for splitting a message. */
export interface SplitOptions {
  /** Maximum character length per message piece */
  maxLength?: number;
  /** Character(s) or Regex(s) to split the message with, an array can be used to split multiple times */
  char?: string | string[] | RegExp | RegExp[];
  /** Text to prepend to every piece except the first */
  prepend?: string;
  /** Text to append to every piece except the last */
  append?: string;
}

/**
 * Splits a string into multiple chunks at a designated character that do not exceed a specific length.
 * @param text Content to split
 * @param options Options controlling the behavior of the split
 */
export function splitMessage(
  text: string,
  { maxLength = 2000, char = '\n', prepend = '', append = '' }: SplitOptions = {}
) {
  if (text.length <= maxLength) return [text];
  let splitText: any = [text];
  if (Array.isArray(char)) {
    while (char.length > 0 && splitText.some((elem: string | any[]) => elem.length > maxLength)) {
      const currentChar = char.shift();
      if (currentChar instanceof RegExp) {
        splitText = splitText.flatMap((chunk: string) => chunk.match(currentChar));
      } else {
        splitText = splitText.flatMap((chunk: { split: (arg0: string | undefined) => any }) =>
          chunk.split(currentChar)
        );
      }
    }
  } else {
    splitText = text.split(char);
  }
  if (splitText.some((elem: string | any[]) => elem.length > maxLength))
    throw new RangeError('SPLIT_MAX_LEN');
  const messages = [];
  let msg = '';
  for (const chunk of splitText) {
    if (msg && (msg + char + chunk + append).length > maxLength) {
      messages.push(msg + append);
      msg = prepend;
    }
    msg += (msg && msg !== prepend ? char : '') + chunk;
  }
  return messages.concat(msg).filter((m) => m);
}
