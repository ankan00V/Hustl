import { prisma } from "../config/prisma.js";

const milestones = [
  { count: 10, prefix: "Trusted" },
  { count: 25, prefix: "Pro" },
  { count: 50, prefix: "Expert" }
] as const;

function humanizeSkill(skill: string) {
  return skill
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export async function awardMilestoneBadges(studentId: string, skillCategories: string[]) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!profile) {
    return [];
  }

  const earned = [];
  for (const skill of skillCategories) {
    for (const milestone of milestones) {
      if (profile.completedShifts >= milestone.count) {
        const name = `${milestone.prefix} ${humanizeSkill(skill)}`;
        const badge = await prisma.badge.upsert({
          where: { userId_name_category: { userId: studentId, name, category: skill } },
          create: { userId: studentId, name, category: skill },
          update: {}
        });
        earned.push(badge);
      }
    }
  }

  if (earned.length > 0) {
    await prisma.studentProfile.update({
      where: { userId: studentId },
      data: { badges: { set: earned.map((badge) => badge.name) } }
    });
  }

  return earned;
}
