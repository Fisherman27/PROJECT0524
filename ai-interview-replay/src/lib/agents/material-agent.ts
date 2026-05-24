import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { MaterialAgentOutput } from "./types";
import { EvidenceCard } from "@/types/replay";

function normalizeMaterialOutput(raw: unknown): MaterialAgentOutput {
  const obj = raw as Record<string, unknown>;
  const cards = ensureArray<Record<string, unknown>>(obj.evidenceCards);
  return {
    evidenceCards: cards.map((c) => ({
      title: ensureString(c.title, "未命名"),
      type: (c.type as EvidenceCard["type"]) || "other",
      content: ensureString(c.content),
      supportedQuestions: ensureArray<string>(c.supportedQuestions),
      abilities: ensureArray<string>(c.abilities),
      possibleFollowUps: ensureArray<string>(c.possibleFollowUps),
      usageRisk: ensureString(c.usageRisk),
      suggestedExpression: ensureString(c.suggestedExpression),
    })),
    summary: ensureString(obj.summary),
  };
}

export async function runMaterialAgent(ctx: {
  backgroundMaterials: string;
  targetDirection?: string;
  targetSchool?: string;
}): Promise<MaterialAgentOutput> {
  const prompt = `你是一个材料分析器。请从用户的背景材料中提取可用的个人证据，生成证据卡。

## 用户材料
${ctx.backgroundMaterials}

${ctx.targetDirection ? `目标方向：${ctx.targetDirection}` : ""}
${ctx.targetSchool ? `目标院校：${ctx.targetSchool}` : ""}

## 要求
1. 抽取最多4张证据卡，每张卡描述一个具体的项目/科研/课程/竞赛经历
2. 注意材料中的文件标签（如【个人简历】【个人陈述】【某某论文】），标签指明了材料类型和用途
3. 不编造用户未提及的经历
4. 每张卡要写清：材料名称、类型、关键内容、可证明的能力、适合支撑的问题类型、可能的追问点、使用风险、建议表达方式
5. 如果材料很少，返回少于4张卡并在 summary 说明信息不足
6. 仅输出JSON，不要其他文字

输出JSON结构：
{
  "evidenceCards": [
    {
      "title": "项目名称",
      "type": "project | research | course | competition | statement | other",
      "content": "详细内容",
      "supportedQuestions": ["适合回答的问题类型"],
      "abilities": ["可证明的能力"],
      "possibleFollowUps": ["可能引发的追问"],
      "usageRisk": "使用时需要注意的风险",
      "suggestedExpression": "建议如何表达这段材料"
    }
  ],
  "summary": "一句话总结材料分析结果"
}`;

  const raw = await callLLM(
    "你是一个保研面试材料分析师，专门从学生的简历和背景材料中提取可用证据。不编造经历，不夸大贡献。仅输出JSON。",
    prompt
  );
  return normalizeMaterialOutput(parseAgentJson(raw));
}
