-- Insert sample grades
INSERT INTO grades (id, name, description, academic_year) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Grade 8', 'Eighth grade students', '2024-2025'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Grade 9', 'Ninth grade students', '2024-2025'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Grade 10', 'Tenth grade students', '2024-2025'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Grade 11', 'Eleventh grade students', '2024-2025'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Grade 12', 'Twelfth grade students', '2024-2025');

-- Insert sample subjects for each grade
-- Grade 8 subjects
INSERT INTO subjects (id, name, description, code, grade_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Mathematics', 'Basic Mathematics for Grade 8', 'MATH8', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440002', 'English', 'English Language Arts for Grade 8', 'ENG8', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Science', 'General Science for Grade 8', 'SCI8', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Social Studies', 'Social Studies for Grade 8', 'SS8', '550e8400-e29b-41d4-a716-446655440001');

-- Grade 9 subjects
INSERT INTO subjects (id, name, description, code, grade_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440005', 'Mathematics', 'Algebra and Geometry for Grade 9', 'MATH9', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440006', 'English', 'English Literature for Grade 9', 'ENG9', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440007', 'Physics', 'Introduction to Physics', 'PHY9', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440008', 'Chemistry', 'Basic Chemistry Concepts', 'CHEM9', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440009', 'Biology', 'Life Sciences for Grade 9', 'BIO9', '550e8400-e29b-41d4-a716-446655440002');

-- Grade 10 subjects
INSERT INTO subjects (id, name, description, code, grade_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440010', 'Mathematics', 'Advanced Algebra for Grade 10', 'MATH10', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440011', 'English', 'Advanced English for Grade 10', 'ENG10', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440012', 'Physics', 'Mechanics and Thermodynamics', 'PHY10', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440013', 'Chemistry', 'Organic Chemistry Basics', 'CHEM10', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440014', 'Biology', 'Human Biology and Genetics', 'BIO10', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440015', 'Computer Science', 'Programming Fundamentals', 'CS10', '550e8400-e29b-41d4-a716-446655440003');

-- Note: Additional sample data will be added through the application once user authentication is set up
-- This includes:
-- - Sample teacher and student profiles (created through auth signup)
-- - Teacher assignments to subjects
-- - Student enrollments
-- - Sample learning content
-- - Sample quizzes and assignments
-- - Sample virtual classes

-- Create some utility views for easier querying

-- View for student's subjects
CREATE VIEW student_subjects AS
SELECT 
    se.student_id,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.description as subject_description,
    g.name as grade_name
FROM student_enrollments se
JOIN grades g ON se.grade_id = g.id
JOIN subjects s ON s.grade_id = g.id
WHERE se.is_active = true;

-- View for teacher's subjects
CREATE VIEW teacher_subjects AS
SELECT 
    ta.teacher_id,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.description as subject_description,
    g.name as grade_name
FROM teacher_assignments ta
JOIN subjects s ON ta.subject_id = s.id
JOIN grades g ON s.grade_id = g.id
WHERE ta.is_active = true;

-- View for student performance summary
CREATE VIEW student_performance_summary AS
SELECT 
    p.id as student_id,
    p.full_name as student_name,
    s.name as subject_name,
    COALESCE(AVG(qa.total_score), 0) as avg_quiz_score,
    COALESCE(AVG(asub.marks_awarded), 0) as avg_assignment_score,
    COUNT(DISTINCT qa.id) as quiz_attempts,
    COUNT(DISTINCT asub.id) as assignment_submissions
FROM profiles p
JOIN student_enrollments se ON p.id = se.student_id
JOIN subjects s ON se.grade_id = s.grade_id
LEFT JOIN quizzes q ON s.id = q.subject_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = p.id AND qa.is_completed = true
LEFT JOIN assignments a ON s.id = a.subject_id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = p.id AND asub.is_graded = true
WHERE p.role = 'student' AND se.is_active = true
GROUP BY p.id, p.full_name, s.id, s.name;

-- View for attendance summary
CREATE VIEW student_attendance_summary AS
SELECT 
    p.id as student_id,
    p.full_name as student_name,
    s.name as subject_name,
    COUNT(ca.id) as total_classes,
    COUNT(CASE WHEN ca.status = 'present' THEN 1 END) as classes_attended,
    COUNT(CASE WHEN ca.status = 'late' THEN 1 END) as classes_late,
    ROUND(
        (COUNT(CASE WHEN ca.status IN ('present', 'late') THEN 1 END) * 100.0) / 
        NULLIF(COUNT(ca.id), 0), 2
    ) as attendance_percentage
FROM profiles p
JOIN student_enrollments se ON p.id = se.student_id
JOIN subjects s ON se.grade_id = s.grade_id
JOIN virtual_classes vc ON s.id = vc.subject_id
LEFT JOIN class_attendance ca ON vc.id = ca.class_id AND ca.student_id = p.id
WHERE p.role = 'student' AND se.is_active = true AND vc.status = 'completed'
GROUP BY p.id, p.full_name, s.id, s.name;









