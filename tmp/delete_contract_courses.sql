DELETE FROM bookings WHERE course_id IN (SELECT id FROM courses WHERE title LIKE '%[CONTRACT-TEST]%');
DELETE FROM courses WHERE title LIKE '%[CONTRACT-TEST]%';
