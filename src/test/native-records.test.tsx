import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ensureNativePresets, NATIVE_PRESETS_KEY, PRESET_CALLS, PRESET_SMS } from "@/components/phone/native-presets";
import { callResult, orderCalls, RECENTS_KEY } from "@/components/phone/contacts";
import { nextSmsTime, SMS_MESSAGES_KEY, SMS_THREADS_KEY, smsText } from "@/components/phone/sms";
import Call from "@/components/phone/apps/Call";

describe("Independent native records", () => {
  beforeEach(() => { cleanup(); localStorage.clear(); });
  it("appends fixed records once and keeps manual call, SMS and KKT edits", () => {
    const call = { ...PRESET_CALLS[0], name: "Manual name", time: "2026-10-20T00:00:00Z" };
    localStorage.setItem(RECENTS_KEY, JSON.stringify([call]));
    localStorage.setItem(SMS_THREADS_KEY, '[{"id":"contact-anton","name":"Manual Anton","number":"010"}]');
    localStorage.setItem(SMS_MESSAGES_KEY, '[{"id":"manual","threadId":"contact-anton","text":"Keep"}]');
    localStorage.setItem("kkt-msgs-v1", '[{"id":"kkt","ko":"보존"}]');
    ensureNativePresets();
    expect(JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]")[0]).toEqual(call);
    expect(JSON.parse(localStorage.getItem(SMS_MESSAGES_KEY) ?? "[]").filter((m: {threadId:string})=>m.threadId==="contact-anton")).toEqual([{id:"manual",threadId:"contact-anton",text:"Keep"}]);
    expect(localStorage.getItem("kkt-msgs-v1")).toBe('[{"id":"kkt","ko":"보존"}]');
    localStorage.setItem(RECENTS_KEY, "[]"); ensureNativePresets();
    expect(localStorage.getItem(RECENTS_KEY)).toBe("[]");
  });
  it("provides three independent localized conversations and five timeline-consistent calls", () => {
    ensureNativePresets();
    expect(JSON.parse(localStorage.getItem(SMS_THREADS_KEY) ?? "[]")).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]")).toHaveLength(5);
    expect(PRESET_SMS.filter((m)=>m.threadId==="contact-anton").map((m)=>m.time)).toEqual(["13:02","13:03","13:04"]);
    const first = PRESET_SMS[0]; if (!first) throw new Error("Missing fixture");
    expect(smsText(first,"zh")).toBe("哥，我到正门了。");
    expect(smsText(first,"en")).toBe("Hyung, I'm at the main gate.");
  });
  it("does not write over malformed saved data", () => {
    localStorage.setItem(SMS_MESSAGES_KEY, "broken");
    expect(()=>ensureNativePresets()).toThrow();
    expect(localStorage.getItem(SMS_MESSAGES_KEY)).toBe("broken");
    expect(localStorage.getItem(RECENTS_KEY)).toBeNull();
    expect(localStorage.getItem(NATIVE_PRESETS_KEY)).toBeNull();
  });
  it("orders recent calls newest first without rewriting the saved array", () => {
    const result=orderCalls(PRESET_CALLS);
    expect(result.map((r)=>r.id)).toEqual(["native-call-anton-1","native-call-anton-3","native-call-anton-2","native-call-minjae","native-call-doyun"]);
    expect(result.filter((r)=>r.direction==="missed").map((r)=>r.id)).toEqual(["native-call-anton-2"]);
    expect(PRESET_CALLS[1]?.id).toBe("native-call-anton-2");
  });
  it("reports connected, cancelled and missed simulation results accurately", () => {
    expect(callResult(false,true,8)).toEqual({direction:"outgoing",outcome:"connected",duration:8});
    expect(callResult(false,false,8)).toEqual({direction:"outgoing",outcome:"cancelled",duration:0});
    expect(callResult(true,false,8)).toEqual({direction:"missed",outcome:"missed",duration:0});
    expect(callResult(true,true,8)).toEqual({direction:"incoming",outcome:"connected",duration:8});
  });
  it("completes only once and never reports a record when the call just opens", () => {
    const complete=vi.fn();
    render(<Call contact={{id:"anton",name:"Anton",avatar:"",status:"",unread:0}} lang="en" onClose={()=>{}} onComplete={complete}/>);
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Hang up"}));
    fireEvent.click(screen.getByRole("button",{name:"Back to chat"}));
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith({direction:"outgoing",outcome:"cancelled",duration:0});
  });
  it("new SMS time follows saved messages even if device clock is earlier", () => {
    expect(nextSmsTime(PRESET_SMS.filter((m)=>m.threadId==="contact-anton"),"2026-10-26","04:00")).toEqual({date:"2026-10-26",time:"13:05"});
  });
});