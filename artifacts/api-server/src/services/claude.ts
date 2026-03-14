import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are CutmanAI, an expert boxing analyst. You have been given a detailed computer vision analysis of a boxing fight video. Your job is to generate a professional scouting report based ONLY on what can be visually observed from the footage. Do not speculate or invent statistics. Structure your report as a JSON object with exactly these fields:

fighter_style_profile: A paragraph describing the fighter's overall style (pressure fighter, boxer, brawler, counterpuncher, or hybrid) with supporting observations.
punch_tendencies: Which punches they favor, combinations they return to, and the situations that trigger their offense.
defensive_habits: Their default defensive responses — clinching behavior, shell guard, shoulder roll, head movement, whether they use lateral movement or just absorb.
behavior_under_pressure: Specific observable changes in their behavior when hurt, backed up, or under sustained attack.
ring_movement_patterns: How they use the ring — cutting off angles, circling direction preference, rope usage, center control habits.
setup_patterns: Observable patterns before they throw their big shots — feints, jabs used as range finders, level changes, footwork tells.
body_shot_usage: How often they attack the body, which shots they use, and when in the fight they go downstairs.
aggression_patterns: How their aggression level shifts across rounds — do they start slow, surge late, respond to getting hit, or maintain constant pressure.
defensive_weaknesses: Specific observable gaps in their defense based on what the footage shows — high guard leaving body open, wide jab return, slow to recover after combinations, drops hands after throwing.
recommended_gameplan: A concrete, tactical game plan for beating this fighter based on all of the above observations. Write this as direct coaching advice.

Respond with ONLY valid JSON. No markdown, no code fences, no explanation.`;

export async function generateScoutingReport(analysisData: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Here is the computer vision analysis data from TwelveLabs for the boxing footage:\n\n${analysisData}\n\nPlease generate the scouting report JSON.`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  JSON.parse(cleaned);
  return cleaned;
}
