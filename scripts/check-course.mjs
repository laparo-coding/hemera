import { prisma } from '../lib/db/prisma.js';

try {
  const course = await prisma.course.findUnique({ 
    where: { id: 'cmj60q9dk0000b5aa0wy836o2' } 
  });
  
  if (course) {
    console.log('✅ Kurs gefunden:', course.title);
    console.log('   Slug:', course.slug);
    console.log('   Published:', course.published);
  } else {
    console.log('❌ Kurs nicht gefunden mit ID: cmj60q9dk0000b5aa0wy836o2');
    
    // Liste alle Kurse auf
    const allCourses = await prisma.course.findMany({
      select: { id: true, title: true, slug: true }
    });
    console.log('\nVerfügbare Kurse:');
    allCourses.forEach(c => console.log(`  - ${c.id}: ${c.title} (${c.slug})`));
  }
} catch (err) {
  console.error('❌ Fehler:', err.message);
} finally {
  await prisma.$disconnect();
}
