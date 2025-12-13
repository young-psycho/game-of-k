export const defaultPermanent = {
    activities: [
        { slug: "spank", name: "Spanking", verb: "spank", preposition: "'s", with_word: "with", has_body_part: true, has_duration: false, has_repetitions: true, min_reps: 1, max_reps: 20, default_targets: ["ass", "thighs"] },
        { slug: "kiss", name: "Kissing", verb: "kiss", preposition: "on the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 60, has_repetitions: false, default_targets: ["lips", "neck", "cheeks", "ears"] },
        { slug: "tickle", name: "Tickling", verb: "tickle", preposition: "in the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 120, has_repetitions: false, default_targets: ["armpits", "feet", "ribs", "belly", "neck"] },
        { slug: "restrain", name: "Restrain", verb: "restrain", preposition: "by the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 60, max_seconds: 600, has_repetitions: false, default_targets: ["arms", "legs"] },
        { slug: "pinch", name: "Nipple Pinching", verb: "pinch", preposition: "on the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 60, has_repetitions: false, default_targets: ["nipples"] },
        { slug: "lick", name: "Licking", verb: "lick", preposition: "on the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 120, has_repetitions: false, default_targets: ["nipples", "neck", "ears", "chest", "breasts", "pussy", "dick"] },
        { slug: "drink_from", name: "Drinking", verb: "drink from", preposition: "'s", with_word: "with", has_body_part: true, has_duration: false, has_repetitions: false, default_targets: ["mouth"] },
        { slug: "slap", name: "Slapping", verb: "slap", preposition: "on the", with_word: "", has_body_part: true, has_duration: false, has_repetitions: true, min_reps: 1, max_reps: 10, default_targets: ["face", "ass"] },
        { slug: "write_something_on", name: "Writing", verb: "write something on", preposition: "'s", with_word: "with", has_body_part: true, has_duration: false, has_repetitions: false, default_targets: ["ass", "belly", "chest", "back", "thighs"] },
        { slug: "gag", name: "Gagging", verb: "gag", preposition: "'s", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 30, max_seconds: 300, has_repetitions: false, default_targets: ["mouth"], enforced_targets: ["mouth"] },
        { slug: "punch", name: "Punching", verb: "punch", preposition: "on the", with_word: "", has_body_part: true, has_duration: false, has_repetitions: true, min_reps: 1, max_reps: 10, default_targets: ["arms", "shoulders"] },
        { slug: "give_oral_pleasure_to", name: "Give Oral Pleasure", verb: "give oral pleasure to", preposition: "on the", with_word: "using their", has_body_part: false, has_duration: true, min_seconds: 60, max_seconds: 300, has_repetitions: false, default_targets: ["pussy", "dick"] },
        { slug: "fuck", name: "Fucking", verb: "fuck", preposition: "in the", with_word: "with their", has_body_part: true, has_duration: true, min_seconds: 60, max_seconds: 600, has_repetitions: false, default_targets: ["pussy", "ass", "mouth"] },
        { slug: "masturbate", name: "Masturbate", verb: "masturbate", preposition: "'s", with_word: "with their", has_body_part: true, has_duration: true, min_seconds: 60, max_seconds: 300, has_repetitions: false, default_targets: ["pussy", "dick"] },
    ],
    body_parts: [
        // head: ears, cheeks, lips
        { slug: "ears", name: "ears", genders: ["M", "F"] },
        { slug: "cheeks", name: "cheeks", genders: ["M", "F"] },
        { slug: "lips", name: "lips", genders: ["M", "F"] },
        { slug: "mouth", name: "mouth", genders: ["M", "F"], is_actor: true, implicit: true, allowed_activities: ["kiss", "lick", "drink_from", "give_oral_pleasure_to"] },
        { slug: "tongue", name: "tongue", genders: ["M", "F"], is_actor: true, implicit: false, allowed_activities: ["tickle", "lick", "give_oral_pleasure_to"] },
        { slug: "face", name: "face", genders: ["M", "F"] },
        // torso: neck, shoulders, arms, chest, breasts, nipples, belly, ribs
        { slug: "neck", name: "neck", genders: ["M", "F"] },
        { slug: "shoulders", name: "shoulders", genders: ["M", "F"] },
        { slug: "arms", name: "arms", genders: ["M", "F"] },
        { slug: "hand", name: "hand", genders: ["M", "F"], is_actor: true, implicit: false, allowed_activities: ["spank", "tickle", "pinch", "slap", "punch", "masturbate"] },
        { slug: "armpits", name: "armpits", genders: ["M", "F"] },
        { slug: "chest", name: "chest", genders: ["M"] },
        { slug: "breasts", name: "breasts", genders: ["F"] },
        { slug: "nipples", name: "nipples", genders: ["M", "F"] },
        { slug: "belly", name: "belly", genders: ["M", "F"] },
        { slug: "ribs", name: "ribs", genders: ["M", "F"] },
        // genitals: dick, pussy, clitoris, ass
        { slug: "dick", name: "dick", genders: ["M"], is_actor: true, implicit: false, allowed_activities: ["fuck"] },
        { slug: "pussy", name: "pussy", genders: ["F"] },
        { slug: "clitoris", name: "clitoris", genders: ["F"] },
        { slug: "ass", name: "ass", genders: ["M", "F"] },
        // lower body: thighs, legs, feet
        { slug: "thighs", name: "thighs", genders: ["M", "F"] },
        { slug: "legs", name: "legs", genders: ["M", "F"] },
        { slug: "feet", name: "feet", genders: ["M", "F"] },
    ],

    tools: [
        // Spanking tools
        { slug: "belt", name: "belt", always_available: false, implicit: false, allowed_activities: ["spank"] },
        { slug: "paddle", name: "paddle", always_available: false, implicit: false, allowed_activities: ["spank"] },
        { slug: "crop", name: "crop", always_available: false, implicit: false, allowed_activities: ["spank"] },
        { slug: "whip", name: "whip", always_available: false, implicit: false, allowed_activities: ["spank"] },
        { slug: "flogger", name: "flogger", always_available: false, implicit: false, allowed_activities: ["spank"] },

        // Tickling tools
        { slug: "feather", name: "feather", always_available: false, implicit: false, allowed_activities: ["tickle"] },
        { slug: "brush", name: "brush", always_available: false, implicit: false, allowed_activities: ["tickle"] },
        { slug: "wartenberg_wheel", name: "wartenberg wheel", always_available: false, implicit: false, allowed_activities: ["tickle"] },

        // Restrain tools
        { slug: "handcuffs", name: "handcuffs", always_available: false, implicit: false, allowed_activities: ["restrain"] },
        { slug: "rope", name: "rope", always_available: false, implicit: false, allowed_activities: ["restrain"] },
        { slug: "tape", name: "tape", always_available: false, implicit: false, allowed_activities: ["restrain", "gag"] },
        { slug: "bands", name: "bands", always_available: false, implicit: false, allowed_activities: ["restrain"] },

        // Pinching tools
        { slug: "nipple_clamps", name: "nipple clamps", always_available: false, implicit: false, allowed_activities: ["pinch"] },

        // Writing tools
        { slug: "lipstick", name: "lipstick", always_available: false, implicit: false, allowed_activities: ["write_something_on"] },
        { slug: "marker", name: "marker", always_available: false, implicit: false, allowed_activities: ["write_something_on"] },

        // Gagging tools
        { slug: "ball_gag", name: "ball gag", always_available: false, implicit: false, allowed_activities: ["gag"] },
        { slug: "ring_gag", name: "ring gag", always_available: false, implicit: false, allowed_activities: ["gag"] },
        { slug: "dildo_gag", name: "dildo gag", always_available: false, implicit: false, allowed_activities: ["gag"] },
        { slug: "underwear", name: "their underwear", always_available: true, implicit: false, allowed_activities: ["gag"] },

        // Sexual toys
        { slug: "dildo", name: "dildo", always_available: false, implicit: false, allowed_activities: ["fuck"] },
        { slug: "vibrator", name: "vibrator", always_available: false, implicit: false, allowed_activities: ["masturbate"] },
        { slug: "butt_plug", name: "butt plug", always_available: false, implicit: false, allowed_activities: [] },
    ],

};
