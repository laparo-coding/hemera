-- CreateTable
CREATE TABLE "curriculum_topic_materials" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_topic_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_topic_materials_course_id_topic_id_idx" ON "curriculum_topic_materials"("course_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_topic_materials_course_id_topic_id_material_id_key" ON "curriculum_topic_materials"("course_id", "topic_id", "material_id");

-- AddForeignKey
ALTER TABLE "curriculum_topic_materials" ADD CONSTRAINT "curriculum_topic_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "seminar_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
