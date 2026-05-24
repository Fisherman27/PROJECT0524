export function getEnv() {
  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.ZHIPU_API_KEY;

  const baseUrl =
    process.env.LLM_BASE_URL ||
    process.env.DEEPSEEK_BASE_URL ||
    "https://api.deepseek.com/v1";

  const model =
    process.env.LLM_MODEL ||
    process.env.DEEPSEEK_MODEL ||
    "deepseek-chat";

  if (!apiKey) {
    throw new Error(
      "MISSING_API_KEY: 请在 .env.local 中设置 LLM_API_KEY（推荐通用名）或 DEEPSEEK_API_KEY 等供应商名"
    );
  }

  return { apiKey, baseUrl, model };
}

export function getPort() {
  return parseInt(process.env.PORT || "3000", 10);
}
