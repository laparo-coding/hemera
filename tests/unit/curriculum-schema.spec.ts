import { ZodError } from 'zod';
import { curriculumSchema } from '../../lib/schemas/admin/course';

describe('curriculumSchema', () => {
  describe('valid curriculum', () => {
    it('should accept null', () => {
      expect(() => curriculumSchema.parse(null)).not.toThrow();
    });

    it('should accept undefined', () => {
      expect(() => curriculumSchema.parse(undefined)).not.toThrow();
    });

    it('should accept empty array', () => {
      expect(() => curriculumSchema.parse([])).not.toThrow();
    });

    it('should accept valid curriculum with modules and topics', () => {
      const validCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul 1: Einführung',
          topics: [
            {
              id: 'top-1',
              timeRange: '09:00-10:30',
              title: 'Thema 1.1: Grundlagen',
            },
            {
              id: 'top-2',
              timeRange: '10:45-12:00',
              title: 'Thema 1.2: Erste Schritte',
            },
          ],
        },
        {
          id: 'mod-2',
          day: 2,
          title: 'Modul 2: Fortgeschritten',
          topics: [
            {
              id: 'top-3',
              timeRange: '09:00-12:00',
              title: 'Thema 2.1: Vertiefung',
            },
          ],
        },
      ];

      expect(() => curriculumSchema.parse(validCurriculum)).not.toThrow();
    });

    it('should accept module with empty topics array', () => {
      const curriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul ohne Themen',
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(curriculum)).not.toThrow();
    });
  });

  describe('invalid curriculum', () => {
    it('should reject non-array values', () => {
      expect(() => curriculumSchema.parse('invalid')).toThrow(ZodError);
      expect(() => curriculumSchema.parse(123)).toThrow(ZodError);
      expect(() => curriculumSchema.parse({})).toThrow(ZodError);
    });

    it('should reject module without required id field', () => {
      const invalidCurriculum = [
        {
          day: 1,
          title: 'Modul 1',
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module without required day field', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          title: 'Modul 1',
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module without title', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module with non-string title', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 123,
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject topic without required id field', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul 1',
          topics: [{ timeRange: '09:00-10:00', title: 'Topic' }],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject topic without required timeRange field', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul 1',
          topics: [{ id: 'top-1', title: 'Topic' }],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject topic without title', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul 1',
          topics: [{ id: 'top-1', timeRange: '09:00-10:00' }],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject topic with non-string title', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul 1',
          topics: [{ id: 'top-1', timeRange: '09:00-10:00', title: 456 }],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module without topics array', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul ohne topics property',
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module with non-array topics', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Modul 1',
          topics: 'not an array',
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module with invalid day type', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 'first',
          title: 'Modul 1',
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });

    it('should reject module with non-positive day', () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 0,
          title: 'Modul 1',
          topics: [],
        },
      ];

      expect(() => curriculumSchema.parse(invalidCurriculum)).toThrow(ZodError);
    });
  });
});
