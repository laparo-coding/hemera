/**
 * Course Material API Functions
 * Feature: 023-slide-editor
 *
 * Server-side functions for managing seminarmaterial CRUD operations
 */

import { prisma } from '../db/prisma';

/**
 * Get all seminar materials
 */
export async function getAllMaterials() {
  return prisma.seminarMaterial.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single seminar material by ID
 */
export async function getMaterialById(id: string) {
  return prisma.seminarMaterial.findUnique({
    where: { id },
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
  const material = await prisma.seminarMaterial.findUnique({
    where: { identifier },
  });

  if (!material) return false;
  if (excludeId && material.id === excludeId) return false;
  return true;
}

/**
 * Create a new seminar material
 */
export async function createMaterial(data: {
  identifier: string;
  title: string;
  blobUrl: string;
  blobPathname: string;
}) {
  return prisma.seminarMaterial.create({
    data,
  });
}

/**
 * Update an existing seminar material
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
  return prisma.seminarMaterial.update({
    where: { id },
    data,
  });
}

/**
 * Delete a seminar material
 */
export async function deleteMaterial(id: string) {
  return prisma.seminarMaterial.delete({
    where: { id },
  });
}
