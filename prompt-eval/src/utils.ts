import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "for",
  "help",
  "helps",
  "idea",
  "of",
  "platform",
  "software",
  "startup",
  "that",
  "the",
  "to",
  "tool",
  "with",
]);

export function projectPath(...parts: string[]) {
  return path.resolve(process.cwd(), ...parts);
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function readTextFile(filePath: string) {
  return readFile(filePath, "utf8");
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeTextFile(filePath: string, value: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf8");
}

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function keywordTokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function overlapRatio(source: string, candidate: string) {
  const sourceTokens = keywordTokens(source);
  const candidateTokens = keywordTokens(candidate);

  if (!sourceTokens.length || !candidateTokens.length) {
    return 0;
  }

  const shared = candidateTokens.filter((token) =>
    sourceTokens.some(
      (sourceToken) =>
        sourceToken === token ||
        sourceToken.startsWith(token) ||
        token.startsWith(sourceToken),
    ),
  );

  return shared.length / candidateTokens.length;
}

export function sentenceCount(value: string) {
  return value
    .split(/[.!?]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean).length;
}

export function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function clampScore(value: number) {
  return Math.max(1, Math.min(5, value));
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
