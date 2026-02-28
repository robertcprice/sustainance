import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function loadJson(filename: string) {
  const filePath = path.join(__dirname, 'seed-data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  console.log('Seeding database...');

  // 1. Skill Families
  const families = loadJson('skill_families.json');
  for (const f of families) {
    await prisma.skillFamily.upsert({
      where: { id: f.id },
      update: { name: f.name, description: f.description, color: f.color },
      create: { id: f.id, name: f.name, description: f.description, color: f.color },
    });
  }
  console.log(`  ✓ ${families.length} skill families`);

  // 2. Skills
  const skills = loadJson('skills.json');
  for (const s of skills) {
    await prisma.skill.upsert({
      where: { id: s.id },
      update: { familyId: s.familyId, name: s.name, description: s.description, tags: s.tags },
      create: { id: s.id, familyId: s.familyId, name: s.name, description: s.description, tags: s.tags },
    });
  }
  console.log(`  ✓ ${skills.length} skills`);

  // 3. Business Functions
  const functions = loadJson('business_functions.json');
  for (const f of functions) {
    await prisma.businessFunction.upsert({
      where: { id: f.id },
      update: { name: f.name },
      create: { id: f.id, name: f.name },
    });
  }
  console.log(`  ✓ ${functions.length} business functions`);

  // 4. Questions + Skill Maps
  const questions = loadJson('assessment_questions.json');
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: { text: q.text, scenarioText: q.scenarioText, orderIndex: q.orderIndex, functionId: q.functionId || null },
      create: { id: q.id, text: q.text, scenarioText: q.scenarioText, orderIndex: q.orderIndex, functionId: q.functionId || null },
    });
    for (const skillId of q.skillIds) {
      await prisma.questionSkillMap.upsert({
        where: { questionId_skillId: { questionId: q.id, skillId } },
        update: {},
        create: { questionId: q.id, skillId },
      });
    }
  }
  console.log(`  ✓ ${questions.length} questions with skill maps`);

  // 5. Incentive Programs
  const incentives = loadJson('incentive_programs.json');
  for (const i of incentives) {
    await prisma.incentiveProgram.upsert({
      where: { id: i.id },
      update: {
        name: i.name, type: i.type, description: i.description,
        estimatedValue: i.estimatedValue, eligibleIndustries: i.eligibleIndustries,
        eligibleStates: i.eligibleStates, eligibleFamilies: i.eligibleFamilies,
        url: i.url, agency: i.agency, deadlineInfo: i.deadlineInfo,
      },
      create: {
        id: i.id, name: i.name, type: i.type, description: i.description,
        estimatedValue: i.estimatedValue, eligibleIndustries: i.eligibleIndustries,
        eligibleStates: i.eligibleStates, eligibleFamilies: i.eligibleFamilies,
        url: i.url, agency: i.agency, deadlineInfo: i.deadlineInfo,
      },
    });
  }
  console.log(`  ✓ ${incentives.length} incentive programs`);

  // 6. ROI Multipliers
  const multipliers = loadJson('roi_multipliers.json');
  for (const m of multipliers) {
    await prisma.roiMultiplier.upsert({
      where: { id: m.id },
      update: {
        industry: m.industry, severity: m.severity, riskType: m.riskType,
        annualCostLow: m.annualCostLow, annualCostHigh: m.annualCostHigh,
        description: m.description,
      },
      create: {
        id: m.id, industry: m.industry, severity: m.severity, riskType: m.riskType,
        annualCostLow: m.annualCostLow, annualCostHigh: m.annualCostHigh,
        description: m.description,
      },
    });
  }
  console.log(`  ✓ ${multipliers.length} ROI multipliers`);

  // 6b. Demo User (needed for conductedBy FK on EmployeeSkillAssessment)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@greenscope.app' },
    update: { name: 'Demo Admin' },
    create: { id: 'demo_user', email: 'demo@greenscope.app', name: 'Demo Admin', role: 'Owner' },
  });
  console.log(`  ✓ Demo user: ${demoUser.email}`);

  // 6c. Sustainance Demo User + Company + Membership (pre-seeded for read-only runtime)
  const sustainanceDemoUser = await prisma.user.upsert({
    where: { email: 'demo@sustainance.app' },
    update: { name: 'Demo User' },
    create: { id: 'demo_user_sustainance', email: 'demo@sustainance.app', name: 'Demo User' },
  });

  const DEMO_COMPANY_ID = 'demo_test_inc';
  let demoCompany = await prisma.company.findUnique({ where: { id: DEMO_COMPANY_ID } });
  if (!demoCompany) {
    demoCompany = await prisma.company.create({
      data: {
        id: DEMO_COMPANY_ID,
        name: 'TEST INCORPORATED',
        industry: 'Technology',
        size: 'medium',
        state: 'California',
        userId: sustainanceDemoUser.id,
      },
    });
  }

  // Create membership for sustainance demo user
  const existingMembership = await prisma.companyMember.findFirst({
    where: { userId: sustainanceDemoUser.id, companyId: DEMO_COMPANY_ID },
  });
  if (!existingMembership) {
    await prisma.companyMember.create({
      data: {
        userId: sustainanceDemoUser.id,
        companyId: DEMO_COMPANY_ID,
        role: 'Manager',
      },
    });
  }

  // Seed demo data for TEST INCORPORATED
  const { seedDemoData } = await import('../src/lib/seed-demo');
  try {
    const result = await seedDemoData(DEMO_COMPANY_ID, sustainanceDemoUser.id);
    console.log(`  ✓ Sustainance demo: ${result.departments} depts, ${result.employees} employees, ${result.roleAssessments} assessments`);
  } catch (e) {
    console.error('  ⚠ Sustainance demo seed failed:', e);
  }
  console.log(`  ✓ Sustainance demo user: ${sustainanceDemoUser.email} → ${demoCompany.name}`);

  // 7. Demo Companies (pre-seeded with departments, roles, employees, and completed assessments)
  const roleSkillMap = loadJson('role_skill_map.json');
  let demoCompaniesFile: string;
  try {
    demoCompaniesFile = fs.readFileSync(path.join(__dirname, 'seed-data', 'demo_companies.json'), 'utf-8');
  } catch {
    console.log('  ⊘ No demo_companies.json found, skipping demo seeding');
    console.log('Seeding complete!');
    return;
  }
  const demoCompanies = JSON.parse(demoCompaniesFile);

  for (const company of demoCompanies) {
    // Create company
    await prisma.company.upsert({
      where: { id: company.id },
      update: { name: company.name, industry: company.industry, size: company.size, state: company.state, isPublic: company.isPublic, description: company.description },
      create: { id: company.id, name: company.name, industry: company.industry, size: company.size, state: company.state, isPublic: company.isPublic, description: company.description },
    });

    // Create departments
    for (const dept of company.departments) {
      await prisma.department.upsert({
        where: { id: dept.id },
        update: { name: dept.name, companyId: company.id },
        create: { id: dept.id, name: dept.name, companyId: company.id },
      });
    }

    // Create roles + auto-assign skill requirements
    for (const role of company.roles) {
      await prisma.role.upsert({
        where: { id: role.id },
        update: { title: role.title, companyId: company.id, functionId: role.functionId, departmentId: role.departmentId },
        create: { id: role.id, title: role.title, companyId: company.id, functionId: role.functionId, departmentId: role.departmentId },
      });

      // Assign skill requirements from role_skill_map
      const functionSkills = roleSkillMap[role.functionId];
      if (functionSkills) {
        for (const mapping of functionSkills) {
          await prisma.roleSkillRequirement.upsert({
            where: { roleId_skillId: { roleId: role.id, skillId: mapping.skillId } },
            update: { requiredLevel: mapping.requiredLevel, weight: mapping.weight },
            create: { roleId: role.id, skillId: mapping.skillId, requiredLevel: mapping.requiredLevel, weight: mapping.weight },
          });
        }
      }
    }

    // Create employees
    for (const emp of company.employees) {
      await prisma.employee.upsert({
        where: { id: emp.id },
        update: { name: emp.name, companyId: company.id, departmentId: emp.departmentId, roleId: emp.roleId },
        create: { id: emp.id, name: emp.name, companyId: company.id, departmentId: emp.departmentId, roleId: emp.roleId },
      });
    }

    // Create assessments with answers
    for (const assessment of company.assessments) {
      const assessmentId = `assess_${assessment.roleId}`;
      await prisma.assessment.upsert({
        where: { id: assessmentId },
        update: { status: 'completed', completedAt: new Date() },
        create: { id: assessmentId, roleId: assessment.roleId, status: 'completed', completedAt: new Date() },
      });

      // Create answers
      for (const [questionId, score] of Object.entries(assessment.answers)) {
        await prisma.assessmentAnswer.upsert({
          where: { assessmentId_questionId: { assessmentId, questionId } },
          update: { score: score as number },
          create: { assessmentId, questionId, score: score as number },
        });
      }
    }

    console.log(`  ✓ Demo company: ${company.name} (${company.roles.length} roles, ${company.employees.length} employees, ${company.assessments.length} assessments)`);

    // 7b. Compute EmployeeSkillAssessment, EmployeeXP, and DepartmentScore
    // Build a map of questionId → skillIds for quick lookup
    const questionSkillIndex: Record<string, string[]> = {};
    for (const q of questions) {
      questionSkillIndex[q.id] = q.skillIds;
    }

    // Build assessment answers by roleId for quick lookup
    const answersByRole: Record<string, Record<string, number>> = {};
    for (const assessment of company.assessments) {
      answersByRole[assessment.roleId] = assessment.answers;
    }

    // Track department XP totals
    const deptXpTotals: Record<string, number> = {};

    for (const emp of company.employees) {
      const roleAnswers = answersByRole[emp.roleId];
      if (!roleAnswers) continue;

      // Get required skills for this role
      const role = company.roles.find((r: { id: string }) => r.id === emp.roleId);
      if (!role) continue;
      const requiredSkills: { skillId: string; requiredLevel: number; weight: number }[] = roleSkillMap[role.functionId] || [];

      let empXpTotal = 0;

      for (const rs of requiredSkills) {
        // Compute current level: average score of answers whose questions map to this skill
        const relevantScores: number[] = [];
        for (const [qId, score] of Object.entries(roleAnswers)) {
          const mappedSkills = questionSkillIndex[qId] || [];
          if (mappedSkills.includes(rs.skillId)) {
            relevantScores.push(score);
          }
        }
        const currentLevel = relevantScores.length > 0
          ? Math.round((relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length) * 10) / 10
          : 1;

        // Upsert EmployeeSkillAssessment
        await prisma.employeeSkillAssessment.upsert({
          where: { employeeId_skillId: { employeeId: emp.id, skillId: rs.skillId } },
          update: { currentLevel: Math.round(currentLevel), assessmentDate: new Date() },
          create: {
            companyId: company.id,
            employeeId: emp.id,
            skillId: rs.skillId,
            currentLevel: Math.round(currentLevel),
            assessmentDate: new Date(),
            conductedBy: demoUser.id,
          },
        });

        // XP per skill: 10 base + bonuses for high scores (matching submit route logic)
        let skillXp = 10;
        if (currentLevel >= 3) skillXp += 50;
        if (currentLevel >= 4) skillXp += 100;
        empXpTotal += skillXp;
      }

      // Completion bonus
      if (requiredSkills.length >= 15) empXpTotal += 25;

      // Upsert EmployeeXP
      await prisma.employeeXP.upsert({
        where: { companyId_employeeId: { companyId: company.id, employeeId: emp.id } },
        update: { xpTotal: empXpTotal, lastUpdated: new Date() },
        create: { companyId: company.id, employeeId: emp.id, xpTotal: empXpTotal },
      });

      // Accumulate department XP
      deptXpTotals[emp.departmentId] = (deptXpTotals[emp.departmentId] || 0) + empXpTotal;
    }

    // Upsert DepartmentScore records
    for (const [deptId, totalXp] of Object.entries(deptXpTotals)) {
      await prisma.departmentScore.upsert({
        where: { companyId_departmentId: { companyId: company.id, departmentId: deptId } },
        update: { score: totalXp, lastUpdated: new Date() },
        create: { companyId: company.id, departmentId: deptId, score: totalXp },
      });
    }

    const totalSkillAssessments = company.employees.length * Object.values(roleSkillMap as Record<string, unknown[]>).reduce((a: number, v: unknown[]) => Math.max(a, v.length), 0);
    console.log(`  ✓ Computed: ${Object.keys(deptXpTotals).length} dept scores, ~${totalSkillAssessments} skill assessments, XP for ${company.employees.length} employees`);
  }

  // 8. Community Companies (global index)
  const communityCompanies = loadJson('community_companies.json');
  for (const cc of communityCompanies) {
    await prisma.communityCompany.upsert({
      where: { id: `cc_${cc.rank}` },
      update: {
        rank: cc.rank, name: cc.name, industry: cc.industry, region: cc.region,
        score: cc.score, scoreChange: cc.scoreChange, logo: cc.logo,
        employees: cc.employees, highlights: JSON.stringify(cc.highlights),
      },
      create: {
        id: `cc_${cc.rank}`, rank: cc.rank, name: cc.name, industry: cc.industry,
        region: cc.region, score: cc.score, scoreChange: cc.scoreChange, logo: cc.logo,
        employees: cc.employees, highlights: JSON.stringify(cc.highlights),
      },
    });
  }
  console.log(`  ✓ ${communityCompanies.length} community companies`);

  // 9. Community Regions
  const communityRegions = loadJson('community_regions.json');
  for (const cr of communityRegions) {
    await prisma.communityRegion.upsert({
      where: { name: cr.name },
      update: { score: cr.score, topCompany: cr.topCompany, companyCount: cr.companyCount },
      create: { name: cr.name, score: cr.score, topCompany: cr.topCompany, companyCount: cr.companyCount },
    });
  }
  console.log(`  ✓ ${communityRegions.length} community regions`);

  // 10. Community Achievements
  const communityAchievements = loadJson('community_achievements.json');
  // Clear existing achievements to avoid duplicates
  await prisma.communityAchievement.deleteMany({});
  for (const ca of communityAchievements) {
    await prisma.communityAchievement.create({
      data: {
        company: ca.company, logo: ca.logo, text: ca.text,
        date: ca.date, type: ca.type, impact: ca.impact,
      },
    });
  }
  console.log(`  ✓ ${communityAchievements.length} community achievements`);

  // 11. Community Global Stats
  await prisma.communityGlobalStats.upsert({
    where: { id: 'global' },
    update: {
      globalScore: 62.4, scoreChange: 3.8, totalCompanies: 2847,
      totalAssessments: 18420, avgReadiness: 58.2, topIndustryScore: 71.3,
    },
    create: {
      id: 'global', globalScore: 62.4, scoreChange: 3.8, totalCompanies: 2847,
      totalAssessments: 18420, avgReadiness: 58.2, topIndustryScore: 71.3,
    },
  });
  console.log(`  ✓ Community global stats`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
