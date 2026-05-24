// Backend logic tests - run with: npx tsx tests/test-backend.ts
import { testAll } from "./test-functions";

async function tryApi() {
  // Try dev server if running
  try {
    const res = await fetch("http://localhost:3000/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewType: "夏令营",
        targetDirection: "人工智能",
        backgroundMaterials: "做过大模型项目",
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (res.ok && data.question) {
      console.log("PASS: /api/questions live test ->", data.question.slice(0, 40));
    } else {
      console.log("SKIP: /api/questions server not available or returned error");
    }
  } catch {
    console.log("SKIP: Dev server not running (start with: npm run dev)");
  }

  try {
    const res = await fetch("http://localhost:3000/api/replay/pre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewType: "夏令营",
        targetDirection: "NLP",
        backgroundMaterials: "论文翻译项目",
        question: "为什么选这个方向？",
        liveAnswer: "感兴趣",
        calmAnswer: "因为做过翻译项目所以想继续深入",
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (res.ok && data.report) {
      console.log("PASS: /api/replay/pre live test -> questionIntent:", data.report.questionIntent?.slice(0, 50));
    } else {
      console.log("SKIP: /api/replay/pre returned", res.status, data?.error?.message || "");
    }
  } catch {
    console.log("SKIP: Dev server not running");
  }
}

tryApi();
