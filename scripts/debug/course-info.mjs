import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main(courseId) {
	if (!courseId) {
		console.error('Usage: node scripts/debug/course-info.mjs <courseId>');
		process.exit(1);
	}

	try {
		const course = await prisma.course.findUnique({
			where: { id: courseId },
			include: { bookings: true },
		});

		if (!course) {
			console.log('Course not found');
			return;
		}

		console.log(JSON.stringify(course, null, 2));
	} catch (error) {
		console.error('Error retrieving course:', error);
	} finally {
		await prisma.$disconnect();
	}
}

const courseId = process.argv[2];
main(courseId);
