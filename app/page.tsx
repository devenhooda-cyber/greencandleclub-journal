/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client';
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => setAuthTimedOut(true), 2500);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthTimedOut(false);
      
      // User login hone par window.storage ko Firebase Firestore se connect karna
      if (currentUser) {
        (window as any).storage = {
          async get(key: string) {
            const docRef = doc(db, "users", currentUser.uid, "trades", key);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("not found");
            return { key, value: docSnap.data().value, shared: false };
          },
          async set(key: string, value: any) {
            const docRef = doc(db, "users", currentUser.uid, "trades", key);
            await setDoc(docRef, { value });
            return { key, value, shared: false };
          },
          async delete(key: string) {
            const docRef = doc(db, "users", currentUser.uid, "trades", key);
            await deleteDoc(docRef);
            return { key, deleted: true, shared: false };
          },
          async list(prefix = "") {
            const keys: string[] = [];
            const colRef = collection(db, "users", currentUser.uid, "trades");
            const querySnapshot = await getDocs(colRef);
            querySnapshot.forEach((doc) => {
              const k = doc.id;
              if (k.startsWith(prefix)) keys.push(k);
            });
            return { keys, prefix, shared: false };
          }
        };
      }
      setLoading(false);
    });
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  if (loading && !authTimedOut) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white font-sans">
        Loading Trading Journal...
      </div>
    );
  }

  // LOGIN SCREEN (New Design)
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl shadow-green-950/20">
          
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.2)] overflow-hidden bg-black border border-neutral-800">
              <img 
                src="/logo.jpg" 
                alt="Green Candle Club" 
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <h1 className="text-2xl font-black tracking-wide text-white">
              GREEN CANDLE <span className="text-green-400">CLUB</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-medium">
              Market Regime Scorecard
            </p>
          </div>

          <div className="h-px bg-neutral-800 my-6"></div>

          {authError && (
            <p className="text-red-400 text-sm mb-4 bg-red-950/30 p-2 rounded-lg border border-red-900/50">
              {authError}
            </p>
          )}

          <button 
            onClick={() => {
              setAuthError("");
              signInWithPopup(auth, new GoogleAuthProvider()).catch(() => {
                setAuthError("Login was blocked. Allow popups for this site and try again.");
              });
            }}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // AUTHENTICATED SCREEN (Inside Regime Desk)
  return (
    <div className="min-h-screen bg-neutral-950 font-sans">
      <div className="bg-neutral-900 border-b border-neutral-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
          <span className="font-bold tracking-wide">REGIME DESK</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.displayName}</span>
          <button 
            onClick={() => signOut(auth)} 
            className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Yahan aapke app ka baaki hissa aayega */}
      <div className="p-6 text-white text-center mt-10">
        <h2 className="text-xl text-neutral-400">Welcome to your Trading Dashboard</h2>
      </div>
    </div>
  );
}
      {/* नीचे दिया गया आपका पुराना ऐप यहाँ रेंडर होगा */}
      <RegimeDeskApp />
    </div>
  );
}

// ============================================================
// अपना पुराना REGIME DESK का कोड यहाँ नीचे पेस्ट करें
// ============================================================
/* ---------- palette: the field floods with the regime ---------- */
const REGIMES = {
  uptrend: {
    key: "uptrend",
    name: "Uptrending",
    short: "UP",
    field: "#0A3327",
    deep: "#061C16",
    fieldL: "#DFF0E6",
    deepL: "#C6E4D3",
    tape: "#1FA971",
    ink: "#0B5C3F",
    line: "Breakouts pay. Hold longer, pyramid, trade price."
  },
  downtrend: {
    key: "downtrend",
    name: "Downtrending",
    short: "DOWN",
    field: "#3F1013",
    deep: "#250A0C",
    fieldL: "#FAE4E4",
    deepL: "#F2CFCF",
    tape: "#C4383A",
    ink: "#8E1E22",
    line: "Breakdowns pay. Sell strength, hold longer, pyramid."
  },
  choppy: {
    key: "choppy",
    name: "Choppy",
    short: "CHOP",
    field: "#463612",
    deep: "#2A2009",
    fieldL: "#FAF0D6",
    deepL: "#F2E3B8",
    tape: "#C99A1E",
    ink: "#7A5B08",
    line: "Both sides fail. Half size, fewer trades, book at breakouts."
  },
  unset: {
    key: "unset",
    name: "Not scored",
    short: "—",
    field: "#232A35",
    deep: "#151A22",
    fieldL: "#E3EFF9",
    deepL: "#C9E0F2",
    tape: "#5C6B80",
    ink: "#2F4A66",
    line: "Score today's session to set the regime."
  }
};

/* ---------- the library: everything here is editable and carries a stable id ----------
   Trades store ids, never labels. Renaming an item keeps its whole history.
   Retiring hides it from the pickers but leaves past trades scored against it. */
const slug = x => String(x).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44);
const seed = (label, extra) => ({
  id: slug(label),
  label,
  retired: false,
  added: null,
  ...extra
});
const SEED_LIBRARY = {
  direction: [seed("Follow-through", {
    weight: 1,
    hint: "Which side actually extends after the break?",
    opts: ["Breakdowns strong", "Breakdowns ok", "Both sides failing", "Breakouts ok", "Breakouts strong"]
  }), seed("Index sync", {
    weight: 1,
    hint: "Nifty, Bank Nifty, Midcap, Smallcap, key sectors",
    opts: ["All down", "Most down", "Mixed, no sync", "Most up", "All up"]
  }), seed("10/20 EMA slope", {
    weight: 1,
    hint: "On the index you trade against",
    opts: ["Falling hard", "Falling", "Flat, tangled", "Rising", "Rising hard"]
  }), seed("Breadth vs 10 & 20 EMA", {
    weight: 1,
    hint: "Set automatically from your Chartink figure",
    opts: ["60%+ below", "50-60% below", "Split 40-60", "50-60% above", "60%+ above"]
  }), seed("Gap behaviour", {
    weight: 1,
    hint: "What happens to the opening gap",
    opts: ["Gap down extends", "Gap down holds", "Flat opens", "Gap up holds", "Gap up extends"]
  }), seed("Reaction to news", {
    weight: 1,
    hint: "The tell that price is stronger than headlines",
    opts: ["Falls on good news", "Sells every rally", "Reacts as expected", "Absorbs bad news", "Rips on bad news"]
  }), seed("Closing behaviour", {
    weight: 1,
    hint: "Where the day settles inside its range",
    opts: ["Closes at lows", "Closes weak", "Mid range", "Closes strong", "Closes at highs"]
  }), seed("Leadership quality", {
    weight: 1,
    hint: "Not how many are participating, but which kind",
    opts: ["Only defensives holding up", "Defensives leading the advance", "Mixed, no clear leadership", "Cyclicals and high beta leading", "Offensive sectors leading decisively"]
  }), seed("New highs vs new lows", {
    weight: 1,
    hint: "Set automatically from your Chartink counts",
    opts: ["New lows swamp new highs", "More lows than highs", "Roughly even", "More highs than lows", "New highs swamp new lows"]
  })],
  readiness: [seed("Sleep", {
    weight: 1,
    hint: "Last night",
    opts: ["Badly short", "Adequate", "Slept well"]
  }), seed("Stress load", {
    weight: 1,
    hint: "Outside the market",
    opts: ["Heavy", "Some", "Clear"]
  }), seed("Energy", {
    weight: 1,
    hint: "Right now, not this morning",
    opts: ["Exhausted", "Flat", "Sharp"]
  }), seed("Mood after yesterday", {
    weight: 1,
    hint: "Carrying anything from the last session?",
    opts: ["Still stinging", "Settled", "Neutral and ready"]
  }), seed("Preparation", {
    weight: 1,
    hint: "Did you do the work before the open?",
    opts: ["Came in cold", "Partly", "Levels and list ready"]
  }), seed("Urge to trade", {
    weight: 1,
    hint: "The honest one",
    opts: ["Itching to be in something", "Mild", "Happy to sit out"]
  })],
  clarity: [seed("Support & resistance", {
    weight: 1,
    hint: "Are levels being respected?",
    opts: ["No clear levels", "Rough levels", "Clean and respected"]
  }), seed("Trade location", {
    weight: 1,
    hint: "Where entries are coming from",
    opts: ["Abrupt places", "Some clear areas", "Obvious clear areas"]
  }), seed("Volume & activity", {
    weight: 1,
    hint: "Participation, not price",
    opts: ["Very low", "Average", "Good, expanding"]
  }), seed("Swing structure", {
    weight: 1,
    hint: "Chart quality on the daily",
    opts: ["Overlapping mess", "Some structure", "Clear swings, clean"]
  }), seed("Intraday character", {
    weight: 1,
    hint: "How the session spends its day",
    opts: ["Moves, then chops", "Mixed", "Trends through the day"]
  }), seed("Trap rate", {
    weight: 1,
    hint: "Failures on both sides is the chop signature",
    opts: ["Both sides trapping", "Occasional traps", "One side clearly works"]
  }), seed("Candle conviction", {
    weight: 1,
    hint: "Body size and urgency, not direction",
    opts: ["Dojis and small bodies", "Mixed bodies", "Strong trend bars"]
  }), seed("Timeframe agreement", {
    weight: 1,
    hint: "Lower timeframe against the daily",
    opts: ["Lower TF fights the daily", "Partly aligned", "Every timeframe agrees"]
  }), seed("Pullback depth", {
    weight: 1,
    hint: "How the market gives back what it gained",
    opts: ["Deep, overlapping, erases days", "Moderate", "Shallow, orderly, holds the prior swing"]
  })],
  setups: [seed("Buildup around 20 EMA", {
    group: "Pullback",
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Buildup around last swing", {
    group: "Pullback",
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Buildup at S/R in favour of the stock's trend", {
    group: "Pullback",
    regimes: ["choppy"]
  }), seed("Buildup in pullback", {
    group: "Pullback",
    regimes: ["choppy"]
  }), seed("Second break around 9/20 EMA", {
    group: "Pullback",
    regimes: ["uptrend", "downtrend"]
  }), seed("Pullback buildup at last swing", {
    group: "Pullback",
    regimes: ["uptrend"]
  }), seed("Pullback buildup at swing / 20 EMA", {
    group: "Pullback",
    regimes: ["downtrend"]
  }), seed("Buildup at resistance", {
    group: "Breakout",
    regimes: ["uptrend"]
  }), seed("Buildup at S/R, down close", {
    group: "Breakout",
    regimes: ["downtrend"]
  }), seed("Breakdown failure", {
    group: "Break failure",
    regimes: ["uptrend", "choppy"]
  }), seed("Breakout failure", {
    group: "Break failure",
    regimes: ["downtrend", "choppy"]
  }), seed("W after breakdown", {
    group: "Break failure",
    regimes: ["uptrend"]
  }), seed("Buildup under the zone", {
    group: "Break failure",
    regimes: ["uptrend", "choppy"]
  }), seed("Buildup above the zone", {
    group: "Break failure",
    regimes: ["downtrend", "choppy"]
  }), seed("Flag after move", {
    group: "Continuation",
    regimes: ["uptrend", "downtrend"]
  }), seed("1-2 day inside bars", {
    group: "Continuation",
    regimes: ["uptrend"]
  }), seed("News impact", {
    group: "Event",
    regimes: ["uptrend", "downtrend", "choppy"]
  }), seed("Gap up or gap down reaction", {
    group: "Event",
    regimes: ["choppy"]
  }), seed("Off-playbook / discretionary", {
    group: "Other",
    regimes: []
  })],
  exits: [seed("Initial stop hit", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Trailing stop hit", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Closed against the 9 EMA", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Closed against the 20 EMA", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Lost the last swing", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Momentum stalled, inside bars", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Climax or exhaustion bar", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Partial into strength", {
    regimes: ["uptrend", "downtrend"]
  }), seed("Booked into the breakout", {
    regimes: ["choppy"]
  }), seed("Booked at the prior swing", {
    regimes: ["choppy"]
  }), seed("Target at the range edge", {
    regimes: ["choppy"]
  }), seed("Target or measured move hit", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Reversal bar at the level", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Time stop, no follow-through", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Closed before the bell", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Regime changed under me", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Scaled out to reduce risk", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Cut early, lost patience", {
    regimes: ["uptrend", "choppy", "downtrend"]
  }), seed("Discretionary, changed my mind", {
    regimes: []
  }), seed("Needed the capital elsewhere", {
    regimes: []
  })],
  behaviour: [seed("Repeated gap ups, holding", {
    side: "long"
  }), seed("Holds up on weak market days", {
    side: "long"
  }), seed("Lock-in expiry absorbed", {
    side: "long"
  }), seed("Gapped down on bad news, bought instantly", {
    side: "long"
  }), seed("Bad news or result, price refuses to fall", {
    side: "long"
  }), seed("Time correction while market price-corrected", {
    side: "long"
  }), seed("Strong Friday close", {
    side: "long"
  }), seed("Repeated gap downs, not filling", {
    side: "short"
  }), seed("Fails to rally on strong market days", {
    side: "short"
  }), seed("Lock-in expiry supply hitting", {
    side: "short"
  }), seed("Gapped up on good news, sold instantly", {
    side: "short"
  }), seed("Good news or result, price refuses to rise", {
    side: "short"
  }), seed("Flat or lower while the market rallied", {
    side: "short"
  }), seed("Weak Friday close", {
    side: "short"
  }), seed("Supply on every rally", {
    side: "short"
  })],
  tech: [seed("Tease break", {
    side: "both"
  }), seed("Strong trend bar", {
    side: "both"
  }), seed("9 and 20 EMA trending", {
    side: "both"
  }), seed("Trending 20 EMA with prior move in strong bars", {
    side: "both"
  }), seed("Liquid enough to size", {
    side: "both"
  }), seed("Volume 3x the weekly average", {
    side: "both"
  }), seed("Liquidity sweep of support or prior swing low", {
    side: "long"
  }), seed("Pullback on falling volume", {
    side: "long"
  }), seed("Liquidity sweep of resistance or prior swing high", {
    side: "short"
  }), seed("Failed breakout, back inside the range", {
    side: "short"
  }), seed("Rally on falling volume", {
    side: "short"
  }), seed("Lower highs into the level", {
    side: "short"
  }), seed("Clear path, no overhead supply", {
    side: "long"
  }), seed("Clear air below, no support nearby", {
    side: "short"
  })]
};
const SEED_VERSION = 7;

/* Adds anything new from the seed that the saved library has never seen, without
   touching renames, weights or retirements the person has already made. Items
   deleted deliberately come back once, on the version bump that introduced them. */
function mergeLibrary(saved) {
  if (!saved) return {
    ...SEED_LIBRARY,
    seedVersion: SEED_VERSION
  };
  if ((saved.seedVersion || 1) >= SEED_VERSION) return saved;
  const out = {
    ...saved,
    seedVersion: SEED_VERSION
  };
  /* v3 shipped a duplicated exit list. Rebuild it from the clean seed, keeping
     anything the person added themselves. Nothing else is touched. */
  if ((saved.seedVersion || 1) < 7 && Array.isArray(saved.setups)) {
    const seedGroup = {};
    SEED_LIBRARY.setups.forEach(x => {
      seedGroup[x.id] = x.group;
    });
    out.setups = saved.setups.map(x => x.group ? x : {
      ...x,
      group: seedGroup[x.id] || "Other"
    });
  }
  if ((saved.seedVersion || 1) === 3 && Array.isArray(saved.exits)) {
    const mine = saved.exits.filter(x => String(x.id).startsWith("u"));
    out.exits = [...SEED_LIBRARY.exits, ...mine];
  }
  Object.keys(SEED_LIBRARY).forEach(g => {
    if (!Array.isArray(SEED_LIBRARY[g])) return;
    const have = new Set((out[g] || []).map(x => x.id));
    const missing = SEED_LIBRARY[g].filter(x => !have.has(x.id));
    out[g] = [...(out[g] || []), ...missing];
  });
  return out;
}
const GROUPS = [{
  key: "readiness",
  name: "Pre-trade state",
  isCheck: true
}, {
  key: "direction",
  name: "Direction checks",
  isCheck: true
}, {
  key: "clarity",
  name: "Clarity checks",
  isCheck: true
}, {
  key: "setups",
  name: "Setups",
  hasRegimes: true,
  hasGroup: true
}, {
  key: "exits",
  name: "Exit reasons",
  hasRegimes: true
}, {
  key: "behaviour",
  name: "Price behaviour tells",
  hasSide: true,
  hasWeight: true
}, {
  key: "tech",
  name: "Technical conditions",
  hasSide: true,
  hasWeight: true
}];
const REGIME_KEYS = ["uptrend", "choppy", "downtrend"];
const GROUP_ORDER = ["Pullback", "Breakout", "Break failure", "Continuation", "Event", "Other"];
const groupsOf = lib => {
  const found = Array.from(new Set((lib.setups || []).map(x => x.group || "Other")));
  return found.sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a),
      ib = GROUP_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
};
const sideOf = dir => dir === "Short" ? "short" : "long";
const itemById = (lib, group, id) => (lib[group] || []).find(x => x.id === id) || null;
const labelOf = (lib, group, id) => {
  const i = itemById(lib, group, id);
  return i ? i.label : id;
};
const activeSetups = (lib, regime) => (lib.setups || []).filter(x => !x.retired && (regime ? (x.regimes || []).includes(regime) : true));
const activeExits = (lib, regime) => (lib.exits || []).filter(x => !x.retired && (regime ? (x.regimes || []).includes(regime) : true));
const activeTells = (lib, group, dir) => (lib[group] || []).filter(x => !x.retired && (x.side === "both" || x.side === sideOf(dir)));
const inPlaybook = (lib, regime, setupId) => {
  const i = itemById(lib, "setups", setupId);
  return i ? (i.regimes || []).includes(regime) : false;
};
const TRADE_TYPES = ["Positional", "Intraday", "News impact"];
const AFTER_EXIT = ["Not reviewed yet", "Kept going without me", "Reversed straight after, exit was right", "Went nowhere either way", "Came back to my exit, then went", "Stopped me, then reversed — noise stop"];
const WATCH_STATUS = ["Watching", "Close to ready", "Traded", "Dropped"];
const QUOTE_TAGS = ["General", "Patience", "Position sizing", "Losses", "Chop", "Discipline", "Exits"];
/* Which tag suits a given signal, so the right line surfaces at the right moment */
function tagForSignal(sig) {
  if (!sig) return null;
  const t = (sig.title + " " + sig.body).toLowerCase();
  if (/overtrad|chop|budget|too hard/.test(t)) return "Chop";
  if (/size|sizing|risk|capital|all in/.test(t)) return "Position sizing";
  if (/loss|revenge|stop-out|stop hit|drawdown/.test(t)) return "Losses";
  if (/hold|patience|early|decay|longer/.test(t)) return "Patience";
  if (/exit|booked|trail/.test(t)) return "Exits";
  if (/playbook|skip line|off-playbook|discipline/.test(t)) return "Discipline";
  return "General";
}
function pickQuote(quotes, tag) {
  if (!quotes || !quotes.length) return null;
  const pool = tag ? quotes.filter(q => q.tag === tag) : [];
  const from = pool.length ? pool : quotes;
  return from[Math.floor(Math.random() * from.length)];
}
const RULES = {
  uptrend: ["Take setups in stocks and sectors leading the index.", "Trade price alone. Hold longer. Pyramid into strength.", "Trail rather than target. The follow-through is the edge."],
  downtrend: ["Short the weakest relative-strength names, not the strongest.", "Trade price alone. Hold longer. Pyramid into weakness.", "Breakout failures are the highest-quality entry."],
  choppy: ["Find the trending stock first. Its trend replaces the index's.", "Book profits into the breakout. Do not wait for follow-through.", "Half size. Fewer positions. Missing a trade here costs nothing."],
  unset: ["Score the session first."]
};
const SECTOR_OPTS = ["Lagging the index", "In line with the index", "Outperforming the index", "Strongest sector on the screen"];
const STOCK_OPTS = ["Weaker than its brothers", "In line with peers", "Stronger than peers", "Leader of the group, visible urgency"];
const BANDS = [{
  min: 80,
  band: "A",
  label: "Full size",
  riskMult: 1,
  note: "Everything lines up. This is the one you concentrate into."
}, {
  min: 65,
  band: "B",
  label: "Standard",
  riskMult: 0.7,
  note: "Good, not exceptional. Normal size, normal management."
}, {
  min: 45,
  band: "C",
  label: "Starter",
  riskMult: 0.4,
  note: "One or two layers are missing. Starter position or nothing."
}, {
  min: 0,
  band: "D",
  label: "Skip",
  riskMult: 0,
  note: "Below your own line. Passing on this is the trade."
}];

/* A news-impact trade is not a relative-strength trade. Sector and peer position
   tell you nothing about how a stock reacts to its own headline, so those two
   layers are dropped and their thirty points move to what does matter. */
function weightsFor(type) {
  if (type === "News impact") return {
    market: 30,
    sector: 0,
    stock: 0,
    behaviour: 35,
    tech: 35
  };
  return {
    market: 30,
    sector: 15,
    stock: 15,
    behaviour: 20,
    tech: 20
  };
}
function entryScore(t, session, lib) {
  const long = t.dir !== "Short";
  const type = t.type || "Positional";
  const W = weightsFor(type);
  const regime = session && session.regime && REGIMES[session.regime] ? session.regime : "unset";
  const conf = session && session.confidence || 0;
  let fit;
  if (regime === "unset") fit = 0.4;else if (regime === "choppy") fit = 0.45;else if (long && regime === "uptrend" || !long && regime === "downtrend") fit = 1;else fit = 0.1;
  const market = W.market * fit * (0.55 + 0.45 * (conf / 100));
  const sec = t.sector === undefined || t.sector === null ? 1 : t.sector;
  const stk = t.stock === undefined || t.stock === null ? 1 : t.stock;
  const sector = W.sector * (sec / 3);
  const stock = W.stock * (stk / 3);

  /* tells carry their own weight, so a condition you rely on can count for more
     than one you merely notice */
  const wOf = x => x.weight === undefined ? 1 : Number(x.weight) || 0;
  const share = (group, chosen) => {
    const active = activeTells(lib, group, t.dir);
    const total = active.reduce((a, x) => a + wOf(x), 0);
    if (!total) return 0;
    const got = active.filter(x => (chosen || []).includes(x.id)).reduce((a, x) => a + wOf(x), 0);
    return Math.min(1, got / total);
  };
  const behaviour = W.behaviour * share("behaviour", t.behav);
  const tech = W.tech * share("tech", t.tech);
  const total = Math.round(market + sector + stock + behaviour + tech);
  const b = BANDS.find(x => total >= x.min);
  return {
    market,
    sector,
    stock,
    behaviour,
    tech,
    total,
    fit,
    weights: W,
    type,
    ...b
  };
}
const TAGS = ["Planned", "FOMO chase", "Revenge", "Boredom", "Hesitated", "Moved stop", "Cut early", "Overheld", "Averaged down", "Sized up"];
const BAD_TAGS = ["FOMO chase", "Revenge", "Boredom", "Moved stop", "Averaged down"];

/* ---------- scoring ---------- */
const activeChecks = (lib, group) => (lib[group] || []).filter(x => !x.retired);
const segLabel = (i, n, kind) => {
  if (kind === "clarity") return String(i);
  if (n === 5) return ["--", "-", "0", "+", "++"][i];
  if (n === 3) return ["-", "0", "+"][i];
  const d = i - (n - 1) / 2;
  if (Math.abs(d) < 0.01) return "0";
  return (d < 0 ? "\u2212" : "+") + Math.ceil(Math.abs(d));
};
function scoreSession(scores, lib) {
  const L = lib || SEED_LIBRARY;
  let dirSum = 0,
    dirMax = 0,
    dirFilled = 0,
    clrSum = 0,
    clrMax = 0,
    clrFilled = 0;
  activeChecks(L, "direction").forEach(c => {
    const w = c.weight === undefined ? 1 : Number(c.weight);
    const n = (c.opts || []).length || 5;
    dirMax += w;
    const v = scores ? scores[c.id] : undefined;
    if (v === undefined || v === null) return;
    dirFilled++;
    const centre = (n - 1) / 2;
    dirSum += w * ((v - centre) / centre); // -w .. +w
  });
  activeChecks(L, "clarity").forEach(c => {
    const w = c.weight === undefined ? 1 : Number(c.weight);
    const n = (c.opts || []).length || 3;
    clrMax += w;
    const v = scores ? scores[c.id] : undefined;
    if (v === undefined || v === null) return;
    clrFilled++;
    clrSum += w * (v / (n - 1)); // 0 .. w
  });
  const totalChecks = activeChecks(L, "direction").length + activeChecks(L, "clarity").length;
  const complete = dirFilled + clrFilled >= totalChecks;
  const trendPct = dirMax ? dirSum / dirMax : 0;
  /* clarity is judged on what you actually answered, so a half-filled card
     is not automatically called choppy */
  const clarityDenom = activeChecks(L, "clarity").filter(c => scores && scores[c.id] !== undefined && scores[c.id] !== null).reduce((a, c) => a + (c.weight === undefined ? 1 : Number(c.weight)), 0);
  const clarityPct = clarityDenom ? clrSum / clarityDenom : 0;
  let regime = "unset";
  if (dirFilled + clrFilled >= Math.min(8, Math.ceil(totalChecks * 0.55))) {
    if (clarityPct < 0.45) regime = "choppy";else if (trendPct >= 0.3) regime = "uptrend";else if (trendPct <= -0.3) regime = "downtrend";else regime = "choppy";
  }
  const confidence = Math.round((clarityPct * 0.5 + Math.abs(trendPct) * 0.5) * 100);
  return {
    trendPct,
    clarityPct,
    regime,
    confidence,
    complete,
    trend100: Math.round(trendPct * 100),
    clarity100: Math.round(clarityPct * 100)
  };
}

/* Your bands, applied to the share of stocks above the 20 EMA alone.
   Fed manually from Chartink and stored with the session. */
function breadthBand(a20) {
  if (a20 === null || a20 === undefined || a20 === "") return null;
  const v = Number(a20);
  if (!isFinite(v)) return null;
  if (v >= 90) return {
    label: "Extended",
    score: 4,
    level: "warn",
    note: "Over 90% above the 20 EMA. Everything is working, which is when trends usually pause. Size down rather than up."
  };
  if (v >= 60) return {
    label: "Strong bull phase",
    score: 4,
    level: "good",
    note: "60–90% above the 20 EMA. Full playbook, hold longer, pyramid allowed."
  };
  if (v >= 40) return {
    label: "Normal bull phase",
    score: 3,
    level: "good",
    note: "40–60% above the 20 EMA. Standard size, standard selectivity."
  };
  if (v >= 25) return {
    label: "No new longs",
    score: 1,
    level: "warn",
    note: "Under 40% above the 20 EMA. Your rule: no fresh longs, intraday news and event trades only. Short setups work best here."
  };
  return {
    label: "Washed out",
    score: 0,
    level: "warn",
    note: "Under 25% above the 20 EMA. Deeply oversold — no new longs, and shorts are late to the move."
  };
}
function hiLoBand(h, l) {
  const H = Number(h),
    L = Number(l);
  if (!isFinite(H) || !isFinite(L) || H + L === 0) return null;
  const share = H / (H + L);
  if (share >= 0.8) return {
    score: 4,
    label: "New highs swamp new lows",
    ratio: share,
    note: "Broad new-high expansion. Healthy, and worth checking it isn't the blow-off kind."
  };
  if (share >= 0.6) return {
    score: 3,
    label: "More highs than lows",
    ratio: share,
    note: "Leadership is making fresh ground."
  };
  if (share >= 0.4) return {
    score: 2,
    label: "Roughly even",
    ratio: share,
    note: "Neither side is winning the extremes. Often the first sign of a stall."
  };
  if (share >= 0.2) return {
    score: 1,
    label: "More lows than highs",
    ratio: share,
    note: "Damage is spreading. This usually turns before EMA breadth does."
  };
  return {
    score: 0,
    label: "New lows swamp new highs",
    ratio: share,
    note: "Washout territory. No new longs, and shorts are late."
  };
}
function scoreReadiness(scores, lib) {
  const items = activeChecks(lib || SEED_LIBRARY, "readiness");
  let sum = 0,
    max = 0,
    filled = 0;
  items.forEach(c => {
    const w = c.weight === undefined ? 1 : Number(c.weight);
    const n = (c.opts || []).length || 3;
    const v = scores ? scores[c.id] : undefined;
    if (v === undefined || v === null) return;
    filled++;
    max += w;
    sum += w * (v / (n - 1));
  });
  if (!filled) return null;
  const pct = max ? Math.round(sum / max * 100) : 0;
  const worst = items.filter(c => scores && scores[c.id] === 0).map(c => c.label);
  return {
    pct,
    filled,
    total: items.length,
    worst,
    band: pct >= 75 ? "Fit to trade" : pct >= 50 ? "Trade smaller" : "Not a trading day",
    mult: pct >= 75 ? 1 : pct >= 50 ? 0.6 : 0
  };
}
function budgetFor(regime, confidence, maxRisk) {
  if (regime === "unset") return {
    trades: 0,
    risk: 0,
    note: "Score the session before you trade."
  };
  if (regime === "choppy") return {
    trades: 1,
    risk: +(maxRisk * 0.4).toFixed(2),
    note: "Chop — one starter position at most. Missing a trade here costs nothing."
  };
  if (confidence >= 70) return {
    trades: 2,
    risk: maxRisk,
    note: "Clean trend — up to two positions, full size on an A-grade entry, pyramid allowed."
  };
  return {
    trades: 1,
    risk: +(maxRisk * 0.7).toFixed(2),
    note: "Trend forming — one position until it confirms."
  };
}

/* ---------- Zerodha charges ----------
   Defaults gathered from public rate pages; sources disagree on a couple of them,
   so every figure is editable in Settings. Check one against a real contract note
   before trusting the net numbers. */
const DEFAULT_CHART_FOLDER = "F:\\invest\\tradejournal\\screenshots\\";
const DEFAULT_LINKS = [{
  id: "l1",
  label: "Chartink",
  url: "https://chartink.com/screener/"
}, {
  id: "l2",
  label: "Screener",
  url: "https://www.screener.in/"
}, {
  id: "l3",
  label: "NSE IPO",
  url: "https://www.nseindia.com/market-data/all-upcoming-issues-ipo"
}];
const DEFAULT_RATES = {
  delivery: {
    brokeragePct: 0,
    brokerageCap: 0,
    sttBuyPct: 0.1,
    sttSellPct: 0.1,
    exchangePct: 0.00307,
    sebiPct: 0.0001,
    stampBuyPct: 0.015,
    dpPerScrip: 15.34
  },
  intraday: {
    brokeragePct: 0.03,
    brokerageCap: 20,
    sttBuyPct: 0,
    sttSellPct: 0.025,
    exchangePct: 0.00307,
    sebiPct: 0.0001,
    stampBuyPct: 0.003,
    dpPerScrip: 0
  },
  gstPct: 18
};
const pct = (v, p) => v * (p / 100);

/* One executed order. Zerodha bills per order, so each leg is charged separately. */
function legCharges(value, isBuy, r, gstPct, orders = 1) {
  /* Zerodha bills the flat cap PER EXECUTED ORDER. One leg in this journal can
     be filled by many orders, so a large position built in slices costs far more
     brokerage than a single fill of the same size. */
  const n = Math.max(1, Math.round(Number(orders) || 1));
  const brokerage = r.brokerageCap ? n * Math.min(r.brokerageCap, pct(value / n, r.brokeragePct)) : pct(value, r.brokeragePct);
  const exchange = pct(value, r.exchangePct);
  const sebi = pct(value, r.sebiPct);
  const stt = isBuy ? pct(value, r.sttBuyPct) : pct(value, r.sttSellPct);
  const stamp = isBuy ? pct(value, r.stampBuyPct) : 0;
  const gst = pct(brokerage + exchange + sebi, gstPct);
  return {
    brokerage,
    exchange,
    sebi,
    stt,
    stamp,
    gst,
    total: brokerage + exchange + sebi + stt + stamp + gst
  };
}
function tradeCharges(legs, type, rates) {
  const R = rates || DEFAULT_RATES;
  const table = type === "Positional" ? R.delivery : R.intraday;
  const acc = {
    brokerage: 0,
    exchange: 0,
    sebi: 0,
    stt: 0,
    stamp: 0,
    gst: 0,
    dp: 0,
    total: 0
  };
  let anySell = false;
  (legs || []).forEach(l => {
    const value = num(l.price) * num(l.qty);
    if (!value) return;
    const isBuy = l.kind === "in";
    if (!isBuy) anySell = true;
    const c = legCharges(value, isBuy, table, R.gstPct, l.orders);
    Object.keys(c).forEach(k => {
      if (k !== "total") acc[k] += c[k];
    });
    acc.total += c.total;
  });
  /* DP is per scrip per day on the delivery sell side, not per order */
  if (anySell && table.dpPerScrip) {
    const sellDays = new Set((legs || []).filter(l => l.kind === "out" && num(l.qty)).map(l => l.date));
    acc.dp = table.dpPerScrip * Math.max(1, sellDays.size);
    acc.total += acc.dp;
  }
  return acc;
}

/* ---------- trade maths ---------- */
function legsOf(t) {
  if (Array.isArray(t.legs) && t.legs.length) return t.legs;
  /* older single-entry records read as one in-leg and, if closed, one out-leg */
  const out = [];
  if (t.entry) out.push({
    id: "l0",
    kind: "in",
    date: t.date,
    time: t.time || "",
    price: t.entry,
    qty: t.qty
  });
  const hasExit = t.exit !== "" && t.exit !== null && t.exit !== undefined && isFinite(parseFloat(t.exit));
  if (hasExit) out.push({
    id: "l1",
    kind: "out",
    date: t.exitDate || t.date,
    time: "",
    price: t.exit,
    qty: t.qty
  });
  return out;
}
function enrich(t, sessionsByDate, lib, rates) {
  const legs = legsOf(t);
  const ins = legs.filter(l => l.kind === "in" && num(l.qty));
  const outs = legs.filter(l => l.kind === "out" && num(l.qty));
  const long = t.dir !== "Short";
  const sign = long ? 1 : -1;
  const qtyIn = ins.reduce((a, l) => a + num(l.qty), 0);
  const qtyOut = outs.reduce((a, l) => a + num(l.qty), 0);
  const openQty = qtyIn - qtyOut;
  const isOpen = qtyIn > 0 && openQty > 0.0000001;
  const avgIn = qtyIn ? ins.reduce((a, l) => a + num(l.price) * num(l.qty), 0) / qtyIn : 0;
  const avgOut = qtyOut ? outs.reduce((a, l) => a + num(l.price) * num(l.qty), 0) / qtyOut : 0;
  const initial = ins[0] || null;
  const entryTime = initial ? initial.time || "" : "";
  const initialStop = num(t.stop);
  const initialQty = initial ? num(initial.qty) : 0;
  const initialPrice = initial ? num(initial.price) : 0;
  /* R is always measured against what you risked when you opened it — the only
     version comparable across trades, however much you added later. */
  const riskAmt = initialPrice && initialStop && initialQty ? Math.abs(initialPrice - initialStop) * initialQty : null;
  const grossClosed = qtyOut ? (avgOut - avgIn) * sign * qtyOut : 0;
  const charges = tradeCharges(legs, t.type || "Positional", rates);
  const pnlGross = qtyOut ? grossClosed : null;
  const pnl = qtyOut ? grossClosed - charges.total : null;
  const r = pnl !== null && riskAmt ? pnl / riskAmt : null;
  const rGross = qtyOut && riskAmt ? grossClosed / riskAmt : null;

  /* what the trade would have made without the adds — isolates pyramiding */
  const rInitialOnly = qtyOut && riskAmt && initialQty ? (avgOut - initialPrice) * sign * Math.min(initialQty, qtyOut) / riskAmt : null;
  const addContribution = r !== null && rInitialOnly !== null ? rGross - rInitialOnly : null;
  const openRisk = isOpen && initialStop ? Math.abs(avgIn - initialStop) * openQty : null;
  const firstDate = ins.length ? ins[0].date : t.date;
  const lastOut = outs.length ? outs[outs.length - 1].date : null;
  let holdDays = null;
  if (firstDate && lastOut) {
    const d = (new Date(lastOut) - new Date(firstDate)) / 864e5;
    if (isFinite(d) && d >= 0) holdDays = Math.round(d);
  }
  const s = sessionsByDate[t.date];
  /* a session record can exist without a computed regime, so fall back rather
     than handing an undefined key to every lookup downstream */
  const regime = s && s.regime && REGIMES[s.regime] ? s.regime : "unset";
  const onModel = regime === "unset" ? null : inPlaybook(lib, regime, t.setupId);
  const es = entryScore(t, s, lib);
  return {
    ...t,
    legs,
    isOpen,
    openQty,
    qtyIn,
    qtyOut,
    avgIn,
    avgOut,
    pnl,
    pnlGross,
    r,
    rGross,
    rInitialOnly,
    addContribution,
    riskAmt,
    openRisk,
    charges,
    exitDay: outs.length ? outs[outs.length - 1].date : null,
    entryTime,
    slot: slotOf(entryTime),
    adds: Math.max(0, ins.length - 1),
    scaleOuts: Math.max(0, outs.length - 1),
    regime,
    onModel,
    _long: long,
    holdDays,
    type: t.type || "Positional",
    ipo: !!t.ipo,
    afterExit: t.afterExit || "Not reviewed yet",
    setupLabel: labelOf(lib, "setups", t.setupId),
    setupGroup: (itemById(lib, "setups", t.setupId) || {}).group || "Other",
    /* the tranche that closed most of the position owns the exit attribution */
    exitId: outs.length ? [...outs].sort((a, b) => num(b.qty) - num(a.qty))[0].exitId || null : null,
    exitLabel: (() => {
      if (!outs.length) return null;
      const biggest = [...outs].sort((a, b) => num(b.qty) - num(a.qty))[0];
      return biggest.exitId ? labelOf(lib, "exits", biggest.exitId) : "Not recorded";
    })(),
    exitLabels: outs.map(l => l.exitId ? labelOf(lib, "exits", l.exitId) : "Not recorded"),
    behavLabels: (t.behav || []).map(id => labelOf(lib, "behaviour", id)),
    techLabels: (t.tech || []).map(id => labelOf(lib, "tech", id)),
    conviction: es.total,
    band: es.band,
    layers: es
  };
}
const num = v => {
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
};
const fmt = (n, d = 2) => n === null || n === undefined || !isFinite(n) ? "—" : n.toFixed(d);
const inr = n => n === null || !isFinite(n) ? "—" : (n < 0 ? "-" : "") + "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");

/* ---------- grouping ---------- */
function stats(list) {
  const withR = list.filter(t => t.r !== null);
  const n = list.length;
  const wins = withR.filter(t => t.r > 0);
  const losses = withR.filter(t => t.r <= 0);
  const sumR = withR.reduce((a, t) => a + t.r, 0);
  const grossWin = wins.reduce((a, t) => a + t.r, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.r, 0));
  return {
    n,
    nR: withR.length,
    winRate: withR.length ? wins.length / withR.length * 100 : null,
    avgR: withR.length ? sumR / withR.length : null,
    sumR,
    avgWin: wins.length ? grossWin / wins.length : null,
    avgLoss: losses.length ? -grossLoss / losses.length : null,
    pf: grossLoss ? grossWin / grossLoss : grossWin ? Infinity : null,
    pnl: list.reduce((a, t) => a + (t.pnl || 0), 0)
  };
}
function groupBy(list, fn) {
  const m = {};
  list.forEach(t => {
    const k = fn(t);
    if (k === null || k === undefined) return;
    (m[k] = m[k] || []).push(t);
  });
  return Object.entries(m).map(([k, v]) => ({
    key: k,
    ...stats(v),
    items: v
  }));
}

/* Older regime-data.json files carry no leaders array. Rebuild the list from the
   stock lookup so clicking Stocks still shows something. */
function membersOf(market, sectorName, leaders) {
  if (leaders && leaders.length) return leaders;
  const st = market && market.stocks || {};
  return Object.entries(st).filter(([, v]) => v.sector === sectorName).map(([symbol, v]) => ({
    symbol,
    rs: v.rs,
    ret20: v.rs20,
    ret60: v.rs60,
    aboveBoth: v.aboveBoth,
    close: v.close
  })).sort((a, b) => (b.rs ?? -999) - (a.rs ?? -999));
}
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = [{
  key: "09:15–10:45",
  from: 555,
  to: 645
}, {
  key: "10:45–14:15",
  from: 645,
  to: 855
}, {
  key: "14:15–15:15",
  from: 855,
  to: 915
}, {
  key: "After 15:15",
  from: 915,
  to: 960
}];
const mins = hhmm => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const slotOf = hhmm => {
  const m = mins(hhmm);
  if (m === null) return null;
  const s = SLOTS.find(s => m >= s.from && m < s.to);
  return s ? s.key : "Outside hours";
};
const dowOf = d => {
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? null : DOW[dt.getDay()];
};
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const sd = a => {
  if (a.length < 2) return null;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

/* ---------- signals: what the data is trying to tell you ---------- */
function buildSignals(sessions, trades, settings, openTrades = [], lib = SEED_LIBRARY) {
  const out = [];
  const S = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  /* 1. regime flip */
  const scored = S.filter(s => s.regime !== "unset");
  if (scored.length >= 2) {
    const last = scored[scored.length - 1];
    let prevDiff = null;
    for (let i = scored.length - 2; i >= 0; i--) {
      if (scored[i].regime !== last.regime) {
        prevDiff = scored[i];
        break;
      }
    }
    const runLen = scored.length - 1 - (prevDiff ? scored.indexOf(prevDiff) : -1);
    if (prevDiff && runLen <= 3) {
      out.push({
        level: "high",
        title: `Regime flipped to ${REGIMES[last.regime].name}`,
        body: `Was ${REGIMES[prevDiff.regime].name} until ${prevDiff.date}. Only ${runLen} session${runLen > 1 ? "s" : ""} in the new state — treat it as unconfirmed and size down until it holds.`
      });
    }
  }
  /* 2. clarity decay */
  if (scored.length >= 6) {
    const recent = scored.slice(-3),
      prior = scored.slice(-6, -3);
    const rc = mean(recent.map(s => s.clarity100)),
      pc = mean(prior.map(s => s.clarity100));
    if (pc - rc >= 12) out.push({
      level: "high",
      title: "Structure is deteriorating",
      body: `Clarity fell from ${Math.round(pc)} to ${Math.round(rc)} over three sessions. Levels stop holding before the regime label changes — this usually leads chop by a few days.`
    });
    const rt = mean(recent.map(s => s.trend100)),
      pt = mean(prior.map(s => s.trend100));
    if (Math.abs(pt) - Math.abs(rt) >= 20 && Math.abs(rt) < 30) out.push({
      level: "med",
      title: "Trend thrust is fading",
      body: `Directional score went from ${Math.round(pt)} to ${Math.round(rt)}. Stop pyramiding and start booking into strength.`
    });
  }
  /* 3. trading the wrong regime */
  const withRegime = trades.filter(t => t.regime !== "unset" && t.r !== null);
  const off = withRegime.filter(t => !t.onModel),
    on = withRegime.filter(t => t.onModel);
  if (off.length >= 5 && on.length >= 5) {
    const so = stats(off),
      sn = stats(on);
    const gap = sn.avgR - so.avgR;
    if (gap > 0.15) out.push({
      level: "high",
      title: "Off-playbook trades are the leak",
      body: `${off.length} trades used a setup that doesn't belong to that day's regime: ${fmt(so.avgR)}R average versus ${fmt(sn.avgR)}R when you stayed on the playbook. That gap is ${fmt(gap)}R per trade, ${fmt(gap * off.length, 1)}R given back in total.`
    });
  }
  /* 4. setup decay */
  const bySetup = groupBy(withRegime, t => t.setupLabel);
  bySetup.forEach(g => {
    if (g.nR < 10) return;
    const ordered = [...g.items].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).filter(t => t.r !== null);
    const recent = ordered.slice(-Math.max(5, Math.floor(ordered.length * 0.35)));
    const prior = ordered.slice(0, ordered.length - recent.length);
    if (prior.length < 5) return;
    const sr = stats(recent),
      sp = stats(prior);
    if (sp.avgR - sr.avgR >= 0.35) out.push({
      level: "med",
      title: `"${g.key}" is decaying`,
      body: `Last ${recent.length} took ${fmt(sr.avgR)}R at ${fmt(sr.winRate, 0)}% versus ${fmt(sp.avgR)}R at ${fmt(sp.winRate, 0)}% before that. Either the regime moved under it or you've loosened the entry criteria.`
    });
    if (sr.avgR - sp.avgR >= 0.35) out.push({
      level: "good",
      title: `"${g.key}" is improving`,
      body: `Last ${recent.length} took ${fmt(sr.avgR)}R versus ${fmt(sp.avgR)}R before. Worth more size while the regime supports it.`
    });
  });
  /* 5. overtrading vs budget */
  const byDay = groupBy(trades, t => t.date);
  const sMap = {};
  S.forEach(s => sMap[s.date] = s);
  const overDays = [],
    normDays = [];
  byDay.forEach(d => {
    const s = sMap[d.key];
    if (!s || s.regime === "unset") return;
    const b = budgetFor(s.regime, s.confidence, settings.maxRisk);
    (d.n > b.trades ? overDays : normDays).push(d);
  });
  if (overDays.length >= 3) {
    const ov = stats(overDays.flatMap(d => d.items)),
      nv = stats(normDays.flatMap(d => d.items));
    out.push({
      level: overDays.length >= normDays.length ? "high" : "med",
      title: "Overtrading past the regime budget",
      body: `${overDays.length} of ${overDays.length + normDays.length} scored days went over budget. Those days averaged ${fmt(ov.avgR)}R per trade against ${fmt(nv.avgR)}R on disciplined days${nv.avgR !== null && ov.avgR !== null && nv.avgR > ov.avgR ? " — the extra trades are subtracting, not adding" : ""}.`
    });
  }
  /* 6. chop volume */
  const chopTrades = trades.filter(t => t.regime === "choppy");
  if (chopTrades.length >= 5 && trades.length >= 15) {
    const chopSessions = S.filter(s => s.regime === "choppy").length;
    const trendSessions = S.filter(s => s.regime === "uptrend" || s.regime === "downtrend").length;
    const trendTrades = trades.filter(t => t.regime === "uptrend" || t.regime === "downtrend");
    if (chopSessions && trendSessions) {
      const cpd = chopTrades.length / chopSessions,
        tpd = trendTrades.length / trendSessions;
      if (cpd > tpd * 0.9) out.push({
        level: "high",
        title: "You trade chop as hard as trend",
        body: `${fmt(cpd, 1)} trades per choppy session versus ${fmt(tpd, 1)} per trending session. Chop is where you should be doing least. ${fmt(stats(chopTrades).avgR)}R vs ${fmt(stats(trendTrades).avgR)}R says the same thing.`
      });
    }
  }
  /* 7. risk sizing drift */
  const risky = trades.filter(t => t.riskAmt).map(t => t.riskAmt / settings.capital * 100);
  if (risky.length >= 10) {
    const m = mean(risky),
      s2 = sd(risky),
      mx = Math.max(...risky);
    if (s2 / m > 0.45) out.push({
      level: "med",
      title: "Position size is inconsistent",
      body: `Risk per trade averages ${fmt(m)}% of capital but swings by ±${fmt(s2)}%, with a largest bet of ${fmt(mx)}%. Uneven size means one impulsive trade can erase a good month of correct ones.`
    });
    if (m > settings.maxRisk * 1.25) out.push({
      level: "high",
      title: "Average risk is above your own cap",
      body: `You're risking ${fmt(m)}% per trade against a stated cap of ${fmt(settings.maxRisk)}%.`
    });
  }
  /* 8. sizing after losses */
  const chron = [...trades].filter(t => t.r !== null && t.riskAmt).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const afterLoss = [],
    afterWin = [];
  for (let i = 1; i < chron.length; i++) {
    const rp = chron[i].riskAmt / settings.capital * 100;
    (chron[i - 1].r <= 0 ? afterLoss : afterWin).push(rp);
  }
  if (afterLoss.length >= 5 && afterWin.length >= 5) {
    const al = mean(afterLoss),
      aw = mean(afterWin);
    if (al > aw * 1.25) out.push({
      level: "high",
      title: "You size up after a loss",
      body: `${fmt(al)}% risk on the trade following a loser versus ${fmt(aw)}% after a winner. That is the shape of getting it back, and it's the fastest way to turn a bad day into a bad month.`
    });
  }
  /* 9. revenge window */
  const rev = [];
  for (let i = 1; i < chron.length; i++) {
    const p = chron[i - 1],
      c = chron[i];
    if (p.date !== c.date || p.r > 0) continue;
    const gap = mins(c.entryTime) - mins(p.entryTime);
    if (gap !== null && gap >= 0 && gap <= 30) rev.push(c);
  }
  if (rev.length >= 4) {
    const rs = stats(rev);
    out.push({
      level: "high",
      title: "Trades inside 30 minutes of a loss",
      body: `${rev.length} of them, averaging ${fmt(rs.avgR)}R at ${fmt(rs.winRate, 0)}% versus ${fmt(stats(chron).avgR)}R overall. A 30-minute cooling rule after a stop-out would have removed most of this.`
    });
  }
  /* 10. behaviour tags */
  const tagged = {};
  trades.forEach(t => (t.tags || []).forEach(tag => (tagged[tag] = tagged[tag] || []).push(t)));
  Object.entries(tagged).forEach(([tag, list]) => {
    if (!BAD_TAGS.includes(tag) || list.length < 4) return;
    const st = stats(list);
    if (st.avgR !== null && st.avgR < 0) out.push({
      level: "med",
      title: `"${tag}" costs you ${fmt(Math.abs(st.avgR))}R a trade`,
      body: `${list.length} trades carry this tag, ${fmt(st.sumR, 1)}R in total. Naming it honestly at entry is most of the fix.`
    });
  });
  /* 11. best day / worst day */
  const byDow = groupBy(trades.filter(t => t.r !== null), t => dowOf(t.date)).filter(g => g.nR >= 5);
  if (byDow.length >= 3) {
    const sorted = [...byDow].sort((a, b) => b.avgR - a.avgR);
    const best = sorted[0],
      worst = sorted[sorted.length - 1];
    if (best.avgR - worst.avgR >= 0.4) out.push({
      level: "good",
      title: `${best.key} is your best day, ${worst.key} your worst`,
      body: `${best.key}: ${fmt(best.avgR)}R across ${best.nR}. ${worst.key}: ${fmt(worst.avgR)}R across ${worst.nR}. Not a rule yet, but worth watching whether ${worst.key} is a scheduling problem rather than a market one.`
    });
  }
  /* 12. best slot */
  const bySlot = groupBy(trades.filter(t => t.r !== null && t.slot), t => t.slot).filter(g => g.nR >= 5);
  if (bySlot.length >= 3) {
    const sorted = [...bySlot].sort((a, b) => b.avgR - a.avgR);
    const b0 = sorted[0],
      w0 = sorted[sorted.length - 1];
    if (b0.avgR - w0.avgR >= 0.4) out.push({
      level: "good",
      title: `Your edge sits in ${b0.key}`,
      body: `${fmt(b0.avgR)}R there against ${fmt(w0.avgR)}R in ${w0.key}. If ${w0.key} entries aren't planned setups, that window is worth closing.`
    });
  }
  /* 13. trades taken below the skip line */
  const scoredT = trades.filter(t => t.r !== null);
  const belowLine = scoredT.filter(t => t.conviction < 45);
  if (belowLine.length >= 4) {
    const bl = stats(belowLine),
      rest = stats(scoredT.filter(t => t.conviction >= 45));
    out.push({
      level: "high",
      title: `${belowLine.length} trades below your own skip line`,
      body: `Entry score under 45 means at least two layers of the funnel were missing. Those trades took ${fmt(bl.avgR)}R against ${fmt(rest.avgR)}R for everything else, ${fmt(bl.sumR, 1)}R in total. This is the cheapest fix on the page: not taking them.`
    });
  }
  /* 14. is the conviction score actually ranking anything */
  if (scoredT.length >= 25) {
    const xs = scoredT.map(t => t.conviction),
      ys = scoredT.map(t => t.r);
    const mx = mean(xs),
      my = mean(ys);
    const cov = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    const dx = Math.sqrt(xs.reduce((a, x) => a + (x - mx) ** 2, 0)),
      dy = Math.sqrt(ys.reduce((a, y) => a + (y - my) ** 2, 0));
    const corr = dx && dy ? cov / (dx * dy) : 0;
    const A = stats(scoredT.filter(t => t.band === "A")),
      C = stats(scoredT.filter(t => t.band === "C" || t.band === "D"));
    if (corr >= 0.18 && A.nR >= 5) out.push({
      level: "good",
      title: "The funnel is ranking your trades properly",
      body: `Entry score tracks outcome at ${fmt(corr)} correlation. A-grade entries return ${fmt(A.avgR)}R against ${fmt(C.avgR)}R for C and D grades. Concentrating into the A-grade names is justified by your own record.`
    });else if (corr < 0.05 && scoredT.length >= 40) out.push({
      level: "med",
      title: "The entry score isn't separating winners yet",
      body: `Correlation between conviction and result is only ${fmt(corr)} across ${scoredT.length} trades. Either you're scoring generously after the fact, or some layers are noise. The confluence table shows which individual tells carry weight and which don't.`
    });
  }
  /* 15. does size follow conviction */
  const sized = scoredT.filter(t => t.riskAmt);
  if (sized.length >= 15) {
    const aRisk = mean(sized.filter(t => t.band === "A").map(t => t.riskAmt / settings.capital * 100));
    const cRisk = mean(sized.filter(t => t.band === "C" || t.band === "D").map(t => t.riskAmt / settings.capital * 100));
    if (aRisk !== null && cRisk !== null && aRisk <= cRisk * 1.1) out.push({
      level: "high",
      title: "Your size doesn't follow your conviction",
      body: `A-grade entries carry ${fmt(aRisk)}% risk, C and D grades carry ${fmt(cRisk)}%. You're betting the same on your best read as your worst. Going all in only pays if the all-in trades are the ones the funnel picked.`
    });
  }
  /* 16. which individual tells carry weight */
  const tellStats = [];
  const allSpecs = [...(lib.behaviour || []).map(x => ({
    ...x,
    group: "Behaviour",
    field: "behav"
  })), ...(lib.tech || []).map(x => ({
    ...x,
    group: "Technical",
    field: "tech"
  }))];
  allSpecs.forEach(spec => {
    const field = spec.field;
    const tell = spec.id;
    /* only compare against trades where the tell was even available */
    const pool = scoredT.filter(t => spec.side === "both" || sideOf(t.dir) === spec.side);
    const withT = pool.filter(t => (t[field] || []).includes(tell));
    const without = pool.filter(t => !(t[field] || []).includes(tell));
    if (withT.length >= 5 && without.length >= 5) tellStats.push({
      tell: spec.label,
      n: withT.length,
      delta: stats(withT).avgR - stats(without).avgR
    });
  });
  if (tellStats.length >= 4) {
    const best = [...tellStats].sort((a, b) => b.delta - a.delta)[0];
    const worst = [...tellStats].sort((a, b) => a.delta - b.delta)[0];
    if (best.delta >= 0.3) out.push({
      level: "good",
      title: `"${best.tell}" is your strongest single tell`,
      body: `Worth ${fmt(best.delta)}R more per trade when present, across ${best.n} trades. Weight it heavier when the layers disagree.`
    });
    if (worst.delta <= -0.2) out.push({
      level: "med",
      title: `"${worst.tell}" isn't earning its place`,
      body: `Trades carrying it return ${fmt(Math.abs(worst.delta))}R less than those without, across ${worst.n} trades. Either it needs a stricter definition or it's confirmation you're collecting after you've already decided.`
    });
  }

  /* 16b. do the adds help */
  const pyramided = trades.filter(t => t.adds > 0 && t.addContribution !== null);
  if (pyramided.length >= 6) {
    const contrib = mean(pyramided.map(t => t.addContribution));
    const flat = trades.filter(t => t.adds === 0 && t.r !== null);
    out.push({
      level: contrib >= 0.2 ? "good" : contrib <= -0.15 ? "high" : "med",
      title: contrib >= 0.2 ? `Pyramiding is adding ${fmt(contrib)}R a trade` : contrib <= -0.15 ? `Pyramiding is costing ${fmt(Math.abs(contrib))}R a trade` : "Pyramiding is roughly neutral so far",
      body: `Across ${pyramided.length} trades where you added, the adds changed the result by ${fmt(contrib)}R against holding only the initial position. Trades with no add averaged ${fmt(stats(flat).avgR)}R. ${contrib <= -0.15 ? "Adding into a position that hasn't proved itself is the usual cause — check whether the adds came before or after the trade was already working." : "Worth checking whether the winners were the ones you added to, or whether you added to everything."}`
    });
  }
  /* 16c. what the charges actually take */
  const charged = trades.filter(t => t.charges && t.charges.total && t.riskAmt);
  if (charged.length >= 15) {
    const totalCost = charged.reduce((a, t) => a + t.charges.total, 0);
    const rLost = mean(charged.map(t => t.charges.total / t.riskAmt));
    const byType = groupBy(charged, t => t.type).map(g => `${g.key} ${fmt(mean(g.items.map(t => t.charges.total / t.riskAmt)))}R`).join(", ");
    if (rLost >= 0.05) out.push({
      level: rLost >= 0.15 ? "high" : "med",
      title: `Charges are taking ${fmt(rLost)}R off every trade`,
      body: `${inr(totalCost)} across ${charged.length} trades, or ${fmt(rLost * charged.length, 1)}R in total. By type: ${byType}. A setup that averages ${fmt(rLost)}R gross is a losing setup once the contract note arrives.`
    });
  }

  /* 16d. how the book leaves */
  const exited = trades.filter(t => t.exitLabel && t.r !== null);
  if (exited.length >= 12) {
    const byExit = groupBy(exited, t => t.exitLabel);
    const unrecorded = byExit.find(g => g.key === "Not recorded");
    if (unrecorded && unrecorded.n / exited.length > 0.4) {
      out.push({
        level: "med",
        title: "Most exits aren't tagged",
        body: `${unrecorded.n} of ${exited.length} closed trades have no exit reason on them. Until that's filled in, the exit half of your process can't be measured at all — and exits are where most of the difference between a good trader and an average one sits.`
      });
    }
    const stopHit = byExit.find(g => g.key === "Initial stop hit");
    if (stopHit && stopHit.n / exited.length > 0.55) {
      out.push({
        level: "med",
        title: `${fmt(stopHit.n / exited.length * 100, 0)}% of trades leave through the initial stop`,
        body: `Most of your book is exiting by being wrong rather than by a decision. That is not automatically bad — a tight stop taken often can still work — but it means your exit criteria are barely being used, and the entry is carrying the whole strategy.`
      });
    }
    const ranked = byExit.filter(g => g.nR >= 6).sort((a, b) => b.avgR - a.avgR);
    if (ranked.length >= 3) {
      const best = ranked[0],
        worst = ranked[ranked.length - 1];
      if (best.avgR - worst.avgR >= 0.5) {
        out.push({
          level: "good",
          title: `"${best.key}" is your best exit, "${worst.key}" your worst`,
          body: `${fmt(best.avgR)}R across ${best.n} against ${fmt(worst.avgR)}R across ${worst.n}. Before changing anything, check whether the difference is the exit or the trades that happened to end that way — a reason used only on trades already in profit will always look good.`
        });
      }
    }
    const impatient = byExit.find(g => g.key === "Cut early, lost patience");
    if (impatient && impatient.nR >= 5) {
      out.push({
        level: impatient.avgR < 0 ? "high" : "med",
        title: `Cutting early has cost ${fmt(impatient.sumR, 1)}R`,
        body: `${impatient.n} trades, averaging ${fmt(impatient.avgR)}R. You tag these honestly, which is the hard part — the fix is usually a written exit rule rather than more willpower.`
      });
    }
  }

  /* 16f. do listing-day trades earn their place */
  const ipos = trades.filter(t => t.ipo && t.r !== null);
  if (ipos.length >= 6) {
    const si = stats(ipos),
      rest = stats(trades.filter(t => !t.ipo && t.r !== null));
    const byReg = groupBy(ipos, t => REGIMES[t.regime].name).filter(g => g.nR >= 3).sort((a, b) => b.avgR - a.avgR);
    const detail = byReg.length ? ` By regime: ${byReg.map(g => `${g.key} ${fmt(g.avgR)}R across ${g.nR}`).join(", ")}.` : "";
    out.push({
      level: si.avgR >= rest.avgR ? "good" : "med",
      title: si.avgR >= rest.avgR ? `Listing-day trades are working: ${fmt(si.avgR)}R` : `Listing-day trades are lagging at ${fmt(si.avgR)}R`,
      body: `${ipos.length} of them against ${fmt(rest.avgR)}R for everything else, ${fmt(si.sumR, 1)}R in total.${detail} A listing day gives you liquidity without history, so these rest almost entirely on behaviour and the regime — if one regime carries all the profit, that's your filter.`
    });
  }

  /* 16g. what the after-exit reviews are saying */
  const reviewed = trades.filter(t => t.afterExit && t.afterExit !== "Not reviewed yet" && t.r !== null);
  if (reviewed.length >= 8) {
    const ran = reviewed.filter(t => t.afterExit === "Kept going without me");
    const noise = reviewed.filter(t => /noise stop/i.test(t.afterExit));
    if (ran.length / reviewed.length >= 0.4) out.push({
      level: "high",
      title: `${fmt(ran.length / reviewed.length * 100, 0)}% of reviewed trades kept going without you`,
      body: `${ran.length} of ${reviewed.length}, averaging ${fmt(stats(ran).avgR)}R when you did hold them that far. Your own rules say hold longer and pyramid in a trend — this is the number that says whether you are.`
    });
    if (noise.length / reviewed.length >= 0.25) out.push({
      level: "high",
      title: `${noise.length} trades stopped you and then reversed`,
      body: `That's ${fmt(noise.length / reviewed.length * 100, 0)}% of what you've reviewed. Stops sitting inside the day's noise rather than beyond the level cost you the trade and the re-entry both. Worth checking the distance from entry to stop against the recent range.`
    });
  }
  const unreviewed = trades.filter(t => (!t.afterExit || t.afterExit === "Not reviewed yet") && t.r !== null);
  if (trades.length >= 15 && unreviewed.length / trades.length > 0.6) out.push({
    level: "med",
    title: `${unreviewed.length} closed trades have no after-exit review`,
    body: `Fifteen minutes on a Sunday filling these in is what turns the exit half of your process from a guess into something measurable.`
  });

  /* 17. how much is live right now */
  if (openTrades.length) {
    const risk = openTrades.reduce((a, t) => a + (t.openRisk || 0), 0);
    const pct = risk / settings.capital * 100;
    out.push({
      level: pct > settings.maxRisk * 2.5 ? "high" : "med",
      title: `${openTrades.length} position${openTrades.length > 1 ? "s" : ""} still open · ${fmt(pct)}% of capital at risk`,
      body: `${openTrades.map(t => t.symbol).join(", ")}. Open risk is the number that decides whether a bad gap is an inconvenience or a problem, and it's the one people forget to add up.`
    });
  }
  /* 18. are positional trades actually being held */
  const positional = trades.filter(t => t.type === "Positional" && t.holdDays !== null && (t.regime === "uptrend" || t.regime === "downtrend"));
  if (positional.length >= 8) {
    const h = mean(positional.map(t => t.holdDays));
    const winners = positional.filter(t => t.r > 0),
      losers = positional.filter(t => t.r <= 0);
    const hw = mean(winners.map(t => t.holdDays)),
      hl = mean(losers.map(t => t.holdDays));
    if (h < 5) out.push({
      level: "med",
      title: `Positional trades are lasting ${fmt(h, 1)} days`,
      body: `Your own rule for a trending market is to hold longer and pyramid. Averaging under a week means you're taking trend-following entries and managing them like intraday trades.`
    });
    if (hw !== null && hl !== null && hw < hl) out.push({
      level: "high",
      title: "You hold losers longer than winners",
      body: `Winners run ${fmt(hw, 1)} days, losers ${fmt(hl, 1)}. That's the wrong way round and it's usually the single most expensive habit in a positional book.`
    });
  }
  const rank = {
    high: 0,
    med: 1,
    good: 2
  };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

/* ---------- styles ---------- */
const DENSITY = {
  compact: {
    "--fs-xs": "10px",
    "--fs-sm": "11.5px",
    "--fs-md": "13px",
    "--fs-lg": "15px",
    "--fs-stat": "22px",
    "--pad": "16px"
  },
  normal: {
    "--fs-xs": "11px",
    "--fs-sm": "13px",
    "--fs-md": "14.5px",
    "--fs-lg": "17px",
    "--fs-stat": "26px",
    "--pad": "20px"
  },
  large: {
    "--fs-xs": "12.5px",
    "--fs-sm": "14.5px",
    "--fs-md": "16.5px",
    "--fs-lg": "19px",
    "--fs-stat": "30px",
    "--pad": "24px"
  }
};
const CSS = `
.rd * { box-sizing: border-box; }
.rd {
  --paper:#FFFFFF; --ink:#14181D; --muted:#5C6672; --rule:#DDE4EB;
  min-height:100vh; padding:0 0 72px;
  font-family: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  color:var(--ink);
  background: radial-gradient(120% 90% at 50% 0%, var(--field) 0%, var(--deep) 100%);
  transition: background 700ms ease;
}
.rd .inner { max-width:none; margin:0 auto; padding:0 22px; }
.rd .top { padding:14px 0 10px; color:var(--head); }
.rd .eyebrow { font-size:var(--fs-xs); letter-spacing:.22em; text-transform:uppercase; opacity:.6; }
.rd h1 { font-size:clamp(22px,3vw,34px); line-height:1; margin:4px 0 0; letter-spacing:-.02em; font-weight:600;
  display:inline-block; margin-right:20px; }
.rd .subline { font-size:var(--fs-sm); opacity:.75; margin-top:4px; max-width:110ch; line-height:1.4;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
.rd .stats { display:flex; gap:22px; flex-wrap:wrap; margin-top:10px; color:var(--head);
  align-items:baseline; }
.rd .stat b { display:block; font-size:var(--fs-lg); font-weight:600; letter-spacing:-.02em; line-height:1.1; }
.rd .stat span { font-size:var(--fs-xs); letter-spacing:.18em; text-transform:uppercase; opacity:.62; }

.rd .tape { display:flex; gap:2px; align-items:flex-end; height:34px; margin-top:10px;
  border-bottom:1px solid var(--tapeRule); overflow-x:auto; }
.rd .blk { flex:1 0 8px; min-width:8px; position:relative; cursor:pointer; opacity:.85; }
.rd .blk:hover, .rd .blk.sel { opacity:1; outline:2px solid var(--head); }
.rd .dot { position:absolute; top:-8px; left:50%; transform:translateX(-50%);
  width:5px; height:5px; border-radius:50%; background:var(--head); }
.rd .tapelegend { display:flex; gap:18px; margin-top:5px; color:var(--head); opacity:.65;
  font-size:var(--fs-xs); letter-spacing:.14em; text-transform:uppercase; flex-wrap:wrap; }

.rd .linkbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:8px 0 4px;
  padding:6px 10px; background:var(--link-bg); border-left:4px solid var(--link-accent); }
.rd .linkchip { display:inline-block; padding:6px 12px; font-size:var(--fs-sm); letter-spacing:.1em;
  text-transform:uppercase; text-decoration:none; color:var(--link-ink); border:1px solid var(--link-accent); }
.rd .linkchip:hover { background:var(--link-accent); color:#fff; }
.rd .linkchip:focus-visible { outline:2px solid var(--head); outline-offset:2px; }

.rd .quote { margin:8px 0 4px; padding:9px 14px; background:var(--quote-bg); color:var(--quote-ink);
  border-left:4px solid var(--quote-accent); display:flex; gap:12px; align-items:baseline; flex-wrap:wrap; }
.rd .qtext { font-size:var(--fs-md); line-height:1.5; font-family:system-ui,-apple-system,sans-serif; max-width:100ch; }
.rd .qwho { font-size:var(--fs-xs); letter-spacing:.14em; text-transform:uppercase; opacity:.7; }
.rd .qmore { margin-left:auto; background:transparent; border:0; color:var(--quote-ink); opacity:.5;
  cursor:pointer; font:inherit; font-size:var(--fs-lg); padding:0 4px; }
.rd .qmore:hover { opacity:1; }

.rd .tabs { display:flex; gap:2px; margin:12px 0 10px; flex-wrap:wrap; }
.rd .tab { background:var(--tabbg); color:var(--head); border:0; padding:8px 14px; cursor:pointer;
  font:inherit; font-size:var(--fs-sm); letter-spacing:.14em; text-transform:uppercase; }
.rd .tab.on { background:var(--paper); color:var(--ink); box-shadow:inset 0 -3px 0 var(--tab-accent); }
.rd .tab:focus-visible { outline:2px solid var(--head); outline-offset:2px; }

.rd .sessionwrap { display:grid; grid-template-columns:clamp(300px, 22%, 460px) minmax(0,1fr); gap:14px; align-items:start; }
.rd .notescol { position:sticky; top:10px; }
.rd .maincol { min-width:0; }
@media (max-width: 1200px) { .rd .sessionwrap { grid-template-columns:1fr; } .rd .notescol { position:static; } }
.rd .sticky { align-self:start; }
.rd .card { background:var(--paper); padding:var(--pad); margin-bottom:14px;
  border:1px solid var(--cardBorder); border-top:2px solid var(--tab-accent); }
.rd .card h2 { font-size:var(--fs-sm); letter-spacing:.2em; text-transform:uppercase; margin:0 0 16px;
  padding-bottom:10px; border-bottom:1px solid var(--rule); color:var(--tab-accent); font-weight:600; }
.rd .grid2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(480px,1fr)); gap:14px; }

.rd .critgrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:0 28px; }
.rd .crit { display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center;
  padding:8px 0; border-bottom:1px solid var(--rule); }
.rd .crit:last-child { border-bottom:0; }
.rd .critgrid .crit:last-child { border-bottom:1px solid var(--rule); }
.rd .crit .cl { font-size:var(--fs-md); font-weight:600; }
.rd .seg { display:flex; gap:1px; }
.rd .seg button { border:1px solid var(--rule); background:transparent; width:38px; height:32px;
  cursor:pointer; font:inherit; font-size:var(--fs-sm); color:var(--muted); padding:0; }
.rd .seg button.on { background:var(--regime-ink); border-color:var(--regime-ink); color:#fff; }
.rd .seg button:focus-visible { outline:2px solid var(--regime-ink); outline-offset:1px; }
.rd .chosen { font-size:var(--fs-sm); color:var(--muted); margin-top:4px; font-family:system-ui,sans-serif; }

.rd .ch { font-size:var(--fs-sm); color:var(--muted); line-height:1.55; max-width:95ch;
  font-family:system-ui,-apple-system,sans-serif; }
.rd .crit .ch { margin-top:3px; }

.rd input, .rd select, .rd textarea { font:inherit; font-size:var(--fs-md); padding:9px 10px;
  border:1px solid var(--rule); background:#fff; color:#14181D; width:100%; border-radius:0; }
.rd input:focus, .rd select:focus, .rd textarea:focus { outline:2px solid var(--regime-ink); outline-offset:-1px; }
.rd label.f { display:block; font-size:var(--fs-xs); letter-spacing:.16em; text-transform:uppercase;
  color:var(--muted); margin-bottom:5px; }
.rd .row { display:grid; gap:12px; }
.rd .btn { background:var(--regime-ink); color:#fff; border:0; padding:12px 20px; cursor:pointer;
  font:inherit; font-size:var(--fs-sm); letter-spacing:.14em; text-transform:uppercase; }
.rd .btn.ghost { background:transparent; color:var(--ink); border:1px solid var(--rule); }
.rd .btn:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
.rd .chip { border:1px solid var(--rule); background:transparent; padding:7px 12px; cursor:pointer;
  font:inherit; font-size:var(--fs-sm); color:var(--muted); }
.rd .chip.on { background:var(--ink); color:var(--paper); border-color:var(--ink); }

.rd table { width:100%; border-collapse:collapse; font-size:var(--fs-md); }
.rd th { text-align:right; font-size:var(--fs-xs); letter-spacing:.14em; text-transform:uppercase;
  color:var(--muted); padding:9px 10px; border-bottom:1px solid var(--rule); font-weight:600; }
.rd th:first-child, .rd td:first-child { text-align:left; }
.rd td { padding:10px; border-bottom:1px solid var(--rule); text-align:right; }
.rd tr:last-child td { border-bottom:0; }
.rd .pos { color:#0B5C3F; } .rd .neg { color:#8E1E22; }
.rd .bar { height:7px; background:var(--rule); position:relative; margin-top:4px; }
.rd .bar i { position:absolute; left:0; top:0; bottom:0; background:var(--regime-ink); }

.rd .sig { border-left:4px solid var(--rule); padding:12px 0 12px 16px; margin-bottom:16px; }
.rd .sig.high { border-color:#B3282F; } .rd .sig.med { border-color:#C99A1E; } .rd .sig.good { border-color:#0B5C3F; }
.rd .sig b { font-size:var(--fs-md); display:block; margin-bottom:6px; }
.rd .sig p { margin:0; font-size:var(--fs-md); line-height:1.6; color:#3A3730; max-width:95ch;
  font-family:system-ui,-apple-system,sans-serif; }
.rd .empty { font-size:var(--fs-md); color:var(--muted); line-height:1.65; max-width:95ch;
  font-family:system-ui,-apple-system,sans-serif; }
.rd .pill { display:inline-block; padding:3px 8px; font-size:var(--fs-xs); letter-spacing:.12em;
  text-transform:uppercase; border:1px solid var(--rule); color:var(--muted); }
.rd .pill.off { background:#8E1E22; color:#fff; border-color:#8E1E22; }
.rd .scroll { overflow-x:auto; }
.rd ul.rules { margin:0; padding-left:18px; font-size:var(--fs-md); line-height:1.75; max-width:95ch;
  font-family:system-ui,-apple-system,sans-serif; }
.rd .alarm { background:#FDECEC; border-left:4px solid #B3282F; padding:14px 16px; margin-bottom:16px;
  animation: rdpulse 1.6s ease-in-out infinite; }
.rd .alarm b { display:block; font-size:var(--fs-md); margin-bottom:6px; color:#8E1E22; }
.rd .alarm p { margin:0; font-size:var(--fs-md); line-height:1.6; color:#3A2222; max-width:95ch;
  font-family:system-ui,-apple-system,sans-serif; }
@keyframes rdpulse { 0%,100% { background:#FDECEC; } 50% { background:#F8D6D6; } }
@media (prefers-reduced-motion: reduce) { .rd .alarm { animation:none; } }
.rd .foot { color:var(--head); opacity:.5; font-size:var(--fs-xs); text-align:center; padding-top:26px; letter-spacing:.1em; }
@media (max-width: 720px) {
  .rd .inner { padding:0 14px; }
  .rd .grid2 { grid-template-columns:1fr; }
}
@media (prefers-reduced-motion: reduce) { .rd { transition:none; } }
`;

/* ---------- storage ---------- */
const K = {
  s: "rdesk:sessions",
  t: "rdesk:trades",
  g: "rdesk:settings",
  m: "rdesk:market",
  l: "rdesk:library",
  q: "rdesk:quotes",
  w: "rdesk:watch"
};
async function loadKey(k, fallback) {
  try {
    const r = await window.storage.get(k);
    return r && r.value ? JSON.parse(r.value) : fallback;
  } catch (e) {
    return fallback;
  }
}
const saveTimers = new Map();
function saveKey(k, v) {
  if (saveTimers.has(k)) clearTimeout(saveTimers.get(k));
  saveTimers.set(k, setTimeout(async () => {
    saveTimers.delete(k);
    try {
      await window.storage.set(k, JSON.stringify(v));
    } catch (e) {/* offline is fine */}
  }, 400));
}

/* ---------- migration: old label-based records become id + leg records ---------- */
function migrateTrade(t, lib) {
  if (t.legs && t.setupId !== undefined) return t;
  const findId = (group, label) => {
    const hit = (lib[group] || []).find(x => x.label === label || x.id === label);
    return hit ? hit.id : slug(label || "");
  };
  return {
    ...t,
    setupId: t.setupId !== undefined ? t.setupId : findId("setups", t.setup),
    behav: (t.behav || []).map(x => findId("behaviour", x)),
    tech: (t.tech || []).map(x => findId("tech", x)),
    legs: t.legs || legsOf(t)
  };
}

/* ---------- sample data ---------- */
function makeSample() {
  let seed = 20260821;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const sessions = [],
    trades = [];
  const d = new Date();
  d.setDate(d.getDate() - 120);
  let phase = 0,
    phaseLeft = 18;
  const phases = ["uptrend", "choppy", "downtrend", "choppy", "uptrend"];
  while (d <= new Date()) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      if (phaseLeft-- <= 0) {
        phase = (phase + 1) % phases.length;
        phaseLeft = 14 + Math.floor(rnd() * 12);
      }
      const p = phases[phase];
      const scores = {};
      SEED_LIBRARY.direction.forEach(c => {
        const base = p === "uptrend" ? 3.4 : p === "downtrend" ? 0.6 : 2;
        scores[c.id] = Math.max(0, Math.min(4, Math.round(base + (rnd() - 0.5) * 1.8)));
      });
      SEED_LIBRARY.clarity.forEach(c => {
        const base = p === "choppy" ? 0.55 : 1.5;
        scores[c.id] = Math.max(0, Math.min(2, Math.round(base + (rnd() - 0.5) * 1.4)));
      });
      const date = d.toISOString().slice(0, 10);
      const sc = scoreSession(scores, SEED_LIBRARY);
      sessions.push({
        date,
        scores,
        note: ""
      });
      const bud = budgetFor(sc.regime, sc.confidence, 1);
      const count = Math.min(5, Math.round(bud.trades * (0.5 + rnd() * 1.3)));
      for (let i = 0; i < count; i++) {
        const book = activeSetups(SEED_LIBRARY, sc.regime).map(x => x.id);
        const onModel = rnd() > (sc.regime === "choppy" ? 0.55 : 0.28);
        const setup = onModel && book.length ? book[Math.floor(rnd() * book.length)] : SEED_LIBRARY.setups[Math.floor(rnd() * SEED_LIBRARY.setups.length)].id;
        const hr = 9 + Math.floor(rnd() * 6),
          mi = Math.floor(rnd() * 60);
        const time = `${String(hr).padStart(2, "0")}:${String(hr === 9 ? 15 + Math.floor(rnd() * 44) : mi).padStart(2, "0")}`;
        const sector = Math.min(3, Math.floor(rnd() * 4));
        const stock = Math.min(3, Math.floor(rnd() * 4));
        const side = sc.regime === "downtrend" ? "Short" : "Long";
        const type = rnd() > 0.82 ? "News impact" : rnd() > 0.55 ? "Intraday" : "Positional";
        const behav = activeTells(SEED_LIBRARY, "behaviour", side).map(x => x.id).filter(() => rnd() > 0.68);
        const tech = activeTells(SEED_LIBRARY, "tech", side).map(x => x.id).filter(() => rnd() > 0.6);
        let edge = onModel ? 0.35 : -0.25;
        if (sc.regime === "choppy") edge -= 0.25;
        if (hr >= 10 && hr < 12) edge += 0.2;
        if (day === 5) edge -= 0.3;
        edge += 0.16 * (sector - 1.5) + 0.2 * (stock - 1.5);
        if (behav.includes("Holds up on weak market days")) edge += 0.35;
        if (behav.includes("Bad news or result, price refuses to fall")) edge += 0.3;
        if (tech.includes("Tease break")) edge += 0.25;
        if (tech.includes("9 and 20 EMA trending")) edge += 0.2;
        if (tech.includes("Liquidity sweep of support / prior swing")) edge -= 0.15;
        const r = edge + (rnd() - 0.45) * 2.6;
        const entry = 200 + Math.round(rnd() * 2400);
        const long = sc.regime !== "downtrend";
        const stopDist = entry * (0.012 + rnd() * 0.02);
        const stop = long ? entry - stopDist : entry + stopDist;
        const qty = Math.max(1, Math.round(10000 * (0.6 + rnd() * 1.5) / stopDist));
        const exit = long ? entry + r * stopDist : entry - r * stopDist;
        const tags = [];
        if (onModel) tags.push("Planned");
        if (!onModel && rnd() > 0.6) tags.push(rnd() > 0.5 ? "FOMO chase" : "Boredom");
        if (rnd() > 0.9) tags.push("Moved stop");
        trades.push({
          id: uid(),
          date,
          time,
          symbol: ["RELIANCE", "HDFCBANK", "TATAMOTORS", "DIVISLAB", "TITAN", "TRENT", "BEL", "CGPOWER"][Math.floor(rnd() * 8)],
          dir: side,
          type,
          setupId: setup,
          stop: +stop.toFixed(2),
          sector,
          stock,
          behav,
          tech,
          tags,
          notes: "",
          ipo: rnd() > 0.93,
          legs: []
        });
        const T = trades[trades.length - 1];
        const exitDate = type === "Positional" ? new Date(new Date(date).getTime() + Math.round(2 + rnd() * 18) * 864e5).toISOString().slice(0, 10) : date;
        T.legs.push({
          id: uid(),
          kind: "in",
          date,
          time,
          price: +entry.toFixed(2),
          qty
        });
        /* about a third of trending positional trades get an add */
        if (type === "Positional" && sc.regime !== "choppy" && rnd() > 0.66) {
          const addPrice = long ? entry + stopDist * (0.6 + rnd()) : entry - stopDist * (0.6 + rnd());
          T.legs.push({
            id: uid(),
            kind: "in",
            date: exitDate,
            time: "",
            price: +addPrice.toFixed(2),
            qty: Math.round(qty * 0.5)
          });
        }
        if (!(type === "Positional" && rnd() > 0.94)) {
          const totalQty = T.legs.filter(l => l.kind === "in").reduce((a, l) => a + l.qty, 0);
          const book = activeExits(SEED_LIBRARY, sc.regime);
          const exitId = r <= -0.9 ? "initial-stop-hit" : rnd() > 0.82 ? "cut-early-lost-patience" : book[Math.floor(rnd() * book.length)].id;
          T.legs.push({
            id: uid(),
            kind: "out",
            date: exitDate,
            time: "",
            price: +exit.toFixed(2),
            qty: totalQty,
            exitId
          });
        }
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return {
    sessions,
    trades
  };
}

/* ---------- csv ---------- */
const CSV_COLS = ["date", "symbol", "dir", "type", "ipo", "setup", "stop", "legs", "chart", "afterExit", "afterExitNote", "sector", "stock", "behaviour", "technical", "tags", "notes"];
function toCSV(trades, lib) {
  const esc = v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lab = (g, id) => labelOf(lib, g, id);
  return [CSV_COLS.join(",")].concat(trades.map(t => CSV_COLS.map(c => esc(c === "tags" ? (t.tags || []).join("|") : c === "behaviour" ? (t.behav || []).map(x => lab("behaviour", x)).join("|") : c === "technical" ? (t.tech || []).map(x => lab("tech", x)).join("|") : c === "setup" ? lab("setups", t.setupId) : c === "ipo" ? t.ipo ? "yes" : "" : c === "legs" ? legsOf(t).map(l => `${l.kind}@${l.date}@${l.price}@${l.qty}@${l.exitId ? lab("exits", l.exitId) : ""}@${l.orders ?? 1}`).join("|") : t[c])).join(","))).join("\n");
}
function parseCSV(text, lib) {
  const rows = [];
  let row = [],
    cur = "",
    q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;else cur += c;
    } else if (c === '"') q = true;else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim().toLowerCase());
  const idFor = (g, label) => {
    const hit = (lib[g] || []).find(x => x.label === label);
    return hit ? hit.id : slug(label || "");
  };
  return rows.slice(1).filter(r => r.some(x => x.trim())).map(r => {
    const o = {};
    head.forEach((h, i) => o[h] = (r[i] || "").trim());
    const legs = (o.legs || "").split("|").filter(Boolean).map(chunk => {
      const [kind, date, price, qty, exitLabel, orders] = chunk.split("@");
      return {
        id: uid(),
        kind: kind === "out" ? "out" : "in",
        date,
        time: "",
        price,
        qty,
        orders: orders ? num(orders) : 1,
        ...(exitLabel ? {
          exitId: idFor("exits", exitLabel)
        } : {})
      };
    });
    return {
      id: uid(),
      date: o.date,
      symbol: o.symbol || "",
      dir: /short/i.test(o.dir) ? "Short" : "Long",
      type: o.type || "Positional",
      ipo: /^(yes|true|1|y)$/i.test(o.ipo || ""),
      setupId: idFor("setups", o.setup),
      stop: o.stop,
      chart: o.chart || "",
      afterExit: o.afterexit || o.afterExit || "Not reviewed yet",
      afterExitNote: o.afterexitnote || o.afterExitNote || "",
      legs: legs.length ? legs : [{
        id: uid(),
        kind: "in",
        date: o.date,
        time: "",
        price: o.entry || "",
        qty: o.qty || ""
      }],
      sector: o.sector === "" || o.sector === undefined ? 1 : num(o.sector),
      stock: o.stock === "" || o.stock === undefined ? 1 : num(o.stock),
      behav: (o.behaviour || "").split("|").filter(Boolean).map(x => idFor("behaviour", x)),
      tech: (o.technical || "").split("|").filter(Boolean).map(x => idFor("tech", x)),
      tags: (o.tags || "").split("|").filter(Boolean),
      notes: o.notes || ""
    };
  }).filter(t => t.date);
}

/* Windows path to a browser-openable file URL: F:\invest\charts\ -> file:///F:/invest/charts/ */
function fileUrl(folder, name) {
  if (!name) return null;
  let f = String(folder || "").replace(/\\/g, "/").trim();
  if (f && !f.endsWith("/")) f += "/";
  let full = f + String(name).replace(/\\/g, "/");
  if (/^[a-zA-Z]:/.test(full)) full = "file:///" + full;else if (full.startsWith("/")) full = "file://" + full;else if (!/^[a-z]+:/i.test(full)) full = "file:///" + full;
  return encodeURI(full);
}
function download(name, text, type) {
  const b = new Blob([text], {
    type
  });
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}

/* ---------- small components ---------- */
function Seg({
  n,
  value,
  onChange,
  labels,
  kind
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "seg",
    role: "group"
  }, Array.from({
    length: n
  }).map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: value === i ? "on" : "",
    "aria-label": labels[i],
    "aria-pressed": value === i,
    title: labels[i],
    onClick: () => onChange(value === i ? null : i)
  }, segLabel(i, n, kind))));
}
function Field({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, label), children);
}
function Table({
  cols,
  rows
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j
  }, c)))))));
}
/* A single number to sort a scan by, so the eye lands on the right row first.
   Side-aware: a short candidate wants the mirror of everything a long wants. */
function opportunityScore(r, side) {
  const long = side !== "Short";
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const cp = r.closePosition === undefined || r.closePosition === null ? 0.5 : r.closePosition;
  const closeScore = long ? cp : 1 - cp; // where it shut in the bar
  const chg = (r.dayChangePct !== undefined ? r.dayChangePct : r.changeInCandlePct) || 0;
  const dirScore = clamp01(((long ? chg : -chg) + 2) / 4); // -2%..+2% mapped to 0..1
  const partRaw = r.pctOfADV !== undefined ? r.pctOfADV / 40 : (r.ratioDaily || 0) / 8;
  const partScore = clamp01(partRaw); // participation, capped
  const ownRaw = r.rvolOwn !== undefined && r.rvolOwn !== null ? Math.log10(Math.max(1, r.rvolOwn)) / 1 // 1x..10x -> 0..1
  : r.ratioWeekly ? clamp01(r.ratioWeekly / 8) : 0.35;
  const ownScore = clamp01(ownRaw);
  const sec = r.sectorRating === undefined || r.sectorRating === null ? 1.5 : r.sectorRating;
  const stk = r.stockRating === undefined || r.stockRating === null ? 1.5 : r.stockRating;
  const strength = long ? (sec + stk) / 6 : 1 - (sec + stk) / 6;
  return Math.round(100 * (closeScore * 0.30 + dirScore * 0.15 + partScore * 0.20 + ownScore * 0.20 + strength * 0.15));
}
function withRanks(rows, side) {
  return [...rows].map(r => ({
    ...r,
    opp: opportunityScore(r, side)
  })).sort((a, b) => b.opp - a.opp).map((r, i) => ({
    ...r,
    rank: i + 1
  }));
}
function Calendar({
  trades,
  months = 12,
  gross = true
}) {
  const byDay = {};
  trades.forEach(t => {
    /* a positional result belongs to the day it was closed, not the day it was opened */
    const day = t.exitDay || t.date;
    if (!day) return;
    const d = byDay[day] = byDay[day] || {
      n: 0,
      pnl: 0,
      r: 0,
      rKnown: 0
    };
    d.n++;
    d.pnl += (gross ? t.pnlGross : t.pnl) || 0;
    const rr = gross ? t.rGross : t.r;
    if (rr !== null && rr !== undefined) {
      d.r += rr;
      d.rKnown++;
    }
  });
  const scale = Math.max(1, ...Object.values(byDay).map(d => Math.abs(d.r || 0)));
  const now = new Date();
  const blocks = [];
  for (let m = months - 1; m >= 0; m--) {
    const anchor = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y = anchor.getFullYear(),
      mo = anchor.getMonth();
    const daysIn = new Date(y, mo + 1, 0).getDate();
    const lead = new Date(y, mo, 1).getDay(); // 0 Sun
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysIn; d++) {
      const iso = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        iso,
        day: d,
        wd: new Date(y, mo, d).getDay(),
        data: byDay[iso]
      });
    }
    blocks.push({
      label: anchor.toLocaleString("en-GB", {
        month: "short"
      }),
      year: y,
      cells
    });
  }
  const colour = c => {
    if (!c) return "transparent";
    if (!c.data) return c.wd === 0 || c.wd === 6 ? "transparent" : "var(--rule)";
    const v = c.data.rKnown ? c.data.r : c.data.pnl > 0 ? 1 : c.data.pnl < 0 ? -1 : 0;
    if (v === 0) return "var(--muted)";
    const a = Math.min(1, 0.28 + Math.abs(v) / scale);
    return v > 0 ? `rgba(15,138,95,${a})` : `rgba(179,40,47,${a})`;
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      overflowX: "auto",
      paddingBottom: 6
    }
  }, blocks.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.label + b.year
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-xs)",
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "var(--muted)",
      marginBottom: 6
    }
  }, b.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 14px)",
      gap: 3
    }
  }, b.cells.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    title: c ? c.data ? `${c.iso} · ${c.data.n} trade${c.data.n > 1 ? "s" : ""} · ${c.data.rKnown ? (c.data.r > 0 ? "+" : "") + c.data.r.toFixed(2) + "R · " : ""}${inr(c.data.pnl)}` : c.iso : "",
    style: {
      width: 14,
      height: 14,
      background: colour(c),
      borderRadius: 2
    }
  }))))));
}
function SortTable({
  cols,
  data,
  initial,
  filterKey,
  filterLabel,
  limit
}) {
  const [sort, setSort] = useState(initial || {
    key: cols[0].key,
    dir: "desc"
  });
  const [filter, setFilter] = useState("All");
  const values = filterKey ? Array.from(new Set(data.map(r => r[filterKey]).filter(Boolean))).sort() : [];
  const counts = {};
  if (filterKey) data.forEach(r => {
    counts[r[filterKey]] = (counts[r[filterKey]] || 0) + 1;
  });
  const shown = filterKey && filter !== "All" ? data.filter(r => r[filterKey] === filter) : data;
  const col = cols.find(c => c.key === sort.key) || cols[0];
  const sorted = [...shown].sort((a, b) => {
    const av = col.get ? col.get(a) : a[col.key];
    const bv = col.get ? col.get(b) : b[col.key];
    const na = av === null || av === undefined,
      nb = bv === null || bv === undefined;
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return sort.dir === "desc" ? -cmp : cmp;
  });
  const click = c => {
    if (c.noSort) return;
    setSort(s2 => s2.key === c.key ? {
      key: c.key,
      dir: s2.dir === "desc" ? "asc" : "desc"
    } : {
      key: c.key,
      dir: typeof (c.get ? c.get(data[0] || {}) : "") === "string" ? "asc" : "desc"
    });
  };
  const rows = limit ? sorted.slice(0, limit) : sorted;
  return /*#__PURE__*/React.createElement(React.Fragment, null, filterKey && values.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, filterLabel || "Filter"), /*#__PURE__*/React.createElement("select", {
    value: filter,
    onChange: e => setFilter(e.target.value),
    style: {
      maxWidth: 340
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "All"
  }, "All · ", data.length), values.map(v => /*#__PURE__*/React.createElement("option", {
    key: v,
    value: v
  }, v, " · ", counts[v])))), /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    onClick: () => click(c),
    style: {
      cursor: c.noSort ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, c.label, sort.key === c.key && !c.noSort ? sort.dir === "desc" ? " \u25BE" : " \u25B4" : "")))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.symbol || i
  }, cols.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key
  }, c.cell(r)))))))), limit && sorted.length > limit && /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 8
    }
  }, "Showing ", limit, " of ", sorted.length, "."));
}
const rcell = (v, d = 2) => v === null || v === undefined || !isFinite(v) ? /*#__PURE__*/React.createElement("span", null, "—") : /*#__PURE__*/React.createElement("span", {
  className: v > 0 ? "pos" : v < 0 ? "neg" : ""
}, v > 0 ? "+" : "", v.toFixed(d));

/* ---------- the app ---------- */
/* Each tab gets its own accent so you know where you are at a glance. Kept to a
   thin rule and the heading — the regime flood stays the loudest thing on screen. */
const TAB_ACCENTS = {
  session: {
    light: "#1E6FA8",
    dark: "#6BB6E8"
  },
  watchlist: {
    light: "#7A5B08",
    dark: "#E0C070"
  },
  trades: {
    light: "#0E7C66",
    dark: "#4FD3AE"
  },
  confluence: {
    light: "#6B4FA8",
    dark: "#B49BE8"
  },
  edge: {
    light: "#A8720E",
    dark: "#E8B85C"
  },
  signals: {
    light: "#B5462F",
    dark: "#F09070"
  },
  library: {
    light: "#4A5B6B",
    dark: "#9FB4C7"
  },
  playbook: {
    light: "#2F7A45",
    dark: "#74D291"
  }
};
const THEMES = {
  light: R => ({
    "--field": R.fieldL,
    "--deep": R.deepL,
    "--regime-ink": R.ink,
    "--paper": "#FFFFFF",
    "--ink": "#14181D",
    "--muted": "#5C6672",
    "--rule": "#DDE4EB",
    "--head": "#14181D",
    "--tabbg": "rgba(20,24,29,.07)",
    "--tapeRule": "rgba(20,24,29,.2)",
    "--cardBorder": "#DDE4EB",
    "--quote-bg": "#E4F3EA",
    "--quote-accent": "#0E7C66",
    "--quote-ink": "#123B30",
    "--link-bg": "#E3EDF7",
    "--link-accent": "#1E6FA8",
    "--link-ink": "#12314A"
  }),
  dark: R => ({
    "--field": R.field,
    "--deep": R.deep,
    "--regime-ink": R.ink,
    "--paper": "#F7F4EC",
    "--ink": "#16181C",
    "--muted": "#6E6858",
    "--rule": "#DCD5C4",
    "--head": "#FFFFFF",
    "--tabbg": "rgba(255,255,255,.1)",
    "--tapeRule": "rgba(255,255,255,.25)",
    "--cardBorder": "transparent",
    "--quote-bg": "rgba(79,211,174,.14)",
    "--quote-accent": "#4FD3AE",
    "--quote-ink": "#FFFFFF",
    "--link-bg": "rgba(107,182,232,.16)",
    "--link-accent": "#6BB6E8",
    "--link-ink": "#FFFFFF"
  })
};
function RegimeDeskApp() {
  const [ready, setReady] = useState(false);
  const [rawSessions, setSessions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [settings, setSettings] = useState({
    capital: 1000000,
    maxRisk: 1,
    theme: "light",
    rates: DEFAULT_RATES,
    links: DEFAULT_LINKS,
    density: "normal",
    chartFolder: "F:\\invest\\charts\\",
    maxTradesPerDay: 3,
    maxDailyLossR: 2
  });
  const [tab, setTab] = useState("session");
  const [date, setDate] = useState(today());
  const [draft, setDraft] = useState(blankTrade());
  const [msg, setMsg] = useState("");
  const [market, setMarket] = useState(null);
  const [lib, setLib] = useState(SEED_LIBRARY);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [scanSide, setScanSide] = useState("Long");
  const [openSector, setOpenSector] = useState(null);
  const [openTheme, setOpenTheme] = useState(null);
  const [showAllSectors, setShowAllSectors] = useState(false);
  const [calType, setCalType] = useState("All");
  const [calGross, setCalGross] = useState(true);
  const [watch, setWatch] = useState([]);
  const [watchPick, setWatchPick] = useState(null);
  const [wDraft, setWDraft] = useState({
    symbol: "",
    thesis: ""
  });
  const [obsDraft, setObsDraft] = useState({
    date: today(),
    text: "",
    tells: []
  });
  const [logSearch, setLogSearch] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [quoteNonce, setQuoteNonce] = useState(0);
  const [qDraft, setQDraft] = useState({
    text: "",
    author: "",
    tag: "General"
  });
  const [showQuotes, setShowQuotes] = useState(false);
  function blankTrade() {
    return {
      id: "",
      date: today(),
      symbol: "",
      dir: "Long",
      type: "Positional",
      setupId: "",
      stop: "",
      legs: [{
        id: uid(),
        kind: "in",
        date: today(),
        time: "",
        price: "",
        qty: "",
        orders: 1
      }],
      sector: 1,
      stock: 1,
      behav: [],
      tech: [],
      tags: [],
      notes: "",
      ipo: false,
      afterExit: "Not reviewed yet",
      afterExitNote: "",
      chart: ""
    };
  }
  useEffect(() => {
    (async () => {
      const [s, t, g, m, l, q, w] = await Promise.all([loadKey(K.s, []), loadKey(K.t, []), loadKey(K.g, null), loadKey(K.m, null), loadKey(K.l, null), loadKey(K.q, []), loadKey(K.w, [])]);
      setWatch(Array.isArray(w) ? w : []);
      setQuotes(Array.isArray(q) ? q : []);
      const library = mergeLibrary(l);
      setLib(library);
      setSessions(s);
      if (m) setMarket(m);
      if (g) setSettings({
        ...g,
        rates: g.rates || DEFAULT_RATES,
        links: g.links || DEFAULT_LINKS,
        density: g.density || "normal",
        chartFolder: g.chartFolder ?? "F:\\invest\\charts\\",
        maxTradesPerDay: g.maxTradesPerDay ?? 3,
        maxDailyLossR: g.maxDailyLossR ?? 2
      });
      /* one-time conversion of label-based records to ids and legs */
      setTrades(t.map(x => migrateTrade(x, library)));
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (ready) saveKey(K.s, rawSessions);
  }, [rawSessions, ready]);
  useEffect(() => {
    if (ready) saveKey(K.t, trades);
  }, [trades, ready]);
  useEffect(() => {
    if (ready) saveKey(K.g, settings);
  }, [settings, ready]);
  useEffect(() => {
    if (ready && market) saveKey(K.m, market);
  }, [market, ready]);
  useEffect(() => {
    if (ready) saveKey(K.l, lib);
  }, [lib, ready]);
  useEffect(() => {
    if (ready) saveKey(K.q, quotes);
  }, [quotes, ready]);
  useEffect(() => {
    if (ready) saveKey(K.w, watch);
  }, [watch, ready]);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(id);
  }, [msg]);

  /* recomputed from the current weights, so changing a weight re-labels history
     consistently instead of leaving old days scored by the old rules */
  const sessions = useMemo(() => rawSessions.map(s2 => ({
    ...s2,
    ...scoreSession(s2.scores, lib)
  })), [rawSessions, lib]);
  const sessionsByDate = useMemo(() => {
    const m = {};
    sessions.forEach(s => m[s.date] = s);
    return m;
  }, [sessions]);
  const current = useMemo(() => sessionsByDate[date] || {
    date,
    scores: {},
    note: "",
    regime: "unset",
    confidence: 0,
    trend100: 0,
    clarity100: 0
  }, [sessionsByDate, date]);
  const live = useMemo(() => scoreSession(current.scores || {}, lib), [current, lib]);
  const latest = useMemo(() => {
    const s = [...sessions].filter(x => x.regime !== "unset").sort((a, b) => a.date.localeCompare(b.date));
    return s.length ? s[s.length - 1] : null;
  }, [sessions]);

  /* the field colour follows the day you are looking at, else the latest scored session */
  const shownRegime = live.regime !== "unset" ? live.regime : latest ? latest.regime : "unset";
  const R = REGIMES[shownRegime];
  const allTrades = useMemo(() => trades.map(t => enrich(t, sessionsByDate, lib, settings.rates)), [trades, sessionsByDate, lib, settings.rates]);
  const openTrades = useMemo(() => allTrades.filter(t => t.isOpen), [allTrades]);
  const enriched = useMemo(() => allTrades.filter(t => !t.isOpen), [allTrades]);
  const signals = useMemo(() => buildSignals(sessions, enriched, settings, openTrades, lib), [sessions, enriched, settings, openTrades, lib]);
  /* on the Signals tab, prefer a line that matches what the top signal is about */
  const activeQuote = useMemo(() => pickQuote(quotes, tab === "signals" ? tagForSignal(signals[0]) : null), [quotes, signals, tab, quoteNonce]);
  const extNow = (() => {
    const man = current.extension || {},
      ex = market && market.extension || null;
    const a21 = man.daysAbove21 !== undefined && man.daysAbove21 !== "" ? Number(man.daysAbove21) : ex ? ex.daysAbove21 : 0;
    const a30 = man.daysAbove30 !== undefined && man.daysAbove30 !== "" ? Number(man.daysAbove30) : ex ? ex.daysAbove30 : 0;
    const b21 = ex ? ex.daysBelow21 : 0,
      b30 = ex ? ex.daysBelow30 : 0;
    return a21 >= 25 || a30 >= 35 || b21 >= 25 || b30 >= 35;
  })();
  const rawBudget = budgetFor(live.regime !== "unset" ? live.regime : shownRegime, live.regime !== "unset" ? live.confidence : latest ? latest.confidence : 0, settings.maxRisk);
  /* scored the session and still took nothing — the discipline worth noticing */
  const todayTrades = enriched.filter(t => t.date === date);
  const noTradeStreak = useMemo(() => {
    const traded = new Set(trades.map(t => t.date));
    const scored = sessions.filter(x => x.regime !== "unset" && x.date <= date).sort((a, b) => b.date.localeCompare(a.date));
    let n = 0;
    for (const x of scored) {
      if (traded.has(x.date)) break;
      n++;
    }
    return n;
  }, [sessions, trades, date]);
  const readiness = useMemo(() => scoreReadiness(current.scores || {}, lib), [current, lib]);
  const dayStats = useMemo(() => {
    const st = stats(todayTrades.filter(t => t.r !== null));
    return {
      count: todayTrades.length,
      r: st.sumR || 0,
      pnl: st.pnl || 0
    };
  }, [todayTrades]);
  const limitHit = settings.maxTradesPerDay && dayStats.count >= settings.maxTradesPerDay || settings.maxDailyLossR && dayStats.r <= -Math.abs(settings.maxDailyLossR);
  let budget = extNow ? {
    ...rawBudget,
    risk: +(rawBudget.risk * 0.5).toFixed(2),
    note: rawBudget.note + " Halved again because the trend is extended past your 25 and 35 session limits."
  } : rawBudget;
  if (readiness && readiness.mult < 1) {
    budget = {
      ...budget,
      risk: +(budget.risk * readiness.mult).toFixed(2),
      trades: readiness.mult === 0 ? 0 : budget.trades,
      note: budget.note + (readiness.mult === 0 ? " Your own pre-trade check says this is not a trading day." : " Reduced because your pre-trade state came in under par.")
    };
  }
  const all = stats(enriched);
  const setScore = useCallback((cid, val) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.date === date);
      const base = idx >= 0 ? prev[idx] : {
        date,
        scores: {},
        note: ""
      };
      const scores = {
        ...base.scores,
        [cid]: val
      };
      const rec = {
        ...base,
        scores
      };
      const next = [...prev];
      if (idx >= 0) next[idx] = rec;else next.push(rec);
      return next.sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [date]);
  const applyMarket = m => {
    if (m && m.kind === "opening") {
      setMarket(prev => ({
        ...(prev || {}),
        opening: m.opening,
        openingAsOf: m.asOf,
        openingParams: m.params
      }));
      return;
    }
    setMarket(m);
    if (m && m.asOf) setDate(m.asOf);
    const target = m && m.asOf || date;
    if (!m || !m.suggestedScores) return;
    setSessions(prev => {
      const idx = prev.findIndex(s => s.date === target);
      const base = idx >= 0 ? prev[idx] : {
        date: target,
        scores: {},
        note: ""
      };
      /* older regime-data.json files used short keys */
      const LEGACY = {
        breadth: "breadth-vs-10-20-ema",
        ema: "10-20-ema-slope",
        close: "closing-behaviour",
        gap: "gap-behaviour",
        vol: "volume-activity",
        candles: "candle-conviction",
        sync: "index-sync",
        ft: "follow-through",
        sr: "support-resistance",
        areas: "trade-location",
        swings: "swing-structure",
        intraday: "intraday-character",
        news: "reaction-to-news",
        tf: "timeframe-agreement",
        traps: "trap-rate"
      };
      const clamp = {};
      Object.entries(m.suggestedScores).forEach(([k0, v]) => {
        const k = itemById(lib, "direction", k0) || itemById(lib, "clarity", k0) ? k0 : LEGACY[k0] || k0;
        const c = itemById(lib, "direction", k) || itemById(lib, "clarity", k);
        const n = c && c.opts ? c.opts.length : null;
        clamp[k] = n ? Math.max(0, Math.min(n - 1, v)) : v;
      });
      const scores = {
        ...base.scores,
        ...clamp
      };
      /* the script's 52-week counts are stored with the session, but never
         overwrite a figure typed in by hand */
      let breadth = base.breadth || {};
      const t = m.hiLo && m.hiLo.today;
      if (t) {
        breadth = {
          ...breadth,
          scriptNewHighs: t.highs,
          scriptNewLows: t.lows
        };
        if (breadth.newHighs === undefined || breadth.newHighs === "") breadth.newHighs = t.highs;
        if (breadth.newLows === undefined || breadth.newLows === "") breadth.newLows = t.lows;
      }
      const rec = {
        ...base,
        scores,
        breadth,
        extension: {
          ...(base.extension || {}),
          ...(m.extension ? {
            script: m.extension
          } : {})
        }
      };
      const next = [...prev];
      if (idx >= 0) next[idx] = rec;else next.push(rec);
      return next.sort((a, b) => a.date.localeCompare(b.date));
    });
  };
  const inspectBackup = text => {
    let d;
    try {
      d = JSON.parse(text);
    } catch (e) {
      setMsg("That file isn't valid JSON.");
      return;
    }
    if (!d || typeof d !== "object" || !Array.isArray(d.sessions) && !Array.isArray(d.trades)) {
      setMsg("That doesn't look like a full backup. Use the file from Export everything, not the trades CSV.");
      return;
    }
    const ss = Array.isArray(d.sessions) ? d.sessions : [];
    const tt = Array.isArray(d.trades) ? d.trades : [];
    const range = arr => {
      const ds = arr.map(x => x.date).filter(Boolean).sort();
      return ds.length ? `${ds[0]} to ${ds[ds.length - 1]}` : "no dates";
    };
    setPendingRestore({
      data: d,
      summary: {
        sessions: ss.length,
        sessionRange: range(ss),
        trades: tt.length,
        tradeRange: range(tt),
        library: d.library ? GROUPS.map(g => `${(d.library[g.key] || []).length} ${g.name.toLowerCase()}`).join(", ") : "not in this file",
        quotes: Array.isArray(d.quotes) ? d.quotes.length : 0,
        watch: Array.isArray(d.watch) ? d.watch.length : 0,
        capital: d.settings && d.settings.capital ? inr(d.settings.capital) : "not in this file",
        nowSessions: rawSessions.length,
        nowTrades: trades.length
      }
    });
  };
  const doRestore = () => {
    const d = pendingRestore.data;
    /* take a safety copy of what is about to be replaced */
    try {
      download(`before-restore-${today()}.json`, JSON.stringify({
        sessions: rawSessions,
        trades,
        settings,
        library: lib,
        quotes,
        watch
      }, null, 2), "application/json");
    } catch (e) {/* if the download is blocked, carry on — the restore still works */}
    const library = mergeLibrary(d.library || null);
    setLib(library);
    if (Array.isArray(d.sessions)) setSessions(d.sessions);
    if (Array.isArray(d.trades)) setTrades(d.trades.map(x => migrateTrade(x, library)));
    if (Array.isArray(d.quotes)) setQuotes(d.quotes);
    if (Array.isArray(d.watch)) setWatch(d.watch);
    if (d.settings) setSettings({
      ...d.settings,
      rates: d.settings.rates || DEFAULT_RATES,
      links: d.settings.links || DEFAULT_LINKS
    });
    setPendingRestore(null);
    setMsg("Restored. A copy of what was here before has been downloaded in case this wasn't what you wanted.");
  };
  const addWatch = () => {
    const sym = (wDraft.symbol || "").trim().toUpperCase();
    if (!sym) {
      setMsg("A symbol first.");
      return;
    }
    if (watch.some(w => w.symbol === sym)) {
      setMsg(`${sym} is already on the list.`);
      setWatchPick(sym);
      return;
    }
    setWatch(p => [...p, {
      id: uid(),
      symbol: sym,
      thesis: wDraft.thesis.trim(),
      added: today(),
      status: "Watching",
      obs: []
    }]);
    setWDraft({
      symbol: "",
      thesis: ""
    });
    setWatchPick(sym);
  };
  const patchWatch = (sym, p2) => setWatch(prev => prev.map(w => w.symbol === sym ? {
    ...w,
    ...p2
  } : w));
  const addObs = sym => {
    if (!obsDraft.text.trim()) {
      setMsg("Write what it did first.");
      return;
    }
    setWatch(prev => prev.map(w => w.symbol === sym ? {
      ...w,
      obs: [...(w.obs || []), {
        id: uid(),
        date: obsDraft.date,
        text: obsDraft.text.trim(),
        tells: obsDraft.tells
      }]
    } : w));
    setObsDraft({
      date: today(),
      text: "",
      tells: []
    });
    setMsg("Noted.");
  };
  const lastSeen = w => (w.obs || []).length ? [...w.obs].sort((a, b) => b.date.localeCompare(a.date))[0].date : w.added;
  const saveQuote = () => {
    if (!qDraft.text.trim()) {
      setMsg("Nothing to save yet — type the line first.");
      return;
    }
    setQuotes(prev => [...prev, {
      id: uid(),
      ...qDraft,
      text: qDraft.text.trim(),
      author: qDraft.author.trim()
    }]);
    setQDraft({
      text: "",
      author: "",
      tag: qDraft.tag
    });
    setMsg("Saved.");
  };
  const setDayLog = v => setSessions(prev => {
    const idx = prev.findIndex(s2 => s2.date === date);
    const base = idx >= 0 ? prev[idx] : {
      date,
      scores: {},
      note: ""
    };
    const next = [...prev];
    const rec = {
      ...base,
      dayLog: v
    };
    if (idx >= 0) next[idx] = rec;else next.push(rec);
    return next.sort((a, b) => a.date.localeCompare(b.date));
  });
  const setExtension = (field, value) => setSessions(prev => {
    const idx = prev.findIndex(s2 => s2.date === date);
    const base = idx >= 0 ? prev[idx] : {
      date,
      scores: {},
      note: ""
    };
    const rec = {
      ...base,
      extension: {
        ...(base.extension || {}),
        [field]: value
      }
    };
    const next = [...prev];
    if (idx >= 0) next[idx] = rec;else next.push(rec);
    return next.sort((a, b) => a.date.localeCompare(b.date));
  });
  const setBreadth = (field, value) => setSessions(prev => {
    const idx = prev.findIndex(s => s.date === date);
    const base = idx >= 0 ? prev[idx] : {
      date,
      scores: {},
      note: ""
    };
    const breadth = {
      ...(base.breadth || {}),
      [field]: value,
      source: "chartink"
    };
    let scores = base.scores;
    if (field === "above20") {
      const b = breadthBand(value);
      if (b) scores = {
        ...scores,
        [slug("Breadth vs 10 & 20 EMA")]: b.score
      };
    }
    if (field === "newHighs" || field === "newLows") {
      const hl = hiLoBand(breadth.newHighs, breadth.newLows);
      if (hl) scores = {
        ...scores,
        [slug("New highs vs new lows")]: hl.score
      };
    }
    const rec = {
      ...base,
      breadth,
      scores
    };
    const next = [...prev];
    if (idx >= 0) next[idx] = rec;else next.push(rec);
    return next.sort((a, b) => a.date.localeCompare(b.date));
  });
  const setNote = v => setSessions(prev => {
    const idx = prev.findIndex(s => s.date === date);
    if (idx < 0) return [...prev, {
      date,
      scores: {},
      note: v
    }].sort((a, b) => a.date.localeCompare(b.date));
    const next = [...prev];
    next[idx] = {
      ...next[idx],
      note: v
    };
    return next;
  });
  const saveTrade = () => {
    if (!draft.date || !draft.symbol) {
      setMsg("A trade needs a date and a symbol.");
      return;
    }
    if (!(draft.legs || []).some(l => l.kind === "in" && num(l.qty) && num(l.price))) {
      setMsg("The initial entry needs a price and a quantity.");
      return;
    }
    setTrades(prev => draft.id ? prev.map(t => t.id === draft.id ? draft : t) : [...prev, {
      ...draft,
      id: uid()
    }]);
    setDraft({
      ...blankTrade(),
      date: draft.date
    });
    setMsg(draft.id ? "Trade updated." : "Trade logged.");
  };
  const delTrade = id => setTrades(prev => prev.filter(t => t.id !== id));
  const editLeg = (i, patch) => setDraft(d => {
    const legs = [...(d.legs || [])];
    legs[i] = {
      ...legs[i],
      ...patch
    };
    return {
      ...d,
      legs
    };
  });
  const addLeg = kind => setDraft(d => {
    const legs = [...(d.legs || [])];
    const openQty = legs.filter(l => l.kind === "in").reduce((a, l) => a + num(l.qty), 0) - legs.filter(l => l.kind === "out").reduce((a, l) => a + num(l.qty), 0);
    legs.push({
      id: uid(),
      kind,
      date: today(),
      time: "",
      price: "",
      orders: 1,
      qty: kind === "out" && openQty > 0 ? String(openQty) : ""
    });
    return {
      ...d,
      legs
    };
  });
  const removeLeg = i => setDraft(d => ({
    ...d,
    legs: (d.legs || []).filter((_, j) => j !== i)
  }));
  const toggleList = (field, v) => setDraft(d => {
    const cur = d[field] || [];
    return {
      ...d,
      [field]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]
    };
  });
  const toggleTag = tag => setDraft(d => ({
    ...d,
    tags: d.tags.includes(tag) ? d.tags.filter(x => x !== tag) : [...d.tags, tag]
  }));
  const tapeDays = useMemo(() => {
    const tradeDays = new Set(trades.map(t => t.date));
    return [...sessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-90).map(s => ({
      ...s,
      traded: tradeDays.has(s.date)
    }));
  }, [sessions, trades]);
  const theme = settings.theme === "dark" ? "dark" : "light";
  const accent = (TAB_ACCENTS[tab] || TAB_ACCENTS.session)[theme];
  const density = DENSITY[settings.density] || DENSITY.normal;
  const style = {
    ...THEMES[theme](R),
    ...density,
    "--tape": R.tape,
    "--tab-accent": accent
  };
  if (!ready) return /*#__PURE__*/React.createElement("div", {
    className: "rd",
    style: style
  }, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "inner top"
  }, "Loading your desk…"));
  return /*#__PURE__*/React.createElement("div", {
    className: "rd",
    style: style
  }, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "inner"
  }, /*#__PURE__*/React.createElement("header", {
    className: "top"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Regime desk · ", date), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, ["compact", "normal", "large"].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    className: "tab" + ((settings.density || "normal") === d ? " on" : ""),
    onClick: () => setSettings({
      ...settings,
      density: d
    }),
    title: `${d} text`
  }, d === "compact" ? "A-" : d === "normal" ? "A" : "A+")), /*#__PURE__*/React.createElement("button", {
    className: "tab",
    onClick: () => setSettings({
      ...settings,
      theme: theme === "dark" ? "light" : "dark"
    })
  }, theme === "dark" ? "Light" : "Dark"))), /*#__PURE__*/React.createElement("h1", null, R.name), /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      opacity: .75
    }
  }, budget.trades || 0, " position", budget.trades === 1 ? "" : "s", " · ", budget.risk ? fmt(budget.risk) + "%" : "—", " each · ", todayTrades.length, " taken"), /*#__PURE__*/React.createElement("div", {
    className: "subline"
  }, live.complete || live.regime !== "unset" ? R.line : "Score the six clarity checks and seven directional checks below. The screen colour is the answer."), /*#__PURE__*/React.createElement("div", {
    className: "stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, live.regime === "unset" ? "—" : (live.trend100 > 0 ? "+" : "") + live.trend100), /*#__PURE__*/React.createElement("span", null, "Direction")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, live.regime === "unset" ? "—" : live.clarity100), /*#__PURE__*/React.createElement("span", null, "Clarity")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, live.regime === "unset" ? "—" : live.confidence), /*#__PURE__*/React.createElement("span", null, "Confidence")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, budget.trades || "—"), /*#__PURE__*/React.createElement("span", null, "Trade budget")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, budget.risk ? fmt(budget.risk) + "%" : "—"), /*#__PURE__*/React.createElement("span", null, "Risk each")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, todayTrades.length), /*#__PURE__*/React.createElement("span", null, "Taken today"))), tapeDays.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "tape",
    role: "list",
    "aria-label": "Regime history"
  }, tapeDays.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.date,
    role: "listitem",
    className: "blk" + (s.date === date ? " sel" : ""),
    onClick: () => {
      setDate(s.date);
      setTab("session");
    },
    title: `${s.date} · ${REGIMES[s.regime].name} · confidence ${s.confidence}`,
    style: {
      background: REGIMES[s.regime].tape,
      height: Math.max(28, s.confidence) + "%"
    }
  }, s.traded && /*#__PURE__*/React.createElement("span", {
    className: "dot"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "tapelegend"
  }, /*#__PURE__*/React.createElement("span", null, "Bar height = confidence"), /*#__PURE__*/React.createElement("span", null, "Dot = you traded"), /*#__PURE__*/React.createElement("span", null, "Click a bar to open that day"))), /*#__PURE__*/React.createElement("nav", {
    className: "tabs"
  }, [["session", "Session"], ["watchlist", `Watchlist${watch.length ? " · " + watch.length : ""}`], ["trades", "Trades"], ["confluence", "Confluence"], ["edge", "Edge"], ["signals", `Signals${signals.length ? " · " + signals.length : ""}`], ["library", "Library"], ["playbook", "Playbook"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: "tab" + (tab === k ? " on" : ""),
    onClick: () => setTab(k)
  }, l))), (settings.links || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "linkbar"
  }, (settings.links || []).filter(l => l.url).map(l => /*#__PURE__*/React.createElement("a", {
    key: l.id,
    className: "linkchip",
    href: l.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, l.label || l.url, " ↗"))), activeQuote && /*#__PURE__*/React.createElement("div", {
    className: "quote"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qtext"
  }, activeQuote.text), activeQuote.author && /*#__PURE__*/React.createElement("span", {
    className: "qwho"
  }, "— ", activeQuote.author), /*#__PURE__*/React.createElement("button", {
    className: "qmore",
    onClick: () => setQuoteNonce(n => n + 1),
    title: "Another one"
  }, "↻"))), msg && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: "10px 18px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "empty"
  }, msg)), tab === "session" && /*#__PURE__*/React.createElement("div", {
    className: "sessionwrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "notescol"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card sticky"
  }, /*#__PURE__*/React.createElement("h2", null, "Day log"), /*#__PURE__*/React.createElement("textarea", {
    rows: 20,
    value: current.dayLog || "",
    onChange: e => setDayLog(e.target.value),
    placeholder: "Anything you notice as the day goes. What the tape is doing, what you nearly did, what you're waiting for."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      const now = new Date();
      const stamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} — `;
      setDayLog((current.dayLog ? current.dayLog.replace(/\s*$/, "") + "\n" : "") + stamp);
    }
  }, "Stamp the time")), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Kept with the session, so it sits alongside the regime you scored and the trades you took. The entries you write at 11am are worth more than the ones you reconstruct at 6pm.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Earlier notes"), /*#__PURE__*/React.createElement("input", {
    value: logSearch,
    placeholder: "Search every day log and session note",
    onChange: e => setLogSearch(e.target.value)
  }), (() => {
    const q = logSearch.trim().toLowerCase();
    const hits = sessions.filter(x => x.dayLog && x.dayLog.trim() || x.note && x.note.trim()).filter(x => !q || ((x.dayLog || "") + " " + (x.note || "")).toLowerCase().includes(q) || x.date.includes(q)).sort((a, b) => b.date.localeCompare(a.date));
    if (!hits.length) return /*#__PURE__*/React.createElement("p", {
      className: "empty",
      style: {
        marginTop: 12
      }
    }, q ? "Nothing matches that." : "Nothing written yet. Everything you type above is kept with its session and shows up here, newest first.");
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        maxHeight: 460,
        overflowY: "auto"
      }
    }, hits.slice(0, 120).map(x => {
      const body = (x.dayLog || x.note || "").trim();
      return /*#__PURE__*/React.createElement("div", {
        key: x.date,
        onClick: () => setDate(x.date),
        style: {
          borderTop: "1px solid var(--rule)",
          padding: "9px 0",
          cursor: "pointer"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "baseline"
        }
      }, /*#__PURE__*/React.createElement("b", {
        style: {
          fontSize: "var(--fs-sm)",
          color: x.date === date ? "var(--tab-accent)" : "inherit"
        }
      }, x.date), /*#__PURE__*/React.createElement("span", {
        className: "pill",
        style: {
          borderColor: REGIMES[x.regime].tape,
          color: REGIMES[x.regime].ink
        }
      }, REGIMES[x.regime].short)), /*#__PURE__*/React.createElement("div", {
        className: "ch",
        style: {
          marginTop: 3
        }
      }, body.length > 160 ? body.slice(0, 160) + "…" : body));
    }), hits.length > 120 && /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 8
      }
    }, "Showing 120 of ", hits.length, "."));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Click any entry to open that session — the scorecard, the breadth figures and the trades from that day come with it."))), /*#__PURE__*/React.createElement("div", {
    className: "maincol"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Which session"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Date"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Jump"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => setDate(today())
  }, "Today")), /*#__PURE__*/React.createElement(Field, {
    label: "From regime_fetch.py"
  }, /*#__PURE__*/React.createElement("label", {
    className: "btn ghost",
    style: {
      display: "block",
      textAlign: "center"
    }
  }, "Import market data", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json,application/json",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const m = JSON.parse(String(rd.result));
          applyMarket(m);
          setMsg(m.kind === "opening" ? `Opening scan loaded — ${(m.opening || []).length} names showing activity.` : `Loaded ${m.asOf} — ${Object.keys(m.suggestedScores || {}).length} checks filled, the rest are yours.`);
        } catch (err) {
          setMsg("That file isn't the JSON the script writes.");
        }
      };
      rd.readAsText(f);
      e.target.value = "";
    }
  }))))), limitHit && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "alarm"
  }, /*#__PURE__*/React.createElement("b", null, "Stop for today"), /*#__PURE__*/React.createElement("p", null, dayStats.count >= settings.maxTradesPerDay ? `${dayStats.count} trades taken against your limit of ${settings.maxTradesPerDay}.` : `Down ${fmt(Math.abs(dayStats.r), 2)}R against your daily limit of ${fmt(settings.maxDailyLossR, 1)}R.`, " ", "You set this number when you were calm and nothing was at stake. Close the platform. The market runs again tomorrow and the setups you'd take now are the ones you'd normally pass on."))), noTradeStreak >= 2 && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sig good",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("b", null, noTradeStreak, " scored sessions, no trades taken"), /*#__PURE__*/React.createElement("p", null, "You've done the work each day and passed anyway. That's the hardest habit in this business and the one nobody congratulates you for, so: well done. Sitting out a market that isn't offering your setups is a decision, and it's the one that keeps the capital intact for when it does."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Before you trade · your own state"), /*#__PURE__*/React.createElement("div", {
    className: "critgrid"
  }, activeChecks(lib, "readiness").map(c => {
    const v = current.scores?.[c.id];
    return /*#__PURE__*/React.createElement("div", {
      className: "crit",
      key: c.id
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "cl"
    }, c.label), /*#__PURE__*/React.createElement("div", {
      className: "ch"
    }, c.hint), v !== undefined && v !== null && /*#__PURE__*/React.createElement("div", {
      className: "chosen"
    }, c.opts[v])), /*#__PURE__*/React.createElement(Seg, {
      n: (c.opts || []).length,
      value: v ?? null,
      labels: c.opts,
      kind: "clarity",
      onChange: x => setScore(c.id, x)
    }));
  })), readiness && /*#__PURE__*/React.createElement("div", {
    className: readiness.mult === 0 ? "alarm" : "sig " + (readiness.mult === 1 ? "good" : "med"),
    style: {
      marginTop: 14,
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("b", null, readiness.band, " · ", readiness.pct), /*#__PURE__*/React.createElement("p", null, readiness.mult === 1 ? "Nothing here is against you. Trade the plan." : readiness.mult === 0 ? "Two or more of these are at the floor. Whatever the charts are offering today, you are not the person to take it — the losses that come from a bad state are the ones that don't fit any pattern afterwards." : "Workable, but not your best. Risk is reduced below.", readiness.worst.length > 0 && ` Weakest: ${readiness.worst.join(", ")}.`))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Breadth from Chartink"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "% above 10 EMA"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: current.breadth?.above10 ?? "",
    onChange: e => setBreadth("above10", e.target.value),
    placeholder: "e.g. 46"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "% above 20 EMA — drives the band"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: current.breadth?.above20 ?? "",
    onChange: e => setBreadth("above20", e.target.value),
    placeholder: "e.g. 52"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Universe scanned"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: current.breadth?.universe ?? "",
    onChange: e => setBreadth("universe", e.target.value),
    placeholder: "500"
  })), /*#__PURE__*/React.createElement(Field, {
    label: `52-week new highs${current.breadth?.scriptNewHighs !== undefined ? " · script says " + current.breadth.scriptNewHighs : ""}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: current.breadth?.newHighs ?? "",
    onChange: e => setBreadth("newHighs", e.target.value),
    placeholder: "e.g. 84"
  })), /*#__PURE__*/React.createElement(Field, {
    label: `52-week new lows${current.breadth?.scriptNewLows !== undefined ? " · script says " + current.breadth.scriptNewLows : ""}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: current.breadth?.newLows ?? "",
    onChange: e => setBreadth("newLows", e.target.value),
    placeholder: "e.g. 21"
  }))), (() => {
    const b = breadthBand(current.breadth?.above20);
    if (!b) return /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Run your two Chartink scans, type the percentages here, and the breadth check on the scorecard sets itself. The numbers are stored with the session, so a year from now you can ask what your results looked like in each band.");
    return /*#__PURE__*/React.createElement("div", {
      className: "sig",
      style: {
        marginTop: 12,
        borderLeftColor: b.level === "good" ? "#0B5C3F" : "#C99A1E"
      }
    }, /*#__PURE__*/React.createElement("b", null, b.label, " · ", fmt(Number(current.breadth.above20), 1), "% above the 20 EMA"), /*#__PURE__*/React.createElement("p", null, b.note));
  })(), (() => {
    const hl = hiLoBand(current.breadth?.newHighs, current.breadth?.newLows);
    if (!hl) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "sig",
      style: {
        marginTop: 10,
        borderLeftColor: hl.score >= 3 ? "#0B5C3F" : hl.score <= 1 ? "#B3282F" : "#C99A1E"
      }
    }, /*#__PURE__*/React.createElement("b", null, hl.label, " · ", fmt(hl.ratio * 100, 0), "% of the extremes are highs"), /*#__PURE__*/React.createElement("p", null, hl.note));
  })(), (() => {
    const hist = sessions.filter(x => x.breadth && x.breadth.above20 !== "" && x.breadth.above20 !== undefined).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
    if (!hist.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Recent readings"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Date", "10 EMA", "20 EMA", "Highs / lows", "Band", "Regime"],
      rows: hist.map(x => {
        const hl2 = hiLoBand(x.breadth.newHighs, x.breadth.newLows);
        return [x.date, x.breadth.above10 ? fmt(Number(x.breadth.above10), 1) + "%" : "—", fmt(Number(x.breadth.above20), 1) + "%", hl2 ? `${x.breadth.newHighs} / ${x.breadth.newLows}` : "—", (breadthBand(x.breadth.above20) || {}).label || "—", REGIMES[x.regime].name];
      })
    }));
  })()), (() => {
    const ex = market && market.extension || null;
    const man = current.extension || {};
    const a21 = man.daysAbove21 !== undefined && man.daysAbove21 !== "" ? Number(man.daysAbove21) : ex ? ex.daysAbove21 : null;
    const a30 = man.daysAbove30 !== undefined && man.daysAbove30 !== "" ? Number(man.daysAbove30) : ex ? ex.daysAbove30 : null;
    const b21 = ex ? ex.daysBelow21 : 0,
      b30 = ex ? ex.daysBelow30 : 0;
    if (a21 === null && !ex) return null;
    const up = a21 >= 25 || a30 >= 35;
    const down = b21 >= 25 || b30 >= 35;
    return /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Trend extension · Nifty against its 21 and 30 EMA"), (up || down) && /*#__PURE__*/React.createElement("div", {
      className: "alarm"
    }, /*#__PURE__*/React.createElement("b", null, up ? "The uptrend is extended" : "The downtrend is extended"), /*#__PURE__*/React.createElement("p", null, up ? `${a21} sessions above the 21 EMA and ${a30} above the 30.` : `${b21} sessions below the 21 EMA and ${b30} below the 30.`, " ", "Past your own thresholds of 25 and 35. New position size is halved below — a pullback is overdue, and entries taken this far into a run carry the worst reward for the risk.")), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Sessions above the 21 EMA · limit 25"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: man.daysAbove21 ?? (ex ? ex.daysAbove21 : ""),
      onChange: e => setExtension("daysAbove21", e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      className: "bar",
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: Math.min(100, (a21 || 0) / 25 * 100) + "%"
      }
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Sessions above the 30 EMA · limit 35"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: man.daysAbove30 ?? (ex ? ex.daysAbove30 : ""),
      onChange: e => setExtension("daysAbove30", e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      className: "bar",
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: Math.min(100, (a30 || 0) / 35 * 100) + "%"
      }
    }))), ex && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Distance from the EMAs"), /*#__PURE__*/React.createElement(Table, {
      cols: ["", ""],
      rows: [["From the 21 EMA", rcell(ex.distancePct21, 2)], ["From the 30 EMA", rcell(ex.distancePct30, 2)], ["Below the 21 EMA", ex.daysBelow21 + " sessions"]]
    }))), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Counted from the daily closes by the script, so it fills itself. Type over either number if you'd rather count it your own way — the stored figure wins and stays with the session."));
  })(), market && market.hiLo && market.hiLo.today && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "52-week highs and lows"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Table, {
    cols: ["", ""],
    rows: [["New highs", market.hiLo.today.highs], ["New lows", market.hiLo.today.lows], ["Counted", market.hiLo.today.counted], ...(market.hiLo.trend ? [["Highs, 5-day average", `${fmt(market.hiLo.trend.avgHighs5, 1)} · ${market.hiLo.trend.highsExpanding ? "expanding" : "contracting"}`], ["Lows, 5-day average", `${fmt(market.hiLo.trend.avgLows5, 1)} · ${market.hiLo.trend.lowsExpanding ? "expanding" : "contracting"}`]] : []), ...(market.hiLo.nearExtremes && market.hiLo.nearExtremes.counted ? [["Within 5% of the 52w high", fmt(market.hiLo.nearExtremes.pctWithin5pctOfHigh, 1) + "%"], ["Within 5% of the 52w low", fmt(market.hiLo.nearExtremes.pctWithin5pctOfLow, 1) + "%"]] : [])]
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Last ten sessions"), (() => {
    const h = (market.hiLo.history || []).slice(-10);
    const peak = Math.max(1, ...h.map(x => Math.max(x.highs, x.lows)));
    return /*#__PURE__*/React.createElement("div", null, h.map(x => /*#__PURE__*/React.createElement("div", {
      key: x.date,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "var(--muted)",
        width: 74
      }
    }, x.date.slice(5)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        width: 54,
        textAlign: "right"
      }
    }, x.highs, " / ", x.lows), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        display: "flex",
        height: 8
      }
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: x.highs / peak * 50 + "%",
        background: "#1FA971"
      }
    }), /*#__PURE__*/React.createElement("i", {
      style: {
        width: x.lows / peak * 50 + "%",
        background: "#C4383A"
      }
    })))));
  })())), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "The level matters less than the direction of travel. New highs expanding while the index rises is a healthy advance; new highs shrinking while the index still rises is the divergence that usually shows up first, well before EMA breadth rolls over. The share sitting within 5% of a 52-week high is the softer version of the same reading and moves earlier still.")), market && market.themes && market.themes.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Your themes · strongest five of ", market.themes.length), /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["#", "Theme", "RS", "Above both EMAs", "Names", "Leaders", ""].map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, market.themes.slice(0, 5).map((x, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: x.theme
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: i < 3 && x.rs !== null ? "var(--tab-accent)" : "inherit"
    }
  }, x.rs === null ? "—" : i + 1)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, x.theme)), /*#__PURE__*/React.createElement("td", null, x.rs === null ? /*#__PURE__*/React.createElement("span", {
    className: "ch"
  }, x.note) : rcell(x.rs, 2)), /*#__PURE__*/React.createElement("td", {
    className: x.pctAboveBoth >= 60 ? "pos" : x.pctAboveBoth <= 25 ? "neg" : ""
  }, x.rs === null ? "—" : fmt(x.pctAboveBoth, 0) + "%"), /*#__PURE__*/React.createElement("td", null, x.members, (x.missing || []).length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "pill",
    title: `Not found: ${x.missing.join(", ")}`
  }, " ", x.missing.length, " missing")), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "left"
    }
  }, (x.leaders || []).slice(0, 3).map(l => l.symbol).join(", ")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => setOpenTheme(openTheme === x.theme ? null : x.theme)
  }, openTheme === x.theme ? "Hide" : "Stocks"))), openTheme === x.theme && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    style: {
      background: "var(--link-bg)",
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["Stock", "RS", "20-day", "60-day", "Close", "vs EMAs", ""].map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, (x.leaders || []).map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.symbol
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, l.symbol)), /*#__PURE__*/React.createElement("td", null, rcell(l.rs, 2)), /*#__PURE__*/React.createElement("td", null, rcell(l.ret20, 2)), /*#__PURE__*/React.createElement("td", null, rcell(l.ret60, 2)), /*#__PURE__*/React.createElement("td", null, fmt(l.close, 2)), /*#__PURE__*/React.createElement("td", {
    className: l.aboveBoth ? "pos" : "neg"
  }, l.aboveBoth ? "above both" : "not above"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => {
      const st = market.stocks && market.stocks[l.symbol];
      setDraft({
        ...blankTrade(),
        date,
        symbol: l.symbol,
        dir: scanSide,
        sector: st ? st.sectorRating : 1,
        stock: st ? st.stockRating : 1
      });
      setTab("trades");
    }
  }, "Log")))), (x.leaders || []).length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ch"
  }, "Nothing to show — this data file predates themes, or none of the symbols resolved. Re-run the script and import again."))))))))))))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Scored exactly like the industries, but from baskets you define in ", /*#__PURE__*/React.createElement("b", null, "themes.txt"), " next to the script. No exchange classifies Cables or Data Centre, so these only exist because you wrote them down. Names outside the Nifty 500 are pulled in too, and anything the script couldn't find is flagged so you can correct the symbol.")), market && market.sectors && market.sectors.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Industries by relative strength · ", showAllSectors ? "all " + market.sectors.length : "strongest five of " + market.sectors.length), /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["#", "Industry", "RS", "Above both EMAs", "Members", "Leaders", ""].map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, (showAllSectors ? market.sectors : market.sectors.slice(0, 5)).map((x, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: x.sector
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: i < 3 ? "var(--tab-accent)" : "inherit"
    }
  }, i + 1)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, x.sector)), /*#__PURE__*/React.createElement("td", null, rcell(x.rs, 2)), /*#__PURE__*/React.createElement("td", {
    className: x.pctAboveBoth >= 60 ? "pos" : x.pctAboveBoth <= 25 ? "neg" : ""
  }, fmt(x.pctAboveBoth, 0), "%"), /*#__PURE__*/React.createElement("td", null, x.members), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "left"
    }
  }, membersOf(market, x.sector, x.leaders).slice(0, 3).map(l => l.symbol).join(", ")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => setOpenSector(openSector === x.sector ? null : x.sector)
  }, openSector === x.sector ? "Hide" : "Stocks"))), openSector === x.sector && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    style: {
      background: "var(--link-bg)",
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["Stock", "RS", "20-day", "60-day", "Close", "vs EMAs", ""].map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, membersOf(market, x.sector, x.leaders).map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.symbol
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, l.symbol)), /*#__PURE__*/React.createElement("td", null, rcell(l.rs, 2)), /*#__PURE__*/React.createElement("td", null, rcell(l.ret20, 2)), /*#__PURE__*/React.createElement("td", null, rcell(l.ret60, 2)), /*#__PURE__*/React.createElement("td", null, fmt(l.close, 2)), /*#__PURE__*/React.createElement("td", {
    className: l.aboveBoth ? "pos" : "neg"
  }, l.aboveBoth ? "above both" : "not above"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => {
      const st = market.stocks && market.stocks[l.symbol];
      setDraft({
        ...blankTrade(),
        date,
        symbol: l.symbol,
        dir: scanSide,
        sector: st ? st.sectorRating : x.rating,
        stock: st ? st.stockRating : 1
      });
      setTab("trades");
    }
  }, "Log")))), membersOf(market, x.sector, x.leaders).length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ch"
  }, "No member list in this data file. Re-run the script and import again."))))))))))))), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    style: {
      marginTop: 12
    },
    onClick: () => setShowAllSectors(!showAllSectors)
  }, showAllSectors ? "Show only the strongest five" : `Show all ${market.sectors.length}, weakest included`), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Relative strength is measured against the median of the whole universe, not the Nifty 50 — strong here means strong against the market you actually trade. RS blends the 20-day return at 60% and the 60-day at 40%. Click ", /*#__PURE__*/React.createElement("b", null, "Stocks"), " on any industry to see its members ranked, strongest first.", market.benchmark && /*#__PURE__*/React.createElement(React.Fragment, null, " The universe median moved ", rcell(market.benchmark.median20, 2), "% over twenty days against the Nifty's ", rcell(market.benchmark.nifty20, 2), "%."))), market && market.opening && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      borderTop: "4px solid var(--regime-ink)"
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Opening five minutes · ", market.openingAsOf, " · ", market.opening.length, " names"), market.opening.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Nothing crossed the threshold. A quiet open is information too.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ch"
  }, "Rank for"), ["Long", "Short"].map(sd => /*#__PURE__*/React.createElement("button", {
    key: sd,
    className: "chip" + (scanSide === sd ? " on" : ""),
    onClick: () => setScanSide(sd)
  }, sd))), /*#__PURE__*/React.createElement(SortTable, {
    data: withRanks(market.opening, scanSide),
    filterKey: "sector",
    filterLabel: "Sector",
    initial: {
      key: "rank",
      dir: "asc"
    },
    limit: 40,
    cols: [{
      key: "rank",
      label: "#",
      get: r => r.rank,
      cell: r => /*#__PURE__*/React.createElement("b", {
        style: {
          color: r.rank <= 3 ? "var(--tab-accent)" : "inherit"
        }
      }, r.rank)
    }, {
      key: "symbol",
      label: "Symbol",
      get: r => r.symbol,
      cell: r => /*#__PURE__*/React.createElement("b", null, r.symbol)
    }, {
      key: "sector",
      label: "Sector",
      get: r => r.sector || "",
      cell: r => /*#__PURE__*/React.createElement("span", {
        style: {
          maxWidth: 150,
          display: "inline-block"
        }
      }, r.sector)
    }, {
      key: "pctOfADV",
      label: "% of ADV",
      get: r => r.pctOfADV,
      cell: r => /*#__PURE__*/React.createElement("span", {
        className: r.pctOfADV >= 20 ? "pos" : ""
      }, fmt(r.pctOfADV, 1), "%")
    }, {
      key: "rvolOwn",
      label: "vs own open",
      get: r => r.rvolOwn,
      cell: r => r.rvolOwn ? /*#__PURE__*/React.createElement("span", {
        className: r.rvolOwn >= 2 ? "pos" : ""
      }, fmt(r.rvolOwn, 1), "x") : /*#__PURE__*/React.createElement("span", {
        title: `only ${r.historyUsed || 0} usable past opens`
      }, "—")
    }, {
      key: "openBar",
      label: "Bar",
      get: r => r.openBar || "",
      cell: r => r.openBar || "—"
    }, {
      key: "changeInCandlePct",
      label: "Candle",
      get: r => r.changeInCandlePct,
      cell: r => rcell(r.changeInCandlePct, 2)
    }, {
      key: "closePosition",
      label: "Close in range",
      get: r => r.closePosition,
      cell: r => /*#__PURE__*/React.createElement("span", {
        className: r.closePosition >= 0.7 ? "pos" : r.closePosition <= 0.3 ? "neg" : ""
      }, fmt(r.closePosition * 100, 0), "%")
    }, {
      key: "stockRating",
      label: "Sector / stock",
      get: r => r.stockRating,
      cell: r => r.sectorRating === undefined || r.sectorRating === null ? "—" : `${r.sectorRating} / ${r.stockRating}`
    }, {
      key: "opp",
      label: "Score",
      get: r => r.opp,
      cell: r => r.opp
    }, {
      key: "log",
      label: "",
      noSort: true,
      cell: r => /*#__PURE__*/React.createElement("button", {
        className: "chip",
        onClick: () => {
          setDraft({
            ...blankTrade(),
            date,
            symbol: r.symbol,
            type: "Intraday",
            dir: scanSide,
            sector: r.sectorRating ?? 1,
            stock: r.stockRating ?? 1
          });
          setTab("trades");
        }
      }, "Log")
    }]
  }), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("b", null, "The rank"), " blends five things: where the candle closed in its range (30%), the direction of the candle (15%), participation against a normal day (20%), the multiple against the stock's own usual open (20%), and the sector and stock ratings (15%). Switch to Short and every one of them inverts, so a name closing on its low in a weak sector rises to the top instead. It's a sorting aid, not a verdict — it cannot see whether the move started at a level, which is the thing that decides the trade.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "% of ADV"), " is the opening candle's volume against the stock's average daily volume over twenty sessions — five minutes doing a fifth of a normal day is real urgency. ", /*#__PURE__*/React.createElement("b", null, "vs own open"), " compares it to that stock's own median opening candle, which matters because some names always open heavy; a 20% reading at 1.1x its own normal is just a liquid stock, while 2.5x its own normal is today being different. Read both columns together, and the close-in-range last."))), market && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Market data · as of ", market.asOf, market.asOf !== date ? " — you are looking at another day" : ""), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Table, {
    cols: ["Breadth", ""],
    rows: [["Above both 10 & 20 EMA", fmt(market.breadth.pctAboveBoth, 1) + "%"], ["Below both", fmt(market.breadth.pctBelowBoth, 1) + "%"], ["Universe", market.breadth.universe], ...(market.chartink ? [["Breakouts / breakdowns", `${market.chartink.breakouts} / ${market.chartink.breakdowns}`]] : [])]
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Leading sectors"), /*#__PURE__*/React.createElement(Table, {
    cols: ["", "RS", "Above both"],
    rows: (market.sectors || []).slice(0, 4).map(x => [x.sector, rcell(x.rs), fmt(x.pctAboveBoth, 0) + "%"])
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Lagging sectors"), /*#__PURE__*/React.createElement(Table, {
    cols: ["", "RS", "Above both"],
    rows: (market.sectors || []).slice(-4).map(x => [x.sector, rcell(x.rs), fmt(x.pctAboveBoth, 0) + "%"])
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Filled automatically: ", Object.keys(market.suggestedScores || {}).join(", "), ". Everything else on the scorecard is a judgement the data can't make for you — override any of the imported values if your eyes disagree.")), /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Direction — seven checks, −2 to +2"), /*#__PURE__*/React.createElement("div", {
    className: "critgrid"
  }, activeChecks(lib, "direction").map(c => {
    const v = current.scores?.[c.id];
    const n = (c.opts || []).length;
    return /*#__PURE__*/React.createElement("div", {
      className: "crit",
      key: c.id
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "cl"
    }, c.label, Number(c.weight) !== 1 && /*#__PURE__*/React.createElement("span", {
      className: "pill",
      style: {
        marginLeft: 6
      }
    }, "x", c.weight)), /*#__PURE__*/React.createElement("div", {
      className: "ch"
    }, c.hint), v !== undefined && v !== null && /*#__PURE__*/React.createElement("div", {
      className: "chosen"
    }, c.opts[v])), /*#__PURE__*/React.createElement(Seg, {
      n: n,
      value: v ?? null,
      labels: c.opts,
      kind: "direction",
      onChange: x => setScore(c.id, x)
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Clarity — is the market tradeable at all"), /*#__PURE__*/React.createElement("div", {
    className: "critgrid"
  }, activeChecks(lib, "clarity").map(c => {
    const v = current.scores?.[c.id];
    const n = (c.opts || []).length;
    return /*#__PURE__*/React.createElement("div", {
      className: "crit",
      key: c.id
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "cl"
    }, c.label, Number(c.weight) !== 1 && /*#__PURE__*/React.createElement("span", {
      className: "pill",
      style: {
        marginLeft: 6
      }
    }, "x", c.weight)), /*#__PURE__*/React.createElement("div", {
      className: "ch"
    }, c.hint), v !== undefined && v !== null && /*#__PURE__*/React.createElement("div", {
      className: "chosen"
    }, c.opts[v])), /*#__PURE__*/React.createElement(Seg, {
      n: n,
      value: v ?? null,
      labels: c.opts,
      kind: "clarity",
      onChange: x => setScore(c.id, x)
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Clarity gates everything"), /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: Math.max(2, live.clarity100) + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 6
    }
  }, "Below 45 the day is scored choppy no matter how strong the direction reads. A market can fall hard and still be untradeable.")))), /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Today's limits"), /*#__PURE__*/React.createElement(Table, {
    cols: ["", "Value"],
    rows: [["Regime", REGIMES[live.regime !== "unset" ? live.regime : shownRegime].name], ["Max positions", budget.trades || "—"], ["Risk per position", budget.risk ? fmt(budget.risk) + "% (" + inr(settings.capital * budget.risk / 100) + ")" : "—"], ["Already taken", todayTrades.length], ["Left in budget", budget.trades ? Math.max(0, budget.trades - todayTrades.length) : "—"], ["Day's R so far", rcell(stats(todayTrades).sumR, 2)]]
  }), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, budget.note)), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "How to trade this regime"), /*#__PURE__*/React.createElement("ul", {
    className: "rules"
  }, RULES[live.regime !== "unset" ? live.regime : shownRegime].map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, r))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Session note"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    value: current.note || "",
    onChange: e => setNote(e.target.value),
    placeholder: "What the tape actually did, not what you hoped."
  })))))), tab === "watchlist" && (() => {
    const sorted = [...watch].sort((a, b) => lastSeen(b).localeCompare(lastSeen(a)));
    const current2 = watch.find(w => w.symbol === watchPick) || null;
    const mk = current2 && market && market.stocks ? market.stocks[current2.symbol] : null;
    const recentTells = current2 ? Array.from(new Set((current2.obs || []).filter(o => (new Date(today()) - new Date(o.date)) / 864e5 <= 45).flatMap(o => o.tells || []))) : [];
    return /*#__PURE__*/React.createElement("div", {
      className: "sessionwrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "notescol"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Add a name"), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: wDraft.symbol,
      placeholder: "SYMBOL",
      onChange: e => setWDraft({
        ...wDraft,
        symbol: e.target.value.toUpperCase()
      })
    }), /*#__PURE__*/React.createElement("input", {
      value: wDraft.thesis,
      placeholder: "Why it's worth watching",
      onChange: e => setWDraft({
        ...wDraft,
        thesis: e.target.value
      })
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: addWatch
    }, "Add to the list"))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, watch.length, " on the list"), watch.length === 0 && /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "Nothing yet. Add the names you're following and write down what they do — the gaps, the results, how they behave on a bad day for the market. After a few weeks the list tells you which ones keep passing their tests."), sorted.map(w => /*#__PURE__*/React.createElement("div", {
      key: w.id,
      onClick: () => setWatchPick(w.symbol),
      style: {
        padding: "9px 0",
        borderBottom: "1px solid var(--rule)",
        cursor: "pointer",
        opacity: w.status === "Dropped" ? 0.45 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        color: watchPick === w.symbol ? "var(--tab-accent)" : "inherit"
      }
    }, w.symbol), /*#__PURE__*/React.createElement("span", {
      className: "ch"
    }, (w.obs || []).length, " note", (w.obs || []).length === 1 ? "" : "s")), /*#__PURE__*/React.createElement("div", {
      className: "ch"
    }, w.status, " · last ", lastSeen(w)))))), /*#__PURE__*/React.createElement("div", {
      className: "maincol"
    }, !current2 ? /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Pick a name"), /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "Choose something from the list to read its history and add today's observation.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, current2.symbol, " · watched since ", current2.added), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gridTemplateColumns: "2fr 1fr auto",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Why you're watching it"), /*#__PURE__*/React.createElement("input", {
      value: current2.thesis || "",
      onChange: e => patchWatch(current2.symbol, {
        thesis: e.target.value
      })
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Status"), /*#__PURE__*/React.createElement("select", {
      value: current2.status,
      onChange: e => patchWatch(current2.symbol, {
        status: e.target.value
      })
    }, WATCH_STATUS.map(x => /*#__PURE__*/React.createElement("option", {
      key: x
    }, x)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "\xA0"), /*#__PURE__*/React.createElement("button", {
      className: "chip",
      onClick: () => {
        if (confirm(`Remove ${current2.symbol} and its ${(current2.obs || []).length} notes?`)) {
          setWatch(p => p.filter(x => x.symbol !== current2.symbol));
          setWatchPick(null);
        }
      }
    }, "Remove"))), mk && /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, mk.sector, " · sector ranked ", mk.sectorRank, " · RS ", mk.rs > 0 ? "+" : "", fmt(mk.rs), " ·", " ", fmt(mk.percentileInSector, 0), "th percentile among its brothers ·", " ", mk.aboveBoth ? "above both EMAs" : "not above both EMAs"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: () => {
        setDraft({
          ...blankTrade(),
          date,
          symbol: current2.symbol,
          dir: scanSide,
          sector: mk ? mk.sectorRating : 1,
          stock: mk ? mk.stockRating : 1,
          behav: recentTells.filter(id => itemById(lib, "behaviour", id)),
          tech: recentTells.filter(id => itemById(lib, "tech", id)),
          notes: current2.thesis || ""
        });
        patchWatch(current2.symbol, {
          status: "Traded"
        });
        setTab("trades");
      }
    }, "Everything lines up — start a trade"), recentTells.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 8
      }
    }, "Carries ", recentTells.length, " tell", recentTells.length === 1 ? "" : "s", " you've observed in the last 45 days straight onto the trade form."))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "What it did"), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gridTemplateColumns: "150px 1fr",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Date"), /*#__PURE__*/React.createElement("input", {
      type: "date",
      value: obsDraft.date,
      onChange: e => setObsDraft({
        ...obsDraft,
        date: e.target.value
      })
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "What happened"), /*#__PURE__*/React.createElement("input", {
      value: obsDraft.text,
      placeholder: "Gapped down 3% on the block deal, bought back the whole gap by 10:30",
      onChange: e => setObsDraft({
        ...obsDraft,
        text: e.target.value
      })
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Tag it with the tells it showed"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        flexWrap: "wrap"
      }
    }, [...activeTells(lib, "behaviour", "Long"), ...activeTells(lib, "behaviour", "Short"), ...activeTells(lib, "tech", "Long"), ...activeTells(lib, "tech", "Short")].filter((x, i, arr) => arr.findIndex(y => y.id === x.id) === i).map(x => /*#__PURE__*/React.createElement("button", {
      key: x.id,
      className: "chip" + (obsDraft.tells.includes(x.id) ? " on" : ""),
      onClick: () => setObsDraft({
        ...obsDraft,
        tells: obsDraft.tells.includes(x.id) ? obsDraft.tells.filter(y => y !== x.id) : [...obsDraft.tells, x.id]
      })
    }, x.label)))), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      style: {
        marginTop: 12
      },
      onClick: () => addObs(current2.symbol)
    }, "Save the note"), (current2.obs || []).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18
      }
    }, [...current2.obs].sort((a, b) => b.date.localeCompare(a.date)).map(o => /*#__PURE__*/React.createElement("div", {
      key: o.id,
      style: {
        borderTop: "1px solid var(--rule)",
        padding: "10px 0"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        fontSize: "var(--fs-sm)"
      }
    }, o.date), /*#__PURE__*/React.createElement("button", {
      className: "chip",
      onClick: () => patchWatch(current2.symbol, {
        obs: current2.obs.filter(x => x.id !== o.id)
      })
    }, "Delete")), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 4
      }
    }, o.text), (o.tells || []).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        marginTop: 6
      }
    }, o.tells.map(id => /*#__PURE__*/React.createElement("span", {
      key: id,
      className: "pill"
    }, labelOf(lib, itemById(lib, "behaviour", id) ? "behaviour" : "tech", id)))))))))));
  })(), tab === "trades" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, draft.id ? "Edit trade" : "Log a trade"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Date"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: draft.date,
    onChange: e => setDraft({
      ...draft,
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Symbol"
  }, /*#__PURE__*/React.createElement("input", {
    value: draft.symbol,
    onChange: e => setDraft({
      ...draft,
      symbol: e.target.value.toUpperCase()
    }),
    placeholder: "TRENT"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Side"
  }, /*#__PURE__*/React.createElement("select", {
    value: draft.dir,
    onChange: e => setDraft({
      ...draft,
      dir: e.target.value,
      behav: [],
      tech: []
    })
  }, /*#__PURE__*/React.createElement("option", null, "Long"), /*#__PURE__*/React.createElement("option", null, "Short"))), /*#__PURE__*/React.createElement(Field, {
    label: "Type"
  }, /*#__PURE__*/React.createElement("select", {
    value: draft.type,
    onChange: e => setDraft({
      ...draft,
      type: e.target.value
    })
  }, TRADE_TYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement(Field, {
    label: "Initial stop"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.05",
    value: draft.stop,
    onChange: e => setDraft({
      ...draft,
      stop: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Listing day"
  }, /*#__PURE__*/React.createElement("button", {
    className: "chip" + (draft.ipo ? " on" : ""),
    style: {
      width: "100%",
      padding: "9px 10px"
    },
    onClick: () => setDraft({
      ...draft,
      ipo: !draft.ipo
    })
  }, draft.ipo ? "IPO listing day" : "Not an IPO"))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "1fr",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: `Setup${sessionsByDate[draft.date] && sessionsByDate[draft.date].regime !== "unset" ? " — playbook for " + REGIMES[sessionsByDate[draft.date].regime].name : ""}`
  }, /*#__PURE__*/React.createElement("select", {
    value: draft.setupId,
    onChange: e => setDraft({
      ...draft,
      setupId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose a setup"), (() => {
    const sess = sessionsByDate[draft.date];
    const rg = sess && sess.regime !== "unset" ? sess.regime : null;
    const all = activeSetups(lib, null);
    const onBook = new Set(rg ? activeSetups(lib, rg).map(x => x.id) : []);
    return groupsOf(lib).map(g => {
      const items = all.filter(x => (x.group || "Other") === g);
      if (!items.length) return null;
      items.sort((a, b) => (onBook.has(b.id) ? 1 : 0) - (onBook.has(a.id) ? 1 : 0));
      return /*#__PURE__*/React.createElement("optgroup", {
        key: g,
        label: g
      }, items.map(x => /*#__PURE__*/React.createElement("option", {
        key: x.id,
        value: x.id
      }, x.label, rg && !onBook.has(x.id) ? "  · off playbook" : "")));
    });
  })()))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      borderTop: "1px solid var(--rule)",
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Legs — the initial entry, every add, every scale-out"), /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["", "Date", "Time", "Price", "Quantity", "Orders", "Exit reason", ""].map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: `${c}-${i}`
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, (draft.legs || []).map((l, i) => /*#__PURE__*/React.createElement("tr", {
    key: l.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    value: l.kind,
    onChange: e => editLeg(i, {
      kind: e.target.value
    }),
    style: {
      width: 90
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "in"
  }, i === 0 ? "Entry" : "Add"), /*#__PURE__*/React.createElement("option", {
    value: "out"
  }, "Exit"))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: l.date || "",
    onChange: e => editLeg(i, {
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: l.time || "",
    onChange: e => editLeg(i, {
      time: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.05",
    value: l.price,
    onChange: e => editLeg(i, {
      price: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: l.qty,
    onChange: e => editLeg(i, {
      qty: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, l.kind === "out" && (() => {
    const sess = sessionsByDate[draft.date];
    const rg = sess && sess.regime !== "unset" ? sess.regime : null;
    const book = rg ? activeExits(lib, rg) : [];
    const ids = new Set(book.map(x => x.id));
    const rest = activeExits(lib, null).filter(x => !ids.has(x.id));
    return /*#__PURE__*/React.createElement("select", {
      value: l.exitId || "",
      onChange: e => editLeg(i, {
        exitId: e.target.value
      }),
      style: {
        minWidth: 170
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Why did you exit?"), book.length > 0 && /*#__PURE__*/React.createElement("optgroup", {
      label: `For ${REGIMES[rg].name.toLowerCase()}`
    }, book.map(x => /*#__PURE__*/React.createElement("option", {
      key: x.id,
      value: x.id
    }, x.label))), /*#__PURE__*/React.createElement("optgroup", {
      label: book.length ? "Others" : "All exits"
    }, rest.map(x => /*#__PURE__*/React.createElement("option", {
      key: x.id,
      value: x.id
    }, x.label))));
  })()), /*#__PURE__*/React.createElement("td", null, (draft.legs || []).length > 1 && /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => removeLeg(i)
  }, "Remove"))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => addLeg("in")
  }, "Add to position"), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => addLeg("out")
  }, "Scale out / close"))), (() => {
    const mk = market && market.stocks ? market.stocks[draft.symbol] : null;
    const fu = market && market.fundamentals ? market.fundamentals[draft.symbol] : null;
    if (!mk && !fu) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14,
        borderTop: "1px solid var(--rule)",
        paddingTop: 12
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "What the data says about ", draft.symbol), /*#__PURE__*/React.createElement("div", {
      className: "ch"
    }, mk && /*#__PURE__*/React.createElement(React.Fragment, null, mk.sector, " · sector ranked ", mk.sectorRank, " of ", (market.sectors || []).length, " · RS ", mk.rs > 0 ? "+" : "", fmt(mk.rs), " against Nifty ·", " ", fmt(mk.percentileInSector, 0), "th percentile among its brothers ·", " ", mk.aboveBoth ? "above both EMAs" : "not above both EMAs"), fu && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("br", null), Object.entries(fu).map(([k, v]) => `${k} ${v}`).join(" · "))), mk && /*#__PURE__*/React.createElement("button", {
      className: "btn ghost",
      style: {
        marginTop: 8
      },
      onClick: () => setDraft({
        ...draft,
        sector: mk.sectorRating,
        stock: mk.stockRating
      })
    }, "Use these ratings"));
  })(), draft.type === "News impact" ? /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 14,
      borderTop: "1px solid var(--rule)",
      paddingTop: 12
    }
  }, "Sector and peer position are switched off for a news-impact trade. A stock reacting to its own headline isn't following its group, so those thirty points move to the reaction and the technical condition instead.") : /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Sector against the index"
  }, /*#__PURE__*/React.createElement("select", {
    value: draft.sector,
    onChange: e => setDraft({
      ...draft,
      sector: num(e.target.value)
    })
  }, SECTOR_OPTS.map((o, i) => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: i
  }, o)))), /*#__PURE__*/React.createElement(Field, {
    label: "Stock against its brothers"
  }, /*#__PURE__*/React.createElement("select", {
    value: draft.stock,
    onChange: e => setDraft({
      ...draft,
      stock: num(e.target.value)
    })
  }, STOCK_OPTS.map((o, i) => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: i
  }, o))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Price behaviour tells present"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, activeTells(lib, "behaviour", draft.dir).map(x => /*#__PURE__*/React.createElement("button", {
    key: x.id,
    className: "chip" + ((draft.behav || []).includes(x.id) ? " on" : ""),
    onClick: () => toggleList("behav", x.id)
  }, x.label, x.weight !== undefined && Number(x.weight) !== 1 && /*#__PURE__*/React.createElement("b", null, " ×", x.weight))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Technical conditions present"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, activeTells(lib, "tech", draft.dir).map(x => /*#__PURE__*/React.createElement("button", {
    key: x.id,
    className: "chip" + ((draft.tech || []).includes(x.id) ? " on" : ""),
    onClick: () => toggleList("tech", x.id)
  }, x.label, x.weight !== undefined && Number(x.weight) !== 1 && /*#__PURE__*/React.createElement("b", null, " ×", x.weight))))), (() => {
    const p = enrich(draft, sessionsByDate, lib, settings.rates);
    const L = p.layers;
    const suggested = settings.maxRisk * L.riskMult;
    const rows = [["Market", L.market, L.weights.market], ["Sector", L.sector, L.weights.sector], ["Stock", L.stock, L.weights.stock], ["Behaviour", L.behaviour, L.weights.behaviour], ["Technical", L.tech, L.weights.tech]].filter(([,, max]) => max > 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        borderTop: "1px solid var(--rule)",
        paddingTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 30,
        fontWeight: 600,
        letterSpacing: "-.03em"
      }
    }, L.total), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
      style: {
        fontSize: 13
      }
    }, L.band, " · ", L.label), /*#__PURE__*/React.createElement("div", {
      className: "ch"
    }, L.note))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
        gap: 10,
        marginTop: 12
      }
    }, rows.map(([k, v, max]) => /*#__PURE__*/React.createElement("div", {
      key: k
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--muted)"
      }
    }, k, " ", Math.round(v), "/", max), /*#__PURE__*/React.createElement("div", {
      className: "bar"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: Math.max(2, v / max * 100) + "%"
      }
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 12
      }
    }, "Suggested risk ", L.riskMult ? fmt(suggested) + "% (" + inr(settings.capital * suggested / 100) + ")" : "none — this is a pass", " · Risk on the initial leg ", inr(p.riskAmt), " (", p.riskAmt ? fmt(p.riskAmt / settings.capital * 100) + "%" : "—", ")", p.adds > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, " · ", p.adds, " add", p.adds > 1 ? "s" : "", ", average cost ", fmt(p.avgIn)), p.isOpen && /*#__PURE__*/React.createElement(React.Fragment, null, " · ", /*#__PURE__*/React.createElement("span", {
      className: "pill"
    }, fmt(p.openQty, 0), " still open")), !p.isOpen && p.qtyOut > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, " · Net ", inr(p.pnl), " after ", inr(p.charges.total), " charges · ", p.r !== null ? fmt(p.r) + "R net (" + fmt(p.rGross) + "R gross)" : "R needs a stop"), p.onModel === false && /*#__PURE__*/React.createElement(React.Fragment, null, " · ", /*#__PURE__*/React.createElement("span", {
      className: "pill off"
    }, "off playbook")), L.fit <= 0.1 && /*#__PURE__*/React.createElement(React.Fragment, null, " · ", /*#__PURE__*/React.createElement("span", {
      className: "pill off"
    }, "against the regime"))));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Honest tags"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, TAGS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: "chip" + (draft.tags.includes(t) ? " on" : ""),
    onClick: () => toggleTag(t)
  }, t)))), (draft.legs || []).some(l => l.kind === "out" && num(l.qty)) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      borderTop: "1px solid var(--rule)",
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "What it did after you were out"), /*#__PURE__*/React.createElement("select", {
    value: draft.afterExit || "Not reviewed yet",
    onChange: e => setDraft({
      ...draft,
      afterExit: e.target.value
    })
  }, AFTER_EXIT.map(x => /*#__PURE__*/React.createElement("option", {
    key: x
  }, x))), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    style: {
      marginTop: 8
    },
    value: draft.afterExitNote || "",
    onChange: e => setDraft({
      ...draft,
      afterExitNote: e.target.value
    }),
    placeholder: "Where it went, how far, how fast. Come back and fill this a few days later — it is the only record of what your exit actually cost or saved."
  }), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 8
    }
  }, "Fill this in a few days after the trade, not at the exit. It's the closest thing to measuring exit quality without tracking every tick, and it's the field that eventually tells you whether your stops sit inside the noise.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Chart screenshot"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "1fr auto auto auto",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: draft.chart || "",
    placeholder: `${draft.symbol || "SYMBOL"}-${draft.date}.png`,
    onChange: e => setDraft({
      ...draft,
      chart: e.target.value
    })
  }), /*#__PURE__*/React.createElement("label", {
    className: "chip",
    style: {
      display: "inline-block",
      textAlign: "center"
    }
  }, "Pick the file", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) {
        setDraft({
          ...draft,
          chart: f.name
        });
        setMsg(`Linked ${f.name}. Keep it in your chart folder.`);
      }
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => setDraft({
      ...draft,
      chart: `${draft.symbol || "CHART"}-${draft.date}.png`
    })
  }, "Standard name"), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => {
      const full = (settings.chartFolder || "") + (draft.chart || "");
      if (navigator.clipboard) navigator.clipboard.writeText(full);
      setMsg("Path copied: " + full);
    }
  }, "Copy path")), draft.chart && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "linkchip",
    href: fileUrl(settings.chartFolder, draft.chart),
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Open the chart ↗"), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 8
    }
  }, "Resolves to ", /*#__PURE__*/React.createElement("b", null, fileUrl(settings.chartFolder, draft.chart)))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 8
    }
  }, "Save the screenshot into ", settings.chartFolder || "your chart folder", " and keep only the filename here — that way moving the folder later means changing one setting rather than every trade.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Notes"), /*#__PURE__*/React.createElement("textarea", {
    rows: 2,
    value: draft.notes,
    onChange: e => setDraft({
      ...draft,
      notes: e.target.value
    }),
    placeholder: "Why you took it. Why you left."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: saveTrade
  }, draft.id ? "Update trade" : "Log trade"), draft.id && /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => setDraft(blankTrade())
  }, "Cancel"))), openTrades.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      borderTop: "4px solid var(--regime-ink)"
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Open positions · ", openTrades.length, " · ", fmt(openTrades.reduce((a, t) => a + (t.openRisk || 0), 0) / settings.capital * 100), "% of capital at risk"), /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["Symbol", "Entered", "Days", "Type", "Setup", "Avg cost", "Stop", "Open qty", "Open risk", ""].map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, [...openTrades].sort((a, b) => a.date.localeCompare(b.date)).map(t => /*#__PURE__*/React.createElement("tr", {
    key: t.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, t.symbol)), /*#__PURE__*/React.createElement("td", null, t.date), /*#__PURE__*/React.createElement("td", null, Math.max(0, Math.round((new Date(today()) - new Date(t.date)) / 864e5))), /*#__PURE__*/React.createElement("td", null, t.type), /*#__PURE__*/React.createElement("td", {
    style: {
      maxWidth: 180
    }
  }, t.setupLabel), /*#__PURE__*/React.createElement("td", null, fmt(t.avgIn), t.adds > 0 ? ` (${t.adds} add${t.adds > 1 ? "s" : ""})` : ""), /*#__PURE__*/React.createElement("td", null, fmt(num(t.stop))), /*#__PURE__*/React.createElement("td", null, fmt(t.openQty, 0)), /*#__PURE__*/React.createElement("td", null, inr(t.openRisk)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => {
      setDraft({
        ...t,
        legs: [...t.legs, {
          id: uid(),
          kind: "out",
          date: today(),
          time: "",
          price: "",
          qty: String(t.openQty)
        }]
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, "Close it"))))))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "These are excluded from every win rate and R figure until you fill in an exit — an unfinished trade has no result yet, and counting it as one is how books start lying to their owners.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Trade log · ", enriched.length, " closed · ", fmt(all.sumR, 1), "R · ", inr(all.pnl)), enriched.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Nothing logged yet. Add a trade above, or load the sample book from the Playbook tab to see what the analysis looks like once there's history.") : /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["Date", "Symbol", "Setup", "Regime", "Side", "Score", "R", "P&L", "Chart", ""].map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, [...allTrades].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 80).map(t => /*#__PURE__*/React.createElement("tr", {
    key: t.id
  }, /*#__PURE__*/React.createElement("td", null, t.date), /*#__PURE__*/React.createElement("td", null, t.symbol), /*#__PURE__*/React.createElement("td", {
    style: {
      maxWidth: 200
    }
  }, t.setupLabel, t.exitLabel && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "ch"
  }, "exit: ", t.exitLabel)), t.onModel === false && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("span", {
    className: "pill off"
  }, "off"))), /*#__PURE__*/React.createElement("td", null, REGIMES[t.regime].short), /*#__PURE__*/React.createElement("td", null, t.dir, t.type === "News impact" ? " · news" : t.type === "Intraday" ? " · intra" : "", t.ipo ? " · IPO" : ""), /*#__PURE__*/React.createElement("td", null, t.conviction, " ", t.band), /*#__PURE__*/React.createElement("td", null, t.isOpen ? /*#__PURE__*/React.createElement("span", {
    className: "pill"
  }, "open") : rcell(t.r)), /*#__PURE__*/React.createElement("td", {
    className: t.pnl > 0 ? "pos" : t.pnl < 0 ? "neg" : ""
  }, t.isOpen ? "—" : inr(t.pnl)), /*#__PURE__*/React.createElement("td", null, t.chart ? /*#__PURE__*/React.createElement("a", {
    href: fileUrl(settings.chartFolder, t.chart),
    target: "_blank",
    rel: "noopener noreferrer",
    title: fileUrl(settings.chartFolder, t.chart)
  }, "Chart ↗") : "—"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => {
      setDraft({
        ...t
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, "Edit"), " ", /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => delTrade(t.id)
  }, "Delete")))))), enriched.length > 80 && /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 8
    }
  }, "Showing the 80 most recent. Export to see everything.")))), tab === "confluence" && (() => {
    const withR = enriched.filter(t => t.r !== null);
    if (withR.length < 5) return /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Confluence"), /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "This page tests the funnel against your results: whether the entry score ranks your trades, and which of the individual tells actually move the number. It needs roughly twenty scored trades before it says anything worth acting on."));
    const bandRows = ["A", "B", "C", "D"].map(b => {
      const list = withR.filter(t => t.band === b);
      if (!list.length) return null;
      const st = stats(list);
      const risks = list.filter(t => t.riskAmt).map(t => t.riskAmt / settings.capital * 100);
      const B = BANDS.find(x => x.band === b);
      return [`${b} · ${B.label}`, st.n, fmt(st.winRate, 0) + "%", rcell(st.avgR), rcell(st.sumR, 1), risks.length ? fmt(mean(risks)) + "%" : "—", fmt(settings.maxRisk * B.riskMult) + "%"];
    }).filter(Boolean);
    const tellRows = [...(lib.behaviour || []).map(x => ({
      ...x,
      group: "Behaviour",
      field: "behav"
    })), ...(lib.tech || []).map(x => ({
      ...x,
      group: "Technical",
      field: "tech"
    }))].map(spec => {
      const pool = withR.filter(t => spec.side === "both" || sideOf(t.dir) === spec.side);
      const w = pool.filter(t => (t[spec.field] || []).includes(spec.id));
      const wo = pool.filter(t => !(t[spec.field] || []).includes(spec.id));
      if (!w.length) return null;
      const a = stats(w),
        b = stats(wo);
      const delta = a.avgR !== null && b.avgR !== null ? a.avgR - b.avgR : null;
      return {
        tell: spec.label,
        group: spec.group,
        side: spec.side,
        retired: spec.retired,
        n: w.length,
        aR: a.avgR,
        bR: b.avgR,
        delta,
        win: a.winRate
      };
    }).filter(Boolean).sort((a, b) => (b.delta ?? -9) - (a.delta ?? -9));
    const secRows = groupBy(withR, t => SECTOR_OPTS[t.sector === undefined ? 1 : t.sector]).sort((a, b) => SECTOR_OPTS.indexOf(a.key) - SECTOR_OPTS.indexOf(b.key));
    const stkRows = groupBy(withR, t => STOCK_OPTS[t.stock === undefined ? 1 : t.stock]).sort((a, b) => STOCK_OPTS.indexOf(a.key) - STOCK_OPTS.indexOf(b.key));
    const gline = g => [g.key, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1)];
    const GC = ["", "N", "Win", "Avg R", "Total R"];
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Entry grade against outcome"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Grade", "N", "Win", "Avg R", "Total R", "Risk taken", "Risk called for"],
      rows: bandRows
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "If avg R doesn't fall as you go down the grades, the score isn't measuring what you think it is. The last two columns show whether your size followed your own read — going all in only pays when the all-in trades are the A grades.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Which tells carry weight"), /*#__PURE__*/React.createElement("div", {
      className: "scroll"
    }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ["Tell", "Layer", "Side", "N", "Win", "With", "Without", "Difference"].map(c => /*#__PURE__*/React.createElement("th", {
      key: c
    }, c)))), /*#__PURE__*/React.createElement("tbody", null, tellRows.map(r => /*#__PURE__*/React.createElement("tr", {
      key: r.tell
    }, /*#__PURE__*/React.createElement("td", null, r.tell, r.retired && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("span", {
      className: "pill"
    }, "retired")), r.n < 8 && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("span", {
      className: "pill"
    }, "thin"))), /*#__PURE__*/React.createElement("td", null, r.group), /*#__PURE__*/React.createElement("td", null, r.side === "both" ? "—" : r.side), /*#__PURE__*/React.createElement("td", null, r.n), /*#__PURE__*/React.createElement("td", null, fmt(r.win, 0), "%"), /*#__PURE__*/React.createElement("td", null, rcell(r.aR)), /*#__PURE__*/React.createElement("td", null, rcell(r.bR)), /*#__PURE__*/React.createElement("td", null, rcell(r.delta))))))), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Difference is the average R of trades where the tell was present minus those where it wasn't. Anything marked thin has fewer than eight observations — interesting, not evidence. A tell sitting near zero after fifty trades is one you can stop looking for.")), /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Sector strength at entry"), /*#__PURE__*/React.createElement(Table, {
      cols: GC,
      rows: secRows.map(gline)
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Stock against its brothers"), /*#__PURE__*/React.createElement(Table, {
      cols: GC,
      rows: stkRows.map(gline)
    }))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Alignment with the regime"), /*#__PURE__*/React.createElement(Table, {
      cols: GC,
      rows: groupBy(withR, t => t.layers.fit >= 1 ? "With the regime" : t.layers.fit >= 0.4 ? "Chop or unscored day" : "Against the regime").map(gline)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Counter-trend entries are the first layer of the funnel failing. If this row is large, nothing below it in the funnel matters much.")));
  })(), tab === "edge" && (() => {
    const withR = enriched.filter(t => t.r !== null);
    const line = g => [g.key, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1), rcell(g.avgWin), rcell(g.avgLoss), g.pf === null ? "—" : g.pf === Infinity ? "∞" : fmt(g.pf)];
    const COLS = ["", "N", "Win", "Avg R", "Total R", "Avg win", "Avg loss", "PF"];
    const byRegime = groupBy(withR, t => REGIMES[t.regime].name).sort((a, b) => b.sumR - a.sumR);
    const bySetup = groupBy(withR, t => t.setupLabel).sort((a, b) => b.sumR - a.sumR);
    const byDay = groupBy(withR, t => dowOf(t.date));
    const bySlot = groupBy(withR.filter(t => t.slot), t => t.slot);
    const byModel = groupBy(withR.filter(t => t.onModel !== null), t => t.onModel ? "On playbook" : "Off playbook");
    const bySide = groupBy(withR, t => t.dir);
    const dayOrder = k => DOW.indexOf(k);
    const slotOrder = k => {
      const i = SLOTS.findIndex(s => s.key === k);
      return i < 0 ? 99 : i;
    };
    if (!withR.length) return /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Edge"), /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "R multiples need an entry, a stop, an exit and a quantity on each trade. Once a handful are logged this page fills in by regime, setup, weekday and time of day."));
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "The year, day by day"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
        flexWrap: "wrap",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 200
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Trade type"), /*#__PURE__*/React.createElement("select", {
      value: calType,
      onChange: e => setCalType(e.target.value)
    }, /*#__PURE__*/React.createElement("option", {
      value: "All"
    }, "All types"), TRADE_TYPES.map(x => /*#__PURE__*/React.createElement("option", {
      key: x,
      value: x
    }, x)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, [["gross", "Before charges"], ["net", "After charges"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
      key: k,
      className: "chip" + (calGross === (k === "gross") ? " on" : ""),
      onClick: () => setCalGross(k === "gross")
    }, l)))), (() => {
      const sel = calType === "All" ? enriched : enriched.filter(t => t.type === calType);
      const st = stats(sel);
      const g = sel.reduce((a, t) => a + (t.pnlGross || 0), 0);
      const c = sel.reduce((a, t) => a + (t.charges && t.charges.total || 0), 0);
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Calendar, {
        trades: sel,
        months: 12,
        gross: calGross
      }), /*#__PURE__*/React.createElement("div", {
        className: "ch",
        style: {
          marginTop: 12
        }
      }, calType === "All" ? "Every trade" : calType, " · ", sel.length, " closed · before charges ", /*#__PURE__*/React.createElement("b", null, inr(g)), " · charges ", /*#__PURE__*/React.createElement("b", null, inr(c)), " · after charges ", /*#__PURE__*/React.createElement("b", null, inr(g - c))));
    })(), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Green for a day in profit, red for a day in loss, deeper for a bigger result. A positional trade lands on the day you closed it, not the day you opened it. Grey squares are trading days you didn't trade — plenty of those in the right conditions is a good sign, not a gap. Hover any square for the trades, the R and the rupees.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Everything, together"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: [line({
        key: "All trades",
        ...stats(withR)
      })]
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By regime — does your read pay"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: byRegime.map(line)
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Playbook discipline"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: byModel.map(line)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "A trade is \"off playbook\" when the setup isn't one you listed for that day's regime. This is usually the single largest number on the page."))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By setup group"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: groupBy(withR, t => t.setupGroup).sort((a, b) => b.sumR - a.sumR).map(line)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Groups reach a useful sample size months before individual setups do, so this is the table worth reading first. If pullbacks are carrying you and breakouts are not, that's a finding long before any single setup has enough trades to say anything.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Group inside regime"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Group", "Regime", "N", "Win", "Avg R", "Total R"],
      rows: groupBy(withR, t => t.setupGroup + " ||| " + REGIMES[t.regime].name).filter(g => g.nR >= 3).sort((a, b) => b.avgR - a.avgR).map(g => {
        const [gg, rr] = g.key.split(" ||| ");
        return [gg, rr, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1)];
      })
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By setup"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: bySetup.map(line)
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Setup inside regime — where each one actually works"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Setup", "Regime", "N", "Win", "Avg R", "Total R"],
      rows: groupBy(withR, t => t.setupLabel + " ||| " + REGIMES[t.regime].name).filter(g => g.nR >= 3).sort((a, b) => b.avgR - a.avgR).map(g => {
        const [s, r] = g.key.split(" ||| ");
        return [s, r, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1)];
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Only combinations with three or more trades. Three is not proof of anything — treat this as a place to look, not a conclusion.")), /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By weekday"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: byDay.sort((a, b) => dayOrder(a.key) - dayOrder(b.key)).map(line)
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By time of day"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: bySlot.sort((a, b) => slotOrder(a.key) - slotOrder(b.key)).map(line)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Taken from the time on the first entry leg, so fill that in when you log."))), /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Setup inside each window"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Setup", "Window", "N", "Win", "Avg R", "Total R"],
      rows: groupBy(withR.filter(t => t.slot), t => t.setupLabel + " ||| " + t.slot).filter(g => g.nR >= 3).sort((a, b) => slotOrder(a.key.split(" ||| ")[1]) - slotOrder(b.key.split(" ||| ")[1]) || b.avgR - a.avgR).map(g => {
        const [sx, w] = g.key.split(" ||| ");
        return [sx, w, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1)];
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Three trades or more per combination. The same setup can behave differently at 09:30 and at 14:30 — the opening drive and the last hour are different markets, and this is where that shows up.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Long against short"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: bySide.map(line)
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By trade type"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: groupBy(withR, t => t.type).map(line)
    }))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "How you get out"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Exit reason", "N", "Win", "Avg R", "Total R", "Avg days"],
      rows: groupBy(withR.filter(t => t.exitLabel), t => t.exitLabel).sort((a, b) => (b.avgR ?? -9) - (a.avgR ?? -9)).map(g => [g.key, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1), fmt(mean(g.items.map(t => t.holdDays).filter(x => x !== null)), 1)])
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Tagged on the largest exit leg. You score entries against five layers and, until now, scored exits against nothing — this is the other half. What to look for: whether your discretionary exits beat your rule-based ones, and how much of your book is leaving through the initial stop rather than through a decision.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Exits inside each regime"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Exit reason", "Regime", "N", "Win", "Avg R", "Total R"],
      rows: groupBy(withR.filter(t => t.exitLabel), t => t.exitLabel + " ||| " + REGIMES[t.regime].name).filter(g => g.nR >= 3).sort((a, b) => (b.avgR ?? -9) - (a.avgR ?? -9)).map(g => {
        const [e, r2] = g.key.split(" ||| ");
        return [e, r2, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1)];
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Three trades or more. Booking into the breakout should look good in chop and expensive in a trend; if it doesn't, one of your rules is wrong.")), withR.some(t => t.ipo) && /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "IPO listing-day trades"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: groupBy(withR, t => t.ipo ? "IPO listing day" : "Everything else").map(line)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "f"
    }, "Listing-day trades by regime"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: groupBy(withR.filter(t => t.ipo), t => REGIMES[t.regime].name).map(line)
    })), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "A listing day has liquidity and participation but no history — no EMAs, no prior swings, no relative strength. Most of your technical layer simply doesn't apply, so these trades lean almost entirely on price behaviour and the day's regime. Whether that's enough is what this table is here to answer.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "By exit reason"), withR.filter(t => t.exitLabel).length === 0 ? /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "Nothing tagged yet. Pick a reason on each exit leg and this fills in — it's the half of the process you currently score against nothing.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: groupBy(withR.filter(t => t.exitLabel), t => t.exitLabel).sort((a, b) => b.avgR - a.avgR).map(line)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Read this against the entries, not on its own. A weak average here can mean a poor exit method, or it can mean that method is the one you reach for when a trade was already going wrong. The exit-inside-regime table below separates those better."))), withR.filter(t => t.exitLabel).length >= 8 && /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Exit inside regime"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Exit", "Regime", "N", "Win", "Avg R", "Total R"],
      rows: groupBy(withR.filter(t => t.exitLabel), t => t.exitLabel + " ||| " + REGIMES[t.regime].name).filter(g => g.nR >= 3).sort((a, b) => b.avgR - a.avgR).map(g => {
        const [e, r2] = g.key.split(" ||| ");
        return [e, r2, g.n, fmt(g.winRate, 0) + "%", rcell(g.avgR), rcell(g.sumR, 1)];
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Your rules say book into the breakout in chop and trail in a trend. This is where you find out whether that's true for you. Three trades or more per combination.")), withR.some(t => t.afterExit && t.afterExit !== "Not reviewed yet") && /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "What happened after you were out"), /*#__PURE__*/React.createElement(Table, {
      cols: COLS,
      rows: groupBy(withR.filter(t => t.afterExit && t.afterExit !== "Not reviewed yet"), t => t.afterExit).sort((a, b) => b.n - a.n).map(line)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Reviewed trades only. \"Kept going without me\" against a decent average R is the signature of exiting well but early; against a poor one it usually means the entries were late. \"Stopped me, then reversed\" turning up often says the stops are sitting inside the noise rather than beyond the level.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "How long you actually hold"), /*#__PURE__*/React.createElement(Table, {
      cols: ["", "N", "Avg days", "Winners", "Losers", "Avg R"],
      rows: groupBy(withR.filter(t => t.holdDays !== null), t => t.type + " · " + REGIMES[t.regime].name).map(g => {
        const w = g.items.filter(t => t.r > 0),
          l = g.items.filter(t => t.r <= 0);
        return [g.key, g.n, fmt(mean(g.items.map(t => t.holdDays)), 1), fmt(mean(w.map(t => t.holdDays)), 1), fmt(mean(l.map(t => t.holdDays)), 1), rcell(g.avgR)];
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Needs an exit date on the trade. Winners should sit longer than losers — if the two columns are the wrong way round, the entries aren't the problem.")));
  })(), tab === "signals" && (() => {
    const withR = enriched.filter(t => t.r !== null);
    const chron = [...withR].filter(t => t.riskAmt).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const risks = chron.map(t => t.riskAmt / settings.capital * 100);
    const afterLoss = [],
      afterWin = [];
    for (let i = 1; i < chron.length; i++) (chron[i - 1].r <= 0 ? afterLoss : afterWin).push(chron[i].riskAmt / settings.capital * 100);
    const days = groupBy(enriched, t => t.date);
    const scoredDays = days.filter(d => sessionsByDate[d.key] && sessionsByDate[d.key].regime !== "unset");
    const over = scoredDays.filter(d => d.n > budgetFor(sessionsByDate[d.key].regime, sessionsByDate[d.key].confidence, settings.maxRisk).trades);
    const tagRows = TAGS.map(tag => {
      const list = withR.filter(t => (t.tags || []).includes(tag));
      return list.length ? [tag, list.length, fmt(stats(list).winRate, 0) + "%", rcell(stats(list).avgR), rcell(stats(list).sumR, 1)] : null;
    }).filter(Boolean);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "What the book is telling you"), signals.length === 0 ? /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "Nothing stands out yet. Signals appear once there are roughly twenty scored trades and a few weeks of session scores to compare against — regime shifts, setup decay, sizing drift and the trades you take when you shouldn't.") : signals.map((s, i) => /*#__PURE__*/React.createElement("div", {
      className: "sig " + s.level,
      key: i
    }, /*#__PURE__*/React.createElement("b", null, s.title), /*#__PURE__*/React.createElement("p", null, s.body)))), /*#__PURE__*/React.createElement("div", {
      className: "grid2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Activity and discipline"), /*#__PURE__*/React.createElement(Table, {
      cols: ["", "Value"],
      rows: [["Trading days", days.length], ["Trades per active day", fmt(days.length ? enriched.length / days.length : 0, 1)], ["Days over the regime budget", `${over.length} of ${scoredDays.length}`], ["Avg R on budget-respecting days", rcell(stats(scoredDays.filter(d => !over.includes(d)).flatMap(d => d.items)).avgR)], ["Avg R on over-budget days", rcell(stats(over.flatMap(d => d.items)).avgR)], ["Busiest single day", days.length ? Math.max(...days.map(d => d.n)) + " trades" : "—"]]
    })), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Position sizing"), /*#__PURE__*/React.createElement(Table, {
      cols: ["", "Value"],
      rows: [["Capital", inr(settings.capital)], ["Stated cap per trade", fmt(settings.maxRisk) + "%"], ["Average risk taken", risks.length ? fmt(mean(risks)) + "%" : "—"], ["Swing in risk (±1 sd)", sd(risks) ? fmt(sd(risks)) + "%" : "—"], ["Largest single risk", risks.length ? fmt(Math.max(...risks)) + "%" : "—"], ["Risk after a loss", afterLoss.length ? fmt(mean(afterLoss)) + "%" : "—"], ["Risk after a win", afterWin.length ? fmt(mean(afterWin)) + "%" : "—"]]
    }))), tagRows.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "What your tags cost"), /*#__PURE__*/React.createElement(Table, {
      cols: ["Tag", "N", "Win", "Avg R", "Total R"],
      rows: tagRows
    }), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, "Tag honestly at the moment of entry, not at review. The tag you least want to press is the one worth the most here.")));
  })(), tab === "library" && (() => {
    const usage = (group, id) => allTrades.filter(t => group === "setups" ? t.setupId === id : (t[group === "behaviour" ? "behav" : "tech"] || []).includes(id)).length;
    const patch = (group, id, p2) => setLib(L => ({
      ...L,
      [group]: L[group].map(x => x.id === id ? {
        ...x,
        ...p2
      } : x)
    }));
    const addItem = group => setLib(L => ({
      ...L,
      [group]: [...L[group], {
        id: "u" + uid(),
        label: "New item",
        retired: false,
        added: today(),
        ...(group === "direction" ? {
          weight: 1,
          hint: "",
          opts: ["Strongly against", "Against", "Neutral", "For", "Strongly for"]
        } : group === "clarity" ? {
          weight: 1,
          hint: "",
          opts: ["No", "Partly", "Yes"]
        } : group === "setups" ? {
          regimes: [],
          group: "Other"
        } : group === "exits" ? {
          regimes: []
        } : {
          side: "both",
          weight: 1
        })
      }]
    }));
    const drop = (group, id) => {
      if (!["direction", "clarity"].includes(group) && usage(group, id) > 0) {
        setMsg("That one has trades against it — retire it instead, so the history survives.");
        return;
      }
      setLib(L => ({
        ...L,
        [group]: L[group].filter(x => x.id !== id)
      }));
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Weights"), /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "Every check carries a weight, 1 by default. Set it to 2 and it counts double toward direction or clarity; set it to 0.5 and it counts half. The totals rescale automatically, so the readings still run \\u2212100 to +100 and 0 to 100 whatever weights you choose. A weight of 0 switches a check off without retiring it.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "One consequence worth understanding."), " Sessions are re-scored from your current weights every time the journal opens, not frozen at whatever they were labelled on the day. Changing a weight therefore changes what past days were called \\u2014 a day that read as an uptrend under equal weights may read as chop once you double the clarity weighting. That keeps your history internally consistent, but your \"uptrend win rate\" will move when you change weights. Change them deliberately, and preferably not while you're in the middle of gathering evidence about something.")), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Editing rules"), /*#__PURE__*/React.createElement("p", {
      className: "empty"
    }, "Rename anything freely — every trade keeps its link, because trades store a hidden id rather than the words. Retiring hides an item from the pickers but leaves your history intact and marks it retired in the Confluence table. Deleting is only allowed while nothing has used it. New items start with no history, so give them a couple of months before reading anything into their numbers.")), GROUPS.map(g => /*#__PURE__*/React.createElement("div", {
      className: "card",
      key: g.key
    }, /*#__PURE__*/React.createElement("h2", null, g.name, " · ", (lib[g.key] || []).filter(x => !x.retired).length, " active"), /*#__PURE__*/React.createElement("div", {
      className: "scroll"
    }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, (g.isCheck ? ["Check", "Options \u2014 separate with |", "Weight", "", ""] : g.hasGroup ? ["Label", "Group", "Regimes", "Used", "", ""] : g.hasWeight ? ["Label", "Side", "Weight", "Used", "", ""] : ["Label", g.hasRegimes ? "Regimes" : "Side", "Used", "", ""]).map((c, i) => /*#__PURE__*/React.createElement("th", {
      key: i
    }, c)))), /*#__PURE__*/React.createElement("tbody", null, (lib[g.key] || []).map(x => /*#__PURE__*/React.createElement("tr", {
      key: x.id,
      style: {
        opacity: x.retired ? 0.45 : 1
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        minWidth: 220
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: x.label,
      onChange: e => patch(g.key, x.id, {
        label: e.target.value
      })
    })), g.hasGroup && /*#__PURE__*/React.createElement("td", {
      style: {
        minWidth: 150
      }
    }, /*#__PURE__*/React.createElement("input", {
      list: "rd-groups",
      value: x.group || "",
      placeholder: "Group",
      onChange: e => patch(g.key, x.id, {
        group: e.target.value
      })
    })), /*#__PURE__*/React.createElement("td", null, g.isCheck ? /*#__PURE__*/React.createElement("input", {
      value: (x.opts || []).join(" | "),
      onChange: e => patch(g.key, x.id, {
        opts: e.target.value.split("|").map(y => y.trim()).filter(Boolean)
      })
    }) : g.hasRegimes ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        justifyContent: "flex-end"
      }
    }, REGIME_KEYS.map(rk => /*#__PURE__*/React.createElement("button", {
      key: rk,
      className: "chip" + ((x.regimes || []).includes(rk) ? " on" : ""),
      onClick: () => patch(g.key, x.id, {
        regimes: (x.regimes || []).includes(rk) ? x.regimes.filter(y => y !== rk) : [...(x.regimes || []), rk]
      })
    }, REGIMES[rk].short))) : /*#__PURE__*/React.createElement("select", {
      value: x.side,
      onChange: e => patch(g.key, x.id, {
        side: e.target.value
      }),
      style: {
        width: 100
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "both"
    }, "Both"), /*#__PURE__*/React.createElement("option", {
      value: "long"
    }, "Long"), /*#__PURE__*/React.createElement("option", {
      value: "short"
    }, "Short"))), (g.isCheck || g.hasWeight) && /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
      type: "number",
      step: "0.5",
      min: "0",
      style: {
        width: 72
      },
      value: x.weight === undefined ? 1 : x.weight,
      onChange: e => patch(g.key, x.id, {
        weight: num(e.target.value)
      })
    })), !g.isCheck && /*#__PURE__*/React.createElement("td", null, usage(g.key, x.id)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      className: "chip",
      onClick: () => patch(g.key, x.id, {
        retired: !x.retired
      })
    }, x.retired ? "Restore" : "Retire")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      className: "chip",
      onClick: () => drop(g.key, x.id)
    }, "Delete"))))))), /*#__PURE__*/React.createElement("datalist", {
      id: "rd-groups"
    }, groupsOf(lib).map(x => /*#__PURE__*/React.createElement("option", {
      key: x,
      value: x
    }))), /*#__PURE__*/React.createElement("button", {
      className: "btn ghost",
      style: {
        marginTop: 12
      },
      onClick: () => addItem(g.key)
    }, "Add ", g.name.toLowerCase()))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Quotes · ", quotes.length, " saved"), /*#__PURE__*/React.createElement("textarea", {
      rows: 2,
      value: qDraft.text,
      placeholder: "The line itself",
      onChange: e => setQDraft({
        ...qDraft,
        text: e.target.value
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gridTemplateColumns: "2fr 1fr auto",
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: qDraft.author,
      placeholder: "Who said it",
      onChange: e => setQDraft({
        ...qDraft,
        author: e.target.value
      })
    }), /*#__PURE__*/React.createElement("select", {
      value: qDraft.tag,
      onChange: e => setQDraft({
        ...qDraft,
        tag: e.target.value
      })
    }, QUOTE_TAGS.map(t => /*#__PURE__*/React.createElement("option", {
      key: t
    }, t))), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: saveQuote
    }, "Save")), /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        marginTop: 10
      }
    }, quotes.length === 0 ? "Empty on purpose. The lines that change how you trade are the ones you picked up yourself and decided were true — a list I pre-filled would be someone else's convictions taking the slot where yours should go. One appears under the tabs each time you open the journal, and on the Signals tab it matches the tag to whatever the top signal is telling you." : "Saved quotes stay out of the way. One shows under the tabs each visit; the \u21BB button pulls another."), quotes.length > 0 && /*#__PURE__*/React.createElement("button", {
      className: "btn ghost",
      style: {
        marginTop: 12
      },
      onClick: () => setShowQuotes(!showQuotes)
    }, showQuotes ? "Hide the list" : `Edit the ${quotes.length} saved`), showQuotes && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, quotes.map((q, i) => /*#__PURE__*/React.createElement("div", {
      key: q.id,
      style: {
        borderTop: "1px solid var(--rule)",
        paddingTop: 12,
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("textarea", {
      rows: 2,
      value: q.text,
      onChange: e => {
        const n = [...quotes];
        n[i] = {
          ...q,
          text: e.target.value
        };
        setQuotes(n);
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gridTemplateColumns: "2fr 1fr auto",
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: q.author || "",
      placeholder: "Who said it",
      onChange: e => {
        const n = [...quotes];
        n[i] = {
          ...q,
          author: e.target.value
        };
        setQuotes(n);
      }
    }), /*#__PURE__*/React.createElement("select", {
      value: q.tag || "General",
      onChange: e => {
        const n = [...quotes];
        n[i] = {
          ...q,
          tag: e.target.value
        };
        setQuotes(n);
      }
    }, QUOTE_TAGS.map(t => /*#__PURE__*/React.createElement("option", {
      key: t
    }, t))), /*#__PURE__*/React.createElement("button", {
      className: "chip",
      onClick: () => setQuotes(quotes.filter(x => x.id !== q.id))
    }, "Remove")))))), /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("h2", null, "Reset"), /*#__PURE__*/React.createElement("button", {
      className: "btn ghost",
      onClick: () => {
        if (confirm("Restore the original list? Your own additions are removed and any renames are undone. Trades keep their links where the ids still exist.")) setLib({
          ...SEED_LIBRARY,
          seedVersion: SEED_VERSION
        });
      }
    }, "Restore the original library")));
  })(), tab === "playbook" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, ["uptrend", "choppy", "downtrend"].map(k => /*#__PURE__*/React.createElement("div", {
    className: "card",
    key: k,
    style: {
      borderTop: `4px solid ${REGIMES[k].tape}`
    }
  }, /*#__PURE__*/React.createElement("h2", null, REGIMES[k].name), /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Setups"), groupsOf(lib).map(gname => {
    const items = activeSetups(lib, k).filter(x => (x.group || "Other") === gname);
    if (!items.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: gname,
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ch",
      style: {
        fontWeight: 600
      }
    }, gname), /*#__PURE__*/React.createElement("ul", {
      className: "rules"
    }, items.map(x => /*#__PURE__*/React.createElement("li", {
      key: x.id
    }, x.label))));
  }), /*#__PURE__*/React.createElement("label", {
    className: "f",
    style: {
      marginTop: 14
    }
  }, "Exits"), /*#__PURE__*/React.createElement("ul", {
    className: "rules"
  }, activeExits(lib, k).map(x => /*#__PURE__*/React.createElement("li", {
    key: x.id
  }, x.label))), /*#__PURE__*/React.createElement("label", {
    className: "f",
    style: {
      marginTop: 14
    }
  }, "Exits"), /*#__PURE__*/React.createElement("ul", {
    className: "rules"
  }, activeExits(lib, k).map(x => /*#__PURE__*/React.createElement("li", {
    key: x.id
  }, x.label))), /*#__PURE__*/React.createElement("label", {
    className: "f",
    style: {
      marginTop: 14
    }
  }, "How to handle them"), /*#__PURE__*/React.createElement("ul", {
    className: "rules"
  }, RULES[k].map((s, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, s))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "How the regime is decided"), /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Seven directional checks score −2 to +2 for a range of −14 to +14. Six clarity checks score 0 to 2 for a range of 0 to 12. Both are shown out of 100.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Clarity is the gate. Below 45 the day is choppy whatever the direction says, because a market can be falling hard and still be untradeable. Above 45, direction at or beyond ±30 sets the trend; anything in between is chop by another name.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Confidence blends the two and drives the trade budget, which is the part that argues with you when you want a sixth position on a day that deserves two."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Two exceptions worth remembering"), /*#__PURE__*/React.createElement("ul", {
    className: "rules"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Chop reverses the order."), " In a choppy index you find the trending stock first and let its own trend replace the market's. The setups listed under Choppy all assume you've already found that name — \"in favour of trend\" means the stock's trend, not the index's."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "News-impact trades skip two layers."), " Sector position and peer strength tell you nothing about a stock reacting to its own headline, especially intraday. Set the type to News impact and those thirty points move to the reaction and the technical condition. The Confluence tab scores news trades as their own group so you can see whether they belong in your book at all."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Positional trades stay open."), " Leave the exit blank when you buy. The position sits in Open positions with its risk counted, appears in no win rate, and gets closed when you actually sell."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "The entry funnel"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "rules"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Market"), " — 30 points. Pulled from that day's session score, weighted by how well your side matches the regime. A long in a downtrend keeps almost none of it."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Sector"), " — 15 points. Where the sector sits against the index."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Stock"), " — 15 points. Where the stock sits against its brothers."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Price behaviour"), " — 20 points, spread across the seven tells."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Technical"), " — 20 points, spread across the five conditions."))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, "Grades and the size they call for"), /*#__PURE__*/React.createElement(Table, {
    cols: ["Grade", "Score", "Risk", "Meaning"],
    rows: BANDS.map(b => [b.band + " · " + b.label, b.min + "+", b.riskMult ? fmt(settings.maxRisk * b.riskMult) + "%" : "—", b.note])
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 12
    }
  }, "The funnel is deliberately ordered so the layers you can't control sit first. Sector and stock strength are worth 30 points together, the same as the market alone — which is the point of step one: no amount of stock-level beauty rescues a trade taken in the wrong regime.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Your numbers"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Trading capital (₹)"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: settings.capital,
    onChange: e => setSettings({
      ...settings,
      capital: num(e.target.value) || 1
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Max risk per trade (%)"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: settings.maxRisk,
    onChange: e => setSettings({
      ...settings,
      maxRisk: num(e.target.value)
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Risk sizing and the budget are calculated from these. Chop halves the risk; a high-confidence trend gets the full number.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Daily limits and chart folder"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Maximum trades in a day"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: settings.maxTradesPerDay,
    onChange: e => setSettings({
      ...settings,
      maxTradesPerDay: num(e.target.value)
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Daily loss limit in R"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.5",
    value: settings.maxDailyLossR,
    onChange: e => setSettings({
      ...settings,
      maxDailyLossR: num(e.target.value)
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Chart screenshot folder"
  }, /*#__PURE__*/React.createElement("input", {
    value: settings.chartFolder || "",
    placeholder: "F:\\\\invest\\\\charts\\\\",
    onChange: e => setSettings({
      ...settings,
      chartFolder: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 10
    }
  }, "Hit either limit and a red banner appears on the Session tab telling you to stop. Set these now, while nothing is at stake — that's the only time the number is honest. The chart folder is prefixed to whatever filename you put on a trade, so keep every screenshot in one place and you only ever type the filename.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Quick links"), /*#__PURE__*/React.createElement("p", {
    className: "empty",
    style: {
      marginBottom: 12
    }
  }, "These appear as buttons under the tabs on every screen and open in a new browser tab. Put whatever you reach for during the day here — a saved Chartink scan URL works, so you can go straight to the scan rather than the homepage."), (settings.links || []).map((l, i) => /*#__PURE__*/React.createElement("div", {
    className: "row",
    key: l.id,
    style: {
      gridTemplateColumns: "1fr 2fr auto",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: l.label,
    placeholder: "Label",
    onChange: e => {
      const links = [...settings.links];
      links[i] = {
        ...l,
        label: e.target.value
      };
      setSettings({
        ...settings,
        links
      });
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: l.url,
    placeholder: "https://…",
    onChange: e => {
      const links = [...settings.links];
      links[i] = {
        ...l,
        url: e.target.value
      };
      setSettings({
        ...settings,
        links
      });
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => setSettings({
      ...settings,
      links: settings.links.filter(x => x.id !== l.id)
    })
  }, "Remove"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => setSettings({
      ...settings,
      links: [...(settings.links || []), {
        id: uid(),
        label: "",
        url: ""
      }]
    })
  }, "Add a link"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => setSettings({
      ...settings,
      links: DEFAULT_LINKS
    })
  }, "Restore defaults"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Charges · Zerodha"), /*#__PURE__*/React.createElement("p", {
    className: "empty",
    style: {
      marginBottom: 12
    }
  }, "Checked against a real Zerodha contract note. The rates below matched to within a rupee — but brokerage is billed ", /*#__PURE__*/React.createElement("b", null, "per executed order"), ", not per position, so the ", /*#__PURE__*/React.createElement("b", null, "Orders"), " column on each leg is what makes the total come out right. A 5,500-share position filled by eleven orders costs ₹220 in brokerage, not ₹20. The exchange charge is set to 0.00307%, the blended rate that appeared on that note; pure NSE is nearer 0.00297%."), ["delivery", "intraday"].map(seg => /*#__PURE__*/React.createElement("div", {
    key: seg,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "f"
  }, seg === "delivery" ? "Delivery — positional trades" : "Intraday — intraday and news trades"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))"
    }
  }, [["brokeragePct", "Brokerage %"], ["brokerageCap", "Cap per order ₹"], ["sttBuyPct", "STT buy %"], ["sttSellPct", "STT sell %"], ["exchangePct", "Exchange %"], ["sebiPct", "SEBI %"], ["stampBuyPct", "Stamp buy %"], ["dpPerScrip", "DP per scrip ₹"]].map(([k, l]) => /*#__PURE__*/React.createElement(Field, {
    key: k,
    label: l
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.0001",
    value: settings.rates[seg][k],
    onChange: e => setSettings({
      ...settings,
      rates: {
        ...settings.rates,
        [seg]: {
          ...settings.rates[seg],
          [k]: num(e.target.value)
        }
      }
    })
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "GST % on brokerage, exchange, SEBI"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: settings.rates.gstPct,
    onChange: e => setSettings({
      ...settings,
      rates: {
        ...settings.rates,
        gstPct: num(e.target.value)
      }
    })
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Restore defaults"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => setSettings({
      ...settings,
      rates: DEFAULT_RATES
    })
  }, "Reset rates")))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h2", null, "Data"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => download(`trades-${today()}.csv`, toCSV(trades, lib), "text/csv")
  }, "Export trades CSV"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => download(`regime-desk-backup-${today()}.json`, JSON.stringify({
      sessions,
      trades,
      settings,
      library: lib,
      quotes,
      watch
    }, null, 2), "application/json")
  }, "Export everything"), /*#__PURE__*/React.createElement("label", {
    className: "btn ghost",
    style: {
      display: "inline-block"
    }
  }, "Import CSV", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".csv,text/csv",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const rows = parseCSV(String(rd.result), lib);
        setTrades(p => [...p, ...rows]);
        setMsg(`Imported ${rows.length} trades.`);
      };
      rd.readAsText(f);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("label", {
    className: "btn ghost",
    style: {
      display: "inline-block"
    }
  }, "Restore a full backup", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json,application/json",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => inspectBackup(String(rd.result));
      rd.readAsText(f);
      e.target.value = "";
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      const s = makeSample();
      setSessions(s.sessions);
      setTrades(s.trades);
      setTab("signals");
      setMsg("Sample book loaded — 120 days of sessions and trades.");
    }
  }, "Load sample book"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      if (confirm("Delete every session score and trade? This cannot be undone.")) {
        setSessions([]);
        setTrades([]);
        setMsg("Cleared.");
      }
    }
  }, "Clear everything")), pendingRestore && /*#__PURE__*/React.createElement("div", {
    className: "sig high",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("b", null, "Check this before replacing anything"), /*#__PURE__*/React.createElement("p", null, "The file holds ", /*#__PURE__*/React.createElement("b", null, pendingRestore.summary.sessions, " sessions"), " (", pendingRestore.summary.sessionRange, ") and ", /*#__PURE__*/React.createElement("b", null, pendingRestore.summary.trades, " trades"), " (", pendingRestore.summary.tradeRange, "). Library: ", pendingRestore.summary.library, ". Quotes: ", pendingRestore.summary.quotes, ". Watchlist: ", pendingRestore.summary.watch, ". Capital: ", pendingRestore.summary.capital, ".", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "You currently have ", /*#__PURE__*/React.createElement("b", null, pendingRestore.summary.nowSessions, " sessions"), " and ", /*#__PURE__*/React.createElement("b", null, pendingRestore.summary.nowTrades, " trades"), ". Restoring replaces all of it — this is not a merge. A copy of what's here now will download first, so a wrong restore is undoable."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: doRestore
  }, "Replace everything"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => setPendingRestore(null)
  }, "Cancel"))), /*#__PURE__*/React.createElement("div", {
    className: "ch",
    style: {
      marginTop: 12
    }
  }, "Both exports carry today's date in the filename — ", /*#__PURE__*/React.createElement("b", null, "regime-desk-backup-", today(), ".json"), " — so weekly backups pile up beside each other instead of overwriting. Keep the last three months of weeklies, then one a month after that, and put a copy somewhere off the F drive.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "CSV columns: ", CSV_COLS.join(", "), ". Tags are separated by a pipe. Side reads Long unless the cell says Short. Import adds to what's already there."))), /*#__PURE__*/React.createElement("div", {
    className: "foot"
  }, "Score the session before the open. Log the trade at the exit. Read the signals on the weekend.")));
}
