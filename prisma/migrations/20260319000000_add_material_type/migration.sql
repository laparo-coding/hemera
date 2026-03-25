-- AlterTable: Add material type field to seminar_materials
-- Feature: 026-course-material-integration
-- Default 'CONTENT' preserves backward compatibility for existing rows.

ALTER TABLE "seminar_materials" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CONTENT';
