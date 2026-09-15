import { AgentConfig, PinnedTest, RegressionResult } from "./types";
import { runBehavioral } from "./behavioral";
import { diffMagnitude } from "./diff";

const DRIFT_THRESHOLD = 0.15;

export async function runRegressionSuite(
  tests: PinnedTest[],
  prevConfig: AgentConfig,
  newConfig: AgentConfig,
  apiKey: string
): Promise<RegressionResult[]> {
  return Promise.all(
    tests.map(async (t): Promise<RegressionResult> => {
      try {
        const [prevOutput, newOutput] = await Promise.all([
          runBehavioral(prevConfig, t.input, apiKey),
          runBehavioral(newConfig, t.input, apiKey),
        ]);
        return {
          testId: t.id,
          label: t.label,
          input: t.input,
          prevOutput,
          newOutput,
          changed: diffMagnitude(prevOutput, newOutput) >= DRIFT_THRESHOLD,
          error: null,
        };
      } catch (err) {
        return {
          testId: t.id,
          label: t.label,
          input: t.input,
          prevOutput: null,
          newOutput: null,
          changed: false,
          error: err instanceof Error ? err.message : "Request failed.",
        };
      }
    })
  );
}
