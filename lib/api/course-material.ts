/**
 * Course Material API Functions
 * Feature: 023-slide-editor, 026-course-material-integration
 *
 * Server-side functions for managing course material CRUD operations
 */

import type { CourseMaterialType, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

type CourseMaterialSummary = Prisma.CourseMaterialGetPayload<{
  select: {
    id: true;
    identifier: true;
    title: true;
    type: true;
    blobUrl: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

/**
 * Get all course materials
 */
export async function getAllMaterials(): Promise<CourseMaterialSummary[]> {
  return prisma.courseMaterial.findMany({
    select: {
      id: true,
      identifier: true,
      title: true,
      type: true,
      blobUrl: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single course material by ID
 */
export async function getMaterialById(id: string) {
  return prisma.courseMaterial.findUnique({
    where: { id },
    select: {
      id: true,
      identifier: true,
      title: true,
      type: true,
      blobUrl: true,
      blobPathname: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Check if an identifier is already taken
 * Optionally exclude a specific material ID (for update scenarios)
 */
export async function isIdentifierTaken(
  identifier: string,
  excludeId?: string
) {
  const material = await prisma.courseMaterial.findUnique({
    where: { identifier },
  });

  if (!material) return false;
  if (excludeId && material.id === excludeId) return false;
  return true;
}

/**
 * Create a new course material
 */
export async function createMaterial(data: {
  identifier: string;
  title: string;
  type: CourseMaterialType;
  blobUrl: string;
  blobPathname: string;
}) {
  return prisma.courseMaterial.create({
    data,
  });
}

/**
 * Update an existing course material
 */
export async function updateMaterial(
  id: string,
  data: {
    title?: string;
    identifier?: string;
    blobUrl?: string;
    blobPathname?: string;
  }
) {
  return prisma.courseMaterial.update({
    where: { id },
    data,
  });
}

/**
 * Delete a course material
 */
export async function deleteMaterial(id: string) {
  return prisma.courseMaterial.delete({
    where: { id },
  });
}
