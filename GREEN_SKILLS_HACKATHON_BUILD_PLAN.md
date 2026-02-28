# 🏆 Green Skills Gap Intelligence MVP — HACKATHON BUILD PLAN

## Codename: **GreenScope**

> "Don't just find the gaps — quantify what closing them is worth."

**Solo builder. AI-agent assisted. Ship by 1pm tomorrow.**

---

## DIFFERENTIATOR SUMMARY

While everyone else builds "you have gaps, here's a chart," GreenScope answers:

1. **How much is each gap costing us?** (ROI Estimation Engine)
2. **What money is on the table?** (Federal/State Incentive Eligibility)
3. **Give me something I can hand my CFO.** (Executive Summary Report)

This transforms a compliance checkbox into a **business case generator**.

---

## REVISED TECH STACK

```
Frontend:  Next.js 14 (App Router) + Tailwind CSS + Recharts
Backend:   Node.js + Express + TypeScript
Auth:      NextAuth.js (Google SSO)
Database:  SQLite (dev) → PostgreSQL (deploy)
ORM:       Prisma
Export:    CSV (json2csv) + HTML Executive Summary (printable)
Deploy:    Vercel (frontend) + Railway (backend + DB)
```

---

## BUILD PHASES (Time-boxed)

| Phase | What | Time Est | Priority |
|-------|------|----------|----------|
| A | Scaffolding + DB + Seed | 1.5h | 🔴 Critical |
| B | Auth (Google SSO) | 0.5h | 🔴 Critical |
| C | Company Onboarding | 0.5h | 🔴 Critical |
| D | Skills Directory + Mapping | 0.5h | 🔴 Critical |
| E | Role Management | 1h | 🔴 Critical |
| F | Assessment Flow | 1.5h | 🔴 Critical |
| G | Gap Calculation + ROI Engine | 1h | 🔴 Critical |
| H | Dashboard (all widgets) | 2h | 🔴 Critical |
| I | Incentive Eligibility | 1h | 🟡 High |
| J | Executive Summary Export | 1h | 🟡 High |
| K | CSV Export | 0.5h | 🔴 Critical |
| L | Deploy + Demo Polish | 1.5h | 🔴 Critical |
| M | README + Docs | 1h | 🔴 Critical |
| **TOTAL** | | **~13h** | Buffer: ~11h |

---

## PRISMA SCHEMA

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"       // swap to "postgresql" for deploy
  url      = env("DATABASE_URL")
}

// ─── AUTH ───────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  company       Company?  @relation(fields: [companyId], references: [id])
  companyId     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// ─── COMPANY ────────────────────────────────────────────

model Company {
  id          String   @id @default(cuid())
  name        String
  industry    String          // Manufacturing, Technology, Finance, Energy, Healthcare, Retail
  size        String          // small (<50), medium (50-500), large (500+)
  location    String          // state code e.g. "FL"
  country     String   @default("US")
  users       User[]
  roles       Role[]
  assessments Assessment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── SKILLS SYSTEM ──────────────────────────────────────

model SkillFamily {
  id          String   @id @default(cuid())
  name        String   @unique   // 4 families
  description String
  color       String              // hex for UI heatmap
  skills      Skill[]
}

model Skill {
  id          String   @id @default(cuid())
  name        String
  description String
  familyId    String
  family      SkillFamily @relation(fields: [familyId], references: [id])
  tags        String      @default("")   // comma-separated
  roleRequirements RoleSkillRequirement[]
  questionMappings QuestionSkillMap[]
}

// ─── FUNCTIONS & ROLES ──────────────────────────────────

model BusinessFunction {
  id    String @id @default(cuid())
  name  String @unique   // Operations, Procurement, Finance, Technology
  roles Role[]
}

model Role {
  id            String   @id @default(cuid())
  title         String
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  functionId    String
  function      BusinessFunction @relation(fields: [functionId], references: [id])
  skillRequirements RoleSkillRequirement[]
  assessments   Assessment[]
  createdAt     DateTime @default(now())
}

model RoleSkillRequirement {
  id            String @id @default(cuid())
  roleId        String
  role          Role   @relation(fields: [roleId], references: [id])
  skillId       String
  skill         Skill  @relation(fields: [skillId], references: [id])
  requiredLevel Int           // 1-4
  weight        Int    @default(1) // 1-3 importance multiplier
  rationale     String @default("") // why this skill matters for this role

  @@unique([roleId, skillId])
}

// ─── ASSESSMENT ─────────────────────────────────────────

model Question {
  id            String @id @default(cuid())
  text          String
  scenarioText  String @default("")  // optional scenario context
  functionId    String?              // null = universal question
  orderIndex    Int
  skillMappings QuestionSkillMap[]
  answers       AssessmentAnswer[]
}

model QuestionSkillMap {
  id         String @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id])
  skillId    String
  skill      Skill    @relation(fields: [skillId], references: [id])

  @@unique([questionId, skillId])
}

model Assessment {
  id            String   @id @default(cuid())
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  roleId        String
  role          Role     @relation(fields: [roleId], references: [id])
  employeeName  String   @default("Demo Employee")
  status        String   @default("in_progress") // in_progress, completed
  answers       AssessmentAnswer[]
  completedAt   DateTime?
  createdAt     DateTime @default(now())
}

model AssessmentAnswer {
  id           String     @id @default(cuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id])
  questionId   String
  question     Question   @relation(fields: [questionId], references: [id])
  score        Int               // 1-4

  @@unique([assessmentId, questionId])
}

// ─── ROI & INCENTIVES ───────────────────────────────────

model IncentiveProgram {
  id              String @id @default(cuid())
  name            String
  type            String          // federal_tax_credit, state_grant, state_tax_credit, federal_grant
  description     String
  estimatedValue  String          // e.g. "$5,000-$50,000 per employee" or "up to 30% of training costs"
  eligibleIndustries String       // comma-separated or "all"
  eligibleStates    String        // comma-separated state codes or "all"
  eligibleFamilies  String        // comma-separated skill family IDs or "all"
  url             String @default("")
  agency          String          // e.g. "IRS", "DOE", "FL DEO"
  deadlineInfo    String @default("Ongoing")
}

model RoiMultiplier {
  id              String @id @default(cuid())
  industry        String
  severity        String    // critical, moderate
  riskType        String    // regulatory_fine, contract_loss, insurance_premium, reputation
  annualCostLow   Float
  annualCostHigh  Float
  description     String
}
```

---

## SEED DATA

### 1. Skill Families (4)

```json
[
  {
    "id": "fam_env_literacy",
    "name": "Environmental Literacy",
    "description": "Understanding of climate science, environmental regulations, carbon accounting, and ecological systems thinking",
    "color": "#059669"
  },
  {
    "id": "fam_sustainable_ops",
    "name": "Sustainable Operations",
    "description": "Ability to integrate sustainability into day-to-day business processes, supply chains, and operational decisions",
    "color": "#0891B2"
  },
  {
    "id": "fam_green_innovation",
    "name": "Green Innovation & Strategy",
    "description": "Capability to drive sustainable transformation, develop green products/services, and embed climate into strategy",
    "color": "#7C3AED"
  },
  {
    "id": "fam_governance_reporting",
    "name": "Governance & Reporting",
    "description": "Skills in ESG reporting, regulatory compliance, stakeholder communication, and sustainability governance frameworks",
    "color": "#DC2626"
  }
]
```

### 2. Skills (50 skills across 4 families)

```json
[
  // ═══ ENVIRONMENTAL LITERACY (13 skills) ═══
  { "id": "sk_001", "familyId": "fam_env_literacy", "name": "Climate Science Fundamentals", "description": "Understanding of greenhouse effect, carbon cycle, climate projections, and planetary boundaries", "tags": "climate,science,fundamentals" },
  { "id": "sk_002", "familyId": "fam_env_literacy", "name": "Carbon Footprint Analysis", "description": "Ability to measure, calculate, and interpret Scope 1, 2, and 3 emissions", "tags": "carbon,emissions,measurement" },
  { "id": "sk_003", "familyId": "fam_env_literacy", "name": "Environmental Regulation Awareness", "description": "Knowledge of key environmental regulations (EPA, EU Taxonomy, CSRD) and compliance requirements", "tags": "regulation,compliance,legal" },
  { "id": "sk_004", "familyId": "fam_env_literacy", "name": "Biodiversity & Ecosystem Impact", "description": "Understanding how business operations affect biodiversity, land use, and natural ecosystems", "tags": "biodiversity,ecosystem,nature" },
  { "id": "sk_005", "familyId": "fam_env_literacy", "name": "Water Stewardship", "description": "Knowledge of water risks, usage optimization, and watershed management principles", "tags": "water,stewardship,resource" },
  { "id": "sk_006", "familyId": "fam_env_literacy", "name": "Circular Economy Principles", "description": "Understanding of waste hierarchy, material loops, cradle-to-cradle design, and resource recovery", "tags": "circular,waste,materials" },
  { "id": "sk_007", "familyId": "fam_env_literacy", "name": "Energy Systems Knowledge", "description": "Understanding of renewable vs fossil energy sources, grid dynamics, and energy transition pathways", "tags": "energy,renewable,transition" },
  { "id": "sk_008", "familyId": "fam_env_literacy", "name": "Life Cycle Assessment (LCA)", "description": "Ability to evaluate environmental impacts across a product or service's full lifecycle", "tags": "lca,lifecycle,assessment" },
  { "id": "sk_009", "familyId": "fam_env_literacy", "name": "Climate Risk Identification", "description": "Ability to identify physical and transition climate risks to business operations", "tags": "risk,climate,identification" },
  { "id": "sk_010", "familyId": "fam_env_literacy", "name": "Environmental Data Interpretation", "description": "Ability to read, interpret, and communicate environmental datasets and metrics", "tags": "data,interpretation,metrics" },
  { "id": "sk_011", "familyId": "fam_env_literacy", "name": "Pollution Prevention", "description": "Knowledge of air, soil, and water pollution sources and prevention strategies", "tags": "pollution,prevention,control" },
  { "id": "sk_012", "familyId": "fam_env_literacy", "name": "Sustainable Materials Knowledge", "description": "Understanding of material sustainability, recyclability, and environmental material certifications", "tags": "materials,sustainable,certification" },
  { "id": "sk_013", "familyId": "fam_env_literacy", "name": "Climate Justice Awareness", "description": "Understanding of equitable climate transition impacts on communities and workers", "tags": "justice,equity,transition" },

  // ═══ SUSTAINABLE OPERATIONS (13 skills) ═══
  { "id": "sk_014", "familyId": "fam_sustainable_ops", "name": "Green Procurement", "description": "Ability to integrate environmental criteria into purchasing decisions and supplier evaluation", "tags": "procurement,purchasing,suppliers" },
  { "id": "sk_015", "familyId": "fam_sustainable_ops", "name": "Sustainable Supply Chain Management", "description": "Capability to map, assess, and improve sustainability across supply chain tiers", "tags": "supply chain,logistics,management" },
  { "id": "sk_016", "familyId": "fam_sustainable_ops", "name": "Energy Efficiency in Operations", "description": "Ability to identify and implement energy reduction measures in facilities and processes", "tags": "energy,efficiency,operations" },
  { "id": "sk_017", "familyId": "fam_sustainable_ops", "name": "Waste Reduction & Management", "description": "Skills in waste auditing, reduction strategies, and diversion from landfill", "tags": "waste,reduction,management" },
  { "id": "sk_018", "familyId": "fam_sustainable_ops", "name": "Sustainable Logistics", "description": "Knowledge of green transportation, route optimization, and last-mile sustainability", "tags": "logistics,transport,shipping" },
  { "id": "sk_019", "familyId": "fam_sustainable_ops", "name": "Green Building & Facilities", "description": "Understanding of sustainable building standards (LEED, WELL), energy management, and facility greening", "tags": "building,facilities,leed" },
  { "id": "sk_020", "familyId": "fam_sustainable_ops", "name": "Operational Carbon Reduction", "description": "Ability to develop and execute carbon reduction plans for operations", "tags": "carbon,reduction,operations" },
  { "id": "sk_021", "familyId": "fam_sustainable_ops", "name": "Sustainable IT & Digital Operations", "description": "Knowledge of green IT practices, data center efficiency, and digital sustainability", "tags": "it,digital,green tech" },
  { "id": "sk_022", "familyId": "fam_sustainable_ops", "name": "Resource Efficiency Planning", "description": "Ability to optimize resource consumption (water, energy, materials) across operations", "tags": "resource,efficiency,planning" },
  { "id": "sk_023", "familyId": "fam_sustainable_ops", "name": "Environmental Health & Safety", "description": "Integration of environmental considerations into workplace health and safety programs", "tags": "health,safety,ehs" },
  { "id": "sk_024", "familyId": "fam_sustainable_ops", "name": "Supplier Sustainability Assessment", "description": "Ability to evaluate and score suppliers on environmental performance", "tags": "supplier,assessment,evaluation" },
  { "id": "sk_025", "familyId": "fam_sustainable_ops", "name": "Process Optimization for Sustainability", "description": "Ability to redesign workflows and processes to minimize environmental impact", "tags": "process,optimization,workflow" },
  { "id": "sk_026", "familyId": "fam_sustainable_ops", "name": "Climate-Resilient Operations", "description": "Capability to build operational resilience against climate disruptions", "tags": "resilience,adaptation,continuity" },

  // ═══ GREEN INNOVATION & STRATEGY (12 skills) ═══
  { "id": "sk_027", "familyId": "fam_green_innovation", "name": "Sustainability Strategy Development", "description": "Ability to formulate and articulate organizational sustainability strategies aligned with business goals", "tags": "strategy,planning,vision" },
  { "id": "sk_028", "familyId": "fam_green_innovation", "name": "Green Product Design", "description": "Capability to integrate sustainability criteria into product development and design thinking", "tags": "product,design,innovation" },
  { "id": "sk_029", "familyId": "fam_green_innovation", "name": "Sustainable Business Model Innovation", "description": "Ability to identify and develop business models that create environmental and economic value", "tags": "business model,innovation,value" },
  { "id": "sk_030", "familyId": "fam_green_innovation", "name": "Climate Tech Evaluation", "description": "Ability to assess and recommend climate technology solutions for business application", "tags": "technology,evaluation,cleantech" },
  { "id": "sk_031", "familyId": "fam_green_innovation", "name": "Sustainability Change Management", "description": "Skills in driving organizational change toward sustainable practices", "tags": "change management,culture,leadership" },
  { "id": "sk_032", "familyId": "fam_green_innovation", "name": "Green Finance & Investment", "description": "Understanding of green bonds, sustainability-linked loans, and climate investment criteria", "tags": "finance,investment,green bonds" },
  { "id": "sk_033", "familyId": "fam_green_innovation", "name": "Carbon Market & Offset Strategy", "description": "Knowledge of voluntary and compliance carbon markets, offset quality, and trading mechanisms", "tags": "carbon market,offsets,trading" },
  { "id": "sk_034", "familyId": "fam_green_innovation", "name": "Net Zero Pathway Planning", "description": "Ability to develop science-based targets and credible net-zero transition roadmaps", "tags": "net zero,targets,sbti" },
  { "id": "sk_035", "familyId": "fam_green_innovation", "name": "Sustainable Innovation Management", "description": "Ability to foster and manage innovation pipelines focused on sustainability outcomes", "tags": "innovation,management,pipeline" },
  { "id": "sk_036", "familyId": "fam_green_innovation", "name": "Climate Scenario Analysis", "description": "Capability to model business impacts under different climate and transition scenarios", "tags": "scenario,analysis,modeling" },
  { "id": "sk_037", "familyId": "fam_green_innovation", "name": "Stakeholder Engagement for Sustainability", "description": "Ability to engage internal and external stakeholders in sustainability initiatives", "tags": "stakeholder,engagement,communication" },
  { "id": "sk_038", "familyId": "fam_green_innovation", "name": "Just Transition Planning", "description": "Capability to plan workforce transitions that are equitable and community-centered", "tags": "just transition,workforce,equity" },

  // ═══ GOVERNANCE & REPORTING (12 skills) ═══
  { "id": "sk_039", "familyId": "fam_governance_reporting", "name": "ESG Reporting & Disclosure", "description": "Ability to prepare sustainability reports following GRI, SASB, ISSB, or CDP frameworks", "tags": "reporting,esg,disclosure" },
  { "id": "sk_040", "familyId": "fam_governance_reporting", "name": "CSRD & EU Taxonomy Compliance", "description": "Knowledge of EU Corporate Sustainability Reporting Directive and Taxonomy alignment", "tags": "csrd,eu taxonomy,compliance" },
  { "id": "sk_041", "familyId": "fam_governance_reporting", "name": "SEC Climate Disclosure", "description": "Understanding of SEC climate-related disclosure requirements and preparation", "tags": "sec,disclosure,regulation" },
  { "id": "sk_042", "familyId": "fam_governance_reporting", "name": "TCFD/TNFD Reporting", "description": "Ability to report against Task Force on Climate/Nature-related Financial Disclosures", "tags": "tcfd,tnfd,financial disclosure" },
  { "id": "sk_043", "familyId": "fam_governance_reporting", "name": "Sustainability Data Management", "description": "Ability to collect, validate, and manage environmental data for reporting", "tags": "data,management,quality" },
  { "id": "sk_044", "familyId": "fam_governance_reporting", "name": "Green Compliance Auditing", "description": "Skills in conducting internal environmental compliance audits and managing audit findings", "tags": "audit,compliance,internal" },
  { "id": "sk_045", "familyId": "fam_governance_reporting", "name": "Sustainability KPI Development", "description": "Ability to define and track meaningful sustainability key performance indicators", "tags": "kpi,metrics,performance" },
  { "id": "sk_046", "familyId": "fam_governance_reporting", "name": "Board-Level Sustainability Governance", "description": "Understanding of governance structures for sustainability oversight at board level", "tags": "governance,board,oversight" },
  { "id": "sk_047", "familyId": "fam_governance_reporting", "name": "Environmental Legal Risk Management", "description": "Ability to identify and manage legal risks from environmental regulations and litigation", "tags": "legal,risk,regulation" },
  { "id": "sk_048", "familyId": "fam_governance_reporting", "name": "Third-Party Sustainability Verification", "description": "Knowledge of assurance standards and managing third-party verification of sustainability data", "tags": "verification,assurance,third party" },
  { "id": "sk_049", "familyId": "fam_governance_reporting", "name": "Sustainability Communication", "description": "Ability to communicate sustainability performance to diverse audiences without greenwashing", "tags": "communication,messaging,greenwashing" },
  { "id": "sk_050", "familyId": "fam_governance_reporting", "name": "Grant & Incentive Application", "description": "Ability to identify, apply for, and manage green grants, tax incentives, and sustainability funding", "tags": "grants,incentives,funding" }
]
```

### 3. Function → Skill Mapping (role_skill_map.json)

Each function auto-assigns ~12-15 skills with required levels and weights.

```json
{
  "Operations": {
    "skills": [
      { "skillId": "sk_001", "requiredLevel": 2, "weight": 1, "rationale": "Ops leaders need baseline climate science to contextualize operational changes" },
      { "skillId": "sk_002", "requiredLevel": 3, "weight": 3, "rationale": "Carbon footprint is central to operational emissions management" },
      { "skillId": "sk_005", "requiredLevel": 2, "weight": 2, "rationale": "Water usage is a key operational resource to steward" },
      { "skillId": "sk_007", "requiredLevel": 3, "weight": 2, "rationale": "Energy systems knowledge drives facility and process decisions" },
      { "skillId": "sk_009", "requiredLevel": 3, "weight": 3, "rationale": "Operations must identify climate risks to physical assets and supply" },
      { "skillId": "sk_016", "requiredLevel": 4, "weight": 3, "rationale": "Energy efficiency is the #1 operational sustainability lever" },
      { "skillId": "sk_017", "requiredLevel": 3, "weight": 2, "rationale": "Waste reduction directly impacts operational costs and compliance" },
      { "skillId": "sk_019", "requiredLevel": 2, "weight": 1, "rationale": "Facility greening supports operational sustainability goals" },
      { "skillId": "sk_020", "requiredLevel": 4, "weight": 3, "rationale": "Operational carbon reduction is a core responsibility" },
      { "skillId": "sk_022", "requiredLevel": 3, "weight": 2, "rationale": "Resource efficiency planning underpins sustainable ops" },
      { "skillId": "sk_023", "requiredLevel": 3, "weight": 2, "rationale": "EHS integration is essential for operational sustainability" },
      { "skillId": "sk_025", "requiredLevel": 3, "weight": 2, "rationale": "Process optimization reduces both cost and environmental impact" },
      { "skillId": "sk_026", "requiredLevel": 3, "weight": 3, "rationale": "Climate resilience protects operational continuity" }
    ]
  },
  "Procurement": {
    "skills": [
      { "skillId": "sk_001", "requiredLevel": 2, "weight": 1, "rationale": "Baseline climate science for informed purchasing decisions" },
      { "skillId": "sk_002", "requiredLevel": 3, "weight": 2, "rationale": "Scope 3 emissions are predominantly procurement-driven" },
      { "skillId": "sk_003", "requiredLevel": 3, "weight": 2, "rationale": "Regulations increasingly require sustainable procurement" },
      { "skillId": "sk_006", "requiredLevel": 3, "weight": 2, "rationale": "Circular economy shapes material and supplier selection" },
      { "skillId": "sk_008", "requiredLevel": 3, "weight": 3, "rationale": "LCA is critical for comparing procurement alternatives" },
      { "skillId": "sk_012", "requiredLevel": 4, "weight": 3, "rationale": "Material sustainability is core to green procurement" },
      { "skillId": "sk_014", "requiredLevel": 4, "weight": 3, "rationale": "Green procurement is the primary function responsibility" },
      { "skillId": "sk_015", "requiredLevel": 4, "weight": 3, "rationale": "Supply chain sustainability management is essential" },
      { "skillId": "sk_018", "requiredLevel": 2, "weight": 1, "rationale": "Logistics decisions have major environmental footprint" },
      { "skillId": "sk_024", "requiredLevel": 4, "weight": 3, "rationale": "Supplier assessment is a core procurement competency" },
      { "skillId": "sk_037", "requiredLevel": 2, "weight": 1, "rationale": "Engaging suppliers requires stakeholder management skills" },
      { "skillId": "sk_048", "requiredLevel": 2, "weight": 1, "rationale": "Verifying supplier sustainability claims prevents greenwashing" }
    ]
  },
  "Finance": {
    "skills": [
      { "skillId": "sk_001", "requiredLevel": 2, "weight": 1, "rationale": "Financial planners need climate context for risk modeling" },
      { "skillId": "sk_002", "requiredLevel": 2, "weight": 2, "rationale": "Carbon accounting increasingly intersects financial accounting" },
      { "skillId": "sk_003", "requiredLevel": 3, "weight": 2, "rationale": "Regulatory costs and fines impact financial planning" },
      { "skillId": "sk_009", "requiredLevel": 3, "weight": 3, "rationale": "Climate risk directly impacts financial risk models" },
      { "skillId": "sk_010", "requiredLevel": 3, "weight": 2, "rationale": "Interpreting environmental data feeds into financial reports" },
      { "skillId": "sk_032", "requiredLevel": 4, "weight": 3, "rationale": "Green finance is a core capability for the finance function" },
      { "skillId": "sk_033", "requiredLevel": 3, "weight": 2, "rationale": "Carbon market strategy has direct financial implications" },
      { "skillId": "sk_036", "requiredLevel": 4, "weight": 3, "rationale": "Climate scenario analysis is critical for financial planning" },
      { "skillId": "sk_039", "requiredLevel": 3, "weight": 3, "rationale": "ESG reporting is increasingly integrated with financial disclosure" },
      { "skillId": "sk_041", "requiredLevel": 4, "weight": 3, "rationale": "SEC climate disclosure is a mandatory finance competency" },
      { "skillId": "sk_042", "requiredLevel": 3, "weight": 2, "rationale": "TCFD reporting bridges climate and financial risk" },
      { "skillId": "sk_045", "requiredLevel": 3, "weight": 2, "rationale": "KPI development ensures measurable sustainability performance" },
      { "skillId": "sk_047", "requiredLevel": 3, "weight": 2, "rationale": "Environmental legal risk has material financial impact" },
      { "skillId": "sk_050", "requiredLevel": 3, "weight": 3, "rationale": "Identifying grants and incentives directly improves ROI" }
    ]
  },
  "Technology": {
    "skills": [
      { "skillId": "sk_001", "requiredLevel": 2, "weight": 1, "rationale": "Tech teams need climate science awareness for solution design" },
      { "skillId": "sk_002", "requiredLevel": 2, "weight": 1, "rationale": "Understanding carbon footprint of digital operations" },
      { "skillId": "sk_007", "requiredLevel": 3, "weight": 2, "rationale": "Energy systems knowledge for data center and infra decisions" },
      { "skillId": "sk_010", "requiredLevel": 3, "weight": 2, "rationale": "Environmental data interpretation for building dashboards and tools" },
      { "skillId": "sk_021", "requiredLevel": 4, "weight": 3, "rationale": "Sustainable IT is the core green skill for technology teams" },
      { "skillId": "sk_025", "requiredLevel": 3, "weight": 2, "rationale": "Process optimization reduces digital waste and energy use" },
      { "skillId": "sk_028", "requiredLevel": 3, "weight": 3, "rationale": "Green product design integrates sustainability into tech products" },
      { "skillId": "sk_029", "requiredLevel": 2, "weight": 1, "rationale": "Business model innovation enables new green tech solutions" },
      { "skillId": "sk_030", "requiredLevel": 4, "weight": 3, "rationale": "Evaluating climate tech is essential for the technology function" },
      { "skillId": "sk_035", "requiredLevel": 3, "weight": 2, "rationale": "Innovation management drives the green tech pipeline" },
      { "skillId": "sk_043", "requiredLevel": 4, "weight": 3, "rationale": "Data management infrastructure enables all sustainability reporting" },
      { "skillId": "sk_049", "requiredLevel": 2, "weight": 1, "rationale": "Tech teams build the tools that communicate sustainability performance" }
    ]
  }
}
```

### 4. Assessment Questions (20 questions — scenario-enhanced)

```json
[
  {
    "id": "q_01",
    "text": "Your facilities team reports that energy costs rose 18% this quarter. How would you approach identifying the causes and potential sustainability improvements?",
    "scenarioText": "Quarterly energy cost review meeting with operations leadership.",
    "skillIds": ["sk_007", "sk_016"],
    "functionId": null,
    "orderIndex": 1
  },
  {
    "id": "q_02",
    "text": "A major supplier is unable to provide emissions data for their manufacturing processes. How would you handle this in your procurement evaluation?",
    "scenarioText": "Supplier review during annual contract renewal.",
    "skillIds": ["sk_024", "sk_014"],
    "functionId": null,
    "orderIndex": 2
  },
  {
    "id": "q_03",
    "text": "You are asked to explain your company's Scope 1, 2, and 3 emissions to a non-technical executive. How confident are you in breaking this down clearly?",
    "scenarioText": "Board preparation briefing.",
    "skillIds": ["sk_002", "sk_010"],
    "functionId": null,
    "orderIndex": 3
  },
  {
    "id": "q_04",
    "text": "A new regulation requires your company to disclose climate-related financial risks. How prepared are you to contribute to this process?",
    "scenarioText": "Regulatory compliance planning session.",
    "skillIds": ["sk_041", "sk_042"],
    "functionId": null,
    "orderIndex": 4
  },
  {
    "id": "q_05",
    "text": "Your team needs to reduce waste sent to landfill by 30% within 12 months. How would you approach building a reduction plan?",
    "scenarioText": "Annual sustainability target setting.",
    "skillIds": ["sk_017", "sk_006"],
    "functionId": null,
    "orderIndex": 5
  },
  {
    "id": "q_06",
    "text": "A product designer asks you to evaluate two materials — one cheaper but less recyclable, the other more expensive but fully circular. How do you frame the trade-off?",
    "scenarioText": "Product development review.",
    "skillIds": ["sk_012", "sk_008"],
    "functionId": null,
    "orderIndex": 6
  },
  {
    "id": "q_07",
    "text": "Your company wants to set a net-zero target. How would you evaluate whether the proposed timeline and pathway are credible?",
    "scenarioText": "Strategic planning offsite.",
    "skillIds": ["sk_034", "sk_027"],
    "functionId": null,
    "orderIndex": 7
  },
  {
    "id": "q_08",
    "text": "A climate event (hurricane, heatwave, flood) disrupts a key supplier. How do you assess the operational risk and build a response?",
    "scenarioText": "Crisis response and business continuity planning.",
    "skillIds": ["sk_009", "sk_026"],
    "functionId": null,
    "orderIndex": 8
  },
  {
    "id": "q_09",
    "text": "Your CFO asks whether green bond financing could reduce the cost of a new facility. How confident are you in evaluating this option?",
    "scenarioText": "Capital expenditure planning meeting.",
    "skillIds": ["sk_032", "sk_036"],
    "functionId": null,
    "orderIndex": 9
  },
  {
    "id": "q_10",
    "text": "You need to prepare your company's first sustainability report following GRI standards. How would you approach the data collection and reporting process?",
    "scenarioText": "Annual reporting cycle kickoff.",
    "skillIds": ["sk_039", "sk_043"],
    "functionId": null,
    "orderIndex": 10
  },
  {
    "id": "q_11",
    "text": "A colleague claims your company's new marketing campaign 'goes green' but you suspect it may constitute greenwashing. How do you assess and address this?",
    "scenarioText": "Marketing and communications review.",
    "skillIds": ["sk_049", "sk_003"],
    "functionId": null,
    "orderIndex": 11
  },
  {
    "id": "q_12",
    "text": "Your data center energy consumption is projected to double in 3 years due to AI workloads. How do you approach making this growth sustainable?",
    "scenarioText": "IT infrastructure planning.",
    "skillIds": ["sk_021", "sk_007"],
    "functionId": null,
    "orderIndex": 12
  },
  {
    "id": "q_13",
    "text": "You are tasked with mapping the full lifecycle environmental impact of your company's flagship product. Where do you start?",
    "scenarioText": "Product sustainability assessment project.",
    "skillIds": ["sk_008", "sk_028"],
    "functionId": null,
    "orderIndex": 13
  },
  {
    "id": "q_14",
    "text": "The local community raises concerns about water usage at your manufacturing facility. How do you evaluate your company's water risk and develop a response?",
    "scenarioText": "Community stakeholder meeting.",
    "skillIds": ["sk_005", "sk_037"],
    "functionId": null,
    "orderIndex": 14
  },
  {
    "id": "q_15",
    "text": "Your company is considering purchasing carbon offsets. How would you evaluate offset quality and determine whether this is the right strategy?",
    "scenarioText": "Emissions reduction strategy meeting.",
    "skillIds": ["sk_033", "sk_020"],
    "functionId": null,
    "orderIndex": 15
  },
  {
    "id": "q_16",
    "text": "You are asked to create KPIs that tie your team's sustainability progress to business performance. How do you design metrics that are both meaningful and measurable?",
    "scenarioText": "Quarterly OKR planning session.",
    "skillIds": ["sk_045", "sk_010"],
    "functionId": null,
    "orderIndex": 16
  },
  {
    "id": "q_17",
    "text": "A promising climate technology startup approaches your company for a pilot partnership. How do you evaluate whether their solution is viable and aligned with your goals?",
    "scenarioText": "Innovation and vendor evaluation.",
    "skillIds": ["sk_030", "sk_035"],
    "functionId": null,
    "orderIndex": 17
  },
  {
    "id": "q_18",
    "text": "Your supply chain spans 15 countries with varying environmental regulations. How do you build a compliance framework that works across jurisdictions?",
    "scenarioText": "Global supply chain governance review.",
    "skillIds": ["sk_015", "sk_003"],
    "functionId": null,
    "orderIndex": 18
  },
  {
    "id": "q_19",
    "text": "Leadership wants to understand how a 2°C vs 4°C warming scenario would impact the company's 10-year business plan. How would you approach this analysis?",
    "scenarioText": "Long-range strategic planning.",
    "skillIds": ["sk_036", "sk_009"],
    "functionId": null,
    "orderIndex": 19
  },
  {
    "id": "q_20",
    "text": "A government grant program offers $500K for workforce green skills development. How would you structure an application that demonstrates measurable impact?",
    "scenarioText": "Grant application development meeting.",
    "skillIds": ["sk_050", "sk_031"],
    "functionId": null,
    "orderIndex": 20
  }
]
```

### 5. Incentive Programs (15 real-world programs)

```json
[
  {
    "id": "inc_001",
    "name": "IRA Section 48C Advanced Energy Manufacturing Tax Credit",
    "type": "federal_tax_credit",
    "description": "Tax credit for investments in clean energy manufacturing facilities and workforce training for qualifying projects",
    "estimatedValue": "Up to 30% of qualified investment (6% base + 24% bonus for meeting prevailing wage/apprenticeship requirements)",
    "eligibleIndustries": "Manufacturing,Energy,Technology",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_sustainable_ops,fam_green_innovation",
    "url": "https://www.energy.gov/infrastructure/48C-702",
    "agency": "IRS / DOE",
    "deadlineInfo": "Rolling application rounds"
  },
  {
    "id": "inc_002",
    "name": "IRA Section 45X Advanced Manufacturing Production Tax Credit",
    "type": "federal_tax_credit",
    "description": "Production tax credit for domestic manufacturing of clean energy components including solar, wind, batteries, and critical minerals",
    "estimatedValue": "$0.07-$35 per unit depending on component type",
    "eligibleIndustries": "Manufacturing,Energy",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_sustainable_ops,fam_green_innovation",
    "url": "https://www.irs.gov/credits-deductions/manufacturers-production-credit",
    "agency": "IRS",
    "deadlineInfo": "Available through 2032"
  },
  {
    "id": "inc_003",
    "name": "DOE Industrial Efficiency & Decarbonization Grant",
    "type": "federal_grant",
    "description": "Grants for industrial facilities to improve energy efficiency, reduce emissions, and train workforce on sustainable operations",
    "estimatedValue": "$50,000 - $5,000,000 per project",
    "eligibleIndustries": "Manufacturing,Energy",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_sustainable_ops,fam_env_literacy",
    "url": "https://www.energy.gov/eere/iedo",
    "agency": "DOE EERE",
    "deadlineInfo": "Periodic funding opportunity announcements"
  },
  {
    "id": "inc_004",
    "name": "EPA Environmental Workforce Development and Job Training (EWDJT)",
    "type": "federal_grant",
    "description": "Grants for environmental job training programs that help communities develop skills for environmental careers",
    "estimatedValue": "Up to $500,000 per cooperative agreement",
    "eligibleIndustries": "all",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_env_literacy,fam_sustainable_ops",
    "url": "https://www.epa.gov/brownfields/environmental-workforce-development-and-job-training-ewdjt-grants",
    "agency": "EPA",
    "deadlineInfo": "Annual funding cycle"
  },
  {
    "id": "inc_005",
    "name": "USDA Rural Energy for America Program (REAP)",
    "type": "federal_grant",
    "description": "Grants and loan guarantees for rural small businesses and agricultural producers to purchase renewable energy systems and make energy efficiency improvements",
    "estimatedValue": "Grants up to 50% of project costs (max $1M for renewable energy, $500K for energy efficiency)",
    "eligibleIndustries": "Manufacturing,Retail,Energy",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_sustainable_ops,fam_green_innovation",
    "url": "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans",
    "agency": "USDA",
    "deadlineInfo": "Quarterly application deadlines"
  },
  {
    "id": "inc_006",
    "name": "Florida Department of Economic Opportunity - Quick Response Training (QRT)",
    "type": "state_grant",
    "description": "State-funded workforce training program that reimburses companies for custom training of new or existing employees in high-demand skills",
    "estimatedValue": "Up to $250,000 per project (reimbursement-based)",
    "eligibleIndustries": "all",
    "eligibleStates": "FL",
    "eligibleFamilies": "fam_env_literacy,fam_sustainable_ops,fam_green_innovation,fam_governance_reporting",
    "url": "https://floridajobs.org/workforce-board-resources/programs-and-resources/quick-response-training",
    "agency": "FL DEO",
    "deadlineInfo": "Open enrollment, first-come first-served"
  },
  {
    "id": "inc_007",
    "name": "Florida Renewable Energy Technologies Sales Tax Exemption",
    "type": "state_tax_credit",
    "description": "Sales tax exemption for renewable energy technologies including solar panels, equipment, and related workforce training investments",
    "estimatedValue": "6% sales tax savings on qualifying equipment and training",
    "eligibleIndustries": "all",
    "eligibleStates": "FL",
    "eligibleFamilies": "fam_sustainable_ops,fam_green_innovation",
    "url": "https://www.dsireusa.org/resources/detailed-summary/florida-renewable-energy-property-tax-exemption",
    "agency": "FL DOR",
    "deadlineInfo": "Ongoing"
  },
  {
    "id": "inc_008",
    "name": "California Climate Catalyst Fund",
    "type": "state_grant",
    "description": "Low-interest loans and grants for climate-aligned businesses in decarbonization, climate resilience, and green workforce development",
    "estimatedValue": "$500,000 - $25,000,000 per project",
    "eligibleIndustries": "all",
    "eligibleStates": "CA",
    "eligibleFamilies": "fam_green_innovation,fam_sustainable_ops",
    "url": "https://www.ibank.ca.gov/climate-financing/climate-catalyst-program/",
    "agency": "CA IBank",
    "deadlineInfo": "Rolling applications"
  },
  {
    "id": "inc_009",
    "name": "New York Clean Energy Workforce Development Grant",
    "type": "state_grant",
    "description": "Funding for clean energy training programs, apprenticeships, and workforce pipeline development in New York State",
    "estimatedValue": "Up to $1,000,000 per organization",
    "eligibleIndustries": "all",
    "eligibleStates": "NY",
    "eligibleFamilies": "fam_env_literacy,fam_sustainable_ops,fam_green_innovation",
    "url": "https://www.nyserda.ny.gov/All-Programs/Clean-Energy-Workforce-Development",
    "agency": "NYSERDA",
    "deadlineInfo": "Periodic PONs"
  },
  {
    "id": "inc_010",
    "name": "Texas Emissions Reduction Plan (TERP)",
    "type": "state_grant",
    "description": "Grants for projects that reduce emissions from heavy-duty vehicles, equipment, and industrial operations in Texas",
    "estimatedValue": "Varies by project type, up to $600,000",
    "eligibleIndustries": "Manufacturing,Energy,Retail",
    "eligibleStates": "TX",
    "eligibleFamilies": "fam_sustainable_ops,fam_env_literacy",
    "url": "https://www.tceq.texas.gov/airquality/terp",
    "agency": "TCEQ",
    "deadlineInfo": "Biannual grant cycles"
  },
  {
    "id": "inc_011",
    "name": "IRA Greenhouse Gas Reduction Fund (GGRF)",
    "type": "federal_grant",
    "description": "EPA administered fund providing grants for clean energy and climate projects, especially in low-income and disadvantaged communities",
    "estimatedValue": "$50,000 - $2,000,000 for community projects",
    "eligibleIndustries": "all",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_env_literacy,fam_green_innovation,fam_sustainable_ops",
    "url": "https://www.epa.gov/greenhouse-gas-reduction-fund",
    "agency": "EPA",
    "deadlineInfo": "Funds being deployed through 2027"
  },
  {
    "id": "inc_012",
    "name": "Section 179D Energy-Efficient Commercial Buildings Deduction",
    "type": "federal_tax_credit",
    "description": "Tax deduction for energy-efficient improvements to commercial buildings including HVAC, lighting, and building envelope upgrades",
    "estimatedValue": "Up to $5.00 per square foot (enhanced by IRA)",
    "eligibleIndustries": "all",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_sustainable_ops",
    "url": "https://www.energy.gov/eere/buildings/179d-commercial-buildings-energy-efficiency-tax-deduction",
    "agency": "IRS / DOE",
    "deadlineInfo": "Ongoing"
  },
  {
    "id": "inc_013",
    "name": "DOL H-1B Skills Training and Green Jobs Grant",
    "type": "federal_grant",
    "description": "Workforce training grants focused on developing green job skills in high-demand sectors including energy, construction, and manufacturing",
    "estimatedValue": "Up to $3,000,000 per project over 4 years",
    "eligibleIndustries": "Manufacturing,Energy,Technology",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_env_literacy,fam_sustainable_ops,fam_green_innovation",
    "url": "https://www.dol.gov/agencies/eta/skills-training-grants",
    "agency": "DOL ETA",
    "deadlineInfo": "Periodic solicitations"
  },
  {
    "id": "inc_014",
    "name": "Work Opportunity Tax Credit (WOTC) - Green Transition Workers",
    "type": "federal_tax_credit",
    "description": "Tax credit for hiring workers from targeted groups transitioning from fossil fuel industries to clean energy careers",
    "estimatedValue": "$2,400 - $9,600 per qualifying employee",
    "eligibleIndustries": "all",
    "eligibleStates": "all",
    "eligibleFamilies": "fam_env_literacy,fam_sustainable_ops",
    "url": "https://www.irs.gov/businesses/small-businesses-self-employed/work-opportunity-tax-credit",
    "agency": "IRS / DOL",
    "deadlineInfo": "Ongoing"
  },
  {
    "id": "inc_015",
    "name": "Florida SunBiz Green Business Certification Program",
    "type": "state_grant",
    "description": "State certification and associated benefits for businesses demonstrating sustainable practices, including priority consideration for state contracts",
    "estimatedValue": "Priority state contract consideration + marketing benefits",
    "eligibleIndustries": "all",
    "eligibleStates": "FL",
    "eligibleFamilies": "fam_governance_reporting,fam_sustainable_ops",
    "url": "https://floridadep.gov/green-business",
    "agency": "FL DEP",
    "deadlineInfo": "Ongoing"
  }
]
```

### 6. ROI Multipliers (risk cost estimates by industry + severity)

```json
[
  { "id": "roi_001", "industry": "Manufacturing", "severity": "critical", "riskType": "regulatory_fine", "annualCostLow": 50000, "annualCostHigh": 500000, "description": "EPA/OSHA fines for non-compliance with environmental regulations" },
  { "id": "roi_002", "industry": "Manufacturing", "severity": "critical", "riskType": "contract_loss", "annualCostLow": 100000, "annualCostHigh": 2000000, "description": "Loss of contracts requiring sustainability certifications or ESG compliance" },
  { "id": "roi_003", "industry": "Manufacturing", "severity": "critical", "riskType": "insurance_premium", "annualCostLow": 25000, "annualCostHigh": 150000, "description": "Increased insurance premiums due to unmanaged climate risk exposure" },
  { "id": "roi_004", "industry": "Manufacturing", "severity": "moderate", "riskType": "regulatory_fine", "annualCostLow": 10000, "annualCostHigh": 75000, "description": "Minor compliance gaps leading to warning-level penalties" },
  { "id": "roi_005", "industry": "Manufacturing", "severity": "moderate", "riskType": "contract_loss", "annualCostLow": 25000, "annualCostHigh": 250000, "description": "Reduced competitiveness in bids requiring sustainability credentials" },

  { "id": "roi_006", "industry": "Technology", "severity": "critical", "riskType": "regulatory_fine", "annualCostLow": 25000, "annualCostHigh": 250000, "description": "Data center energy compliance and e-waste regulation penalties" },
  { "id": "roi_007", "industry": "Technology", "severity": "critical", "riskType": "contract_loss", "annualCostLow": 200000, "annualCostHigh": 5000000, "description": "Enterprise clients requiring Scope 3 reporting from tech vendors" },
  { "id": "roi_008", "industry": "Technology", "severity": "critical", "riskType": "reputation", "annualCostLow": 50000, "annualCostHigh": 1000000, "description": "Brand damage from greenwashing allegations or poor ESG ratings" },
  { "id": "roi_009", "industry": "Technology", "severity": "moderate", "riskType": "contract_loss", "annualCostLow": 50000, "annualCostHigh": 500000, "description": "Missed RFP requirements for sustainability documentation" },

  { "id": "roi_010", "industry": "Finance", "severity": "critical", "riskType": "regulatory_fine", "annualCostLow": 100000, "annualCostHigh": 2000000, "description": "SEC climate disclosure non-compliance penalties" },
  { "id": "roi_011", "industry": "Finance", "severity": "critical", "riskType": "reputation", "annualCostLow": 500000, "annualCostHigh": 10000000, "description": "Investor and client attrition from poor climate risk management" },
  { "id": "roi_012", "industry": "Finance", "severity": "moderate", "riskType": "regulatory_fine", "annualCostLow": 25000, "annualCostHigh": 200000, "description": "Partial disclosure gaps in ESG reporting requirements" },

  { "id": "roi_013", "industry": "Energy", "severity": "critical", "riskType": "regulatory_fine", "annualCostLow": 200000, "annualCostHigh": 5000000, "description": "Major environmental violation penalties from EPA/state agencies" },
  { "id": "roi_014", "industry": "Energy", "severity": "critical", "riskType": "insurance_premium", "annualCostLow": 100000, "annualCostHigh": 1000000, "description": "Climate liability insurance cost increases" },
  { "id": "roi_015", "industry": "Energy", "severity": "critical", "riskType": "contract_loss", "annualCostLow": 500000, "annualCostHigh": 10000000, "description": "Lost power purchase agreements or transition contracts" },

  { "id": "roi_016", "industry": "Healthcare", "severity": "critical", "riskType": "regulatory_fine", "annualCostLow": 50000, "annualCostHigh": 500000, "description": "Environmental health regulation violations" },
  { "id": "roi_017", "industry": "Healthcare", "severity": "critical", "riskType": "insurance_premium", "annualCostLow": 50000, "annualCostHigh": 300000, "description": "Climate resilience gaps in facility operations" },

  { "id": "roi_018", "industry": "Retail", "severity": "critical", "riskType": "reputation", "annualCostLow": 100000, "annualCostHigh": 2000000, "description": "Consumer backlash from poor sustainability practices" },
  { "id": "roi_019", "industry": "Retail", "severity": "critical", "riskType": "contract_loss", "annualCostLow": 50000, "annualCostHigh": 500000, "description": "Loss of shelf space or partnerships requiring sustainability compliance" },
  { "id": "roi_020", "industry": "Retail", "severity": "moderate", "riskType": "reputation", "annualCostLow": 10000, "annualCostHigh": 100000, "description": "Negative sustainability sentiment impacting brand perception" }
]
```

---

## API CONTRACTS (Request/Response)

### POST /api/company
```typescript
// Request
{
  name: string;
  industry: "Manufacturing" | "Technology" | "Finance" | "Energy" | "Healthcare" | "Retail";
  size: "small" | "medium" | "large";   // <50, 50-500, 500+
  location: string;   // US state code
}
// Response
{ id: string; ...fields }
```

### GET /api/skills
```typescript
// Response
{
  families: Array<{
    id: string;
    name: string;
    color: string;
    skills: Array<{ id: string; name: string; description: string; tags: string }>
  }>
}
```

### POST /api/roles
```typescript
// Request
{ title: string; functionId: string; }
// Response
{
  id: string;
  title: string;
  function: { id: string; name: string };
  skillRequirements: Array<{
    skill: { id: string; name: string; family: string };
    requiredLevel: number;
    weight: number;
    rationale: string;
  }>
}
```

### POST /api/assessments
```typescript
// Request
{ roleId: string; employeeName?: string; }
// Response
{
  id: string;
  role: { id: string; title: string };
  questions: Array<{
    id: string;
    text: string;
    scenarioText: string;
    orderIndex: number;
    mappedSkills: string[];
  }>;
  status: "in_progress";
}
```

### POST /api/assessments/:id/submit
```typescript
// Request
{
  answers: Array<{ questionId: string; score: 1 | 2 | 3 | 4 }>
}
// Response
{
  status: "completed";
  summary: {
    totalQuestions: number;
    averageScore: number;
    completedAt: string;
  }
}
```

### GET /api/dashboard
```typescript
// Response
{
  kpis: {
    totalRoles: number;
    totalSkillsTracked: number;
    criticalGaps: number;
    avgReadinessScore: number;           // % of skills at or above required
    estimatedAnnualRiskExposure: {       // ROI ENGINE
      low: number;
      high: number;
    };
    eligibleIncentivePrograms: number;   // INCENTIVE ENGINE
    potentialIncentiveValue: string;     // e.g. "$125,000 - $2,500,000"
  };
  gapDistribution: {
    critical: number;
    moderate: number;
    noGap: number;
  };
  heatmap: {
    roles: string[];               // row labels
    families: string[];            // column labels
    familyColors: string[];
    data: number[][];              // avg gap per role × family (0 = no gap, negative = ahead)
  };
  highRiskRoles: Array<{
    roleId: string;
    roleTitle: string;
    function: string;
    riskScore: number;
    criticalSkills: number;
    topGapSkill: string;
    estimatedRiskCost: { low: number; high: number };
  }>;
  roiBreakdown: {                  // ROI ENGINE
    costOfInaction: { low: number; high: number };
    estimatedTrainingCost: number;
    netRoiRange: { low: number; high: number };
    breakdownByRiskType: Array<{
      riskType: string;
      low: number;
      high: number;
    }>;
  };
  incentiveMatches: Array<{        // INCENTIVE ENGINE
    programId: string;
    name: string;
    type: string;
    agency: string;
    estimatedValue: string;
    relevantFamilies: string[];
    url: string;
  }>;
}
```

### GET /api/export/csv
```
Returns CSV file with headers:
role, function, skill_family, skill, required_level, current_level, gap, severity, risk_weight, estimated_risk_cost_low, estimated_risk_cost_high
```

### GET /api/export/executive-summary
```typescript
// Query params: ?format=html (default) or ?format=json
// Returns: HTML page (printable) with:
// - Company profile header
// - Overall readiness score
// - Top 5 critical gaps with ROI impact
// - Eligible incentive programs
// - Recommended next steps with timeline
// - Generated date + disclaimer
```

---

## SCORING ENGINE LOGIC

### Gap Calculation
```typescript
function calculateGap(requiredLevel: number, currentLevel: number) {
  const gap = requiredLevel - currentLevel;
  return {
    gap,
    severity: gap >= 2 ? 'critical' : gap === 1 ? 'moderate' : 'no_gap'
  };
}

function computeCurrentLevel(skillId: string, answers: AssessmentAnswer[], questionSkillMap: QuestionSkillMap[]) {
  const relevantQuestionIds = questionSkillMap
    .filter(m => m.skillId === skillId)
    .map(m => m.questionId);
  
  const relevantAnswers = answers.filter(a => relevantQuestionIds.includes(a.questionId));
  
  if (relevantAnswers.length === 0) return 1; // default to lowest if no data
  
  const avg = relevantAnswers.reduce((sum, a) => sum + a.score, 0) / relevantAnswers.length;
  return Math.round(avg); // round to nearest integer (1-4)
}
```

### ROI Estimation
```typescript
function estimateRoi(company: Company, gapResults: GapResult[]) {
  const criticalCount = gapResults.filter(g => g.severity === 'critical').length;
  const moderateCount = gapResults.filter(g => g.severity === 'moderate').length;
  
  const multipliers = getRoiMultipliers(company.industry); // from seeded data
  
  const criticalCosts = multipliers
    .filter(m => m.severity === 'critical')
    .reduce((acc, m) => ({
      low: acc.low + m.annualCostLow * (criticalCount / 5), // normalize
      high: acc.high + m.annualCostHigh * (criticalCount / 5)
    }), { low: 0, high: 0 });
    
  const moderateCosts = multipliers
    .filter(m => m.severity === 'moderate')
    .reduce((acc, m) => ({
      low: acc.low + m.annualCostLow * (moderateCount / 10),
      high: acc.high + m.annualCostHigh * (moderateCount / 10)
    }), { low: 0, high: 0 });

  // Training cost estimate: $500-$2000 per skill gap per employee
  const trainingCostPerGap = company.size === 'large' ? 2000 : company.size === 'medium' ? 1200 : 500;
  const totalTrainingCost = (criticalCount + moderateCount) * trainingCostPerGap;

  return {
    costOfInaction: {
      low: criticalCosts.low + moderateCosts.low,
      high: criticalCosts.high + moderateCosts.high
    },
    estimatedTrainingCost: totalTrainingCost,
    netRoi: {
      low: (criticalCosts.low + moderateCosts.low) - totalTrainingCost,
      high: (criticalCosts.high + moderateCosts.high) - totalTrainingCost
    }
  };
}
```

### Incentive Matching
```typescript
function matchIncentives(company: Company, gapFamilies: string[]) {
  return incentivePrograms.filter(program => {
    const industryMatch = program.eligibleIndustries === 'all' || 
      program.eligibleIndustries.split(',').includes(company.industry);
    const stateMatch = program.eligibleStates === 'all' || 
      program.eligibleStates.split(',').includes(company.location);
    const familyMatch = program.eligibleFamilies === 'all' ||
      program.eligibleFamilies.split(',').some(f => gapFamilies.includes(f));
    
    return industryMatch && stateMatch && familyMatch;
  });
}
```

---

## DASHBOARD WIDGETS SPEC

### KPI Cards (6 cards, top row)
1. **Total Roles Assessed** — count
2. **Skills Tracked** — count  
3. **Critical Gaps** — count (red badge)
4. **Readiness Score** — percentage (green/yellow/red)
5. **Est. Risk Exposure** — dollar range (the ROI hook)
6. **Eligible Incentives** — count + dollar range

### Gap Distribution Bar Chart (Recharts)
- 3 bars: Critical (red), Moderate (yellow), No Gap (green)
- Labeled with counts + percentages

### Role × Family Heatmap
- Rows: roles (e.g., "Procurement Specialist", "Operations Manager")
- Columns: 4 skill families
- Cell color: intensity based on avg gap severity (green → yellow → red)
- Click cell → shows specific skill gaps

### High Risk Roles Table
- Columns: Role | Function | Risk Score | Critical Gaps | Top Gap Skill | Est. Risk Cost
- Sorted by risk score desc
- Row click → drill into role details

### ROI Summary Panel (NEW — differentiator)
- "Cost of Inaction" range
- "Investment to Close Gaps" estimate
- "Net ROI" range
- Breakdown by risk type (mini bar chart)
- Call-to-action: "Generate Executive Summary"

### Incentive Eligibility Panel (NEW — differentiator)
- Cards for each matched program
- Shows: program name, type badge, agency, estimated value, relevant skill families
- "Learn More" link to program URL
- Summary: "You may qualify for X programs worth $Y-$Z"

---

## EXECUTIVE SUMMARY TEMPLATE (HTML, printable)

```
┌─────────────────────────────────────────────┐
│  [COMPANY LOGO AREA]                         │
│  GREEN SKILLS READINESS                      │
│  Executive Summary                           │
│  Generated: [DATE]                           │
├─────────────────────────────────────────────┤
│                                              │
│  COMPANY PROFILE                             │
│  Name: [company]  Industry: [ind]            │
│  Size: [size]     Location: [state]          │
│                                              │
│  OVERALL READINESS: [XX%]                    │
│  ████████████░░░░░░░░  [visual bar]          │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  KEY FINDINGS                                │
│  • X critical skill gaps identified          │
│  • Y roles at high risk                      │
│  • Estimated annual risk: $A - $B            │
│                                              │
│  TOP 5 CRITICAL GAPS                         │
│  1. [Skill] — [Role] — Gap: X levels        │
│     Risk: $XX,XXX - $XXX,XXX annually        │
│  2. ...                                      │
│  3. ...                                      │
│  4. ...                                      │
│  5. ...                                      │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  FINANCIAL IMPACT                            │
│  Cost of Inaction: $XXX,XXX - $X,XXX,XXX     │
│  Training Investment: $XX,XXX                │
│  Net ROI: $XXX,XXX - $X,XXX,XXX              │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  ELIGIBLE INCENTIVE PROGRAMS                 │
│  ┌──────────────────────────────────────┐    │
│  │ Program Name | Type | Est. Value     │    │
│  │ ─────────────────────────────────────│    │
│  │ IRA 48C      | Tax  | Up to 30%     │    │
│  │ FL QRT       | Grant| Up to $250K   │    │
│  │ ...          |      |               │    │
│  └──────────────────────────────────────┘    │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  RECOMMENDED NEXT STEPS                      │
│  30 days: Address top 3 critical gaps        │
│  60 days: Apply for [X] grant programs       │
│  90 days: Reassess and track improvement     │
│                                              │
│  ─────────────────────────────────────────   │
│  Generated by GreenScope | Not financial     │
│  advice. Consult advisors for incentive      │
│  eligibility verification.                   │
└─────────────────────────────────────────────┘
```

---

## DEMO ANSWERS (auto-fill for judges)

Create a "Fill Demo Data" button that populates answers designed to produce:
- At least 3 critical gaps (in high-weight skills)
- At least 4 moderate gaps
- Some "no gap" results for contrast

```json
{
  "demoAnswerPattern": [
    { "questionId": "q_01", "score": 1 },
    { "questionId": "q_02", "score": 1 },
    { "questionId": "q_03", "score": 2 },
    { "questionId": "q_04", "score": 1 },
    { "questionId": "q_05", "score": 2 },
    { "questionId": "q_06", "score": 1 },
    { "questionId": "q_07", "score": 2 },
    { "questionId": "q_08", "score": 1 },
    { "questionId": "q_09", "score": 2 },
    { "questionId": "q_10", "score": 3 },
    { "questionId": "q_11", "score": 2 },
    { "questionId": "q_12", "score": 1 },
    { "questionId": "q_13", "score": 2 },
    { "questionId": "q_14", "score": 3 },
    { "questionId": "q_15", "score": 1 },
    { "questionId": "q_16", "score": 3 },
    { "questionId": "q_17", "score": 2 },
    { "questionId": "q_18", "score": 1 },
    { "questionId": "q_19", "score": 1 },
    { "questionId": "q_20", "score": 4 }
  ]
}
```

---

## UI DESIGN DIRECTION

**Aesthetic: "Enterprise Command Center"** — dark-mode primary, clean data visualization, serious but not boring.

- **Color palette:**
  - Background: `#0F172A` (slate-900)
  - Cards: `#1E293B` (slate-800)
  - Accent green: `#10B981` (emerald-500)
  - Critical red: `#EF4444`
  - Warning amber: `#F59E0B`
  - Text primary: `#F8FAFC`
  - Text secondary: `#94A3B8`

- **Typography:** Use a distinctive pairing — **"Plus Jakarta Sans"** for headings (Google Fonts, clean and modern), **"IBM Plex Mono"** for data/numbers (monospace gives a "technical intelligence" feel)

- **Key UI touches:**
  - Subtle grid pattern background on dashboard
  - Glassmorphism on KPI cards (frosted glass effect)
  - Animated number counters on KPI values
  - Red pulse glow on "Critical" badges
  - Green → red gradient on heatmap cells
  - Smooth page transitions

---

## JUDGE DEMO SCRIPT (2-3 minutes)

**Rehearse this. Time it. Nail it.**

| Step | Action | What Judge Sees | Time |
|------|--------|-----------------|------|
| 1 | Click "Sign in with Google" | Google SSO flow | 10s |
| 2 | Fill company form: "Velric Demo Corp", Manufacturing, Large, FL | Clean onboarding | 15s |
| 3 | Create role: "Procurement Specialist" → Procurement | Skills auto-assigned (12 skills, levels shown) | 15s |
| 4 | Create role: "Operations Manager" → Operations | Second role populated | 10s |
| 5 | Start assessment for Procurement Specialist | Scenario-based questions appear | 5s |
| 6 | Click "Fill Demo Answers" | Auto-populates realistic answers | 5s |
| 7 | Submit assessment | "Assessment Complete" confirmation | 5s |
| 8 | Repeat quick assessment for Ops Manager | Second data point | 15s |
| 9 | Open Dashboard | All widgets populated: KPIs, charts, heatmap, table | 5s |
| 10 | Point to "Est. Risk Exposure: $175K-$2.5M" | **ROI MOMENT** — judge sees the dollar impact | 10s |
| 11 | Point to "6 Eligible Incentive Programs" | **INCENTIVE MOMENT** — real programs with values | 10s |
| 12 | Scroll to heatmap | Visual gap identification across roles × families | 10s |
| 13 | Click "Generate Executive Summary" | Beautiful printable report with everything | 10s |
| 14 | Click "Export CSV" | File downloads | 5s |
| **TOTAL** | | | **~2:10** |

---

## README OUTLINE

```markdown
# 🌿 GreenScope — Green Skills Gap Intelligence MVP

> Turn workforce climate readiness gaps into dollars, risks, and action plans.

## 🔗 Live Demo
[https://greenscope.vercel.app](https://greenscope.vercel.app)

## What We Built
GreenScope is a Green Skills Gap Intelligence platform that goes beyond identifying 
skill gaps — it quantifies the ROI of closing them and matches companies with real 
federal and state incentive programs.

## Why It Matters
Every company knows they need green skills. No one knows what it's costing them 
NOT to have them. GreenScope turns vague "we should probably do something about 
sustainability" into a CFO-ready business case.

## Key Features
- **Company Onboarding** — Industry, size, location-aware profiling
- **Smart Role Management** — Auto-assigns green skills by function with weighted requirements
- **Scenario-Based Assessment** — 20 real-world scenario questions, 4-point maturity scale
- **Gap Analysis Engine** — Required vs. current with Critical/Moderate/No Gap severity
- **ROI Estimation** — Dollar impact of inaction based on industry risk models
- **Incentive Matching** — Real federal and state programs matched to your profile
- **Executive Summary** — Printable report for leadership and grant applications
- **Full Dashboard** — KPIs, gap distribution, role×family heatmap, risk table, CSV export

## How Gap Scoring Works
[See docs/methodology.md for full details]
1. Each role is auto-assigned 10-15 green skills based on business function
2. Skills are rated on a 4-point maturity scale: Curious Explorer → Conscious Changemaker
3. Gap = Required Level − Current Level
4. Severity: Gap ≥ 2 = Critical, Gap = 1 = Moderate, Gap ≤ 0 = No Gap
5. Risk Score = Σ(gap × weight) per role

## Data Used
- 50 green skills across 4 skill families (pre-seeded, industry-researched)
- 20 scenario-based assessment questions mapped to 1-2 skills each
- 15 real incentive programs (federal + FL, CA, NY, TX)
- Industry-specific ROI risk multipliers (6 industries)

## Tech Stack
Next.js 14 | Express | Prisma | SQLite/PostgreSQL | Tailwind | Recharts

## Quickstart
[setup instructions]

## Hackathon Requirements Coverage
✅ Google SSO authentication
✅ Company profile (industry, size, location)
✅ Role management with function-based auto-assignment
✅ 50 skills in 4 families (pre-seeded)
✅ 20 scenario-based assessment questions
✅ 4-point maturity scale (Curious Explorer → Conscious Changemaker)
✅ Gap analysis: required − current, Critical/Moderate/No Gap
✅ Dashboard: KPI cards, gap bar chart, heatmap, high risk table, CSV export
✅ Public URL deployment
✅ BONUS: ROI estimation, incentive matching, executive summary report
```

---

## FINAL NOTES

### What Makes This Win

1. **Every other team**: "You have gaps. Here's a chart."
2. **You**: "Your gaps are costing you $175K-$2.5M annually. Here are 6 programs worth up to $3M that you qualify for. Here's the report to hand your CFO."

That's not a dashboard. That's a **business case generator**.

### Risk Mitigation
- If time is tight, cut the executive summary HTML (keep CSV). The ROI + incentive panels on the dashboard are the real differentiator.
- If Google SSO is painful, get it working early. It's a hard requirement.
- Pre-seed demo data so the judge never waits. The "Fill Demo Answers" button is essential.
- Deploy early. Don't wait until the end. Get a working URL by hour 8.
