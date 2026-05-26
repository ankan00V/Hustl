import { prisma } from "../config/prisma.js";

export async function recalculateReputation(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { rating: true, createdAt: true }
  });

  if (reviews.length === 0) {
    return 5;
  }

  const weighted = reviews.reduce(
    (acc, review, index) => {
      const weight = Math.max(1, 20 - index);
      return {
        score: acc.score + review.rating * weight,
        weight: acc.weight + weight
      };
    },
    { score: 0, weight: 0 }
  );

  const reputationScore = Number((weighted.score / weighted.weight).toFixed(2));
  await prisma.user.update({ where: { id: userId }, data: { reputationScore } });
  return reputationScore;
}
