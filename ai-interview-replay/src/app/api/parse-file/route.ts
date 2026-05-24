import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "请上传文件" } },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "文件不能超过 5MB" } },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = new TextDecoder("utf-8").decode(buffer);
    } else if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    } else {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "不支持的文件格式，仅支持 .txt .md .docx .pdf" } },
        { status: 400 }
      );
    }

    const cleaned = text.replace(/\0/g, "").trim();
    const truncated = cleaned.slice(0, 5000);

    return NextResponse.json({ text: truncated });
  } catch {
    return NextResponse.json(
      { error: { code: "MODEL_RESPONSE_INVALID", message: "文件解析失败，请确认文件未损坏" } },
      { status: 500 }
    );
  }
}
