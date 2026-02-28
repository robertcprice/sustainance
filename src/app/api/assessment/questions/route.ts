import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const emp = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: auth.companyId,
      isActive: true,
    },
    include: {
      role: {
        include: {
          function: true,
          skillRequirements: {
            include: {
              skill: { include: { family: true } },
            },
          },
        },
      },
    },
  });

  if (!emp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const roleFunction = emp.role.function.name;

  // Build questions from the role's actual skill requirements
  const questions = emp.role.skillRequirements.map((rsr) => ({
    id: `q-${rsr.skill.id}`,
    skillId: rsr.skill.id,
    skillName: rsr.skill.name,
    familyName: rsr.skill.family.name,
    question: `Rate your proficiency in "${rsr.skill.name}"`,
    requiredLevel: rsr.requiredLevel,
  }));

  return NextResponse.json({ questions, roleFunction });
}
