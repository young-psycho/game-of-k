import { defaultPermanent } from "../data/defaults";

export const uid = () => Math.random().toString(36).slice(2, 10);
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Grammar niceties per activity/body-part
export function phrase(activitySlug, bodyPartSlug) {
    const override = {
        tickle: { armpits: "in the armpits" },
    };
    const table = override[activitySlug] || {};
    if (table[bodyPartSlug]) return table[bodyPartSlug];
    // sensible defaults
    const def = defaultPermanent.activities.find((b) => b.slug === activitySlug)?.preposition || "on the";
    const part = defaultPermanent.body_parts.find((b) => b.slug === bodyPartSlug)?.name || bodyPartSlug;
    return `${def} ${part}`;
}

// Dare generator with constraints
export function buildDare(session, permanent, recentSignatures = new Set()) {
    const { players, consents, prefs, inventory } = session;
    const { activities, body_parts, activity_body_parts, tools, activity_tools } = permanent;


    // Precompute helper indexes
    const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));
    const activityBySlug = Object.fromEntries(activities.map((a) => [a.slug, a]));
    const bodyBySlug = Object.fromEntries(body_parts.map((b) => [b.slug, b]));


    // Build all eligible combinations, then sample one
    const combos = [];
    const freshCombos = []; // combos not in recent history
    for (const giver of players) {
        for (const receiver of players) {
            if (giver.id === receiver.id) continue;
            // mutual consent
            const consentAB = !!consents[`${giver.id}|${receiver.id}`];
            const consentBA = !!consents[`${receiver.id}|${giver.id}`];
            if (!consentAB || !consentBA) continue;


            for (const act of activities) {
                const pG = prefs[giver.id]?.[act.slug] || "nope";
                const pR = prefs[receiver.id]?.[act.slug] || "nope";
                const giverOK = pG === "give" || pG === "both";
                const recOK = pR === "receive" || pR === "both";
                if (!giverOK || !recOK) continue;

                // Check if this combo was recent
                const signature = `${giver.id}|${receiver.id}|${act.slug}`;
                const isRecent = recentSignatures.has(signature);


                const allowedParts = act.has_body_part ? (activity_body_parts[act.slug] || []) : [null];
                const partsFiltered = allowedParts.filter((bp) => {
                    if (!bp) return true;
                    const b = bodyBySlug[bp];
                    return b && (b.genders.includes(receiver.gender) || b.genders.includes("Any"));
                });
                if (act.has_body_part && partsFiltered.length === 0) continue;


                const toolSlugs = activity_tools[act.slug] || [];
                const inventorySet = new Set([...(inventory || []), ...tools.filter(t => t.always_available).map(t => t.slug)]);
                const usableTools = toolSlugs.filter((ts) => inventorySet.has(ts));
                // If an activity defines tools but none usable, skip
                if (toolSlugs.length > 0 && usableTools.length === 0) continue;


                const combo = { giver, receiver, act, parts: partsFiltered, tools: usableTools.length ? usableTools : [null] };
                combos.push(combo);
                if (!isRecent) freshCombos.push(combo);
            }
        }
    }


    if (combos.length === 0) return { error: "No eligible dares. Adjust consents, preferences, or inventory." };

    // Prefer fresh combos, but fall back to all if no fresh ones available
    const poolToUse = freshCombos.length > 0 ? freshCombos : combos;


    const pick = sample(poolToUse);
    const part = pick.act.has_body_part ? sample(pick.parts) : null;
    const toolSlug = sample(pick.tools);
    const tool = toolSlug ? toolBySlug[toolSlug] : null;

    // Decide between duration or repetitions if both are available
    let secs = null;
    let reps = null;

    if (pick.act.has_duration && pick.act.has_repetitions) {
        // Randomly choose between duration or repetitions
        if (Math.random() < 0.5) {
            secs = rand(pick.act.min_seconds, pick.act.max_seconds);
        } else {
            reps = rand(pick.act.min_reps, pick.act.max_reps);
        }
    } else if (pick.act.has_duration) {
        secs = rand(pick.act.min_seconds, pick.act.max_seconds);
    } else if (pick.act.has_repetitions) {
        reps = rand(pick.act.min_reps, pick.act.max_reps);
    }


    // Build phrase
    const bodyFrag = part ? ` ${phrase(pick.act.slug, part)}` : "";
    const withFrag = tool && !tool.implicit ? ` ${pick.act.with_word} ${tool.name === "hand" ? "their " : ""}${tool.name}` : "";

    // Format duration
    let durFrag = "";
    if (secs) {
        if (secs >= 60) {
            const mins = Math.floor(secs / 60);
            const remainingSecs = secs % 60;
            if (remainingSecs === 0) {
                durFrag = ` for ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
            } else {
                durFrag = ` for ${mins} ${mins === 1 ? 'minute' : 'minutes'} and ${remainingSecs} ${remainingSecs === 1 ? 'second' : 'seconds'}`;
            }
        } else {
            durFrag = ` for ${secs} ${secs === 1 ? 'second' : 'seconds'}`;
        }
    }

    // Format repetitions
    let repFrag = "";
    if (reps) {
        repFrag = ` ${reps} ${reps === 1 ? 'time' : 'times'}`;
    }


    return {
        text: `${pick.giver.name} must ${pick.act.verb} ${pick.receiver.name}${bodyFrag}${withFrag}${repFrag}${durFrag}.`,
        meta: { giver: pick.giver, receiver: pick.receiver, activity: pick.act.slug, bodyPart: part, tool: toolSlug, seconds: secs, repetitions: reps },
    };
}
