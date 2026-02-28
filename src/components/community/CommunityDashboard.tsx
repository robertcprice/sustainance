'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const I = ({ d, w = 18, h = 18, color = "currentColor", style = {} }: { d: React.ReactNode; w?: number; h?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const Icons = {
  leaf: (p: Record<string, unknown>) => <I {...p} d={<><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-1.1 5.7-4.3 11.3A7 7 0 0 1 11 20z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>} />,
  globe: (p: Record<string, unknown>) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></>} />,
  trending: (p: Record<string, unknown>) => <I {...p} d={<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>} />,
  award: (p: Record<string, unknown>) => <I {...p} d={<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>} />,
  building: (p: Record<string, unknown>) => <I {...p} d={<><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></>} />,
  mapPin: (p: Record<string, unknown>) => <I {...p} d={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>} />,
  search: (p: Record<string, unknown>) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>} />,
  handshake: (p: Record<string, unknown>) => <I {...p} d={<><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></>} />,
  arrowUpRight: (p: Record<string, unknown>) => <I {...p} d={<><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>} />,
  zap: (p: Record<string, unknown>) => <I {...p} d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  star: (p: Record<string, unknown>) => <I {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />,
  barChart: (p: Record<string, unknown>) => <I {...p} d={<><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>} />,
  msgCircle: (p: Record<string, unknown>) => <I {...p} d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  send: (p: Record<string, unknown>) => <I {...p} d={<><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>} />,
  x: (p: Record<string, unknown>) => <I {...p} d={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} />,
  check: (p: Record<string, unknown>) => <I {...p} d="M20 6 9 17l-5-5" />,
  chevDown: (p: Record<string, unknown>) => <I {...p} d="m6 9 6 6 6-6" />,
  target: (p: Record<string, unknown>) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} />,
  heart: (p: Record<string, unknown>) => <I {...p} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  sprout: (p: Record<string, unknown>) => <I {...p} d={<><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></>} />,
  plus: (p: Record<string, unknown>) => <I {...p} d={<><path d="M5 12h14"/><path d="M12 5v14"/></>} />,
  minus: (p: Record<string, unknown>) => <I {...p} d="M5 12h14" />,
  arrowLeft: (p: Record<string, unknown>) => <I {...p} d={<><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>} />,
  flag: (p: Record<string, unknown>) => <I {...p} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></>} />,
  home: (p: Record<string, unknown>) => <I {...p} d={<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />,
  rocket: (p: Record<string, unknown>) => <I {...p} d={<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>} />,
};

// ─── TYPES ───────────────────────────────────────────

interface Leader {
  rank: number;
  co: string;
  ind: string;
  reg: string;
  score: number;
  chg: number;
  logo: string;
  emp: string;
  hl: string[];
}

interface Region {
  region: string;
  score: number;
  top: string;
  n: number;
}

interface Achievement {
  co: string;
  logo: string;
  text: string;
  date: string;
  type: string;
  impact: string;
}

interface GlobalStats {
  score: number;
  change: number;
  companies: number;
  assessments: number;
  avgReadiness: number;
  topIndustryScore: number;
}

// ─── DATA HOOK ───────────────────────────────────────

function useCommunityData() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [global, setGlobal] = useState<GlobalStats>({ score: 0, change: 0, companies: 0, assessments: 0, avgReadiness: 0, topIndustryScore: 0 });
  const [loading, setLoading] = useState(true);
  const [yourScore, setYourScore] = useState(65);
  const [yourCompany, setYourCompany] = useState("Your Company");

  useEffect(() => {
    Promise.all([
      fetch('/api/community').then(r => r.ok ? r.json() : null),
      fetch('/api/dashboard').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([community, dashboard]) => {
      if (community) {
        setLeaders(community.companies.map((c: { rank: number; name: string; industry: string; region: string; score: number; scoreChange: number; logo: string; employees: string; highlights: string[] }) => ({
          rank: c.rank, co: c.name, ind: c.industry, reg: c.region,
          score: c.score, chg: c.scoreChange, logo: c.logo, emp: c.employees, hl: c.highlights,
        })));
        setRegions(community.regions.map((r: { name: string; score: number; topCompany: string; companyCount: number }) => ({
          region: r.name, score: r.score, top: r.topCompany, n: r.companyCount,
        })));
        setAchievements(community.achievements.map((a: { company: string; logo: string; text: string; date: string; type: string; impact: string }) => ({
          co: a.company, logo: a.logo, text: a.text, date: a.date, type: a.type, impact: a.impact,
        })));
        setGlobal({
          score: community.global.globalScore,
          change: community.global.scoreChange,
          companies: community.global.totalCompanies,
          assessments: community.global.totalAssessments,
          avgReadiness: community.global.avgReadiness,
          topIndustryScore: community.global.topIndustryScore,
        });
      }
      if (dashboard?.overallReadiness) {
        setYourScore(dashboard.overallReadiness);
      }
      if (dashboard?.company?.name) {
        setYourCompany(dashboard.company.name);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return { leaders, regions, achievements, global, loading, yourScore, yourCompany };
}

const INDS = ["All Industries", "Energy", "Technology", "Manufacturing", "Retail", "Healthcare"];
const REGS_F = ["All Regions", "North America", "Western Europe", "Northern Europe", "East Asia", "South America"];

function getGreennessFilters(yourScore: number) {
  return [
    { id: "all", label: "All Companies", desc: "No greenness filter", color: "#64748B" },
    { id: "equals", label: "Similar Greenness", desc: `Score within \u00B115 of yours (${yourScore})`, color: "#059669" },
    { id: "greener", label: "Greener Than You", desc: `Score above ${yourScore}`, color: "#0891B2" },
    { id: "developing", label: "Less Green (Mentor)", desc: `Score below ${yourScore}`, color: "#D97706" },
  ];
}

const BADGES: Record<string, { label: string; bg: string; fg: string; icon: string }> = {
  milestone: { label: "Milestone", bg: "#D1FAE5", fg: "#065F46", icon: "star" },
  certification: { label: "Certification", bg: "#DBEAFE", fg: "#1E40AF", icon: "award" },
  reporting: { label: "Reporting", bg: "#EDE9FE", fg: "#5B21B6", icon: "barChart" },
  product: { label: "Product", bg: "#FEF3C7", fg: "#92400E", icon: "zap" },
};

// ─── COMPONENTS ──────────────────────────────────────

function AnimNum({ value, dec = 1, suf = "" }: { value: number; dec?: number; suf?: string }) {
  const [d, setD] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return; ran.current = true;
    let s: number | null = null;
    const go = (t: number) => { if (!s) s = t; const p = Math.min((t - s) / 1400, 1); setD((1 - Math.pow(1 - p, 3)) * value); if (p < 1) requestAnimationFrame(go); };
    requestAnimationFrame(go);
  }, [value]);
  return <>{d.toFixed(dec)}{suf}</>;
}

function Ring({ score, size = 210 }: { score: number; size?: number }) {
  const sw = 14, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const [o, setO] = useState(c);
  useEffect(() => { setTimeout(() => setO(c - (score / 100) * c), 300); }, [score, c]);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#D1FAE5" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#059669" strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: "#065F46" }}><AnimNum value={score} /></span>
        <span style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 2, marginTop: 2 }}>Global Index</span>
      </div>
    </div>
  );
}

function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW((value / max) * 100), 150); }, [value, max]);
  return (
    <div style={{ width: "100%", height: 10, backgroundColor: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, backgroundColor: `hsl(${Math.round((value/max)*140)},72%,40%)`, borderRadius: 99, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const color = score >= 80 ? "#059669" : score >= 60 ? "#0891B2" : score >= 40 ? "#D97706" : "#DC2626";
  const bg = score >= 80 ? "#D1FAE5" : score >= 60 ? "#CFFAFE" : score >= 40 ? "#FEF3C7" : "#FEE2E2";
  const sz = size === "sm" ? { fontSize: 13, padding: "2px 8px" } : { fontSize: 16, padding: "4px 12px" };
  return <span style={{ ...sz, borderRadius: 8, fontWeight: 800, color, backgroundColor: bg }}>{score}</span>;
}

// ─── STYLES ──────────────────────────────────────────

const cardS: React.CSSProperties = { backgroundColor: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)", border: "1px solid rgba(16,185,129,0.1)", borderRadius: 20 };
const hov = (e: React.MouseEvent, up: boolean) => { (e.currentTarget as HTMLElement).style.transform = up ? "translateY(-2px)" : ""; (e.currentTarget as HTMLElement).style.boxShadow = up ? "0 8px 32px rgba(5,150,105,0.08)" : ""; };

// ─── CAMPAIGN BUILDER TAB ────────────────────────────

function CampaignBuilder({ invited, setInvited, allCompanies, onBack, yourScore, yourCompany }: {
  invited: Leader[];
  setInvited: React.Dispatch<React.SetStateAction<Leader[]>>;
  allCompanies: Leader[];
  onBack: () => void;
  onAddMore: () => void;
  yourScore: number;
  yourCompany: string;
}) {
  const GREENNESS_FILTERS = getGreennessFilters(yourScore);
  const [campaignName, setCampaignName] = useState("");
  const [greenFilter, setGreenFilter] = useState("all");
  const [includeInternal, setIncludeInternal] = useState(false);
  const [message, setMessage] = useState("");
  const [indFilter, setIndFilter] = useState("All Industries");
  const [searchQ, setSearchQ] = useState("");
  const [sent, setSent] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);

  const applyGreenFilter = (list: Leader[]) => {
    if (greenFilter === "equals") return list.filter(c => Math.abs(c.score - yourScore) <= 15);
    if (greenFilter === "greener") return list.filter(c => c.score > yourScore);
    if (greenFilter === "developing") return list.filter(c => c.score < yourScore);
    return list;
  };

  const browsable = applyGreenFilter(
    allCompanies.filter(c =>
      (indFilter === "All Industries" || c.ind === indFilter) &&
      (!searchQ || c.co.toLowerCase().includes(searchQ.toLowerCase())) &&
      !invited.find(inv => inv.co === c.co)
    )
  );

  const removeInvited = (co: Leader) => setInvited(prev => prev.filter(c => c.co !== co.co));
  const addInvited = (co: Leader) => setInvited(prev => [...prev, co]);

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", backgroundColor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          {Icons.rocket({ w: 40, h: 40, color: "#059669" })}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#064E3B", margin: "0 0 8px" }}>Campaign Launched!</h2>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 8px" }}>
          <strong>&ldquo;{campaignName || "Green Campaign"}&rdquo;</strong> has been sent to <strong>{invited.length} {invited.length === 1 ? "company" : "companies"}</strong>
          {includeInternal ? " plus your internal teams" : ""}.
        </p>
        <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 32 }}>Recipients will be notified and can respond within 48 hours.</p>
        <button onClick={onBack} style={{ padding: "14px 32px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: 16, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #E2E8F0", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          {Icons.arrowLeft({ w: 18, h: 18, color: "#475569" })}
        </button>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#064E3B", margin: 0 }}>Campaign Builder</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Configure your green campaign, select partners, and launch</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

        {/* LEFT: Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Campaign Name */}
          <div style={{ ...cardS, padding: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Campaign Name</label>
            <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
              placeholder="e.g. Q2 Sustainability Sprint, Cross-Industry Green Challenge..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#1E293B", boxSizing: "border-box" }} />
          </div>

          {/* Greenness Filter */}
          <div style={{ ...cardS, padding: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>Partner Greenness Level</label>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 16px" }}>Filter which companies you want to collaborate with based on their green score relative to yours ({yourScore})</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {GREENNESS_FILTERS.map(gf => (
                <button key={gf.id} onClick={() => setGreenFilter(gf.id)} style={{
                  padding: 14, borderRadius: 14, textAlign: "left" as const, cursor: "pointer", fontFamily: "inherit",
                  border: greenFilter === gf.id ? `2px solid ${gf.color}` : "2px solid #E2E8F0",
                  backgroundColor: greenFilter === gf.id ? gf.color + "08" : "#fff",
                  transition: "all 0.15s"
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: greenFilter === gf.id ? gf.color : "#475569" }}>{gf.label}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{gf.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Internal Campaign Toggle */}
          <div style={{ ...cardS, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {Icons.home({ w: 20, h: 20, color: "#7C3AED" })}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Include Internal Campaign</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Also run this campaign within {yourCompany}&apos;s own teams</div>
                </div>
              </div>
              <button onClick={() => setIncludeInternal(!includeInternal)} style={{
                width: 52, height: 28, borderRadius: 99, border: "none", cursor: "pointer", padding: 2,
                backgroundColor: includeInternal ? "#059669" : "#CBD5E1", transition: "background-color 0.2s",
                display: "flex", alignItems: "center",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transform: includeInternal ? "translateX(24px)" : "translateX(0)",
                  transition: "transform 0.2s"
                }} />
              </button>
            </div>
            {includeInternal && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: "#F5F3FF", border: "1px solid #EDE9FE" }}>
                <div style={{ fontSize: 12, color: "#7C3AED", fontWeight: 600, marginBottom: 4 }}>Internal teams will receive:</div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                  An internal version of your campaign with team-level skill gap benchmarking, department challenges, and progress tracking within {yourCompany}.
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div style={{ ...cardS, padding: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Campaign Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Describe your campaign goals, what you hope to achieve together, and any specific initiatives you'd like to propose..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", fontSize: 13, resize: "none", height: 120, outline: "none", fontFamily: "inherit", color: "#334155", boxSizing: "border-box", lineHeight: 1.6 }} />
          </div>

          {/* Browse & Add Companies */}
          <div style={{ ...cardS, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Browse & Add Companies</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Find more companies matching your greenness filter</div>
              </div>
              <button onClick={() => setShowBrowse(!showBrowse)} style={{
                padding: "8px 16px", borderRadius: 12, border: "1px solid #D1FAE5", backgroundColor: showBrowse ? "#ECFDF5" : "#fff",
                fontSize: 12, fontWeight: 600, color: "#059669", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6
              }}>
                {showBrowse ? "Hide" : "Show"} ({browsable.length} available)
              </button>
            </div>

            {showBrowse && (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{Icons.search({ w: 14, h: 14, color: "#94A3B8" })}</div>
                    <input type="text" placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, outline: "none", fontFamily: "inherit", color: "#334155", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ position: "relative" }}>
                    <select value={indFilter} onChange={e => setIndFilter(e.target.value)}
                      style={{ appearance: "none" as const, paddingLeft: 12, paddingRight: 30, paddingTop: 8, paddingBottom: 8, borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#334155", outline: "none" }}>
                      {INDS.map(i => <option key={i}>{i}</option>)}
                    </select>
                    <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }}>{Icons.chevDown({ w: 12, h: 12, color: "#94A3B8" })}</div>
                  </div>
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {browsable.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No companies match this filter</div>
                  ) : browsable.map(co => (
                    <div key={co.co} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, backgroundColor: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: 18 }}>{co.logo}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{co.co}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{co.ind} &middot; {co.reg}</div>
                      </div>
                      <ScoreBadge score={co.score} />
                      <button onClick={() => addInvited(co)} style={{
                        width: 32, height: 32, borderRadius: 10, border: "1px solid #D1FAE5", backgroundColor: "#ECFDF5",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
                      }}>
                        {Icons.plus({ w: 14, h: 14, color: "#059669" })}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Invited Roster + Launch */}
        <div style={{ position: "sticky" as const, top: 20, display: "flex", flexDirection: "column" as const, gap: 20 }}>

          {/* Summary Card */}
          <div style={{ ...cardS, padding: 24, border: "1.5px solid #D1FAE5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {Icons.flag({ w: 20, h: 20, color: "#059669" })}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#064E3B" }}>Campaign Summary</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Review before launching</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 20 }}>
              {[
                { l: "Name", v: campaignName || "Untitled Campaign" },
                { l: "Filter", v: GREENNESS_FILTERS.find(g => g.id === greenFilter)?.label },
                { l: "Partners", v: `${invited.length} ${invited.length === 1 ? "company" : "companies"}` },
                { l: "Internal", v: includeInternal ? "Yes \u2014 " + yourCompany : "No" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{r.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{r.v}</span>
                </div>
              ))}
            </div>

            <button onClick={() => invited.length > 0 && setSent(true)} disabled={invited.length === 0}
              style={{
                width: "100%", padding: 14, borderRadius: 14, border: "none", fontWeight: 700, fontSize: 14,
                cursor: invited.length > 0 ? "pointer" : "not-allowed", fontFamily: "inherit",
                backgroundColor: invited.length > 0 ? "#059669" : "#E2E8F0",
                color: invited.length > 0 ? "#fff" : "#94A3B8",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: invited.length > 0 ? "0 8px 24px rgba(5,150,105,0.3)" : "none", transition: "all 0.2s"
              }}>
              {Icons.rocket({ w: 18, h: 18, color: invited.length > 0 ? "#fff" : "#94A3B8" })}
              Initiate Pre-Campaign
            </button>
          </div>

          {/* Invited Roster */}
          <div style={{ ...cardS, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>Invited Companies ({invited.length})</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 14 }}>Click &times; to remove</div>

            {invited.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{Icons.sprout({ w: 32, h: 32, color: "#D1FAE5" })}</div>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>No companies invited yet. Browse below or go back to the leaders list to add some.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 360, overflowY: "auto" as const }}>
                {invited.map(co => (
                  <div key={co.co} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, backgroundColor: "#ECFDF5", border: "1px solid #D1FAE5" }}>
                    <span style={{ fontSize: 18 }}>{co.logo}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#064E3B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{co.co}</div>
                      <div style={{ fontSize: 11, color: "#6EE7B7" }}>{co.ind}</div>
                    </div>
                    <ScoreBadge score={co.score} />
                    <button onClick={() => removeInvited(co)} style={{
                      width: 28, height: 28, borderRadius: 8, border: "none", backgroundColor: "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                    }}>
                      {Icons.x({ w: 14, h: 14, color: "#94A3B8" })}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {includeInternal && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, backgroundColor: "#F5F3FF", border: "1px solid #EDE9FE", display: "flex", alignItems: "center", gap: 10 }}>
                {Icons.home({ w: 16, h: 16, color: "#7C3AED" })}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>{yourCompany}</div>
                  <div style={{ fontSize: 11, color: "#A78BFA" }}>Internal teams</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, backgroundColor: "#EDE9FE", color: "#7C3AED", fontWeight: 600 }}>Internal</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────

// ─── CAMPAIGNS TAB ──────────────────────────────────

const DEMO_CAMPAIGNS = {
  active: [
    { id: "c1", name: "Q1 Net-Zero Sprint", type: "Collaborate as Equals", partners: 4, startDate: "Feb 10, 2026", status: "In Progress", xpEarned: 1240, industry: "Technology", region: "North America" },
    { id: "c2", name: "Supply Chain Sustainability", type: "Mentor & Uplift", partners: 2, startDate: "Feb 18, 2026", status: "Awaiting Responses", xpEarned: 0, industry: "Manufacturing", region: "Western Europe" },
  ],
  past: [
    { id: "c3", name: "2025 Green Skills Challenge", type: "Industry Challenge", partners: 7, startDate: "Nov 1, 2025", endDate: "Dec 15, 2025", status: "Completed", xpEarned: 3850, industry: "Energy", region: "Northern Europe" },
    { id: "c4", name: "Circular Economy Pilot", type: "Collaborate as Equals", partners: 3, startDate: "Sep 5, 2025", endDate: "Oct 30, 2025", status: "Completed", xpEarned: 2100, industry: "Retail", region: "North America" },
  ],
  industry: [
    { id: "c5", name: "Clean Energy Workforce Initiative", organizer: "Vestas Wind Systems", partners: 12, industry: "Energy", region: "Northern Europe", score: 94.2 },
    { id: "c6", name: "Tech for Climate Pact", organizer: "Schneider Electric", partners: 8, industry: "Technology", region: "Western Europe", score: 89.5 },
    { id: "c7", name: "Sustainable Hospitality Alliance", organizer: "Unilever", partners: 15, industry: "Retail", region: "North America", score: 78.8 },
    { id: "c8", name: "Asia Green Manufacturing Network", organizer: "Samsung SDI", partners: 6, industry: "Manufacturing", region: "East Asia", score: 85.3 },
  ],
};

function CampaignsTab() {
  const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
    "In Progress": { bg: "#D1FAE5", fg: "#065F46" },
    "Awaiting Responses": { bg: "#FEF3C7", fg: "#92400E" },
    "Completed": { bg: "#E0E7FF", fg: "#3730A3" },
  };

  return (
    <div>
      {/* Active Campaigns */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {Icons.rocket({ w: 18, h: 18, color: "#059669" })}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0 }}>Active Campaigns</h3>
        </div>
        {DEMO_CAMPAIGNS.active.length === 0 ? (
          <div style={{ ...cardS, padding: 32, textAlign: "center" }}>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>No active campaigns. Initiate one from the Campaign tab!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DEMO_CAMPAIGNS.active.map(c => (
              <div key={c.id} style={{ ...cardS, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{c.type} &middot; Started {c.startDate}</div>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, backgroundColor: STATUS_STYLES[c.status]?.bg, color: STATUS_STYLES[c.status]?.fg }}>{c.status}</span>
                </div>
                <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#64748B" }}>
                  <span><strong style={{ color: "#1E293B" }}>{c.partners}</strong> partners</span>
                  <span><strong style={{ color: "#059669" }}>{c.xpEarned.toLocaleString()}</strong> XP earned</span>
                  <span>{c.industry} &middot; {c.region}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Campaigns */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {Icons.check({ w: 18, h: 18, color: "#6366F1" })}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0 }}>Past Campaigns</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DEMO_CAMPAIGNS.past.map(c => (
            <div key={c.id} style={{ ...cardS, padding: 20, opacity: 0.85 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{c.type} &middot; {c.startDate} — {c.endDate}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, backgroundColor: STATUS_STYLES[c.status]?.bg, color: STATUS_STYLES[c.status]?.fg }}>{c.status}</span>
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#64748B" }}>
                <span><strong style={{ color: "#1E293B" }}>{c.partners}</strong> partners</span>
                <span><strong style={{ color: "#059669" }}>{c.xpEarned.toLocaleString()}</strong> XP earned</span>
                <span>{c.industry} &middot; {c.region}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry & Region Campaigns */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {Icons.globe({ w: 18, h: 18, color: "#0891B2" })}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0 }}>Campaigns in Your Industry & Region</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {DEMO_CAMPAIGNS.industry.map(c => (
            <div key={c.id} style={{ ...cardS, padding: 20, transition: "transform 0.3s, box-shadow 0.3s" }}
              onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {Icons.handshake({ w: 18, h: 18, color: "#059669" })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>by {c.organizer}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                <span>{c.partners} partners</span>
                <span>{c.industry}</span>
                <span>{c.region}</span>
              </div>
              <button style={{
                width: "100%", padding: "10px 16px", borderRadius: 12, border: "1px solid #D1FAE5",
                backgroundColor: "#ECFDF5", fontSize: 12, fontWeight: 700, color: "#059669",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s"
              }}>
                Request to Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────

export default function CommunityDashboard({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { leaders: LEADERS, regions: REGIONS, achievements: ACHVS, global: GLOBAL, loading: dataLoading, yourScore, yourCompany } = useCommunityData();
  const [indF, setIndF] = useState("All Industries");
  const [regF, setRegF] = useState("All Regions");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("leaders");
  const [, setCampaignMode] = useState<string | null>(null);
  const [invited, setInvited] = useState<Leader[]>([]);
  const [on, setOn] = useState(false);

  useEffect(() => { setOn(true); }, []);

  if (dataLoading) {
    return (
      <div style={{ minHeight: embedded ? 200 : "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: embedded ? "transparent" : "#F7FDF8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <p style={{ color: "#64748B", fontSize: 14 }}>Loading community data...</p>
        </div>
      </div>
    );
  }

  const filtered = LEADERS.filter(c =>
    (indF === "All Industries" || c.ind === indF) &&
    (regF === "All Regions" || c.reg === regF) &&
    (!q || c.co.toLowerCase().includes(q.toLowerCase()))
  );

  const handleBrowseFromCard = (campId: string) => {
    setCampaignMode(campId);
    setTab("campaign");
  };

  const handleInvite = (co: Leader) => {
    if (!invited.find(c => c.co === co.co)) {
      setInvited(prev => [...prev, co]);
    }
    setTab("campaign");
  };

  const anim = (d: number): React.CSSProperties => ({ opacity: on ? 1 : 0, transform: on ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.6s ease ${d}s, transform 0.6s ease ${d}s` });

  // Embedded content (tabs + content only, no hero/chrome)
  const tabContent = (
    <>

      {/* COMPACT HEADER FOR EMBEDDED MODE */}
      {embedded && (
        <div style={{ marginBottom: 24, ...anim(0.05) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>Community</h1>
              <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>Connect, collaborate, and benchmark with {GLOBAL.companies.toLocaleString()} companies</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>{GLOBAL.score}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Global Index</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", padding: "4px 8px", borderRadius: 8, backgroundColor: "#D1FAE5" }}>+{GLOBAL.change}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div style={{ color: "#1E293B" }}>
        {tabContent}

        {/* REGIONAL (compact for embedded) */}
        <section style={{ marginBottom: 32, ...anim(0.15) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {Icons.mapPin({ w: 16, h: 16, color: "#059669" })}
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: 0 }}>Greenness by Region</h3>
          </div>
          <div style={{ ...cardS, padding: 20 }}>
            {REGIONS.map((r, i) => (
              <div key={r.region} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: i < REGIONS.length - 1 ? 12 : 0 }}>
                <div style={{ width: 130, flexShrink: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{r.region}</div><div style={{ fontSize: 10, color: "#94A3B8" }}>{r.n} companies</div></div>
                <div style={{ flex: 1 }}><MiniBar value={r.score} /></div>
                <div style={{ width: 36, textAlign: "right" as const, fontSize: 13, fontWeight: 700, color: "#059669" }}>{r.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, backgroundColor: "#ECFDF5", borderRadius: 16, padding: 5, width: "fit-content", marginBottom: 24, ...anim(0.2) }}>
          {[
            { id: "leaders", l: "Industry Leaders", ic: "trending" as const },
            { id: "achievements", l: "Achievements", ic: "award" as const },
            { id: "campaign", l: `Campaign${invited.length > 0 ? ` (${invited.length})` : ""}`, ic: "rocket" as const },
            { id: "campaigns", l: "Campaigns", ic: "flag" as const },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              backgroundColor: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#047857" : "#64748B",
              boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.2s"
            }}>{Icons[t.ic]({ w: 16, h: 16, color: tab === t.id ? "#047857" : "#64748B" })} {t.l}</button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {tab === "leaders" && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginBottom: 20 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>{Icons.search({ w: 16, h: 16, color: "#94A3B8" })}</div>
                <input type="text" placeholder="Search companies..." value={q} onChange={e => setQ(e.target.value)}
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 16, border: "1px solid #E2E8F0", backgroundColor: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#334155", boxSizing: "border-box" }} />
              </div>
              {[{ v: indF, set: setIndF, opts: INDS }, { v: regF, set: setRegF, opts: REGS_F }].map((f, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <select value={f.v} onChange={e => f.set(e.target.value)} style={{ appearance: "none" as const, paddingLeft: 16, paddingRight: 40, paddingTop: 10, paddingBottom: 10, borderRadius: 16, border: "1px solid #E2E8F0", backgroundColor: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#334155", outline: "none" }}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }}>{Icons.chevDown({ w: 16, h: 16, color: "#94A3B8" })}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {filtered.map(co => {
                const isInvited = invited.find(c => c.co === co.co);
                return (
                  <div key={co.co} style={{ ...cardS, padding: 20, transition: "transform 0.3s, box-shadow 0.3s" }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#047857" }}>#{co.rank}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                        <span style={{ fontSize: 24 }}>{co.logo}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1E293B", fontSize: 14 }}>{co.co}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8" }}>{co.ind} &middot; {co.reg} &middot; {co.emp}</div>
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          {co.hl.map((h, j) => <span key={j} style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "#ECFDF5", fontSize: 11, color: "#047857", fontWeight: 600 }}>{h}</span>)}
                        </div>
                        <div style={{ textAlign: "right" as const, minWidth: 50 }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#047857" }}>{co.score}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: co.chg >= 0 ? "#10B981" : "#EF4444" }}>{co.chg >= 0 ? "+" : ""}{co.chg}</div>
                        </div>
                        <button onClick={() => handleInvite(co)} disabled={!!isInvited} style={{
                          padding: "10px 16px", borderRadius: 14, border: "none",
                          backgroundColor: isInvited ? "#D1FAE5" : "#059669", color: isInvited ? "#059669" : "#fff",
                          fontSize: 12, fontWeight: 700, cursor: isInvited ? "default" : "pointer",
                          display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: "inherit",
                          boxShadow: isInvited ? "none" : "0 4px 12px rgba(5,150,105,0.25)", transition: "all 0.2s"
                        }}>
                          {isInvited
                            ? <>{Icons.check({ w: 14, h: 14, color: "#059669" })} Added</>
                            : <>{Icons.plus({ w: 14, h: 14, color: "#fff" })} Invite</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "achievements" && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {ACHVS.map((a, i) => {
                const b = BADGES[a.type] || BADGES.milestone;
                return (
                  <div key={i} style={{ ...cardS, padding: 20, transition: "transform 0.3s, box-shadow 0.3s" }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 28, marginTop: 2 }}>{a.logo}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{a.co}</span>
                          <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, backgroundColor: b.bg, color: b.fg, display: "flex", alignItems: "center", gap: 4 }}>{Icons[b.icon as keyof typeof Icons]({ w: 12, h: 12, color: b.fg })} {b.label}</span>
                          <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: "auto" }}>{a.date}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: "0 0 10px" }}>{a.text}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icons.zap({ w: 14, h: 14, color: "#F59E0B" })}<span style={{ fontSize: 12, color: "#64748B" }}>{a.impact}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "campaign" && (
          <section style={{ marginBottom: 56 }}>
            <CampaignBuilder
              invited={invited} setInvited={setInvited} allCompanies={LEADERS}
              onBack={() => { setTab("leaders"); setCampaignMode(null); }}
              onAddMore={() => setTab("leaders")}
              yourScore={yourScore} yourCompany={yourCompany}
            />
          </section>
        )}

        {tab === "campaigns" && (
          <section style={{ marginBottom: 56 }}>
            <CampaignsTab />
          </section>
        )}

        {tab !== "campaign" && tab !== "campaigns" && (
          <section style={anim(0.3)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {Icons.handshake({ w: 18, h: 18, color: "#059669" })}
              </div>
              <div><h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", margin: 0 }}>Initiate a Pre-Campaign</h2><p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Collaborate with companies to accelerate climate readiness</p></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { id: "collab", label: "Collaborate as Equals", desc: "Partner with companies at similar green maturity for joint sustainability initiatives", color: "#059669", icon: "handshake" as const },
                { id: "mentor", label: "Mentor & Uplift", desc: "Help developing companies build their green skills capacity through knowledge sharing", color: "#0891B2", icon: "heart" as const },
                { id: "challenge", label: "Industry Challenge", desc: "Launch a competitive sustainability challenge across companies in your sector", color: "#7C3AED", icon: "target" as const },
              ].map(t => (
                <button key={t.id} onClick={() => handleBrowseFromCard(t.id)} style={{
                  ...cardS, padding: 24, cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit",
                  transition: "transform 0.3s, box-shadow 0.3s"
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${t.color}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.color + "14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    {Icons[t.icon]({ w: 28, h: 28, color: t.color })}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: "0 0 8px" }}>{t.label}</h3>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65, margin: "0 0 16px" }}>{t.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: t.color }}>
                    Initiate Pre-Campaign {Icons.arrowUpRight({ w: 16, h: 16, color: t.color })}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: "#F7FDF8", color: "#1E293B",
      backgroundImage: "radial-gradient(circle at 20% 80%, rgba(16,185,129,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(5,150,105,0.04) 0%, transparent 50%)"
    }}>

      {/* HERO */}
      <div style={{ background: "linear-gradient(165deg, #ECFDF5 0%, #D1FAE5 25%, #F0FDF4 50%, #FFFFFF 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, ...anim(0.05) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                title="Back to Dashboard"
              >
                {Icons.arrowLeft({ w: 18, h: 18, color: "#059669" })}
              </button>
              <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#059669", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}>
                {Icons.leaf({ w: 24, h: 24, color: "#fff" })}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#064E3B", letterSpacing: -0.5 }}>Sustainance</div>
                <div style={{ fontSize: 11, color: "#059669", letterSpacing: 2, fontWeight: 600, marginTop: -2 }}>COMMUNITY</div>
              </div>
            </div>
            <div style={{ padding: "8px 16px", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid rgba(16,185,129,0.15)", fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
              {Icons.globe({ w: 16, h: 16, color: "#10B981" })}
              <strong style={{ color: "#047857" }}>{GLOBAL.companies.toLocaleString()}</strong> companies tracked
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", ...anim(0.15) }}><Ring score={GLOBAL.score} /></div>
            <div style={anim(0.25)}>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1E293B", margin: "0 0 8px", letterSpacing: -0.5 }}>Global Greenness Index</h2>
              <p style={{ color: "#64748B", margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, maxWidth: 520 }}>
                Composite score across {GLOBAL.companies.toLocaleString()} companies. Up <span style={{ color: "#059669", fontWeight: 700 }}>+{GLOBAL.change} pts</span> this quarter.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[{ l: "Companies", v: GLOBAL.companies.toLocaleString(), ic: "building" as const }, { l: "Assessments", v: GLOBAL.assessments.toLocaleString(), ic: "barChart" as const }, { l: "Avg Readiness", v: `${GLOBAL.avgReadiness}%`, ic: "trending" as const }, { l: "Top Industry", v: `${GLOBAL.topIndustryScore}%`, ic: "award" as const }].map((s2, i) => (
                  <div key={i} style={{ ...cardS, padding: 16, transition: "transform 0.3s, box-shadow 0.3s" }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>{Icons[s2.ic]({ w: 15, h: 15, color: "#10B981" })}<span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{s2.l}</span></div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1E293B" }}>{s2.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* REGIONAL */}
        <section style={{ marginBottom: 56, ...anim(0.35) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.mapPin({ w: 18, h: 18, color: "#059669" })}</div>
            <div><h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", margin: 0 }}>Greenness by Region</h2><p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Average workforce climate readiness scores</p></div>
          </div>
          <div style={{ ...cardS, padding: 24 }}>
            {REGIONS.map((r, i) => (
              <div key={r.region} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: i < REGIONS.length - 1 ? 16 : 0 }}>
                <div style={{ width: 150, flexShrink: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.region}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{r.n} companies</div></div>
                <div style={{ flex: 1 }}><MiniBar value={r.score} /></div>
                <div style={{ width: 44, textAlign: "right" as const, fontSize: 14, fontWeight: 700, color: "#059669" }}>{r.score}</div>
                <div style={{ width: 140, fontSize: 12, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>Top: {r.top}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, backgroundColor: "#ECFDF5", borderRadius: 16, padding: 5, width: "fit-content", marginBottom: 24, ...anim(0.4) }}>
          {[
            { id: "leaders", l: "Industry Leaders", ic: "trending" as const },
            { id: "achievements", l: "Achievements", ic: "award" as const },
            { id: "campaign", l: `Campaign${invited.length > 0 ? ` (${invited.length})` : ""}`, ic: "rocket" as const },
            { id: "campaigns", l: "Campaigns", ic: "flag" as const },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              backgroundColor: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#047857" : "#64748B",
              boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.2s"
            }}>{Icons[t.ic]({ w: 16, h: 16, color: tab === t.id ? "#047857" : "#64748B" })} {t.l}</button>
          ))}
        </div>

        {/* LEADERS */}
        {tab === "leaders" && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginBottom: 20 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>{Icons.search({ w: 16, h: 16, color: "#94A3B8" })}</div>
                <input type="text" placeholder="Search companies..." value={q} onChange={e => setQ(e.target.value)}
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 16, border: "1px solid #E2E8F0", backgroundColor: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#334155", boxSizing: "border-box" }} />
              </div>
              {[{ v: indF, set: setIndF, opts: INDS }, { v: regF, set: setRegF, opts: REGS_F }].map((f, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <select value={f.v} onChange={e => f.set(e.target.value)} style={{ appearance: "none" as const, paddingLeft: 16, paddingRight: 40, paddingTop: 10, paddingBottom: 10, borderRadius: 16, border: "1px solid #E2E8F0", backgroundColor: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#334155", outline: "none" }}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }}>{Icons.chevDown({ w: 16, h: 16, color: "#94A3B8" })}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {filtered.map(co => {
                const isInvited = invited.find(c => c.co === co.co);
                return (
                  <div key={co.co} style={{ ...cardS, padding: 20, transition: "transform 0.3s, box-shadow 0.3s" }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#047857" }}>#{co.rank}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                        <span style={{ fontSize: 24 }}>{co.logo}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1E293B", fontSize: 14 }}>{co.co}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8" }}>{co.ind} &middot; {co.reg} &middot; {co.emp}</div>
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          {co.hl.map((h, j) => <span key={j} style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "#ECFDF5", fontSize: 11, color: "#047857", fontWeight: 600 }}>{h}</span>)}
                        </div>
                        <div style={{ textAlign: "right" as const, minWidth: 50 }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#047857" }}>{co.score}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: co.chg >= 0 ? "#10B981" : "#EF4444" }}>{co.chg >= 0 ? "+" : ""}{co.chg}</div>
                        </div>
                        <button onClick={() => handleInvite(co)} disabled={!!isInvited} style={{
                          padding: "10px 16px", borderRadius: 14, border: "none",
                          backgroundColor: isInvited ? "#D1FAE5" : "#059669", color: isInvited ? "#059669" : "#fff",
                          fontSize: 12, fontWeight: 700, cursor: isInvited ? "default" : "pointer",
                          display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: "inherit",
                          boxShadow: isInvited ? "none" : "0 4px 12px rgba(5,150,105,0.25)", transition: "all 0.2s"
                        }}>
                          {isInvited
                            ? <>{Icons.check({ w: 14, h: 14, color: "#059669" })} Added</>
                            : <>{Icons.plus({ w: 14, h: 14, color: "#fff" })} Invite</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ACHIEVEMENTS */}
        {tab === "achievements" && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {ACHVS.map((a, i) => {
                const b = BADGES[a.type] || BADGES.milestone;
                return (
                  <div key={i} style={{ ...cardS, padding: 20, transition: "transform 0.3s, box-shadow 0.3s" }} onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 28, marginTop: 2 }}>{a.logo}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{a.co}</span>
                          <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, backgroundColor: b.bg, color: b.fg, display: "flex", alignItems: "center", gap: 4 }}>{Icons[b.icon as keyof typeof Icons]({ w: 12, h: 12, color: b.fg })} {b.label}</span>
                          <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: "auto" }}>{a.date}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: "0 0 10px" }}>{a.text}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icons.zap({ w: 14, h: 14, color: "#F59E0B" })}<span style={{ fontSize: 12, color: "#64748B" }}>{a.impact}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CAMPAIGN BUILDER */}
        {tab === "campaign" && (
          <section style={{ marginBottom: 56 }}>
            <CampaignBuilder
              invited={invited}
              setInvited={setInvited}
              allCompanies={LEADERS}
              onBack={() => { setTab("leaders"); setCampaignMode(null); }}
              onAddMore={() => setTab("leaders")}
              yourScore={yourScore}
              yourCompany={yourCompany}
            />
          </section>
        )}

        {/* CAMPAIGNS TAB */}
        {tab === "campaigns" && (
          <section style={{ marginBottom: 56 }}>
            <CampaignsTab />
          </section>
        )}

        {/* CAMPAIGNS CTA */}
        {tab !== "campaign" && tab !== "campaigns" && (
          <section style={anim(0.5)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {Icons.handshake({ w: 18, h: 18, color: "#059669" })}
              </div>
              <div><h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", margin: 0 }}>Initiate a Pre-Campaign</h2><p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Collaborate with companies to accelerate climate readiness</p></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { id: "collab", label: "Collaborate as Equals", desc: "Partner with companies at similar green maturity for joint sustainability initiatives", color: "#059669", icon: "handshake" as const },
                { id: "mentor", label: "Mentor & Uplift", desc: "Help developing companies build their green skills capacity through knowledge sharing", color: "#0891B2", icon: "heart" as const },
                { id: "challenge", label: "Industry Challenge", desc: "Launch a competitive sustainability challenge across companies in your sector", color: "#7C3AED", icon: "target" as const },
              ].map(t => (
                <button key={t.id} onClick={() => handleBrowseFromCard(t.id)} style={{
                  ...cardS, padding: 24, cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit",
                  transition: "transform 0.3s, box-shadow 0.3s"
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${t.color}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.color + "14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    {Icons[t.icon]({ w: 28, h: 28, color: t.color })}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: "0 0 8px" }}>{t.label}</h3>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65, margin: "0 0 16px" }}>{t.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: t.color }}>
                    Initiate Pre-Campaign {Icons.arrowUpRight({ w: 16, h: 16, color: t.color })}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #D1FAE5", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "#94A3B8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Icons.leaf({ w: 16, h: 16, color: "#6EE7B7" })} Sustainance Community</div>
          <span>Updated February 2026</span>
        </div>
      </div>
    </div>
  );
}
