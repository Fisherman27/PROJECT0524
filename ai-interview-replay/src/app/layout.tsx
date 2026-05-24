import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Replay - 保研面试复盘工具",
  description:
    "面向保研学生的AI面试复盘教练，通过面试前模拟和面试后复盘两种模式，帮助诊断回答中的表达损失、证据缺失和逻辑漏洞。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <div className="min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-white/20 bg-white/70 backdrop-blur-lg">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 transition-opacity hover:opacity-70">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs text-white">
                  IR
                </span>
                Interview Replay
              </Link>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                保研面试复盘教练
              </span>
            </div>
          </header>

          {/* Main content */}
          <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>

          {/* Footer */}
          <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
            Interview Replay &middot; 专注保研面试复盘 &middot; AI 精准诊断
          </footer>
        </div>
      </body>
    </html>
  );
}
