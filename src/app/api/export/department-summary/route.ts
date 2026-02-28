import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { buildRoleGapSummary } from '@/lib/scoring-engine';
import ExcelJS from 'exceljs';

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

const EMERALD = '059669';
const WHITE = 'FFFFFF';
const RED_LIGHT = 'FEE2E2';
const AMBER_LIGHT = 'FEF3C7';
const EMERALD_LIGHT = 'D1FAE5';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const departmentId = request.nextUrl.searchParams.get('departmentId');
  const format = request.nextUrl.searchParams.get('format') || 'xlsx';
  const company = await prisma.company.findUnique({ where: { id: auth.companyId } });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const deptFilter = departmentId ? { id: departmentId, companyId: auth.companyId } : { companyId: auth.companyId };
  const departments = await prisma.department.findMany({
    where: deptFilter,
    include: {
      employees: { where: { isActive: true } },
      roles: {
        include: {
          function: true,
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
      },
    },
    orderBy: { name: 'asc' },
  });

  if (format === 'csv') {
    const headers = ['Department', 'Employees', 'Role', 'Function', 'Readiness %', 'Risk Score', 'Critical Gaps', 'Moderate Gaps'];
    const rows: (string | number)[][] = [];
    for (const dept of departments) {
      const roleGaps = dept.roles
        .filter(r => r.assessments.length > 0)
        .map(role => {
          const latest = role.assessments.sort((a, b) =>
            (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
          )[0];
          return buildRoleGapSummary(role.id, role.title, role.function.name, role.skillRequirements, latest.answers);
        });
      for (const rg of roleGaps) {
        const crit = rg.gaps.filter(g => g.severity === 'critical').length;
        const mod = rg.gaps.filter(g => g.severity === 'moderate').length;
        rows.push([dept.name, dept.employees.length, rg.roleTitle, rg.functionName, `${rg.readinessScore}%`, rg.riskScore, crit, mod]);
      }
    }
    const csv = buildCsv(headers, rows);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dept-summary-${company!.name.replace(/\s+/g, '-')}.csv"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sustainance';
  wb.created = new Date();

  // Summary sheet (only if multiple departments)
  if (departments.length > 1) {
    const summary = wb.addWorksheet('Summary', { properties: { defaultColWidth: 20 } });

    summary.mergeCells('A1:F1');
    const titleCell = summary.getCell('A1');
    titleCell.value = `SUSTAINANCE — Department Summary | ${company.name}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: WHITE } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summary.getRow(1).height = 40;

    const headerRow = 3;
    const headers = ['Department', 'Employees', 'Roles Assessed', 'Readiness %', 'Critical Gaps', 'Top Gap'];
    headers.forEach((h, i) => {
      const cell = summary.getCell(headerRow, i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
      cell.alignment = { horizontal: 'center' };
    });

    let row = headerRow + 1;
    for (const dept of departments) {
      const roleGaps = dept.roles
        .filter(r => r.assessments.length > 0)
        .map(role => {
          const latest = role.assessments.sort((a, b) =>
            (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
          )[0];
          return buildRoleGapSummary(role.id, role.title, role.function.name, role.skillRequirements, latest.answers);
        });

      const allGaps = roleGaps.flatMap(r => r.gaps);
      const criticalCount = allGaps.filter(g => g.severity === 'critical').length;
      const readiness = allGaps.length > 0
        ? Math.round((allGaps.filter(g => g.severity === 'no_gap').length / allGaps.length) * 100)
        : 0;
      const topGap = allGaps.sort((a, b) => b.gap - a.gap)[0];

      const bgColor = readiness >= 70 ? EMERALD_LIGHT : readiness >= 40 ? AMBER_LIGHT : RED_LIGHT;

      const values = [
        dept.name,
        dept.employees.length,
        roleGaps.length,
        `${readiness}%`,
        criticalCount,
        topGap ? `${topGap.skillName} (${topGap.gap})` : 'N/A',
      ];

      values.forEach((v, i) => {
        const cell = summary.getCell(row, i + 1);
        cell.value = v;
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { horizontal: 'center' };
        if (i === 3) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
      });
      row++;
    }
  }

  // One sheet per department
  for (const dept of departments) {
    const ws = wb.addWorksheet(dept.name.substring(0, 31), { properties: { defaultColWidth: 18 } });

    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `${dept.name} — Department Detail`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: WHITE } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 35;

    ws.getCell('A3').value = 'Employees';
    ws.getCell('B3').value = dept.employees.length;
    ws.getCell('A4').value = 'Roles';
    ws.getCell('B4').value = dept.roles.length;
    ['A3', 'A4'].forEach(ref => {
      ws.getCell(ref).font = { name: 'Arial', size: 10, bold: true };
    });

    // Role breakdown
    const roleHeaderRow = 6;
    const roleHeaders = ['Role', 'Function', 'Readiness %', 'Risk Score', 'Critical Gaps', 'Moderate Gaps'];
    roleHeaders.forEach((h, i) => {
      const cell = ws.getCell(roleHeaderRow, i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
      cell.alignment = { horizontal: 'center' };
    });

    let row = roleHeaderRow + 1;
    for (const role of dept.roles) {
      if (role.assessments.length === 0) continue;
      const latest = role.assessments.sort((a, b) =>
        (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      const summary = buildRoleGapSummary(role.id, role.title, role.function.name, role.skillRequirements, latest.answers);

      const criticalCount = summary.gaps.filter(g => g.severity === 'critical').length;
      const moderateCount = summary.gaps.filter(g => g.severity === 'moderate').length;
      const bgColor = summary.readinessScore >= 70 ? EMERALD_LIGHT
        : summary.readinessScore >= 40 ? AMBER_LIGHT : RED_LIGHT;

      const values = [
        role.title,
        role.function.name,
        `${summary.readinessScore}%`,
        summary.riskScore,
        criticalCount,
        moderateCount,
      ];

      values.forEach((v, i) => {
        const cell = ws.getCell(row, i + 1);
        cell.value = v;
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { horizontal: 'center' };
        if (i === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
      });
      row++;
    }

    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 24;
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="dept-summary-${company.name.replace(/\s+/g, '-')}.xlsx"`,
    },
  });
}
