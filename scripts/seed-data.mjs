// India's Got Latent-flavoured seed data + generators for simulate-igl.mjs.
//
// Everything here is fictional. Judges/acts evoke the vibe of Samay Raina's
// "India's Got Latent" (a host + rotating guest panel roasting amateur acts)
// without using real people's likenesses defamatorily. Content is Hinglish and
// deliberately steers clear of the auto-hold keywords in src/app/actions/roasts.js
// (caste/religion slurs etc.) so nothing seeds as HELD/removed.

import { pick, randInt, randFloat, chance } from "./seed-common.mjs";

export const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ── Judge panel (Redis panel:members pool) ──────────────────────────────────
// MAX_PANEL = 5 (src/lib/panel.js). The host sits on every episode; guests rotate.
export const JUDGES = [
  {
    name: "Samrat Raikar",
    descriptor: "The Host",
    instagram_handle: "samrat_on_latent",
    bio: "Chess pe stream karta tha, ab logon ki zindagi pe react karta hoon. Sab kuch allowed hai.",
    tags: ["Genuinely Fair", "Savage Roaster", "Visibly Bored"],
  },
  {
    name: "Tanya Bakshi",
    descriptor: "The Standup",
    instagram_handle: "tanyacomedy",
    bio: "Mumbai open-mic veteran. Agar main hassi toh tu pass, warna ghar ja.",
    tags: ["Savage Roaster", "Petty Comments"],
  },
  {
    name: "DJ Rehaan",
    descriptor: "The Music Guy",
    instagram_handle: "rehaanbeats",
    bio: "Producer/DJ. Pitch off ho toh kaan se khoon aata hai mera.",
    tags: ["Backhanded Praise", "Overly Generous"],
  },
  {
    name: "Meher Kapadia",
    descriptor: "The Influencer",
    instagram_handle: "meheronthegram",
    bio: "2.4M followers, 0 chill. Reels banao, content do, points lo.",
    tags: ["Overly Generous", "Visibly Bored"],
  },
  {
    name: "Coach Balwinder",
    descriptor: "The OG",
    instagram_handle: "balwinder.real",
    bio: "Punjab se. Akhada bhi chalata hoon aur opinions bhi. Dono free hain.",
    tags: ["Genuinely Fair", "Petty Comments"],
  },
  {
    name: "Abhay Deolkar",
    descriptor: "The Cynical Critic",
    instagram_handle: "abhay.does.not.care",
    bio: "Indie filmmaker. Agar tumhari performance mein 'nuance' nahi hai, toh main so raha hoon.",
    tags: ["Visibly Bored", "Savage Roaster"]
  },
  {
    name: "Kriti Malhotra",
    descriptor: "The Gen-Z Rep",
    instagram_handle: "kriti.slays",
    bio: "Corporate slave by day, absolute menace on Twitter by night. Delusion pasand hai mujhe.",
    tags: ["Petty Comments", "Backhanded Praise"]
  },
  {
    name: "Varun Grover",
    descriptor: "The Writer",
    instagram_handle: "groverwrites",
    bio: "Lyrics likhta hoon, log bolte hain gehra hai. Main toh bas cringe se bachne ki koshish kar raha hoon.",
    tags: ["Genuinely Fair", "Visibly Bored"]
  },
  {
    name: "Rohan Joshi",
    descriptor: "The Disgruntled Comedian",
    instagram_handle: "mojorojo",
    bio: "AIB chalaya hai bhai, tumhara confidence dekh ke thoda jealous hoon bas.",
    tags: ["Savage Roaster", "Petty Comments"]
  },
  {
    name: "Shreya Ghoshal-ish",
    descriptor: "The Vocal Coach",
    instagram_handle: "singwithshreya",
    bio: "Sur bigda toh main stage se uth jaungi. Autotune live perform nahi hota beta.",
    tags: ["Genuinely Fair", "Backhanded Praise"]
  },
  {
    name: "Zakir Khan",
    descriptor: "The Sakht Launda",
    instagram_handle: "zakirkhan_200",
    bio: "Shayari aur dard. Par agar content kharab hua, toh pighalna mushkil hai.",
    tags: ["Overly Generous", "Genuinely Fair"]
  },
  {
    name: "Ananya Pandey",
    descriptor: "The Nepo Baby",
    instagram_handle: "ananyap",
    bio: "Struggle kya hota hai main sikhungi aaj. 10/10 for trying though!",
    tags: ["Overly Generous", "Visibly Bored"]
  },
  {
    name: "Aadar Malik",
    descriptor: "The Musical Comic",
    instagram_handle: "theaadarmalik",
    bio: "Piano pe roast karne ki aadat hai. Pitch perfect cringefest chahiye mujhe.",
    tags: ["Savage Roaster", "Backhanded Praise"]
  }
];

// ── Contestant act pool ─────────────────────────────────────────────────────
// `quality` (2–9) is the hidden "true appeal" that biases the crowd's votes.
// self_score is what they claim (usually inflated); judge_average is set per
// episode relative to quality to engineer ALIGNED / HARSH / GENEROUS verdicts.
const ACT_POOL = [
  { name: "Bantai Beatbox", talent_type: "Beatboxing", quality: 8, bio: "Andheri ka beatboxer. Mooh se pura DJ set nikaalta hai." },
  { name: "Shayar-e-Heartbreak", talent_type: "Shayari", quality: 7, bio: "Engineering chhod ke shayari pakdi. Ex ke liye 40 sher ready hain." },
  { name: "Pinky Didi", talent_type: "Standup Comedy", quality: 6, bio: "Aunty energy, savage punchlines. Society ki har gossip ki malik." },
  { name: "Rapper Chhotu", talent_type: "Rap", quality: 7, bio: "Dharavi ka 17-saal ka rapper. Bars itne tej ki subtitle lag jaaye." },
  { name: "Yogi Flexman", talent_type: "Contortion", quality: 5, bio: "Sharir ko rubber band bana deta hai. Doctor mana karte hain." },
  { name: "Veena Vibes", talent_type: "Classical Music", quality: 8, bio: "Veena pe Carnatic bhi, lo-fi bhi. Dadi proud, internet confused." },
  { name: "Magic Mehul", talent_type: "Magic", quality: 4, bio: "Card tricks 50%, confidence 200%. Trick fail ho toh bhi smile." },
  { name: "Dabbu Dance", talent_type: "Dance", quality: 6, bio: "Shaadi viral-video uncle, ab official stage pe. Steps illegal hain." },
  { name: "Standup Sardar", talent_type: "Standup Comedy", quality: 7, bio: "Delhi ka sardar, observational comedy ka baadshah." },
  { name: "Glass Gulshan", talent_type: "Stunt", quality: 3, bio: "Kaanch pe chalta hai, insurance nahi hai. Mummy ko mat batao." },
  { name: "Sufi Sana", talent_type: "Singing", quality: 9, bio: "Sufi aवaz jo rooh tak jaaye. Judges ke aansu guaranteed." },
  { name: "Mimicry Manoj", talent_type: "Mimicry", quality: 6, bio: "50 actors ki awaaz, ek hi gala. Politicians bhi karta hai (safe wale)." },
  { name: "Pottery Pari", talent_type: "Pottery Art", quality: 5, bio: "30 second me chaak pe masterpiece. Ya phir keechad. 50-50." },
  { name: "Skater Sid", talent_type: "Skateboarding", quality: 6, bio: "Flyover ke neeche seekha. Ab ramp pe gravity ko challenge deta hai." },
  { name: "Garba Queen Hetal", talent_type: "Folk Dance", quality: 7, bio: "Surat se. 9 raat practice, ab non-stop garba machine." },
  { name: "Coder Comedian", talent_type: "Standup Comedy", quality: 5, bio: "IT job chhod ke jokes. Bugs se zyada laughs target hai." },
  { name: "Whistler Wajid", talent_type: "Whistling", quality: 4, bio: "Poore Bollywood gaane seeti pe. Padosi shikayat karte hain." },
  { name: "Acro Aisha", talent_type: "Acrobatics", quality: 8, bio: "Gymnast turned street performer. Hawa me ghoomna hobby hai." },
  { name: "Tabla Tornado", talent_type: "Percussion", quality: 8, bio: "Banaras gharana. Haath itne tej, ungliyan dikhti nahi." },
  { name: "Painter Prakash", talent_type: "Speed Painting", quality: 6, bio: "Ulta latak ke portrait banata hai. Reveal pe sab dang." },
];

// ── Episode plan: a full Season 1 in mixed lifecycle states ──────────────────
// alignment hint engineers the verdict board: how judges scored vs the crowd.
//   "ALIGNED"  → judges ≈ crowd
//   "HARSH"    → judges below crowd  (sum_judge < sum_people)
//   "GENEROUS" → judges above crowd
export const EPISODE_PLAN = [
  { season: 1, episode: 1, title: "The One Where Nobody Got 10", state: "REVEALED", alignment: "ALIGNED", acts: 5 },
  { season: 1, episode: 2, title: "Shayari Made The Host Cry", state: "REVEALED", alignment: "HARSH", acts: 6 },
  { season: 1, episode: 3, title: "Beatbox vs Bollywood Night", state: "REVEALED", alignment: "GENEROUS", acts: 5 },
  { season: 1, episode: 4, title: "The Sufi That Broke The Panel", state: "REVEALED", alignment: "ALIGNED", acts: 6 },
  { season: 1, episode: 5, title: "Live: Semi-Final Madness", state: "LIVE", alignment: "ALIGNED", acts: 6 },
  { season: 1, episode: 6, title: "Grand Finale (Predictions Open)", state: "UPCOMING", alignment: "ALIGNED", acts: 6 },
];

// Build the concrete contestant list for an episode from the act pool (no reuse
// across episodes — addContestantToEpisode creates a fresh Contestant each time).
export function buildContestants(plan, poolCursor) {
  const out = [];
  for (let i = 0; i < plan.acts; i++) {
    const act = ACT_POOL[poolCursor.i % ACT_POOL.length];
    poolCursor.i++;
    const quality = act.quality;
    // Self score: contestants over-rate themselves by 1–3 (capped at 10).
    const self_score = Math.min(10, quality + randInt(1, 3));
    // Judge average relative to quality, shaped by the episode's alignment hint.
    let judge_average;
    if (plan.alignment === "HARSH") judge_average = Math.max(1, quality - randFloat(1.8, 3.0));
    else if (plan.alignment === "GENEROUS") judge_average = Math.min(10, quality + randFloat(1.8, 3.0));
    else judge_average = quality + randFloat(-0.8, 0.8);
    out.push({
      name: act.name,
      talent_type: act.talent_type,
      bio: act.bio,
      quality,
      self_score: Math.round(self_score * 10) / 10,
      judge_average: Math.round(judge_average * 10) / 10,
    });
  }
  return out;
}

// ── User generation ─────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "rohit", "priya", "arjun", "sneha", "vikram", "ananya", "karan", "isha", "rahul", "neha",
  "aditya", "pooja", "siddharth", "kavya", "manish", "divya", "akash", "riya", "gaurav", "shreya",
  "nikhil", "tanvi", "harsh", "meera", "yash", "simran", "abhishek", "aarti", "deepak", "nisha",
  "varun", "swati", "ramesh", "payal", "sunny", "komal", "imran", "fatima", "ankit", "preeti",
  "sachin", "ritu", "naveen", "anjali", "rajat", "bhavna", "kunal", "sonali", "vivek", "jyoti",
];
const HANDLE_FLAVOURS = [
  "memer", "fan", "savage", "07", "99", "official", "xd", "ki_jaan", "rocks", "boss",
  "lol", "420", "stan", "haterproof", "og", "uncle", "didi", "vibes", "tharki", "nawab",
];
const CITIES = ["delhi", "mumbai", "blr", "pune", "kolkata", "lucknow", "indore", "surat", "jaipur", "patna"];

const BIO_TEMPLATES = [
  (n, c) => `${cap(c)} ka aam aadmi. IGL ka din-raat fan. Roasts pe PhD.`,
  (n) => `Comedy > everything. Samay ka content dekh ke job chhodne ka mann karta hai.`,
  (n, c) => `${cap(c)} se. Vote deta hoon dil se, judge karta hoon dimaag se.`,
  () => `Latent dekhta hoon, predictions lagata hoon, haarta hoon, phir bhi aata hoon.`,
  () => `Beatbox > shayari. Fight me in the comments.`,
  (n) => `Self-proclaimed talent scout. Top/bottom call karne me expert (kabhi kabhi).`,
  () => `Sirf Sufi acts ke liye aata hoon. Baaki sab skip.`,
  (n, c) => `${cap(c)} based. Roast karna art hai, gaali nahi.`,
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Returns 300 user objects with a behaviour "persona" used by the simulation.
// ~15% are NOT onboarded yet (temp username u_<hex>, no bio) — exactly the shape
// the auth route creates on first Google login (see [...nextauth]/route.js +
// migration 0027). They mostly lurk; a few still cast a vote (the "temp name
// leaking onto the leaderboard" reality the migration calls out).
export function generateUsers(count = 300) {
  const usernames = new Set();
  const users = [];

  const makeHandle = (first) => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const flavour = pick(HANDLE_FLAVOURS);
      let h = chance(0.5) ? `${first}_${flavour}` : `${first}${randInt(1, 9999)}`;
      h = h.slice(0, 20); // User.username is VARCHAR(20)
      if (!usernames.has(h)) { usernames.add(h); return h; }
    }
    // Fallback guaranteed-unique handle.
    let h = `${first}${users.length}`.slice(0, 20);
    while (usernames.has(h)) h = `u${randInt(0, 9)}${h}`.slice(0, 20);
    usernames.add(h);
    return h;
  };

  const hex = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");

  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES);
    const city = pick(CITIES);
    const onboarded = !chance(0.15);

    // Trust tiers: most casual, some regulars, a few high-trust veterans, ~2% banned.
    const roll = Math.random();
    let trust, tier;
    if (roll < 0.70) { trust = randFloat(0.2, 0.4); tier = "casual"; }
    else if (roll < 0.88) { trust = randFloat(0.4, 0.65); tier = "regular"; }
    else if (roll < 0.98) { trust = randFloat(0.65, 0.95); tier = "veteran"; }
    else { trust = randFloat(0.05, 0.15); tier = "casual"; }
    const is_shadow_banned = chance(0.015);

    // Voting personality: bias (how generous), troll/stan flags, and how active.
    const bias = gaussianLite() * 1.6; // centred at 0
    const troll = chance(0.10);
    const stan = chance(0.12);
    const activity = onboarded
      ? (tier === "veteran" ? 0.95 : tier === "regular" ? 0.85 : 0.7)
      : 0.18; // un-onboarded users barely participate

    const personality_tag = bias > 1.2 ? "Generous Soul" : bias < -1.2 ? "Harsh Critic" : "Balanced Juror";

    let username;
    if (onboarded) {
      username = makeHandle(first);
    } else {
      username = `u_${hex()}`;
      while (usernames.has(username)) username = `u_${hex()}`;
      usernames.add(username);
    }
    const bioFn = pick(BIO_TEMPLATES);

    users.push({
      // DB columns
      username,
      email: `${username}.${i}@example.in`, // unique, obviously fake
      avatar_url: null,
      trust_score: Math.round(trust * 1000) / 1000,
      is_shadow_banned,
      onboarded,
      bio: onboarded ? bioFn(first, city).slice(0, 280) : null,
      voting_personality_tag: onboarded ? personality_tag : null,
      created_at: daysAgoISO(randInt(1, 75)),
      // simulation-only persona (stripped before insert)
      _persona: { bias, troll, stan, activity, tier },
    });
  }
  return users;
}

// Light gaussian without importing (keeps this module standalone-ish).
function gaussianLite() {
  return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2 * 2;
}
function daysAgoISO(days) {
  return new Date(Date.now() - days * 86400_000 - randInt(0, 86_400) * 1000).toISOString();
}

// ── Hinglish content lines ──────────────────────────────────────────────────
// Roasts are aimed at the ACTS, playful not hateful. {name} is filled in.
export const ROAST_LINES = [
  "Bhai {name} ne stage pe aake confidence ka over-acting kar diya 😂",
  "{name} ka act dekh ke judges ne calculator nikaal liya... minus me dene ke liye.",
  "Maine {name} ko 10 diya... galti se. Wapas nahi le sakta kya?",
  "{name}: talent thoda, drama zyada. Classic latent move.",
  "Itna nervous tha {name}, mic bhi ghabra gaya 🎤",
  "{name} ka performance dekh ke meri dadi bhi bول padi 'beta kuch aur try kar'.",
  "Honestly {name} deserved better edit. Raw talent tha bhai.",
  "{name} aaya, dekha, aur judges ko confuse kar gaya. Respect.",
  "Plot twist: {name} actually achha tha, hum log hi expert ban rahe the.",
  "{name} ke act me suspense tha — kya yeh khatam hoga? 😭",
  "Beatbox ho ya shayari, {name} ne apna best diya. Points kam, dil bada.",
  "{name} ko bottom me daalne walon, dil hai ya pathar?",
];

// Community takes (general vibe, some tagged to an episode/contestant).
export const COMMUNITY_LINES = [
  "Yeh season ab tak ka sabse balanced panel hai, mat fight karo 🙏",
  "Predictions lock kar diye. Agar galat hue toh account delete (jhooth).",
  "Sufi acts ko full marks dene chahiye, judges ko sangeet ki samajh nahi.",
  "Top prediction sahi nikla, ab leaderboard pe mera naam dhoondo 😎",
  "Imandari se: is hafte ke roasts last week se 10x funny the.",
  "Beatbox > everything. Comment me ladai shuru karo.",
  "Judge the Judges feature OP hai, akhir power hamare haath me 😏",
  "Live episode ke time server slow ho jaata hai ya mera net? 😤",
  "Bhai jo bhi bottom predict kar raha tha contestant ko, thoda dil rakho.",
  "Mera oracle score gir raha hai par maza aa raha hai, that's the point.",
  "IGL ne weekend bana diya. Samay + panel = pure comedy gold.",
  "Itna toxic mat bano, yeh amateur performers hain, pros nahi.",
  "Prophet's Wall pe pahुंchna hai is season, predictions pe focus.",
  "Tabla wala act underrated tha, fight me.",
  "Verdict reveal se pehle ka suspense > exam results ka suspense.",
];

export const ROAST_TAGS = ["Savage Roaster", "Genuinely Fair", "Petty Comments", "Backhanded Praise", "Overly Generous", "Visibly Bored"];
