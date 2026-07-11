import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const businessNames = [
  "Brew Lane",
  "FrameLab Studio",
  "Campus Cart",
  "QuickPrint Hub",
  "FitFuel Cafe",
  "PixelPop Events",
  "Urban Books",
  "Green Basket",
  "Night Owl Diner",
  "SkillSprint Tutors"
];

const studentSkills = ["Barista", "Sales", "Video Editing", "Graphic Design", "Delivery", "Tutoring", "Events"];
const listingTitles = [
  "Evening Barista",
  "Reel Editor",
  "Campus Flyer Promoter",
  "Inventory Helper",
  "Weekend Sales Associate",
  "Event Check-in Crew",
  "Food Counter Support",
  "Delivery Runner",
  "Poster Designer",
  "Math Tutor"
];

function coords(index: number) {
  return {
    lat: 12.9352 + (index % 8) * 0.004,
    lng: 77.6245 + (index % 7) * 0.004
  };
}

async function setPoint(table: "Listing" | "BusinessProfile", idColumn: "id" | "userId", id: string, lat: number, lng: number) {
  await prisma.$executeRawUnsafe(
    `UPDATE "${table}" SET coords = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "${idColumn}" = $3`,
    lng,
    lat,
    id
  );
}

async function main() {
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis`;
  await prisma.review.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  // For seed data, we'll use a simple phone-based auth (no password hash needed)
  const phone = (index: number) => `+91990000${String(index + 1).padStart(4, "0")}`;

  const businesses = [];
  for (let index = 0; index < 10; index += 1) {
    const user = await prisma.user.create({
      data: {
        name: businessNames[index]!,
        phone: phone(index),
        role: "BUSINESS",
        avatarUrl: `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(businessNames[index]!)}`,
        reputationScore: index % 4 === 0 ? 3.7 : 4.4,
        businessProfile: {
          create: {
            businessName: businessNames[index]!,
            category: index % 2 === 0 ? "Cafe" : "Creative",
            address: `Block ${index + 1}, Koramangala`,
            currentTier: index % 3 === 0 ? "PRO" : "FREE",
            isVerified: index % 5 === 0
          }
        }
      },
      include: { businessProfile: true }
    });
    const point = coords(index);
    await setPoint("BusinessProfile", "userId", user.id, point.lat, point.lng);
    businesses.push(user);
  }

  const students = [];
  for (let index = 0; index < 30; index += 1) {
    const skills = [studentSkills[index % studentSkills.length]!, studentSkills[(index + 2) % studentSkills.length]!];
    const user = await prisma.user.create({
      data: {
        name: `HUSTL Student ${index + 1}`,
        phone: phone(index + 100),
        role: "STUDENT",
        college: index % 2 === 0 ? "Christ University" : "St Joseph's University",
        avatarUrl: `https://api.dicebear.com/9.x/initials/png?seed=student${index + 1}`,
        reputationScore: index % 12 === 0 ? 3.3 : 4 + (index % 10) / 10,
        studentProfile: {
          create: {
            skills,
            portfolioUrls: [`https://portfolio.hustl.local/student-${index + 1}`],
            collegeName: index % 2 === 0 ? "Christ University" : "St Joseph's University",
            badges: index > 10 ? [`Trusted ${skills[0]}`] : [],
            completedShifts: index,
            availabilitySlots: ["Weekday evening", "Weekend"]
          }
        },
        badges:
          index > 10
            ? { create: [{ name: `Trusted ${skills[0]}`, category: skills[0]! }] }
            : undefined
      }
    });
    students.push(user);
  }

  const listings = [];
  for (let index = 0; index < 50; index += 1) {
    const business = businesses[index % businesses.length]!;
    const startTime = new Date(Date.now() + (index + 1) * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + (2 + (index % 5)) * 60 * 60 * 1000);
    const skill = studentSkills[index % studentSkills.length]!;
    const listing = await prisma.listing.create({
      data: {
        businessId: business.id,
        title: listingTitles[index % listingTitles.length]!,
        description: `Short HUSTL shift for ${skill.toLowerCase()} support near campus. Bring punctuality and clear communication.`,
        skills: [skill, studentSkills[(index + 1) % studentSkills.length]!],
        hourlyRate: new Prisma.Decimal(150 + (index % 8) * 50),
        startTime,
        endTime,
        totalHours: (endTime.getTime() - startTime.getTime()) / 3_600_000,
        isUrgent: index % 6 === 0,
        verifiedBadgeOnly: index % 9 === 0,
        status: index % 11 === 0 ? "MATCHED" : "OPEN"
      }
    });
    const point = coords(index);
    await setPoint("Listing", "id", listing.id, point.lat, point.lng);
    listings.push(listing);
  }

  for (let index = 0; index < 20; index += 1) {
    const listing = listings[index]!;
    const student = students[index % students.length]!;
    await prisma.swipe.create({
      data: { listingId: listing.id, studentId: student.id, direction: "RIGHT" }
    });
    await prisma.match.create({
      data: {
        listingId: listing.id,
        studentId: student.id,
        status: index % 4 === 0 ? "ACCEPTED" : "PENDING"
      }
    });
  }

  console.log("Seeded HUSTL: 10 businesses, 30 students, 50 listings, 20 matches.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
