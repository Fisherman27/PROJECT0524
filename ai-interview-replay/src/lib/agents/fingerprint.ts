import crypto from "node:crypto";

export function createInputFingerprint(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

export function makeMaterialFingerprint(backgroundMaterials: string, targetDirection?: string, targetSchool?: string): string {
  return createInputFingerprint({
    backgroundMaterials,
    targetDirection: targetDirection || "",
    targetSchool: targetSchool || "",
  });
}

export function makeQuestionFingerprint(question: string, materialFingerprint: string, targetDirection?: string): string {
  return createInputFingerprint({
    question,
    materialFingerprint,
    targetDirection: targetDirection || "",
  });
}
