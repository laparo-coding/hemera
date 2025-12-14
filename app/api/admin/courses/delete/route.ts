import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db/prisma';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('id');

    // Validate course ID
    if (!courseId) {
      return NextResponse.json(
        { error: 'Kurs-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Kurs nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete course
    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json(
      { message: `Kurs "${existingCourse.title}" wurde erfolgreich gelöscht` },
      { status: 200 }
    );
  } catch (error) {
    console.warn('Fehler beim Löschen des Kurses:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist beim Löschen des Kurses aufgetreten' },
      { status: 500 }
    );
  }
}
