-- Fix subject group assignments
-- This migration fixes the issues with missing subject groups and incorrect subject assignments

-- First, let's add missing subject groups for grades 10 and 11
INSERT INTO subject_groups (name, description, grade_id) VALUES
-- Grade 10 missing groups
('Grade 10 Physics', 'Physics stream - Physical Sciences, Life Sciences, Mathematics', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1)),
('Grade 10 Commerce', 'Commerce stream - Business Studies, Economics, Tourism', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1)),
('Grade 10 IT', 'IT stream - Computer Applications Technology, Information Technology, Mathematics', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1)),

-- Grade 11 missing groups  
('Grade 11 Physics', 'Physics stream - Physical Sciences, Life Sciences, Mathematics', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1)),
('Grade 11 Commerce', 'Commerce stream - Business Studies, Economics, Tourism', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1)),
('Grade 11 IT', 'IT stream - Computer Applications Technology, Information Technology, Mathematics', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1))

ON CONFLICT (name) DO NOTHING;

-- Add missing subjects for these groups
INSERT INTO subjects (name, code, grade_id, description) VALUES
-- Grade 10 subjects
('Tourism Grade 10', 'TOUR_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Tourism Studies for Grade 10'),
('Computer Applications Technology Grade 10', 'CAT_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Computer Applications Technology for Grade 10'),
('Information Technology Grade 10', 'IT_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Information Technology for Grade 10'),

-- Grade 11 subjects  
('Tourism Grade 11', 'TOUR_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Tourism Studies for Grade 11'),
('Computer Applications Technology Grade 11', 'CAT_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Computer Applications Technology for Grade 11'),
('Information Technology Grade 11', 'IT_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Information Technology for Grade 11')

ON CONFLICT (code) DO NOTHING;

-- Now assign subjects to the new groups
-- Grade 10 Physics Group (same as Science but different name)
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'ZULU_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'LO_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'PHY_SCI_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'MATH_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Physics'), (SELECT id FROM subjects WHERE code = 'GEO_10'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Grade 10 Commerce Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'ZULU_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'LO_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'BUS_STUD_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'ECON_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'TOUR_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Commerce'), (SELECT id FROM subjects WHERE code = 'MATH_LIT_10'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Grade 10 IT Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'ZULU_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'LO_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'CAT_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'IT_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'PHY_SCI_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 IT'), (SELECT id FROM subjects WHERE code = 'MATH_10'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Grade 11 Physics Group (same as Science but different name)
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'ZULU_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'LO_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'PHY_SCI_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'MATH_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Physics'), (SELECT id FROM subjects WHERE code = 'GEO_11'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Grade 11 Commerce Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'ZULU_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'LO_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'BUS_STUD_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'ECON_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'TOUR_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Commerce'), (SELECT id FROM subjects WHERE code = 'MATH_LIT_11'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Grade 11 IT Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'ZULU_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'LO_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'CAT_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'IT_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'PHY_SCI_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 IT'), (SELECT id FROM subjects WHERE code = 'MATH_11'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Fix Humanities groups - Add Life Sciences to Grade 10 and 11 Humanities
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI_11'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Fix Accounting groups for Grade 10 and 11 to use Mathematics instead of Mathematical Literacy
-- Remove Mathematical Literacy from Grade 10 Accounting
DELETE FROM subject_group_assignments 
WHERE group_id = (SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting')
AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH_LIT_10');

-- Remove Mathematical Literacy from Grade 11 Accounting  
DELETE FROM subject_group_assignments 
WHERE group_id = (SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting')
AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH_LIT_11');

-- Add Mathematics to Grade 10 Accounting
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'MATH_10'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Add Mathematics to Grade 11 Accounting
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'MATH_11'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Ensure Grade 12 Accounting has Mathematics (should already exist but ensure it's there)
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'MATH'))
ON CONFLICT (group_id, subject_id) DO NOTHING;

-- Update descriptions to be more accurate
UPDATE subject_groups SET description = 'Physics stream - Physical Sciences, Life Sciences, Mathematics' 
WHERE name = 'Grade 10 Physics';

UPDATE subject_groups SET description = 'Physics stream - Physical Sciences, Life Sciences, Mathematics' 
WHERE name = 'Grade 11 Physics';

UPDATE subject_groups SET description = 'Commerce stream - Business Studies, Economics, Tourism, Mathematical Literacy' 
WHERE name = 'Grade 10 Commerce';

UPDATE subject_groups SET description = 'Commerce stream - Business Studies, Economics, Tourism, Mathematical Literacy' 
WHERE name = 'Grade 11 Commerce';

UPDATE subject_groups SET description = 'IT stream - Computer Applications Technology, Information Technology, Physical Sciences, Mathematics' 
WHERE name = 'Grade 10 IT';

UPDATE subject_groups SET description = 'IT stream - Computer Applications Technology, Information Technology, Physical Sciences, Mathematics' 
WHERE name = 'Grade 11 IT';

UPDATE subject_groups SET description = 'Humanities stream - History, Geography, Life Sciences, Mathematical Literacy' 
WHERE name = 'Grade 10 Humanities';

UPDATE subject_groups SET description = 'Humanities stream - History, Geography, Life Sciences, Mathematical Literacy' 
WHERE name = 'Grade 11 Humanities';

UPDATE subject_groups SET description = 'Accounting stream - Accounting, Business Studies, Economics, Mathematics' 
WHERE name = 'Grade 10 Accounting';

UPDATE subject_groups SET description = 'Accounting stream - Accounting, Business Studies, Economics, Mathematics' 
WHERE name = 'Grade 11 Accounting';

UPDATE subject_groups SET description = 'Business and Mathematics focus - Accounting, Business Studies, Economics, Mathematics' 
WHERE name = 'Accounting';