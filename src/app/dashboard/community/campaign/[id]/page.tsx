'use client';

import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

/* ───────── RICH CAMPAIGN DATA ───────── */

interface Update {
  id: string;
  type: 'event' | 'milestone' | 'fundraising' | 'greenscore' | 'climate' | 'photo' | 'announcement';
  date: string;
  title: string;
  body: string;
  image?: string;
  raised?: number;
  goal?: number;
  scoreDelta?: number;
  newScore?: number;
}

interface Partner {
  name: string;
  industry: string;
  score: number;
  logo: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string;
  industry: string;
  region: string;
  xpEarned: number;
  partners: Partner[];
  description: string;
  fundraising?: { raised: number; goal: number; currency: string };
  greenScoreImpact?: { before: number; after: number };
  updates: Update[];
}

const CAMPAIGNS: Record<string, CampaignDetail> = {
  c1: {
    id: 'c1', name: 'Q1 Net-Zero Sprint', type: 'Collaborate as Equals', status: 'In Progress',
    startDate: 'Feb 10, 2026', industry: 'Technology', region: 'North America', xpEarned: 1240,
    description: 'A 12-week intensive sprint where 4 tech companies collaborate to halve their Scope 2 emissions through renewable energy procurement, office electrification, and employee behavior change programs.',
    fundraising: { raised: 42000, goal: 75000, currency: 'USD' },
    greenScoreImpact: { before: 62.4, after: 71.8 },
    partners: [
      { name: 'Vertex AI Labs', industry: 'Technology', score: 68.2, logo: 'V' },
      { name: 'CloudSpark Inc', industry: 'Technology', score: 72.1, logo: 'C' },
      { name: 'DataFlow Systems', industry: 'Technology', score: 58.9, logo: 'D' },
      { name: 'GreenByte Software', industry: 'Technology', score: 65.5, logo: 'G' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Feb 10, 2026', title: 'Campaign Launched!', body: 'All 4 partners have confirmed participation. Kickoff call scheduled for Feb 12. Each team will designate a Net-Zero Champion to coordinate weekly check-ins.' },
      { id: 'u2', type: 'event', date: 'Feb 12, 2026', title: 'Virtual Kickoff Workshop', body: 'Teams shared current emissions baselines and set individual reduction targets. Vertex AI Labs presented their data center cooling optimization project that already reduced energy use by 18%.' },
      { id: 'u3', type: 'greenscore', date: 'Feb 17, 2026', title: 'Green Score Update', body: 'CloudSpark completed their renewable energy audit and switched 3 office locations to 100% green energy contracts.', scoreDelta: 4.2, newScore: 76.3 },
      { id: 'u4', type: 'photo', date: 'Feb 19, 2026', title: 'Solar Panel Installation at Vertex HQ', body: 'Vertex AI Labs completed installation of 240kW rooftop solar array. Expected to offset 35% of building energy consumption.', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=300&fit=crop' },
      { id: 'u5', type: 'climate', date: 'Feb 20, 2026', title: 'Global: Arctic Ice Minimum Record', body: 'In response to reports of record Arctic ice loss, campaign partners collectively pledged to accelerate Scope 1 reduction timelines by 6 months. This aligns with the urgency highlighted by NOAA\'s latest climate report.' },
      { id: 'u6', type: 'fundraising', date: 'Feb 22, 2026', title: 'Carbon Offset Fund Milestone', body: 'Joint carbon offset fund has reached $42,000 of the $75,000 goal. Funds will be invested in verified reforestation projects in the Pacific Northwest.', raised: 42000, goal: 75000 },
      { id: 'u7', type: 'milestone', date: 'Feb 25, 2026', title: '100 Employees Trained', body: 'Combined across all partners, 100 employees have completed the Green Skills Fundamentals module. Average assessment score improved from 2.1 to 3.2 (out of 4.0).' },
      { id: 'u8', type: 'event', date: 'Mar 5, 2026', title: 'Upcoming: Mid-Sprint Review', body: 'All partners will present progress against their reduction targets. Guest speaker from EPA Region 10 will discuss new federal incentive programs for tech sector decarbonization.' },
    ],
  },
  c2: {
    id: 'c2', name: 'Supply Chain Sustainability', type: 'Mentor & Uplift', status: 'Awaiting Responses',
    startDate: 'Feb 18, 2026', industry: 'Manufacturing', region: 'Western Europe', xpEarned: 0,
    description: 'A mentorship program pairing a sustainability-mature manufacturer with emerging suppliers to build green procurement capabilities, implement ISO 14001, and establish supplier sustainability scorecards.',
    partners: [
      { name: 'EcoForge GmbH', industry: 'Manufacturing', score: 81.3, logo: 'E' },
      { name: 'PrecisionParts Ltd', industry: 'Manufacturing', score: 42.7, logo: 'P' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Feb 18, 2026', title: 'Campaign Created', body: 'EcoForge GmbH has initiated a mentor-mentee program with PrecisionParts Ltd. Awaiting confirmation from PrecisionParts\' sustainability officer.' },
      { id: 'u2', type: 'climate', date: 'Feb 20, 2026', title: 'EU Carbon Border Adjustment Mechanism Update', body: 'The EU CBAM phase-in continues to drive urgency for supply chain transparency. This campaign directly addresses Scope 3 reporting readiness for both partners.' },
      { id: 'u3', type: 'event', date: 'Feb 28, 2026', title: 'Upcoming: ISO 14001 Gap Analysis Workshop', body: 'EcoForge will lead PrecisionParts through a 2-day environmental management system gap analysis at their Stuttgart facility.' },
    ],
  },
  c3: {
    id: 'c3', name: '2025 Green Skills Challenge', type: 'Industry Challenge', status: 'Completed',
    startDate: 'Nov 1, 2025', endDate: 'Dec 15, 2025', industry: 'Energy', region: 'Northern Europe', xpEarned: 3850,
    description: 'A 6-week competitive challenge across 7 energy companies to maximize employee green skills assessments. Companies competed on assessment completion rates, average scores, and most-improved metrics.',
    fundraising: { raised: 125000, goal: 125000, currency: 'EUR' },
    greenScoreImpact: { before: 71.5, after: 88.2 },
    partners: [
      { name: 'NordWind Energy', industry: 'Energy', score: 92.1, logo: 'N' },
      { name: 'Vattenfall Green', industry: 'Energy', score: 89.4, logo: 'V' },
      { name: 'Equinor Renewables', industry: 'Energy', score: 87.8, logo: 'E' },
      { name: 'Statkraft Academy', industry: 'Energy', score: 91.2, logo: 'S' },
      { name: 'Danish Energy Co', industry: 'Energy', score: 85.6, logo: 'D' },
      { name: 'Baltic Power', industry: 'Energy', score: 82.3, logo: 'B' },
      { name: 'Fortum Learning', industry: 'Energy', score: 84.7, logo: 'F' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Nov 1, 2025', title: 'Challenge Kickoff', body: '7 leading Nordic energy companies have entered the arena! Each company will race to complete sustainability assessments across all departments by Dec 15.' },
      { id: 'u2', type: 'photo', date: 'Nov 5, 2025', title: 'Kickoff Event in Oslo', body: 'Over 200 attendees gathered at the Oslo Sustainability Center for the official launch. Keynote by former IPCC co-chair on why energy sector workforce development is critical for the transition.', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop' },
      { id: 'u3', type: 'milestone', date: 'Nov 12, 2025', title: '500 Assessments Completed', body: 'In just 12 days, participating companies have completed 500 individual assessments. NordWind Energy leads with a 94% completion rate.' },
      { id: 'u4', type: 'greenscore', date: 'Nov 18, 2025', title: 'Week 3 Score Update', body: 'The cohort\'s average green score rose from 71.5 to 78.9. Biggest jumps seen in Scope 3 awareness and renewable energy procurement skills.', scoreDelta: 7.4, newScore: 78.9 },
      { id: 'u5', type: 'climate', date: 'Nov 22, 2025', title: 'COP30 Belem Commitments', body: 'Challenge partners collectively signed the COP30 Corporate Pledge for Energy Transition Workforce Development, committing to train 100% of their workforce in climate literacy by 2028.' },
      { id: 'u6', type: 'fundraising', date: 'Nov 28, 2025', title: 'Skills Fund Fully Funded!', body: 'The joint Green Skills Training Fund reached its \u20AC125,000 target! Funds will provide free sustainability certifications to employees across all 7 companies.', raised: 125000, goal: 125000 },
      { id: 'u7', type: 'event', date: 'Dec 1, 2025', title: 'Webinar: Top Performers Share Strategies', body: 'NordWind and Statkraft shared their internal engagement strategies that drove 90%+ completion rates. Key insight: gamification + manager buy-in = fastest adoption.' },
      { id: 'u8', type: 'photo', date: 'Dec 10, 2025', title: 'Award Ceremony in Copenhagen', body: 'NordWind Energy was crowned champion with a final score of 92.1. All participating companies received recognition certificates.', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=300&fit=crop' },
      { id: 'u9', type: 'greenscore', date: 'Dec 15, 2025', title: 'Final Results: +16.7 Average Score Increase', body: 'The challenge drove the cohort\'s average green score from 71.5 to 88.2 — a 23% improvement. Every single company improved their score.', scoreDelta: 16.7, newScore: 88.2 },
      { id: 'u10', type: 'milestone', date: 'Dec 15, 2025', title: 'Challenge Complete: 3,850 XP Earned', body: '2,100 individual assessments completed across 7 companies. 3,850 XP earned collectively. 14 new "Conscious Changemaker" certifications awarded.' },
    ],
  },
  c4: {
    id: 'c4', name: 'Circular Economy Pilot', type: 'Collaborate as Equals', status: 'Completed',
    startDate: 'Sep 5, 2025', endDate: 'Oct 30, 2025', industry: 'Retail', region: 'North America', xpEarned: 2100,
    description: 'Three retail companies collaborated to pilot circular economy practices including take-back programs, packaging reduction, and waste-to-resource initiatives. Focus on building internal capabilities through hands-on project work.',
    greenScoreImpact: { before: 55.2, after: 68.9 },
    partners: [
      { name: 'GreenMart', industry: 'Retail', score: 72.4, logo: 'G' },
      { name: 'EcoStyle Brands', industry: 'Retail', score: 66.8, logo: 'E' },
      { name: 'FreshLoop Markets', industry: 'Retail', score: 67.5, logo: 'F' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Sep 5, 2025', title: 'Pilot Program Begins', body: '3 retail leaders unite to test circular economy practices at scale. Each company will implement one take-back program and one packaging reduction initiative.' },
      { id: 'u2', type: 'photo', date: 'Sep 12, 2025', title: 'GreenMart Take-Back Station Launch', body: 'GreenMart opened its first in-store textile take-back station in Portland, OR. Customers can return used clothing for recycling credits.', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=300&fit=crop' },
      { id: 'u3', type: 'milestone', date: 'Sep 20, 2025', title: '10,000 Items Collected', body: 'Combined take-back programs across all 3 partners have collected 10,000 items in the first 2 weeks. 78% are suitable for recycling or upcycling.' },
      { id: 'u4', type: 'greenscore', date: 'Oct 1, 2025', title: 'Mid-Pilot Score Improvement', body: 'Circular economy skill scores across partner companies improved by an average of 8.4 points as employees gained hands-on experience.', scoreDelta: 8.4, newScore: 63.6 },
      { id: 'u5', type: 'climate', date: 'Oct 14, 2025', title: 'UN Report: Textile Waste Crisis', body: 'Partners responded to the UN Environment Programme report on textile waste by jointly publishing a circular fashion commitment. The pilot\'s take-back data was cited as a scalable model.' },
      { id: 'u6', type: 'milestone', date: 'Oct 30, 2025', title: 'Pilot Complete: 68% Waste Reduction', body: 'Participating stores achieved a 68% reduction in landfill-bound waste. The pilot model will be expanded to 50 additional locations in Q1 2026.' },
    ],
  },
  c5: {
    id: 'c5', name: 'Clean Energy Workforce Initiative', type: 'Industry Challenge', status: 'In Progress',
    startDate: 'Jan 15, 2026', industry: 'Energy', region: 'Northern Europe', xpEarned: 6200,
    description: 'Organized by Vestas Wind Systems, this initiative brings together 12 energy companies to collaboratively build the next-generation clean energy workforce through shared training programs, joint certifications, and cross-company mentorship.',
    fundraising: { raised: 340000, goal: 500000, currency: 'EUR' },
    greenScoreImpact: { before: 78.4, after: 94.2 },
    partners: [
      { name: 'Vestas Wind Systems', industry: 'Energy', score: 94.2, logo: 'V' },
      { name: 'Orsted', industry: 'Energy', score: 91.8, logo: 'O' },
      { name: 'Siemens Gamesa', industry: 'Energy', score: 89.3, logo: 'S' },
      { name: 'Neste', industry: 'Energy', score: 87.6, logo: 'N' },
      { name: 'TotalEnergies', industry: 'Energy', score: 82.4, logo: 'T' },
      { name: 'Enel Green Power', industry: 'Energy', score: 88.1, logo: 'E' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Jan 15, 2026', title: 'Initiative Launched by Vestas', body: '12 companies spanning wind, solar, hydrogen, and grid technologies have committed to a shared workforce development agenda. Goal: 10,000 employees trained by end of 2026.' },
      { id: 'u2', type: 'photo', date: 'Jan 22, 2026', title: 'Copenhagen Summit', body: 'Leaders from all 12 companies gathered in Copenhagen to sign the Clean Energy Workforce Charter and set collaborative training milestones.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop' },
      { id: 'u3', type: 'fundraising', date: 'Feb 1, 2026', title: 'Training Fund Growing', body: 'Joint workforce development fund has reached \u20AC340,000 of its \u20AC500,000 target. Major contribution from Orsted (\u20AC75,000) announced today.', raised: 340000, goal: 500000 },
      { id: 'u4', type: 'milestone', date: 'Feb 10, 2026', title: '2,500 Employees Assessed', body: 'Quarter of the way to the 10,000 target! Average baseline score across participants: 3.1/4.0 — the highest of any Sustainance campaign.' },
      { id: 'u5', type: 'greenscore', date: 'Feb 18, 2026', title: 'Cohort Green Score: 94.2', body: 'The initiative\'s combined green score has risen to 94.2, setting a new benchmark for industry collaboration campaigns.', scoreDelta: 15.8, newScore: 94.2 },
      { id: 'u6', type: 'climate', date: 'Feb 24, 2026', title: 'EU Green Deal Industrial Plan Update', body: 'The European Commission\'s updated Industrial Plan emphasizes workforce readiness. This initiative was cited as a model for cross-company skills collaboration in the clean energy sector.' },
    ],
  },
  c6: {
    id: 'c6', name: 'Tech for Climate Pact', type: 'Collaborate as Equals', status: 'In Progress',
    startDate: 'Jan 20, 2026', industry: 'Technology', region: 'Western Europe', xpEarned: 4100,
    description: 'Organized by Schneider Electric, 8 technology companies committed to aligning their workforce sustainability capabilities with the Paris Agreement targets. Focus on AI for sustainability, green data centers, and Scope 3 supply chain transparency.',
    greenScoreImpact: { before: 68.2, after: 89.5 },
    partners: [
      { name: 'Schneider Electric', industry: 'Technology', score: 89.5, logo: 'S' },
      { name: 'SAP', industry: 'Technology', score: 86.2, logo: 'S' },
      { name: 'Siemens Digital', industry: 'Technology', score: 84.7, logo: 'S' },
      { name: 'Nokia Networks', industry: 'Technology', score: 79.3, logo: 'N' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Jan 20, 2026', title: 'Pact Signed', body: '8 European tech leaders signed the Tech for Climate Pact, committing to 100% green-skills-literate workforces by 2028.' },
      { id: 'u2', type: 'event', date: 'Feb 5, 2026', title: 'Green Data Center Summit', body: 'Partners shared best practices on PUE optimization, liquid cooling, and renewable energy procurement for data centers. Average PUE across partners: 1.28.' },
      { id: 'u3', type: 'greenscore', date: 'Feb 15, 2026', title: 'Score Surge: +21.3 Average', body: 'Intensive AI for Sustainability training modules drove significant improvements. SAP\'s workforce scored highest on ESG data platform competencies.', scoreDelta: 21.3, newScore: 89.5 },
      { id: 'u4', type: 'photo', date: 'Feb 20, 2026', title: 'Schneider Innovation Campus Tour', body: 'Partners visited Schneider\'s carbon-neutral innovation campus in Grenoble to see green building technology and IoT-driven energy management in action.', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=300&fit=crop' },
    ],
  },
  c7: {
    id: 'c7', name: 'Sustainable Hospitality Alliance', type: 'Industry Challenge', status: 'In Progress',
    startDate: 'Feb 1, 2026', industry: 'Retail', region: 'North America', xpEarned: 2800,
    description: 'Organized by Unilever, this alliance brings together 15 hospitality and consumer goods companies to build sustainable sourcing capabilities, reduce food waste, and implement circular packaging across their supply chains.',
    fundraising: { raised: 180000, goal: 250000, currency: 'USD' },
    partners: [
      { name: 'Unilever', industry: 'Retail', score: 78.8, logo: 'U' },
      { name: 'Marriott Green', industry: 'Hospitality', score: 72.4, logo: 'M' },
      { name: 'Hilton Sustain', industry: 'Hospitality', score: 69.1, logo: 'H' },
      { name: 'Compass Group', industry: 'Food Service', score: 74.3, logo: 'C' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Feb 1, 2026', title: 'Alliance Formed', body: '15 companies unite to tackle the hospitality sector\'s biggest sustainability challenges: food waste, single-use plastics, and water consumption.' },
      { id: 'u2', type: 'milestone', date: 'Feb 10, 2026', title: 'Food Waste Baseline Complete', body: 'All partners have completed food waste audits. Combined baseline: 23% of purchased food wasted. Target: reduce to 10% by end of campaign.' },
      { id: 'u3', type: 'fundraising', date: 'Feb 15, 2026', title: 'Innovation Grant Fund Growing', body: 'The sustainable packaging innovation fund has reached $180,000. Grants will support pilot programs for compostable packaging alternatives.', raised: 180000, goal: 250000 },
      { id: 'u4', type: 'climate', date: 'Feb 22, 2026', title: 'World Water Day Response', body: 'Alliance partners committed to 30% water use reduction across hospitality operations. Hilton announced installation of grey water recycling systems at 40 properties.' },
    ],
  },
  c8: {
    id: 'c8', name: 'Asia Green Manufacturing Network', type: 'Collaborate as Equals', status: 'In Progress',
    startDate: 'Dec 1, 2025', industry: 'Manufacturing', region: 'East Asia', xpEarned: 3400,
    description: 'Organized by Samsung SDI, this network connects 6 Asian manufacturers to share green manufacturing best practices, implement clean production standards, and build workforce capabilities in environmental management systems.',
    greenScoreImpact: { before: 58.6, after: 85.3 },
    partners: [
      { name: 'Samsung SDI', industry: 'Manufacturing', score: 85.3, logo: 'S' },
      { name: 'Toyota Green Mfg', industry: 'Automotive', score: 82.1, logo: 'T' },
      { name: 'LG Energy Solutions', industry: 'Manufacturing', score: 79.8, logo: 'L' },
      { name: 'Panasonic Eco', industry: 'Electronics', score: 76.4, logo: 'P' },
    ],
    updates: [
      { id: 'u1', type: 'announcement', date: 'Dec 1, 2025', title: 'Network Established', body: '6 leading Asian manufacturers launched the region\'s first cross-company green skills network. Samsung SDI\'s Ulsan facility will serve as the pilot site.' },
      { id: 'u2', type: 'photo', date: 'Dec 10, 2025', title: 'Samsung SDI Factory Tour', body: 'Partners toured Samsung SDI\'s zero-waste-to-landfill battery manufacturing facility, which achieved a 99.7% waste diversion rate.', image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=300&fit=crop' },
      { id: 'u3', type: 'greenscore', date: 'Jan 5, 2026', title: 'First Quarter Results', body: 'Network average green score improved from 58.6 to 74.2. Largest gains in energy management and waste reduction skills.', scoreDelta: 15.6, newScore: 74.2 },
      { id: 'u4', type: 'event', date: 'Jan 20, 2026', title: 'Clean Production Standards Workshop — Tokyo', body: 'Toyota hosted a 3-day workshop on lean green manufacturing, combining Toyota Production System principles with environmental management. 120 engineers attended.' },
      { id: 'u5', type: 'milestone', date: 'Feb 5, 2026', title: '1,000 Employees Certified', body: 'The network has certified 1,000 employees in Green Manufacturing Fundamentals. LG Energy Solutions leads with 280 certifications.' },
      { id: 'u6', type: 'greenscore', date: 'Feb 20, 2026', title: 'Score Update: 85.3', body: 'Continued improvement as partners implement shared best practices. Samsung SDI\'s workforce achieved an average assessment score of 3.6/4.0.', scoreDelta: 26.7, newScore: 85.3 },
      { id: 'u7', type: 'climate', date: 'Feb 25, 2026', title: 'Asia Climate Week Preview', body: 'Network partners will present their collaborative workforce development model at Asia Climate Week in Singapore. The model is being recognized as a blueprint for regional manufacturing decarbonization.' },
    ],
  },
};

/* ───────── STYLES ───────── */

const UPDATE_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  event: { icon: '📅', color: '#7C3AED', bg: '#F5F3FF', label: 'Event' },
  milestone: { icon: '🏆', color: '#D97706', bg: '#FFFBEB', label: 'Milestone' },
  fundraising: { icon: '💰', color: '#059669', bg: '#ECFDF5', label: 'Fundraising' },
  greenscore: { icon: '📊', color: '#0891B2', bg: '#ECFEFF', label: 'Green Score' },
  climate: { icon: '🌍', color: '#DC2626', bg: '#FEF2F2', label: 'Climate Alert' },
  photo: { icon: '📸', color: '#6366F1', bg: '#EEF2FF', label: 'Photo Update' },
  announcement: { icon: '📢', color: '#1E293B', bg: '#F1F5F9', label: 'Announcement' },
};

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  'In Progress': { bg: '#D1FAE5', fg: '#065F46' },
  'Awaiting Responses': { bg: '#FEF3C7', fg: '#92400E' },
  'Completed': { bg: '#E0E7FF', fg: '#3730A3' },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const campaign = CAMPAIGNS[id];

  if (!campaign) {
    return (
      <AppShell>
        <div className="max-w-4xl py-20 text-center">
          <p className="text-slate-400 text-lg">Campaign not found.</p>
          <button onClick={() => router.push('/dashboard/community')} className="mt-4 text-emerald-600 hover:text-emerald-500 font-medium">
            Back to Community
          </button>
        </div>
      </AppShell>
    );
  }

  const statusStyle = STATUS_STYLES[campaign.status] || STATUS_STYLES['In Progress'];

  return (
    <AppShell>
      <div className="max-w-4xl">
        {/* Back link */}
        <button
          onClick={() => router.push('/dashboard/community')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Community
        </button>

        {/* ── HEADER ── */}
        <div className="panel rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
                <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}>
                  {campaign.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{campaign.type}</span>
                <span className="text-slate-300">|</span>
                <span>{campaign.startDate}{campaign.endDate ? ` — ${campaign.endDate}` : ''}</span>
                <span className="text-slate-300">|</span>
                <span>{campaign.industry} &middot; {campaign.region}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">{campaign.xpEarned.toLocaleString()}</div>
              <div className="text-xs text-slate-400">XP Earned</div>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{campaign.description}</p>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="panel rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{campaign.partners.length}</div>
            <div className="text-xs text-slate-400 mt-1">Partners</div>
          </div>
          <div className="panel rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{campaign.updates.length}</div>
            <div className="text-xs text-slate-400 mt-1">Updates</div>
          </div>
          {campaign.greenScoreImpact && (
            <div className="panel rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-cyan-600">+{(campaign.greenScoreImpact.after - campaign.greenScoreImpact.before).toFixed(1)}</div>
              <div className="text-xs text-slate-400 mt-1">Score Impact</div>
            </div>
          )}
          {campaign.fundraising && (
            <div className="panel rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{Math.round((campaign.fundraising.raised / campaign.fundraising.goal) * 100)}%</div>
              <div className="text-xs text-slate-400 mt-1">Funded</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: UPDATES FEED ── */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Campaign Updates</h2>

            {/* Fundraising progress bar */}
            {campaign.fundraising && (
              <div className="panel rounded-xl shadow-sm p-5 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Fundraising Progress</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {campaign.fundraising.currency === 'EUR' ? '\u20AC' : '$'}
                    {campaign.fundraising.raised.toLocaleString()} / {campaign.fundraising.currency === 'EUR' ? '\u20AC' : '$'}
                    {campaign.fundraising.goal.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (campaign.fundraising.raised / campaign.fundraising.goal) * 100)}%`,
                      backgroundColor: campaign.fundraising.raised >= campaign.fundraising.goal ? '#059669' : '#F59E0B',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Updates timeline */}
            <div className="space-y-4">
              {[...campaign.updates].reverse().map((update) => {
                const config = UPDATE_TYPE_CONFIG[update.type] || UPDATE_TYPE_CONFIG.announcement;
                return (
                  <div key={update.id} className="panel rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: config.bg }}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ backgroundColor: config.bg, color: config.color }}>
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-400">{update.date}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">{update.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{update.body}</p>

                        {/* Green score change */}
                        {update.type === 'greenscore' && update.scoreDelta != null && (
                          <div className="mt-3 flex items-center gap-3 bg-cyan-50 rounded-lg p-3">
                            <div className="text-xl font-bold text-cyan-600">+{update.scoreDelta}</div>
                            <div className="text-xs text-cyan-700">
                              Green Score increased to <strong>{update.newScore}</strong>
                            </div>
                          </div>
                        )}

                        {/* Fundraising update */}
                        {update.type === 'fundraising' && update.raised != null && update.goal != null && (
                          <div className="mt-3 bg-emerald-50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-emerald-700 font-medium">${update.raised.toLocaleString()} raised</span>
                              <span className="text-emerald-500">{Math.round((update.raised / update.goal) * 100)}%</span>
                            </div>
                            <div className="w-full bg-emerald-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, (update.raised / update.goal) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Photo */}
                        {update.image && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={update.image}
                              alt={update.title}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: PARTNERS + SCORE ── */}
          <div className="space-y-6">
            {/* Green Score Impact */}
            {campaign.greenScoreImpact && (
              <div className="panel rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Green Score Impact</h3>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-400">{campaign.greenScoreImpact.before}</div>
                    <div className="text-xs text-slate-400">Before</div>
                  </div>
                  <div className="text-center">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{campaign.greenScoreImpact.after}</div>
                    <div className="text-xs text-slate-400">After</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                    style={{ width: `${(campaign.greenScoreImpact.after / 100) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Partners List */}
            <div className="panel rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Partners ({campaign.partners.length})</h3>
              <div className="space-y-3">
                {campaign.partners.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                      {p.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.industry}</div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600">{p.score}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="panel rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Campaign Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Started</span>
                  <span className="text-slate-700 font-medium">{campaign.startDate}</span>
                </div>
                {campaign.endDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ended</span>
                    <span className="text-slate-700 font-medium">{campaign.endDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Updates</span>
                  <span className="text-slate-700 font-medium">{campaign.updates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">XP Earned</span>
                  <span className="text-emerald-600 font-bold">{campaign.xpEarned.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
