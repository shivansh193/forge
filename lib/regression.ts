import { AgentConfig, PinnedTest, RegressionResult } from "./types";
import { runBehavioral } from "./behavioral";
import { runJudge, geminiKeyFor, JUDGE_FALLBACK_THRESHOLD } from "./judgeClient";
import { diffMagnitude } from "./diff";

export async function runRegressionSuite(
  tests: PinnedTest[],
  prevConfig: AgentConfig,
  newConfig: AgentConfig,
  apiKey: string
): Promise<RegressionResult[]> {
  const judgeKey = geminiKeyFor([prevConfig, newConfig], apiKey);

  return Promise.all(
    tests.map(async (t): Promise<RegressionResult> => {
      try {
        const [prevOutput, newOutput] = await Promise.all([
          runBehavioral(prevConfig, t.input, apiKey),
          runBehavioral(newConfig, t.input, apiKey),
        ]);

        // Byte-identical outputs are unambiguous -- skip the judge call
        // entirely rather than spend an API call confirming the obvious.
        // Anything past that, magnitude stops being trustworthy for
        // "did the MEANING change" (a one-word negation flip scores low, a
        // full paraphrase scores high) so we hand it to the judge instead
        // of thresholding on the raw diff.
        const magnitude = diffMagnitude(prevOutput, newOutput);
        if (magnitude === 0) {
          return {
            testId: t.id,
            label: t.label,
            input: t.input,
            prevOutput,
            newOutput,
            changed: false,
            reason: null,
            error: null,
          };
        }

        try {
          const verdict = await runJudge(t.input, prevOutput, newOutput, judgeKey);
          return {
            testId: t.id,
            label: t.label,
            input: t.input,
            prevOutput,
            newOutput,
            changed: !verdict.same,
            reason: verdict.reason,
            error: null,
          };
        } catch {
          // Judge call failed (network, rate limit, missing key) -- degrade
          // to the old character-diff heuristic rather than dropping the
          // test result or failing the whole suite.
          return {
            testId: t.id,
            label: t.label,
            input: t.input,
            prevOutput,
            newOutput,
            changed: magnitude >= JUDGE_FALLBACK_THRESHOLD,
            reason: "Judge unavailable — used text-diff heuristic instead.",
            error: null,
          };
        }
      } catch (err) {
        return {
          testId: t.id,
          label: t.label,
          input: t.input,
          prevOutput: null,
          newOutput: null,
          changed: false,
          reason: null,
          error: err instanceof Error ? err.message : "Request failed.",
        };
      }
    })
  );
}
