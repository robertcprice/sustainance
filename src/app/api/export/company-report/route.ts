import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { buildRoleGapSummary } from '@/lib/scoring-engine';
import { estimateRoi } from '@/lib/roi-engine';
import { matchIncentives } from '@/lib/incentive-engine';
import { GapResult } from '@/lib/types';
import ExcelJS from 'exceljs';

const EMERALD = '059669';
const EMERALD_DARK = '047857';
const WHITE = 'FFFFFF';
const RED_LIGHT = 'FEE2E2';
const AMBER_LIGHT = 'FEF3C7';
const EMERALD_LIGHT = 'D1FAE5';
const GRAY_50 = 'F9FAFB';

function currency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function addHeaderRow(ws: ExcelJS.Worksheet, row: number, headers: string[], cols?: number) {
  const maxCol = cols || headers.length;
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
    cell.alignment = { horizontal: 'center' };
  });
  // Fill remaining cols with emerald if needed
  for (let i = headers.length; i < maxCol; i++) {
    const cell = ws.getCell(row, i + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
  }
}

function addSheetTitle(ws: ExcelJS.Worksheet, title: string, mergeTo: string = 'H1') {
  ws.mergeCells(`A1:${mergeTo}`);
  const cell = ws.getCell('A1');
  cell.value = title;
  cell.font = { name: 'Arial', size: 16, bold: true, color: { argb: WHITE } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD_DARK } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;
}

function severityColor(severity: string): string {
  if (severity === 'critical') return RED_LIGHT;
  if (severity === 'moderate') return AMBER_LIGHT;
  return EMERALD_LIGHT;
}

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id: auth.companyId } });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const roles = await prisma.role.findMany({
    where: { companyId: auth.companyId },
    include: {
      function: true,
      department: true,
      skillRequirements: {
        include: { skill: { include: { family: true } } },
      },
      assessments: {
        where: { status: 'completed' },
        include: {
          answers: {
            include: {
              question: { include: { skillMaps: true } },
            },
          },
        },
      },
    },
  });

  const roleGaps = roles
    .filter(r => r.assessments.length > 0)
    .map(role => {
      const latest = role.assessments.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      return {
        ...buildRoleGapSummary(role.id, role.title, role.function.name, role.skillRequirements, latest.answers),
        departmentName: role.department?.name || 'Unassigned',
      };
    });

  const allGaps: GapResult[] = roleGaps.flatMap(r => r.gaps);
  const criticalGaps = allGaps.filter(g => g.severity === 'critical');
  const moderateGaps = allGaps.filter(g => g.severity === 'moderate');
  const overallReadiness = allGaps.length > 0
    ? Math.round((allGaps.filter(g => g.severity === 'no_gap').length / allGaps.length) * 100)
    : 0;

  const multipliers = await prisma.roiMultiplier.findMany();
  const roi = estimateRoi(allGaps, multipliers, company.size, company.industry);

  const programs = await prisma.incentiveProgram.findMany();
  const incentives = matchIncentives(programs, company.industry, company.state, allGaps);

  const departments = await prisma.department.findMany({
    where: { companyId: auth.companyId },
    include: { employees: { where: { isActive: true } } },
  });

  // ─── Build Workbook ───
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sustainance';
  wb.created = new Date();

  // ═══ Sheet 1: Executive Summary ═══
  const s1 = wb.addWorksheet('Executive Summary', { properties: { defaultColWidth: 22 } });
  addSheetTitle(s1, `SUSTAINANCE — Full Company Report | ${company.name}`);

  s1.mergeCells('A2:H2');
  const sub = s1.getCell('A2');
  sub.value = `${company.industry} | ${company.size} | ${company.state} | Generated ${new Date().toLocaleDateString()}`;
  sub.font = { name: 'Arial', size: 10, italic: true, color: { argb: '6B7280' } };
  sub.alignment = { horizontal: 'center' };

  // KPIs
  const kpis = [
    ['Overall Readiness', `${overallReadiness}%`],
    ['Roles Assessed', roleGaps.length.toString()],
    ['Departments', departments.length.toString()],
    ['Critical Gaps', criticalGaps.length.toString()],
    ['Moderate Gaps', moderateGaps.length.toString()],
    ['Total Employees', departments.reduce((sum, d) => sum + d.employees.length, 0).toString()],
  ];

  let r = 4;
  kpis.forEach(([label, value]) => {
    s1.getCell(r, 1).value = label;
    s1.getCell(r, 1).font = { name: 'Arial', size: 11, bold: true, color: { argb: '374151' } };
    s1.getCell(r, 2).value = value;
    s1.getCell(r, 2).font = { name: 'Arial', size: 11, bold: true, color: { argb: EMERALD } };
    r++;
  });

  // Top critical gaps
  r += 1;
  s1.getCell(r, 1).value = 'Top Critical Gaps';
  s1.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
  r++;
  addHeaderRow(s1, r, ['Skill', 'Family', 'Required', 'Current', 'Gap']);
  r++;

  criticalGaps.sort((a, b) => b.gap - a.gap).slice(0, 10).forEach(g => {
    [g.skillName, g.familyName, g.requiredLevel, g.currentLevel, g.gap].forEach((v, i) => {
      const cell = s1.getCell(r, i + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { horizontal: 'center' };
      if (i >= 2) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_LIGHT } };
      }
    });
    r++;
  });

  s1.getColumn(1).width = 32;
  s1.getColumn(2).width = 22;

  // ═══ Sheet 2: Department Breakdown ═══
  const s2 = wb.addWorksheet('Departments', { properties: { defaultColWidth: 20 } });
  addSheetTitle(s2, 'Department Breakdown', 'F1');

  r = 3;
  for (const dept of departments) {
    const deptRoles = roleGaps.filter(rg => rg.departmentName === dept.name);
    const deptGaps = deptRoles.flatMap(rg => rg.gaps);
    const deptReadiness = deptGaps.length > 0
      ? Math.round((deptGaps.filter(g => g.severity === 'no_gap').length / deptGaps.length) * 100)
      : 0;

    s2.getCell(r, 1).value = dept.name;
    s2.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true, color: { argb: EMERALD_DARK } };
    s2.getCell(r, 2).value = `${dept.employees.length} employees | ${deptRoles.length} roles assessed | ${deptReadiness}% ready`;
    s2.getCell(r, 2).font = { name: 'Arial', size: 10, color: { argb: '6B7280' } };
    r++;

    if (deptRoles.length > 0) {
      addHeaderRow(s2, r, ['Role', 'Function', 'Readiness %', 'Risk', 'Critical', 'Moderate']);
      r++;

      for (const rg of deptRoles) {
        const crit = rg.gaps.filter(g => g.severity === 'critical').length;
        const mod = rg.gaps.filter(g => g.severity === 'moderate').length;
        const bgColor = rg.readinessScore >= 70 ? EMERALD_LIGHT : rg.readinessScore >= 40 ? AMBER_LIGHT : RED_LIGHT;

        [rg.roleTitle, rg.functionName, `${rg.readinessScore}%`, rg.riskScore, crit, mod].forEach((v, i) => {
          const cell = s2.getCell(r, i + 1);
          cell.value = v;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { horizontal: 'center' };
          if (i === 2) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          }
        });
        r++;
      }
    }
    r++; // spacer
  }

  s2.getColumn(1).width = 28;
  s2.getColumn(2).width = 24;

  // ═══ Sheet 3: Role-Level Detail ═══
  const s3 = wb.addWorksheet('Role Detail', { properties: { defaultColWidth: 18 } });
  addSheetTitle(s3, 'Role-Level Skill Gaps');

  r = 3;
  addHeaderRow(s3, r, ['Role', 'Department', 'Skill Family', 'Skill', 'Required', 'Current', 'Gap', 'Severity']);
  r++;

  for (const rg of roleGaps) {
    for (const gap of rg.gaps) {
      const isAlt = (r % 2 === 0);
      [rg.roleTitle, rg.departmentName, gap.familyName, gap.skillName, gap.requiredLevel, gap.currentLevel, gap.gap, gap.severity].forEach((v, i) => {
        const cell = s3.getCell(r, i + 1);
        cell.value = v;
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { horizontal: 'center' };
        if (i === 7) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: severityColor(gap.severity) } };
          cell.font = { name: 'Arial', size: 10, bold: true };
        } else if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_50 } };
        }
      });
      r++;
    }
  }

  s3.getColumn(1).width = 26;
  s3.getColumn(2).width = 22;
  s3.getColumn(3).width = 20;
  s3.getColumn(4).width = 30;

  // ═══ Sheet 4: ROI Analysis ═══
  const s4 = wb.addWorksheet('ROI Analysis', { properties: { defaultColWidth: 24 } });
  addSheetTitle(s4, 'Return on Investment Analysis', 'D1');

  r = 3;
  const roiData = [
    ['Cost of Inaction (Low)', currency(roi.costOfInactionLow)],
    ['Cost of Inaction (High)', currency(roi.costOfInactionHigh)],
    ['Training Investment', currency(roi.trainingInvestment)],
    ['Net ROI (Low)', currency(roi.netRoiLow)],
    ['Net ROI (High)', currency(roi.netRoiHigh)],
  ];

  roiData.forEach(([label, value]) => {
    s4.getCell(r, 1).value = label;
    s4.getCell(r, 1).font = { name: 'Arial', size: 11, bold: true };
    s4.getCell(r, 2).value = value;
    s4.getCell(r, 2).font = { name: 'Arial', size: 11, bold: true, color: { argb: EMERALD } };
    r++;
  });

  r += 1;
  s4.getCell(r, 1).value = 'Risk Breakdown';
  s4.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
  r++;
  addHeaderRow(s4, r, ['Risk Type', 'Cost (Low)', 'Cost (High)', 'Description']);
  r++;

  for (const rb of roi.riskBreakdown) {
    [rb.riskType, currency(rb.costLow), currency(rb.costHigh), rb.description].forEach((v, i) => {
      const cell = s4.getCell(r, i + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 10 };
    });
    r++;
  }

  s4.getColumn(4).width = 50;

  // ═══ Sheet 5: Incentive Programs ═══
  const s5 = wb.addWorksheet('Incentives', { properties: { defaultColWidth: 22 } });
  addSheetTitle(s5, 'Matching Incentive Programs', 'F1');

  r = 3;
  addHeaderRow(s5, r, ['Program', 'Type', 'Estimated Value', 'Agency', 'Match Reason', 'Deadline']);
  r++;

  for (const inc of incentives) {
    [inc.name, inc.type, inc.estimatedValue, inc.agency, inc.matchReason, inc.deadlineInfo].forEach((v, i) => {
      const cell = s5.getCell(r, i + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 10 };
      if (i === 0) cell.font = { name: 'Arial', size: 10, bold: true };
    });
    r++;
  }

  s5.getColumn(1).width = 30;
  s5.getColumn(5).width = 35;
  s5.getColumn(6).width = 20;

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="sustainance-report-${company.name.replace(/\s+/g, '-')}.xlsx"`,
    },
  });
}
