import { PreReplayRequest, PostReplayRequest, QuestionsRequest } from "@/types/replay";

export function buildPrePrompt(req: PreReplayRequest): string {
  return `你是一个保研面试复盘教练。请分析以下面试材料并生成结构化复盘报告。你必须仅输出 JSON，不要包含任何其他文本或 Markdown。

## 面试信息
- 面试类型: ${req.interviewType}
- 目标方向: ${req.targetDirection}
${req.targetSchool ? `- 目标院校: ${req.targetSchool}` : ""}

## 背景材料
${req.backgroundMaterials}

## 面试问题
${req.question}

## 临场回答（紧张状态下说出的话）
${req.liveAnswer}

## 冷静回答（冷静后组织的话）
${req.calmAnswer}

## 要求
1. 比较临场回答与冷静回答之间的差距
2. 分析临场回答丢失了哪些关键信息
3. 结合背景材料找出遗漏的证据
4. 预测导师可能追问的风险点
5. 生成最佳融合回答（口语化、真实、边界清楚）
6. 生成下次紧张时可用救场模板
7. 不得编造用户未提供的经历
8. 如果信息不足，要说明可信度有限

请严格按照以下JSON结构输出：
{
  "questionIntent": "这道题在保研面试中考察什么",
  "liveAnswerDiagnosis": [{"title": "问题点", "detail": "具体分析"}],
  "calmAnswerImprovements": [{"title": "改进点", "detail": "补充了什么"}],
  "liveLossAnalysis": [{"title": "损失类型(结论损失/证据损失/结构损失/深度损失/匹配损失/边界损失)", "detail": "丢失了什么"}],
  "missingEvidence": [{"title": "遗漏的材料", "detail": "本应使用的内容"}],
  "followUpRisks": [{"risk": "可能的追问", "reason": "追问原因", "suggestedPreparation": "准备建议"}],
  "bestMergedAnswer": "融合后的最佳回答",
  "rescueTemplate": "下次紧张时的救场模板，留填空 ___",
  "nextPracticeAdvice": [{"title": "建议方向", "detail": "具体建议"}]
}`;
}

export function buildPostPrompt(req: PostReplayRequest): string {
  const answersText = req.answers
    .map((a) => `### ${a.label}（${a.source}）\n${a.content}`)
    .join("\n\n");

  return `你是一个保研面试复盘教练。请分析以下多个回答版本并生成结构化复盘报告。你必须仅输出 JSON，不要包含任何其他文本或 Markdown。

## 面试信息
- 面试场景: ${req.interviewContext}
- 目标方向: ${req.targetDirection}
${req.backgroundMaterials ? `\n## 背景材料\n${req.backgroundMaterials}` : ""}

## 面试问题
${req.question}

## 回答版本
${answersText}

## 要求
1. 从导师视角比较多个回答版本
2. 分别分析每个版本的优缺点
3. 对关键句子进行逐句诊断
4. 识别空泛表达和过度包装风险
5. 预测导师可能追问的点
6. 融合多个版本生成最佳回答
7. 总结可迁移回答公式
8. 不得编造用户未提供的经历
9. 最佳回答要口语化、真实、边界清楚

请严格按照以下JSON结构输出：
{
  "questionIntent": "这道题在保研面试中考察什么",
  "answerRanking": [{"label": "版本标签", "rank": 1, "reason": "排名理由"}],
  "versionReviews": [{"label": "版本标签", "strengths": ["优点"], "problems": ["问题"], "keepParts": ["值得保留"], "avoidParts": ["不建议使用"]}],
  "sentenceDiagnosis": [{"original": "原句", "diagnosis": "诊断", "suggestion": "建议"}],
  "vagueAndOverpackagingRisks": [{"risk": "风险点", "reason": "原因", "suggestedPreparation": "准备建议"}],
  "followUpRisks": [{"risk": "可能的追问", "reason": "追问原因", "suggestedPreparation": "准备建议"}],
  "bestMergedAnswer": "融合后的最佳回答",
  "transferableFormula": "同类问题的可迁移回答公式",
  "nextInterviewChecklist": ["准备事项1", "准备事项2"]
}`;
}

export function buildQuestionsPrompt(req: QuestionsRequest): string {
  return `你是一个保研面试准备教练。请根据用户的背景材料生成一个适合练习的面试问题。你必须仅输出 JSON。

## 用户信息
${req.interviewType ? `- 面试类型: ${req.interviewType}` : ""}
${req.targetDirection ? `- 目标方向: ${req.targetDirection}` : ""}

## 背景材料
${req.backgroundMaterials}

## 要求
1. 生成一个面试中可能被问到的具体问题
2. 说明为什么这个问题值得练习
3. 不要生成过于简单或过于冷门的问题

请严格按照以下JSON结构输出：
{
  "question": "生成的面试问题",
  "reason": "为什么这个问题值得练习"
}`;
}

export const SYSTEM_PROMPT = "你是一个专业的保研面试复盘教练。你的重点是帮助用户诊断面试回答中的表达损失、证据缺失、逻辑漏洞和导师追问风险。你不得编造用户未提供的经历，也不得诱导过度包装。如果信息不足，要明确说明可信度有限。输出必须精准、具体、可执行，语言适合中国保研面试语境。";
