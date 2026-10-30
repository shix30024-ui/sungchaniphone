import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";
import type { Msg } from "./story";
import { sortMessages } from "./chronology";

export type AntonReply = { ko: string; zh: string; en: string };

const MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
let enginePromise: Promise<MLCEngine> | null = null;

async function getEngine(): Promise<MLCEngine> {
  if (!("gpu" in navigator)) {
    throw new Error("这个浏览器或设备暂不支持 WebGPU。请使用支持 WebGPU 的新版 Chrome 或 Edge。");
  }
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL, {
      initProgressCallback: (progress) => {
        window.dispatchEvent(new CustomEvent("anton-model-progress", {
          detail: { text: progress.text, progress: progress.progress },
        }));
      },
    }).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

const messageText = (message: Msg) =>
  (message.originalText || message.ko || message.zh || message.en || "").trim();

/** Generate Anton's next message locally in the browser; no API key or server call. */
export async function generateAntonReply(thread: Msg[], source: Msg): Promise<AntonReply> {
  const ordered = sortMessages(thread);
  const sourceIndex = ordered.findIndex((message) => message.id === source.id);
  const history = ordered
    .slice(0, sourceIndex < 0 ? ordered.length : sourceIndex + 1)
    .filter((message) => message.type === "text" || message.type === "image")
    .slice(-18);

  const transcript = history.map((message) => {
    const who = message.sender === "me" ? "Sungchan" : "Anton";
    return message.type === "image" ? `${who}: [sent a photo]` : `${who}: ${messageText(message)}`;
  }).join("\n");

  const engine = await getEngine();
  const result = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are Anton, replying in a private KakaoTalk conversation with Sungchan, someone you are already close to and quietly fond of. Write like a real Korean university student texting a close older friend: casual, observant, understated, sometimes playful or shy. You have your own life, opinions and activities. React specifically to what Sungchan just said and remember the preceding conversation. If he answers a question you asked, continue from that answer. Do not force a question into every reply, do not overdo affection, and do not repeat or paraphrase his message. Never use customer-service language, generic filler, role labels, stage directions, or quotation marks. Keep most replies to one or two natural chat sentences. Use natural Korean as the primary voice, with occasional ㅋㅋ or ㅎㅎ only when it fits. Keep the content wholesome and non-explicit.

Return ONLY valid JSON with exactly these string keys: "ko", "zh", "en". They must express the same natural reply in Korean, Simplified Chinese and English respectively. No markdown fences or extra text.`,
      },
      { role: "user", content: `Recent KakaoTalk conversation:\n${transcript}\n\nWrite Anton's next reply now.` },
    ],
    temperature: 0.85,
    top_p: 0.9,
    max_tokens: 180,
  });

  const raw = result.choices[0]?.message?.content;
  const content = typeof raw === "string" ? raw.trim() : "";
  if (!content) throw new Error("Anton 暂时没有生成回复，请稍后再试。");

  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<AntonReply>;
      if (parsed.ko?.trim() && parsed.zh?.trim() && parsed.en?.trim()) {
        return { ko: parsed.ko.trim(), zh: parsed.zh.trim(), en: parsed.en.trim() };
      }
    } catch { /* try the plain-text response below */ }
  }
  // If the model misses the JSON format, preserve its generated reply rather than
  // substituting a canned line. The same text is shown in each language slot.
  return { ko: content, zh: content, en: content };
}
