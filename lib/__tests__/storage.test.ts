// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Agent } from "../types";

function makeAgent(id: string, name = "Test"): Agent {
  return {
    id,
    name,
    avatarSeed: id,
    createdAt: new Date().toISOString(),
    commits: [
      {
        id: `${id}-c0`,
        timestamp: new Date().toISOString(),
        message: "Initial version",
        config: { provider: "gemini", prompt: "hi", temperature: 0.5, model: "x" },
        promptDiffFromPrev: null,
        status: "finalized",
        demo: null,
      },
    ],
    chatHistory: [],
    pinnedTests: [],
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

// The module-level cache in lib/storage.ts persists across tests within the
// same process (that's the whole point of it — see the comment above
// `cache` in storage.ts), so every test needs a fresh module instance to
// avoid one test's agents leaking into the next.
async function freshStorage() {
  vi.resetModules();
  return import("../storage");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAgents — per-agent writes", () => {
  it("updateAgent PUTs only the changed agent's id and body, not the whole list", async () => {
    const { useAgents } = await freshStorage();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ agents: [makeAgent("a"), makeAgent("b")] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    fetchMock.mockClear();

    act(() => {
      result.current.updateAgent("a", (agent) => ({ ...agent, name: "Renamed" }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/agents/a");
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body as string);
    expect(body.id).toBe("a");
    expect(body.name).toBe("Renamed");
  });

  it("addAgent PUTs the new agent to its own id, not the collection route", async () => {
    const { useAgents } = await freshStorage();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ agents: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    fetchMock.mockClear();

    const created = makeAgent("new-agent");
    act(() => {
      result.current.addAgent(created);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/agents/new-agent");
    expect(JSON.parse(init.body as string)).toEqual(created);
  });

  it("two updates to different agents each fire their own scoped PUT, so neither can clobber the other", async () => {
    const { useAgents } = await freshStorage();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ agents: [makeAgent("a"), makeAgent("b")] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    fetchMock.mockClear();

    act(() => {
      result.current.updateAgent("a", (agent) => ({ ...agent, name: "A2" }));
      result.current.updateAgent("b", (agent) => ({ ...agent, name: "B2" }));
    });

    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls.sort()).toEqual(["/api/agents/a", "/api/agents/b"]);
    // Both updates land in the shared in-memory cache regardless of request
    // ordering — this is what a whole-list PUT couldn't guarantee, since the
    // second PUT's full-array snapshot could have raced ahead of the first.
    expect(result.current.agents.find((a) => a.id === "a")?.name).toBe("A2");
    expect(result.current.agents.find((a) => a.id === "b")?.name).toBe("B2");
  });

  it("updateAgent on an unknown id is a no-op and fires no request", async () => {
    const { useAgents } = await freshStorage();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ agents: [makeAgent("a")] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    fetchMock.mockClear();

    act(() => {
      result.current.updateAgent("does-not-exist", (agent) => ({ ...agent, name: "x" }));
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
