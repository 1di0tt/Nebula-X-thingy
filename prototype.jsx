import React, { useState, useMemo, useEffect } from "react";
import {
  Home as HomeIcon, Search, Bell, User, ChevronRight, ChevronLeft, MapPin,
  Clock, AlertTriangle, Bus, TrainFront, ArrowUpDown, Navigation2, Settings,
  Star, X, CheckCircle2, Info, Megaphone, Users, Signal, ChevronDown, Zap
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA — mocked to stand in for LTA DataMall service alert / arrival */
/*  / bus / GeoJSON feeds referenced in the problem statement.         */
/* ------------------------------------------------------------------ */

const LINES = [
  { id: "NSL", name: "North South Line", color: "#E1251B", status: "delay",
    note: "Add ~5 min journey time, Toa Payoh \u2194 Novena" },
  { id: "EWL", name: "East West Line", color: "#009645", status: "normal", note: "Service running normally" },
  { id: "NEL", name: "North East Line", color: "#9900AA", status: "normal", note: "Service running normally" },
  { id: "CCL", name: "Circle Line", color: "#FFC61E", status: "disruption",
    note: "Signal fault, Bishan \u2194 Paya Lebar" },
  { id: "DTL", name: "Downtown Line", color: "#005EC4", status: "normal", note: "Service running normally" },
  { id: "TEL", name: "Thomson-East Coast Line", color: "#9D5B25", status: "normal", note: "Service running normally" },
];

const LINE_MAP = Object.fromEntries(LINES.map(l => [l.id, l]));

const STATIONS = [
  { name: "Jurong East", lines: ["NSL", "EWL"] },
  { name: "Woodlands", lines: ["NSL", "TEL"] },
  { name: "Ang Mo Kio", lines: ["NSL"] },
  { name: "Toa Payoh", lines: ["NSL"] },
  { name: "Novena", lines: ["NSL"] },
  { name: "Orchard", lines: ["NSL", "TEL"] },
  { name: "City Hall", lines: ["NSL", "EWL"] },
  { name: "Marina Bay", lines: ["NSL"] },
  { name: "Pasir Ris", lines: ["EWL"] },
  { name: "Tampines", lines: ["EWL"] },
  { name: "Paya Lebar", lines: ["EWL", "CCL"] },
  { name: "Bugis", lines: ["EWL", "DTL"] },
  { name: "Raffles Place", lines: ["EWL", "NSL"] },
  { name: "Boon Lay", lines: ["EWL"] },
  { name: "HarbourFront", lines: ["NEL", "CCL"] },
  { name: "Chinatown", lines: ["NEL", "DTL"] },
  { name: "Dhoby Ghaut", lines: ["NEL", "CCL", "NSL"] },
  { name: "Little India", lines: ["NEL", "DTL"] },
  { name: "Serangoon", lines: ["NEL", "CCL"] },
  { name: "Punggol", lines: ["NEL"] },
  { name: "Bras Basah", lines: ["CCL"] },
  { name: "Bishan", lines: ["CCL", "NSL"] },
  { name: "MacPherson", lines: ["CCL", "DTL"] },
  { name: "Newton", lines: ["DTL", "NSL"] },
  { name: "Botanic Gardens", lines: ["DTL", "CCL"] },
  { name: "Bukit Panjang", lines: ["DTL"] },
  { name: "Expo", lines: ["DTL"] },
  { name: "Caldecott", lines: ["TEL", "CCL"] },
  { name: "Outram Park", lines: ["TEL", "NEL", "EWL"] },
  { name: "Gardens by the Bay", lines: ["TEL"] },
];

const DISRUPTED_ZONE = ["Bishan", "Bras Basah", "Serangoon", "Paya Lebar", "MacPherson", "Dhoby Ghaut", "HarbourFront"];

const ALERTS = [
  {
    id: 1, line: "CCL", severity: "high", time: "2 min ago",
    title: "Service disruption",
    body: "Signal fault detected between Bishan and Paya Lebar. Trains are running at reduced frequency in both directions.",
    stations: ["Bishan", "Marymount", "Caldecott", "Botanic Gardens", "Farrer Road", "Holland Village", "Buona Vista", "one-north", "Kent Ridge", "Haw Par Villa", "Pasir Panjang", "Labrador Park", "Telok Blangah", "HarbourFront", "Bras Basah", "Esplanade", "Promenade", "Nicoll Highway", "Stadium", "Mountbatten", "Dakota", "Paya Lebar"],
    alt: "Bridging bus 153 is running between Bishan and Paya Lebar. Or transfer via EWL at Paya Lebar \u2192 NSL at City Hall.",
  },
  {
    id: 2, line: "NSL", severity: "low", time: "14 min ago",
    title: "Minor delay",
    body: "Earlier train fault near Toa Payoh has been cleared. Expect residual delays of about 5 minutes.",
    stations: ["Toa Payoh", "Novena"],
    alt: "No action needed \u2014 delay is minor and easing.",
  },
  {
    id: 3, line: "DTL", severity: "info", time: "1 hr ago",
    title: "Planned early closure \u2014 this Saturday",
    body: "Last train will leave 30 minutes earlier between Bukit Panjang and Botanic Gardens for signalling works.",
    stations: ["Bukit Panjang", "Cashew", "Hillview", "Beauty World", "King Albert Park", "Sixth Avenue", "Tan Kah Kee", "Botanic Gardens"],
    alt: "Plan to catch the last train by 11.00pm, or use bus 963/975 as a late-night alternative.",
  },
  {
    id: 4, line: "EWL", severity: "resolved", time: "38 min ago",
    title: "Delay resolved",
    body: "The earlier signalling delay near Tanah Merah has been fully resolved. Service has returned to normal.",
    stations: ["Tanah Merah"],
    alt: "No action needed.",
  },
];

const SEVERITY_STYLE = {
  high: { color: "#FF5A5F", label: "Disruption" },
  low: { color: "#FFB020", label: "Minor delay" },
  info: { color: "#4DA3FF", label: "Planned works" },
  resolved: { color: "#3ECF8E", label: "Resolved" },
};

const SAVED_ROUTE = { from: "Bishan", to: "Paya Lebar", label: "Home \u2192 Work", time: "6:45pm" };

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function crowdFor(seed) {
  const levels = ["Low", "Moderate", "High"];
  return levels[seed % 3];
}
function crowdColor(level) {
  return level === "Low" ? "#3ECF8E" : level === "Moderate" ? "#FFB020" : "#FF5A5F";
}

function buildRoutes(from, to) {
  const affected = DISRUPTED_ZONE.includes(from) && DISRUPTED_ZONE.includes(to);
  const seed = (from.length + to.length) || 5;

  if (affected) {
    return [
      {
        id: "direct", mode: "train", label: "Circle Line (Direct)", tag: "avoid",
        duration: "27 min", crowd: "High", legs: [{ icon: "train", text: `${from} \u2192 ${to} on CCL`, line: "CCL" }],
        note: "Passes through the disrupted section \u2014 expect long waits.",
      },
      {
        id: "bridge", mode: "mixed", label: "CCL to Paya Lebar + bridging bus", tag: "recommended",
        duration: "19 min", crowd: "Moderate",
        legs: [
          { icon: "train", text: `${from} \u2192 Paya Lebar on CCL (part-running)`, line: "CCL" },
          { icon: "bus", text: "Bridging bus 153 to affected stations", line: null },
        ],
        note: "Fastest reliable option while the fault is being cleared.",
      },
      {
        id: "walk", mode: "bus", label: "EWL transfer via City Hall", tag: null,
        duration: "24 min", crowd: "Low",
        legs: [
          { icon: "train", text: `${from} \u2192 Dhoby Ghaut on NSL`, line: "NSL" },
          { icon: "train", text: `Dhoby Ghaut \u2192 City Hall \u2192 Paya Lebar on EWL`, line: "EWL" },
        ],
        note: "Longer, but avoids the disrupted section entirely.",
      },
    ];
  }

  const fromLine = STATIONS.find(s => s.name === from)?.lines?.[0] || "NSL";
  return [
    {
      id: "direct", mode: "train", label: `Direct on ${LINE_MAP[fromLine]?.name || fromLine}`, tag: "recommended",
      duration: `${14 + (seed % 6)} min`, crowd: crowdFor(seed), legs: [{ icon: "train", text: `${from} \u2192 ${to}`, line: fromLine }],
      note: "Fastest option right now.",
    },
    {
      id: "alt", mode: "mixed", label: "Transfer via interchange", tag: null,
      duration: `${18 + (seed % 6)} min`, crowd: crowdFor(seed + 1),
      legs: [{ icon: "train", text: `${from} \u2192 interchange`, line: fromLine }, { icon: "train", text: `interchange \u2192 ${to}`, line: "EWL" }],
      note: "One transfer, usually less crowded.",
    },
    {
      id: "bus", mode: "bus", label: "Bus \u2014 no train needed", tag: null,
      duration: `${26 + (seed % 8)} min`, crowd: crowdFor(seed + 2),
      legs: [{ icon: "bus", text: `${from} \u2192 ${to} direct bus`, line: null }],
      note: "Above-ground option, good in wet weather.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  SMALL UI PRIMITIVES                                                */
/* ------------------------------------------------------------------ */

function LineDot({ id, size = 8 }) {
  const l = LINE_MAP[id];
  if (!l) return null;
  return <span style={{ width: size, height: size, borderRadius: 999, background: l.color, display: "inline-block", flexShrink: 0 }} />;
}

function CrowdBars({ level }) {
  const heights = [5, 9, 13];
  const active = level === "Low" ? 1 : level === "Moderate" ? 2 : 3;
  const col = crowdColor(level);
  return (
    <div className="flex items-end gap-0.5">
      {heights.map((h, i) => (
        <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < active ? col : "#2A303C" }} />
      ))}
    </div>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div className="absolute left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full"
      style={{ bottom: 96, transform: "translateX(-50%)", background: "#1A1F29", border: "1px solid #2A303C", boxShadow: "0 12px 24px rgba(0,0,0,0.4)" }}>
      <CheckCircle2 size={15} style={{ color: "#3ECF8E" }} />
      <span className="text-xs font-medium" style={{ color: "#E8EAED", whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREENS                                                            */
/* ------------------------------------------------------------------ */

function LineTicker({ onPick }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wide" style={{ color: "#7C8592" }}>NETWORK STATUS</span>
        <span className="font-mono text-[10px]" style={{ color: "#4A5261" }}>LIVE</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {LINES.map(l => (
          <button key={l.id} onClick={() => onPick(l)} className="flex items-center gap-3 w-full text-left">
            <span className="font-mono text-[11px] font-semibold w-9" style={{ color: l.color }}>{l.id}</span>
            <div className="flex-1 h-1.5 rounded-full relative overflow-hidden" style={{ background: "#1E232D" }}>
              <div className="h-full rounded-full" style={{ width: "100%", background: l.color, opacity: l.status === "normal" ? 0.9 : 0.35 }} />
              {l.status !== "normal" && (
                <div className="absolute top-1/2 h-2.5 w-2.5 rounded-full animate-pulse"
                  style={{ left: "60%", transform: "translate(-50%,-50%)", background: l.status === "disruption" ? "#FF5A5F" : "#FFB020", boxShadow: `0 0 0 3px ${l.status === "disruption" ? "#FF5A5F33" : "#FFB02033"}` }} />
              )}
            </div>
            <ChevronRight size={14} style={{ color: "#4A5261" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeScreen({ savedAffected, onOpenAlert, onGoToPlan, onReport, onPickLine }) {
  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      <div>
        <div className="text-xs font-mono" style={{ color: "#4A5261" }}>THU 27 AUG &middot; 6:12 PM</div>
        <div className="font-display text-2xl font-bold mt-1" style={{ color: "#E8EAED" }}>Good evening.</div>
      </div>

      {savedAffected && (
        <button onClick={onOpenAlert} className="text-left rounded-2xl p-4 flex gap-3 items-start"
          style={{ background: "linear-gradient(135deg, #2A1416, #1A1214)", border: "1px solid #4A1F22" }}>
          <div className="mt-0.5 rounded-full p-1.5" style={{ background: "#FF5A5F22" }}>
            <AlertTriangle size={16} style={{ color: "#FF5A5F" }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: "#FFD6D7" }}>Your {SAVED_ROUTE.time} commute is affected</div>
            <div className="text-xs mt-1 leading-relaxed" style={{ color: "#C9A6A8" }}>
              {SAVED_ROUTE.label} runs via Circle Line, currently disrupted. Tap for a proactive alternate route.
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "#C9A6A8", marginTop: 2 }} />
        </button>
      )}

      <button onClick={onGoToPlan} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
        <Search size={16} style={{ color: "#7C8592" }} />
        <span className="text-sm" style={{ color: "#7C8592" }}>Where are you headed?</span>
      </button>

      <LineTicker onPick={onPickLine} />

      <div className="rounded-2xl p-4" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wide" style={{ color: "#7C8592" }}>CROWD RIGHT NOW</span>
          <Users size={13} style={{ color: "#4A5261" }} />
        </div>
        <div className="flex flex-col gap-3">
          {[["Bishan", "NSL/CCL", "High"], ["Paya Lebar", "EWL/CCL", "Moderate"], ["Jurong East", "NSL/EWL", "Low"]].map(([st, ln, lvl]) => (
            <div key={st} className="flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: "#E8EAED" }}>{st}</div>
                <div className="text-[11px] font-mono" style={{ color: "#4A5261" }}>{ln}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: crowdColor(lvl) }}>{lvl}</span>
                <CrowdBars level={lvl} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReport} className="rounded-2xl p-3.5 flex items-center justify-center gap-2"
        style={{ background: "#12161F", border: "1px dashed #2A303C" }}>
        <Megaphone size={15} style={{ color: "#7C8592" }} />
        <span className="text-xs font-medium" style={{ color: "#7C8592" }}>See something? Report it to LTOC</span>
      </button>
    </div>
  );
}

function PlanScreen({ from, to, setFrom, setTo, routes, onSearch, onSelect, focusField, setFocusField, savedAffected }) {
  const suggestions = focusField
    ? STATIONS.filter(s => s.name.toLowerCase().includes((focusField === "from" ? from : to).toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="px-5 pt-6 flex flex-col gap-4">
      <div className="font-display text-xl font-bold" style={{ color: "#E8EAED" }}>Plan a journey</div>

      <div className="rounded-2xl p-3.5" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
        <div className="flex items-center gap-3 py-2">
          <div className="flex flex-col items-center" style={{ width: 14 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#3ECF8E" }} />
            <span style={{ width: 1, height: 20, background: "#2A303C", margin: "3px 0" }} />
            <span style={{ width: 7, height: 7, borderRadius: 2, background: "#FF5A5F" }} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input value={from} onChange={e => setFrom(e.target.value)} onFocus={() => setFocusField("from")}
              placeholder="From" className="bg-transparent text-sm outline-none w-full" style={{ color: "#E8EAED" }} />
            <div style={{ height: 1, background: "#1E232D" }} />
            <input value={to} onChange={e => setTo(e.target.value)} onFocus={() => setFocusField("to")}
              placeholder="To" className="bg-transparent text-sm outline-none w-full" style={{ color: "#E8EAED" }} />
          </div>
          <button onClick={() => { const t = from; setFrom(to); setTo(t); }} className="p-1.5 rounded-full" style={{ background: "#1A1F29" }}>
            <ArrowUpDown size={13} style={{ color: "#7C8592" }} />
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 border-t pt-2" style={{ borderColor: "#1E232D" }}>
            {suggestions.map(s => (
              <button key={s.name} onClick={() => { focusField === "from" ? setFrom(s.name) : setTo(s.name); setFocusField(null); }}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg text-left" style={{ background: "#0F131B" }}>
                <span className="text-sm" style={{ color: "#E8EAED" }}>{s.name}</span>
                <div className="flex gap-1">{s.lines.map(l => <LineDot key={l} id={l} size={7} />)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setFrom(SAVED_ROUTE.from); setTo(SAVED_ROUTE.to); }}
          className="text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "#1A1F29", color: "#9BA4B0", border: "1px solid #2A303C" }}>
          Home &rarr; Work
        </button>
        <button onClick={() => { setFrom("Jurong East"); setTo("HarbourFront"); }}
          className="text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "#1A1F29", color: "#9BA4B0", border: "1px solid #2A303C" }}>
          Jurong East &rarr; HarbourFront
        </button>
      </div>

      <button onClick={onSearch} disabled={!from || !to} className="rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold"
        style={{ background: from && to ? "#E8EAED" : "#1A1F29", color: from && to ? "#0B0E14" : "#4A5261" }}>
        <Navigation2 size={14} /> Find routes
      </button>

      {routes && (
        <div className="flex flex-col gap-3 mt-1">
          {savedAffected && from === SAVED_ROUTE.from && to === SAVED_ROUTE.to && (
            <div className="flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl" style={{ background: "#2A1416", color: "#FF9B9E", border: "1px solid #4A1F22" }}>
              <Zap size={12} /> Routes adjusted for the live Circle Line disruption
            </div>
          )}
          {routes.map(r => (
            <button key={r.id} onClick={() => onSelect(r)} className="text-left rounded-2xl p-4 flex flex-col gap-2.5"
              style={{
                background: "#12161F",
                border: r.tag === "recommended" ? "1px solid #3ECF8E55" : r.tag === "avoid" ? "1px solid #FF5A5F33" : "1px solid #1E232D",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.mode === "bus" ? <Bus size={15} style={{ color: "#7C8592" }} /> : <TrainFront size={15} style={{ color: "#7C8592" }} />}
                  <span className="text-sm font-semibold" style={{ color: "#E8EAED" }}>{r.label}</span>
                </div>
                {r.tag === "recommended" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#3ECF8E22", color: "#3ECF8E" }}>RECOMMENDED</span>}
                {r.tag === "avoid" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FF5A5F22", color: "#FF5A5F" }}>AVOID</span>}
              </div>

              <div className="flex flex-col gap-1.5 pl-1">
                {r.legs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#9BA4B0" }}>
                    {leg.line && <LineDot id={leg.line} size={7} />}
                    {!leg.line && <Bus size={11} style={{ color: "#7C8592" }} />}
                    <span>{leg.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 mt-0.5 border-t" style={{ borderColor: "#1E232D" }}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "#E8EAED" }}><Clock size={11} /> {r.duration}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: crowdColor(r.crowd) }}><Users size={11} /> {r.crowd}</span>
                </div>
                <ChevronRight size={14} style={{ color: "#4A5261" }} />
              </div>
              <div className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>{r.note}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsScreen({ expanded, setExpanded }) {
  return (
    <div className="px-5 pt-6 flex flex-col gap-3">
      <div className="font-display text-xl font-bold mb-1" style={{ color: "#E8EAED" }}>Service alerts</div>
      {ALERTS.map(a => {
        const sev = SEVERITY_STYLE[a.severity];
        const isOpen = expanded === a.id;
        return (
          <div key={a.id} className="rounded-2xl overflow-hidden" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
            <button onClick={() => setExpanded(isOpen ? null : a.id)} className="w-full text-left p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LineDot id={a.line} size={9} />
                  <span className="text-xs font-mono font-semibold" style={{ color: LINE_MAP[a.line].color }}>{a.line}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sev.color + "22", color: sev.color }}>{sev.label}</span>
                </div>
                <ChevronDown size={14} style={{ color: "#4A5261", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: "#E8EAED" }}>{a.title}</div>
              <div className="text-[11px] font-mono" style={{ color: "#4A5261" }}>{a.time}</div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid #1E232D" }}>
                <div className="text-xs leading-relaxed pt-3" style={{ color: "#9BA4B0" }}>{a.body}</div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>
                  <span className="font-semibold" style={{ color: "#7C8592" }}>Affected: </span>
                  {a.stations.slice(0, 4).join(", ")}{a.stations.length > 4 ? ` +${a.stations.length - 4} more` : ""}
                </div>
                <div className="rounded-xl p-3 flex gap-2" style={{ background: "#0F131B" }}>
                  <Info size={13} style={{ color: "#4DA3FF", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-[11px] leading-relaxed" style={{ color: "#B8C0CC" }}>{a.alt}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full flex items-center justify-center" style={{ width: 52, height: 52, background: "#1A1F29" }}>
          <User size={22} style={{ color: "#7C8592" }} />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "#E8EAED" }}>Commuter</div>
          <div className="text-xs" style={{ color: "#7C8592" }}>Notifications on for saved routes</div>
        </div>
      </div>

      <div className="rounded-2xl p-1" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <Star size={14} style={{ color: "#FFB020" }} />
            <span className="text-sm" style={{ color: "#E8EAED" }}>Saved: {SAVED_ROUTE.label}</span>
          </div>
          <ChevronRight size={14} style={{ color: "#4A5261" }} />
        </div>
        <div style={{ height: 1, background: "#1E232D" }} />
        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <Bell size={14} style={{ color: "#7C8592" }} />
            <span className="text-sm" style={{ color: "#E8EAED" }}>Proactive disruption alerts</span>
          </div>
          <div className="rounded-full p-0.5 flex" style={{ width: 34, height: 19, background: "#3ECF8E" }}>
            <div className="rounded-full" style={{ width: 15, height: 15, background: "#0B0E14", marginLeft: "auto" }} />
          </div>
        </div>
        <div style={{ height: 1, background: "#1E232D" }} />
        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <Settings size={14} style={{ color: "#7C8592" }} />
            <span className="text-sm" style={{ color: "#E8EAED" }}>Preferences</span>
          </div>
          <ChevronRight size={14} style={{ color: "#4A5261" }} />
        </div>
      </div>

      <div className="rounded-2xl p-4 text-[11px] leading-relaxed" style={{ background: "#12161F", border: "1px solid #1E232D", color: "#6B7280" }}>
        NEBULA X &middot; Problem Statement 02 &mdash; Smart Travel Companion. Demo data stands in for live MRT service alerts, bus routing and real-time arrival feeds.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  REPORT MODAL                                                       */
/* ------------------------------------------------------------------ */

function ReportModal({ onClose, onSubmit }) {
  const [cat, setCat] = useState(null);
  const cats = [
    { id: "crowd", label: "Crowded", icon: Users },
    { id: "delay", label: "Delay", icon: Clock },
    { id: "clean", label: "Cleanliness", icon: Info },
    { id: "safety", label: "Safety", icon: AlertTriangle },
  ];
  return (
    <div className="absolute inset-0 z-40 flex items-end" style={{ background: "#000000AA" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full rounded-t-3xl p-5 flex flex-col gap-4" style={{ background: "#12161F", border: "1px solid #1E232D" }}>
        <div className="flex items-center justify-between">
          <span className="font-display text-base font-bold" style={{ color: "#E8EAED" }}>Report to LTOC</span>
          <button onClick={onClose}><X size={16} style={{ color: "#7C8592" }} /></button>
        </div>
        <div className="text-xs" style={{ color: "#7C8592" }}>Your report helps operators spot issues before they escalate.</div>
        <div className="grid grid-cols-2 gap-2">
          {cats.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className="flex items-center gap-2 rounded-xl px-3 py-3"
              style={{ background: cat === c.id ? "#1A2A24" : "#0F131B", border: cat === c.id ? "1px solid #3ECF8E55" : "1px solid #1E232D" }}>
              <c.icon size={14} style={{ color: cat === c.id ? "#3ECF8E" : "#7C8592" }} />
              <span className="text-xs font-medium" style={{ color: "#E8EAED" }}>{c.label}</span>
            </button>
          ))}
        </div>
        <button disabled={!cat} onClick={() => onSubmit(cat)} className="rounded-2xl py-3 text-sm font-semibold"
          style={{ background: cat ? "#E8EAED" : "#1A1F29", color: cat ? "#0B0E14" : "#4A5261" }}>
          Submit report
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP SHELL                                                          */
/* ------------------------------------------------------------------ */

export default function App() {
  const [tab, setTab] = useState("home");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [focusField, setFocusField] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState("");

  const savedAffected = LINE_MAP["CCL"].status !== "normal";

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const goPlanWithSaved = () => {
    setFrom(SAVED_ROUTE.from);
    setTo(SAVED_ROUTE.to);
    setRoutes(buildRoutes(SAVED_ROUTE.from, SAVED_ROUTE.to));
    setTab("plan");
  };

  const NAV = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "plan", label: "Plan", icon: Search },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 820, background: "transparent" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display{ font-family:'Space Grotesk', sans-serif; }
        * { font-family:'Inter', sans-serif; }
        .font-mono, .font-mono * { font-family:'IBM Plex Mono', monospace; }
        ::-webkit-scrollbar{ display:none; }
      `}</style>

      <div className="relative" style={{ width: 390, height: 800, background: "#0B0E14", borderRadius: 44, overflow: "hidden", border: "8px solid #1A1F29", boxShadow: "0 40px 90px rgba(0,0,0,0.55)" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 130, height: 26, background: "#1A1F29", borderRadius: "0 0 18px 18px", zIndex: 50 }} />

        <div className="h-full w-full overflow-y-auto" style={{ paddingBottom: 96 }}>
          {tab === "home" && (
            <HomeScreen
              savedAffected={savedAffected}
              onOpenAlert={() => { setTab("alerts"); setExpandedAlert(1); }}
              onGoToPlan={() => setTab("plan")}
              onReport={() => setReportOpen(true)}
              onPickLine={(l) => { setTab("alerts"); const a = ALERTS.find(al => al.line === l.id); if (a) setExpandedAlert(a.id); }}
            />
          )}
          {tab === "plan" && (
            <PlanScreen
              from={from} to={to} setFrom={setFrom} setTo={setTo}
              routes={routes}
              onSearch={() => setRoutes(buildRoutes(from, to))}
              onSelect={(r) => setToast(`Navigating: ${r.label}`)}
              focusField={focusField} setFocusField={setFocusField}
              savedAffected={savedAffected}
            />
          )}
          {tab === "alerts" && <AlertsScreen expanded={expandedAlert} setExpanded={setExpandedAlert} />}
          {tab === "profile" && <ProfileScreen />}
        </div>

        <Toast text={toast} />
        {reportOpen && (
          <ReportModal
            onClose={() => setReportOpen(false)}
            onSubmit={() => { setReportOpen(false); setToast("Reported \u2014 thanks for helping operators"); }}
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2"
          style={{ height: 78, paddingBottom: 18, background: "#0D1017EE", borderTop: "1px solid #1A1F29", backdropFilter: "blur(8px)" }}>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-1 px-3 py-1">
                <n.icon size={19} style={{ color: active ? "#E8EAED" : "#4A5261" }} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-medium" style={{ color: active ? "#E8EAED" : "#4A5261" }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}