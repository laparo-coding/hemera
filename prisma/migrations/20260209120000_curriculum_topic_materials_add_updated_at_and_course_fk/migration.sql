-- AlterTable: Add updated_at to curriculum_topic_materials
ALTER TABLE "curriculum_topic_materials" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey: Link curriculum_topic_materials.course_id to courses.id
ALTER TABLE "curriculum_topic_materials" ADD CONSTRAINT "curriculum_topic_materials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
