import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const courses = await request.json();

    // Validate courses array
    if (!Array.isArray(courses)) {
      return NextResponse.json(
        { error: 'Kurse müssen als Array übergeben werden' },
        { status: 400 }
      );
    }

    // Create courses in database
    const createdCourses = await prisma.course.createMany({
      data: courses.map(course => ({
        title: course.title,
        description: course.description,
        slug: course.slug,
        price: course.price,
        currency: course.currency || 'EUR',
        capacity: course.capacity,
        date: course.date ? new Date(course.date) : null,
        isPublished:
          course.isPublished !== undefined ? course.isPublished : true,
      })),
    });

    return NextResponse.json(
      {
        message: `${createdCourses.count} Kurse wurden erfolgreich erstellt`,
        courses: createdCourses,
      },
      { status: 201 }
    );
  } catch (error) {
    console.warn('Fehler beim Erstellen der Kurse:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist beim Erstellen der Kurse aufgetreten' },
      { status: 500 }
    );
  }
}
