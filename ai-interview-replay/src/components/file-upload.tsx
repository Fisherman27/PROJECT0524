"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  onText: (text: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export function FileUpload({ onText, loading, setLoading }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "docx", "pdf"].includes(ext || "")) {
      alert("仅支持 .txt .md .docx .pdf 文件");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error?.message || "文件解析失败");
        return;
      }
      onText(data.text);
    } catch {
      alert("文件上传失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center text-sm transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".txt,.md,.docx,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            解析中...
          </div>
        ) : fileName ? (
          <span className="text-gray-600">
            已上传: <span className="font-medium text-blue-600">{fileName}</span>
            <span className="ml-1 text-gray-400">(点击更换)</span>
          </span>
        ) : (
          <span className="text-gray-400">
            拖拽或点击上传简历、个人陈述等（.txt .md .docx .pdf）
          </span>
        )}
      </div>
    </div>
  );
}
