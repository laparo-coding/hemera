/**
 * Curriculum–Material Link API Functions
 *
 * Server-side functions for managing links between
 * curriculum topics (JSON) and CourseMaterial records.
 */

import { prisma } from '../db/prisma';

/**
 * Get all material links for a course, grouped by topicId.
 * Returns a map: topicId → materialId[]
 */
export async function getMaterialLinksForCourse(courseId: string) {
  const links = await prisma.curriculumTopicMaterial.findMany({
    where: { courseId },
    include: {
      material: { select: { id: true, title: true, identifier: true } },
    },
    orderBy: [{ topicId: 'asc' }, { sortOrder: 'asc' }],
  });

  // Group by topicId for easy consumption
  const grouped: Record<
    string,
    Array<{
      id: string;
      materialId: string;
      title: string;
      identifier: string;
      sortOrder: number;
    }>
  > = {};

  for (const link of links) {
    const topicLinks = grouped[link.topicId] ?? [];
    topicLinks.push({
      id: link.id,
      materialId: link.materialId,
      title: link.material.title,
      identifier: link.material.identifier,
      sortOrder: link.sortOrder,
    });
    grouped[link.topicId] = topicLinks;
  }

  return grouped;
}

/**
 * Add a material link to a curriculum topic.
 * Returns the created link (or existing if duplicate).
 */
export async function addMaterialLink(params: {
  courseId: string;
  topicId: string;
  materialId: string;
  sortOrder?: number;
}) {
  const { courseId, topicId, materialId, sortOrder = 0 } = params;

  // Upsert: ignore if duplicate
  return prisma.curriculumTopicMaterial.upsert({
    where: {
      courseId_topicId_materialId: { courseId, topicId, materialId },
    },
    create: { courseId, topicId, materialId, sortOrder },
    update: { sortOrder },
    include: {
      material: { select: { id: true, title: true, identifier: true } },
    },
  });
}

/**
 * Remove a material link from a curriculum topic.
 */
export async function removeMaterialLink(linkId: string) {
  return prisma.curriculumTopicMaterial.delete({
    where: { id: linkId },
  });
}

/**
 * Remove a material link by composite key.
 */
export async function removeMaterialLinkByKey(params: {
  courseId: string;
  topicId: string;
  materialId: string;
}) {
  return prisma.curriculumTopicMaterial.delete({
    where: {
      courseId_topicId_materialId: params,
    },
  });
}

/**
 * Get curriculum with linked materials for a course.
 * Merges JSON curriculum with material links from the DB.
 */
export async function getCurriculumWithMaterials(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, curriculum: true },
  });

  if (!course) return null;

  const materialLinks = await getMaterialLinksForCourse(courseId);

  // Parse curriculum JSON
  const curriculum = course.curriculum as Array<{
    id: string;
    day: number;
    title: string;
    topics: Array<{
      id: string;
      timeRange: string;
      title: string;
    }>;
  }> | null;

  if (!curriculum) {
    return { courseId, modules: [] };
  }

  // Merge materials into topics
  const modules = curriculum.map(mod => ({
    ...mod,
    topics: mod.topics.map(topic => ({
      ...topic,
      materials: materialLinks[topic.id] ?? [],
    })),
  }));

  return { courseId, modules };
}
