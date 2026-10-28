import { describe, it, expect } from "vitest";
import { TWEETS } from "@/components/phone/story";
import { xText, editXText, weatherAppName } from "@/components/phone/x-language";
describe("System-language X and Weather", () => {
  it("translates every unchanged preset without changing the original", () => {
    const first = TWEETS[0]; if (!first) throw new Error("Missing tweet");
    expect(xText(first,"zh")).toBe("今天本来只是想吃个饭。");
    expect(xText(first,"en")).toBe("I was originally just going to get something to eat today.");
    expect(xText(first,"ko")).toBe("오늘 본래 그냥 밥만 먹으려고 했음");
    expect(TWEETS.every((t)=>xText(t,"en")!==t.text&&xText(t,"zh")!==t.text)).toBe(true);
  });
  it("preserves manually changed originals and explicit language edits including empty text", () => {
    const first = TWEETS[0]; if (!first) throw new Error("Missing tweet");
    expect(xText({...first,text:"My edit"},"zh")).toBe("My edit");
    const edited=editXText(first,"zh","我的译文");
    expect(xText(edited,"zh")).toBe("我的译文");
    expect(edited.text).toBe(first.text);
    expect(xText(editXText(edited,"en",""),"en")).toBe("");
  });
  it("selects reply translations independently of original text and other languages", () => {
    const reply={text:"Original reply",translations:{ko:"답글",en:"English reply",zh:"中文回复"}};
    expect(xText(reply,"zh")).toBe("中文回复");
    expect(xText(editXText(reply,"en","Saved English"),"ko")).toBe("답글");
    expect(reply.text).toBe("Original reply");
  });
  it("switches the default Weather name across system languages but preserves custom names", () => {
    expect(["en","ko","zh"].map((lang)=>weatherAppName("Weather",lang as "en"|"ko"|"zh"))).toEqual(["Weather","날씨","天气"]);
    expect(weatherAppName("My forecast","zh")).toBe("My forecast");
  });
});