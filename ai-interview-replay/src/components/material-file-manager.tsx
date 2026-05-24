"use client";

import { useState, useRef } from "react";

export type MaterialFile = {
  id: string;
  label: string;
  fileName: string;
  content: string;
};

let fid = 0;
function nextId(): string { return `f_${++fid}_${Date.now()}`; }

interface MaterialFileManagerProps {
  files: MaterialFile[];
  onAdd: (file: MaterialFile) => void;
  onRemove: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
}

export function MaterialFileManager({ files, onAdd, onRemove, onLabelChange }: MaterialFileManagerProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "docx", "pdf"].includes(ext || "")) {
      alert("仅支持 .txt .md .docx .pdf 文件");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error?.message || "文件解析失败");
        return;
      }
      onAdd({
        id: nextId(),
        label: "",
        fileName: file.name,
        content: data.text,
      });
    } catch {
      alert("文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  const dropAndUpload = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <svg className="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <input
                type="text"
                value={f.label}
                onChange={(e) => onLabelChange(f.id, e.target.value)}
                placeholder="添加标签（如：个人简历、个人陈述）"
                className="min-w-0 flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              <span className="text-xs text-gray-400 truncate max-w-[200px] hidden sm:inline-block">{f.fileName}</span>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="flex-shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
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
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={dropAndUpload}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-3 text-center text-sm transition-colors ${
          uploading ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-300"
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            解析中...
          </div>
        ) : (
          <span className="text-gray-400">
            上传材料文件（.txt .md .docx .pdf，≤20MB，可上传多个）
          </span>
        )}
      </div>
    </div>
  );
}
