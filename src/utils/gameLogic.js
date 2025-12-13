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
    const { activities, body_parts, tools } = permanent;


    // Precompute helper indexes
    const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));
    const activityBySlug = Object.fromEntries(activities.map((a) => [a.slug, a]));
    const bodyBySlug = Object.fromEntries(body_parts.map((b) => [b.slug, b]));

    // Identify body parts that can be actors
    const actorBodyParts = body_parts.filter(b => b.is_actor);
    const actorBodyPartSlugs = new Set(actorBodyParts.map(b => b.slug));

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
                const pG = prefs[giver.id]?.[act.slug];
                const pR = prefs[receiver.id]?.[act.slug];

                // Ensure preferences exist and are in the new object format
                if (!pG || !pR || typeof pG !== 'object' || typeof pR !== 'object') continue;

                const giverWantsToGive = pG.give?.enabled;
                const receiverWantsToReceive = pR.receive?.enabled;

                if (!giverWantsToGive || !receiverWantsToReceive) continue;

                // Check if this combo was recent
                const signature = `${giver.id}|${receiver.id}|${act.slug}`;
                const isRecent = recentSignatures.has(signature);


                // Determine allowed body parts (intersection of giver's target list and receiver's allowed list)
                let partsFiltered = [null];
                if (act.has_body_part) {
                    let giverTargets = pG.give?.targets || [];
                    let receiverTargets = pR.receive?.targets || [];

                    // Apply enforcement
                    if (act.enforced_targets) {
                        giverTargets = [...new Set([...giverTargets, ...act.enforced_targets])];
                        receiverTargets = [...new Set([...receiverTargets, ...act.enforced_targets])];
                    }

                    // Intersection
                    const commonTargets = giverTargets.filter(t => receiverTargets.includes(t));

                    // Filter by gender
                    partsFiltered = commonTargets.filter((bp) => {
                        const b = bodyBySlug[bp];
                        return b && (b.genders.includes(receiver.gender) || b.genders.includes("Any"));
                    });

                    if (partsFiltered.length === 0) continue;
                }


                // Determine allowed tools/actors (intersection)
                const giverTools = pG.give?.tools || [];
                const receiverTools = pR.receive?.tools || [];

                // Intersection
                let commonTools = giverTools.filter(t => receiverTools.includes(t));

                // Filter by inventory (tools need to be in inventory, actor body parts are always available)
                const inventorySet = new Set([
                    ...(inventory || []),
                    ...tools.filter(t => t.always_available).map(t => t.slug),
                    ...actorBodyParts.map(b => b.slug)
                ]);

                commonTools = commonTools.filter(ts => inventorySet.has(ts));

                // If no tools available (and we assume every activity needs a tool/actor), skip
                if (commonTools.length === 0) continue;

                // Now we need to find valid (Tool, Part) pairs
                // A pair is valid if the Part is in the intersection of:
                // 1. Global allowed targets (partsFiltered)
                // 2. Giver's allowed targets for this specific tool (if constrained)
                // 3. Receiver's allowed targets for this specific tool (if constrained)

                const validOptions = [];

                for (const toolSlug of commonTools) {
                    // Get constraints
                    const giverConstraints = pG.give?.tool_constraints?.[toolSlug];
                    const receiverConstraints = pR.receive?.tool_constraints?.[toolSlug];

                    // Start with global valid parts
                    let validPartsForTool = partsFiltered;

                    // Apply Giver constraints if any
                    if (giverConstraints && giverConstraints.length > 0) {
                        validPartsForTool = validPartsForTool.filter(p => giverConstraints.includes(p));
                    }

                    // Apply Receiver constraints if any
                    if (receiverConstraints && receiverConstraints.length > 0) {
                        validPartsForTool = validPartsForTool.filter(p => receiverConstraints.includes(p));
                    }

                    // If we have valid parts (or if the activity doesn't use body parts), this tool is an option
                    if (!act.has_body_part) {
                        validOptions.push({ tool: toolSlug, parts: [null] });
                    } else if (validPartsForTool.length > 0) {
                        validOptions.push({ tool: toolSlug, parts: validPartsForTool });
                    }
                }

                if (validOptions.length === 0) continue;

                const combo = { giver, receiver, act, options: validOptions };
                combos.push(combo);
                if (!isRecent) freshCombos.push(combo);
            }
        }
    }


    if (combos.length === 0) return { error: "No eligible dares. Adjust consents, preferences, or inventory." };

    // Prefer fresh combos, but fall back to all if no fresh ones available
    const poolToUse = freshCombos.length > 0 ? freshCombos : combos;


    const pick = sample(poolToUse);
    const option = sample(pick.options);
    const toolSlug = option.tool;
    const part = sample(option.parts);

    // Resolve tool object from either tools or body_parts
    const tool = toolSlug ? (toolBySlug[toolSlug] || bodyBySlug[toolSlug]) : null;

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
