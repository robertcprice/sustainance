import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import ExcelJS from 'exceljs';

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

const EMERALD = '059669';
const EMERALD_LIGHT = 'D1FAE5';
const RED_LIGHT = 'FEE2E2';
const AMBER_LIGHT = 'FEF3C7';
const WHITE = 'FFFFFF';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const employeeId = request.nextUrl.searchParams.get('employeeId');
  const format = request.nextUrl.searchParams.get('format') || 'xlsx';
  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: auth.companyId },
    include: {
      department: true,
      role: {
        include: {
          function: true,
          skillRequirements: {
            include: { skill: { include: { family: true } } },
          },
        },
      },
      assessments: {
        orderBy: { assessmentDate: 'desc' },
        include: { employee: true },
      },
      xp: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const company = await prisma.company.findUnique({ where: { id: auth.companyId } });

  // Use EmployeeSkillAssessment records for current levels
  const employeeAssessments = await prisma.employeeSkillAssessment.findMany({
    where: { employeeId: employee.id, companyId: auth.companyId },
  });

  const currentLevels: Record<string, number> = {};
  for (const a of employeeAssessments) {
    currentLevels[a.skillId] = a.currentLevel;
  }

  const requirements = employee.role.skillRequirements;
  const totalXp = employee.xp.reduce((sum, x) => sum + x.xpTotal, 0);

  if (format === 'csv') {
    const headers = ['Employee', 'Role', 'Department', 'Function', 'Skill Family', 'Skill', 'Required Level', 'Current Level', 'Gap', 'Status', 'Weight'];
    const rows: (string | number)[][] = [];
    for (const req of requirements) {
      const current = currentLevels[req.skillId] ?? 0;
      const gap = Math.max(0, req.requiredLevel - current);
      const status = gap >= 2 ? 'Critical' : gap >= 1 ? 'Moderate' : 'Met';
      rows.push([employee.name, employee.role.title, employee.department.name, employee.role.function.name, req.skill.family.name, req.skill.name, req.requiredLevel, current, gap, status, req.weight]);
    }
    const csv = buildCsv(headers, rows);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scorecard-${employee.name.replace(/\s+/g, '-')}.csv"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sustainance';
  wb.created = new Date();

  const ws = wb.addWorksheet(employee.name, {
    properties: { defaultColWidth: 18 },
  });

  // Header section
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'SUSTAINANCE — Employee Scorecard';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;

  ws.mergeCells('A2:G2');
  const subCell = ws.getCell('A2');
  subCell.value = `${company?.name || 'Company'} | Generated ${new Date().toLocaleDateString()}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '6B7280' } };
  subCell.alignment = { horizontal: 'center' };

  // Employee info
  ws.getCell('A4').value = 'Employee';
  ws.getCell('B4').value = employee.name;
  ws.getCell('A5').value = 'Role';
  ws.getCell('B5').value = employee.role.title;
  ws.getCell('A6').value = 'Department';
  ws.getCell('B6').value = employee.department.name;
  ws.getCell('A7').value = 'Function';
  ws.getCell('B7').value = employee.role.function.name;

  ws.getCell('D4').value = 'Total XP';
  ws.getCell('E4').value = totalXp;
  ws.getCell('D5').value = 'Assessments';
  ws.getCell('E5').value = employee.assessments.length;

  ['A4', 'A5', 'A6', 'A7', 'D4', 'D5'].forEach(ref => {
    ws.getCell(ref).font = { name: 'Arial', size: 10, bold: true, color: { argb: '374151' } };
  });

  // Skills table header
  const headerRow = 9;
  const headers = ['Skill Family', 'Skill', 'Required Level', 'Current Level', 'Gap', 'Status', 'Weight'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMERALD } };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: '9CA3AF' } },
    };
  });

  // Build skill data from employee assessments
  let row = headerRow + 1;

  let metCount = 0;
  for (const req of requirements) {
    const current = currentLevels[req.skillId] ?? 0;
    const gap = Math.max(0, req.requiredLevel - current);
    const status = gap >= 2 ? 'Critical' : gap >= 1 ? 'Moderate' : 'Met';
    if (status === 'Met') metCount++;

    const bgColor = status === 'Critical' ? RED_LIGHT
      : status === 'Moderate' ? AMBER_LIGHT
      : EMERALD_LIGHT;

    const values = [
      req.skill.family.name,
      req.skill.name,
      req.requiredLevel,
      current,
      gap,
      status,
      req.weight,
    ];

    values.forEach((v, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { horizontal: 'center' };
      if (i >= 2) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
      };
    });
    row++;
  }

  // Summary row
  row += 1;
  ws.getCell(row, 1).value = 'Readiness Score';
  ws.getCell(row, 1).font = { name: 'Arial', size: 11, bold: true };
  const readiness = requirements.length > 0 ? Math.round((metCount / requirements.length) * 100) : 0;
  ws.getCell(row, 2).value = `${readiness}%`;
  ws.getCell(row, 2).font = { name: 'Arial', size: 11, bold: true, color: { argb: readiness >= 70 ? EMERALD : 'DC2626' } };

  // Column widths
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 10;
  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 10;

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="scorecard-${employee.name.replace(/\s+/g, '-')}.xlsx"`,
    },
  });
}
