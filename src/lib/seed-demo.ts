import { prisma } from "./prisma";
import * as fs from "fs";
import * as path from "path";

interface SkillMapping {
  skillId: string;
  requiredLevel: number;
  weight: number;
}

interface QuestionDef {
  id: string;
  functionId: string | null;
  skillIds: string[];
}

function getRoleSkillMap(): Record<string, SkillMapping[]> {
  const filePath = path.join(process.cwd(), "prisma", "seed-data", "role_skill_map.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function getQuestions(): QuestionDef[] {
  const filePath = path.join(process.cwd(), "prisma", "seed-data", "assessment_questions.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const DEMO_DEPARTMENTS = [
  {
    name: "Sustainability & ESG",
    roles: [
      {
        function: "People & HR",
        title: "Director of Workforce Sustainability",
        employees: [
          { name: "Nadia Ferrante", profile: "strong" },
          { name: "Ravi Subramanian", profile: "moderate" },
          { name: "Chloe Bergstr\u00f6m", profile: "growing" },
        ],
      },
      {
        function: "Finance & Risk",
        title: "Climate Risk Analyst",
        employees: [
          { name: "Omar Tadesse", profile: "moderate" },
          { name: "Ingrid Haugen", profile: "strong" },
        ],
      },
    ],
  },
  {
    name: "Operations",
    roles: [
      {
        function: "Operations & Facilities",
        title: "Head of Green Operations",
        employees: [
          { name: "Jun Tanaka", profile: "growing" },
          { name: "Mariana Costa", profile: "moderate" },
          { name: "Derek Whitfield", profile: "new" },
        ],
      },
      {
        function: "Procurement & Supply Chain",
        title: "Sustainable Procurement Lead",
        employees: [
          { name: "Amara Diallo", profile: "strong" },
          { name: "Henrik Lindqvist", profile: "moderate" },
        ],
      },
    ],
  },
  {
    name: "Innovation & R&D",
    roles: [
      {
        function: "Technology & IT",
        title: "Green Technology Manager",
        employees: [
          { name: "Zara Hussain", profile: "strong" },
          { name: "Mateo Ruiz", profile: "new" },
          { name: "Yuki Sato", profile: "growing" },
        ],
      },
    ],
  },
  {
    name: "Compliance & Legal",
    roles: [
      {
        function: "Legal & Compliance",
        title: "Environmental Compliance Director",
        employees: [
          { name: "Anya Kowalski", profile: "moderate" },
          { name: "Benjamin Asare", profile: "growing" },
        ],
      },
    ],
  },
  {
    name: "Marketing & Communications",
    roles: [
      {
        function: "Sales & Marketing",
        title: "Sustainability Communications Lead",
        employees: [
          { name: "Lucia Mendoza", profile: "new" },
          { name: "Finn Callahan", profile: "strong" },
          { name: "Preethi Nair", profile: "moderate" },
        ],
      },
    ],
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLevel(requiredLevel: number, profile: string): number {
  switch (profile) {
    case "strong":
      return Math.min(4, Math.max(1, requiredLevel + randomInt(-1, 1)));
    case "moderate":
      return Math.min(4, Math.max(1, requiredLevel + randomInt(-2, 0)));
    case "growing":
      return Math.min(4, Math.max(1, requiredLevel + randomInt(-2, -1)));
    case "new":
      return Math.min(4, Math.max(1, Math.min(requiredLevel - 1, randomInt(1, 2))));
    default:
      return 1;
  }
}

function generateAnswerScore(profile: string): number {
  switch (profile) {
    case "strong":
      return randomInt(3, 4);
    case "moderate":
      return randomInt(2, 3);
    case "growing":
      return randomInt(1, 3);
    case "new":
      return randomInt(1, 2);
    default:
      return 1;
  }
}

function averageProfile(employees: { profile: string }[]): string {
  const strengthMap: Record<string, number> = { strong: 4, moderate: 3, growing: 2, new: 1 };
  const avg = employees.reduce((sum, e) => sum + (strengthMap[e.profile] || 1), 0) / employees.length;
  if (avg >= 3.5) return "strong";
  if (avg >= 2.5) return "moderate";
  if (avg >= 1.5) return "growing";
  return "new";
}

export async function seedDemoData(companyId: string, conductedBy: string) {
  const roleSkillMap = getRoleSkillMap();
  const allQuestions = getQuestions();
  const now = new Date();

  // Delete existing data for this company (order matters for FK constraints)
  await prisma.assessmentAnswer.deleteMany({
    where: { assessment: { role: { companyId } } },
  });
  await prisma.assessment.deleteMany({
    where: { role: { companyId } },
  });
  await prisma.employeeSkillAssessment.deleteMany({ where: { companyId } });
  await prisma.employeeXP.deleteMany({ where: { companyId } });
  await prisma.departmentScore.deleteMany({ where: { companyId } });
  await prisma.employee.deleteMany({ where: { companyId } });
  await prisma.roleSkillRequirement.deleteMany({
    where: { role: { companyId } },
  });
  await prisma.role.deleteMany({ where: { companyId } });
  await prisma.department.deleteMany({ where: { companyId } });

  // Build a lookup of BusinessFunction name -> id
  const businessFunctions = await prisma.businessFunction.findMany();
  const funcNameToId = new Map(businessFunctions.map((f) => [f.name, f.id]));

  let totalEmployees = 0;
  let totalSkillAssessments = 0;
  let totalRoleAssessments = 0;

  for (const deptDef of DEMO_DEPARTMENTS) {
    const dept = await prisma.department.create({
      data: { companyId, name: deptDef.name },
    });

    let deptTotalXP = 0;

    for (const roleDef of deptDef.roles) {
      const functionId = funcNameToId.get(roleDef.function);
      if (!functionId) {
        console.warn(`BusinessFunction "${roleDef.function}" not found, skipping role`);
        continue;
      }

      const role = await prisma.role.create({
        data: {
          companyId,
          departmentId: dept.id,
          functionId,
          title: roleDef.title,
        },
      });

      // Create RoleSkillRequirement records
      const functionSkills = roleSkillMap[functionId] || [];
      for (const mapping of functionSkills) {
        await prisma.roleSkillRequirement.create({
          data: {
            roleId: role.id,
            skillId: mapping.skillId,
            requiredLevel: mapping.requiredLevel,
            weight: mapping.weight,
          },
        });
      }

      // Create Assessment + AssessmentAnswer for this role
      const roleProfile = averageProfile(roleDef.employees);
      const roleQuestions = allQuestions.filter(
        (q) => q.functionId === null || q.functionId === functionId
      );

      const assessment = await prisma.assessment.create({
        data: {
          roleId: role.id,
          status: "completed",
          completedAt: now,
        },
      });

      for (const q of roleQuestions) {
        await prisma.assessmentAnswer.create({
          data: {
            assessmentId: assessment.id,
            questionId: q.id,
            score: generateAnswerScore(roleProfile),
          },
        });
      }
      totalRoleAssessments++;

      // Create Employees + EmployeeSkillAssessment + XP
      for (const empDef of roleDef.employees) {
        const emp = await prisma.employee.create({
          data: {
            companyId,
            departmentId: dept.id,
            roleId: role.id,
            name: empDef.name,
          },
        });

        totalEmployees++;

        for (const rs of functionSkills) {
          const level = generateLevel(rs.requiredLevel, empDef.profile);
          await prisma.employeeSkillAssessment.create({
            data: {
              companyId,
              employeeId: emp.id,
              skillId: rs.skillId,
              currentLevel: level,
              assessmentDate: now,
              conductedBy,
            },
          });
          totalSkillAssessments++;
        }

        const xpBase =
          empDef.profile === "strong"
            ? randomInt(800, 1500)
            : empDef.profile === "moderate"
            ? randomInt(400, 800)
            : empDef.profile === "growing"
            ? randomInt(200, 500)
            : randomInt(0, 150);

        await prisma.employeeXP.create({
          data: {
            companyId,
            employeeId: emp.id,
            xpTotal: xpBase,
            lastUpdated: now,
          },
        });

        deptTotalXP += xpBase;
      }
    }

    await prisma.departmentScore.create({
      data: {
        companyId,
        departmentId: dept.id,
        score: deptTotalXP,
        lastUpdated: now,
      },
    });
  }

  return { departments: DEMO_DEPARTMENTS.length, employees: totalEmployees, roleAssessments: totalRoleAssessments, skillAssessments: totalSkillAssessments };
}
