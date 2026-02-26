-- ============================================
-- TeachWave Database - Common Queries Reference
-- ============================================

-- ============================================
-- 1. VIEW ALL SUBJECTS BY GRADE
-- ============================================

-- Grade 8 subjects
SELECT s.name, s.code 
FROM subjects s
JOIN subject_grade_mappings sgm ON s.id = sgm.subject_id
WHERE sgm.grade_id = 1
ORDER BY s.name;

-- Grade 10 subjects (all across streams)
SELECT DISTINCT s.name, s.code 
FROM subjects s
JOIN subject_group_mappings sgm ON s.id = sgm.subject_id
WHERE sgm.grade_id = 3
ORDER BY s.name;

-- ============================================
-- 2. VIEW SUBJECTS BY STREAM
-- ============================================

-- Humanities stream subjects for Grade 10
SELECT s.name, s.code, sg.name as stream_name
FROM subjects s
JOIN subject_group_mappings sgm ON s.id = sgm.subject_id
JOIN subject_groups sg ON sgm.subject_group_id = sg.id
WHERE sg.code = 'HUM' AND sgm.grade_id = 3
ORDER BY s.name;

-- Science stream subjects for Grade 12
SELECT s.name, s.code, sg.name as stream_name
FROM subjects s
JOIN subject_group_mappings sgm ON s.id = sgm.subject_id
JOIN subject_groups sg ON sgm.subject_group_id = sg.id
WHERE sg.code = 'SCI' AND sgm.grade_id = 5
ORDER BY s.name;

-- ============================================
-- 3. VIEW TEACHERS AND THEIR ASSIGNMENTS
-- ============================================

-- All teachers with their assigned subjects
SELECT 
    u.full_name as teacher_name,
    u.email,
    s.name as subject_name,
    g.name as grade_name,
    ta.assigned_date
FROM teachers t
JOIN users u ON t.user_id = u.id
JOIN teacher_assignments ta ON t.id = ta.teacher_id
JOIN subjects s ON ta.subject_id = s.id
JOIN grades g ON ta.grade_id = g.id
ORDER BY u.full_name, g.name, s.name;

-- Find what subjects a specific teacher teaches
SELECT 
    s.name as subject_name,
    g.name as grade_name
FROM teacher_assignments ta
JOIN subjects s ON ta.subject_id = s.id
JOIN grades g ON ta.grade_id = g.id
JOIN teachers t ON ta.teacher_id = t.id
JOIN users u ON t.user_id = u.id
WHERE u.email = 'teacher@teachwave.com'
ORDER BY g.name, s.name;

-- ============================================
-- 4. VIEW STUDENTS AND THEIR ENROLLMENTS
-- ============================================

-- All students with their grade and stream
SELECT 
    u.full_name as student_name,
    u.email,
    s.student_number,
    g.name as grade_name,
    sg.name as stream_name
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN grades g ON s.grade_id = g.id
LEFT JOIN subject_groups sg ON s.subject_group_id = sg.id
ORDER BY g.name, u.full_name;

-- View a student's enrolled subjects
SELECT 
    s.name as subject_name,
    s.code as subject_code,
    se.enrollment_date
FROM subject_enrollments se
JOIN subjects s ON se.subject_id = s.id
JOIN students st ON se.student_id = st.id
JOIN users u ON st.user_id = u.id
WHERE u.email = 'student@example.com'
ORDER BY s.name;

-- ============================================
-- 5. STUDENT ASSIGNMENTS
-- ============================================

-- View all assignments for a student
SELECT 
    a.title,
    a.description,
    s.name as subject_name,
    a.due_date,
    a.total_points,
    CASE 
        WHEN asub.id IS NOT NULL THEN 'Submitted'
        ELSE 'Not Submitted'
    END as submission_status,
    asub.grade as score,
    asub.submitted_at
FROM assignments a
JOIN subjects s ON a.subject_id = s.id
JOIN subject_enrollments se ON s.id = se.subject_id
JOIN students st ON se.student_id = st.id
JOIN users u ON st.user_id = u.id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = st.id
WHERE u.email = 'student@example.com'
ORDER BY a.due_date DESC;

-- ============================================
-- 6. TEACHER ASSIGNMENTS VIEW
-- ============================================

-- View assignments created by a teacher
SELECT 
    a.title,
    s.name as subject_name,
    g.name as grade_name,
    a.due_date,
    COUNT(asub.id) as total_submissions,
    COUNT(CASE WHEN asub.grade IS NOT NULL THEN 1 END) as graded_submissions
FROM assignments a
JOIN subjects s ON a.subject_id = s.id
JOIN grades g ON a.grade_id = g.id
JOIN teachers t ON a.teacher_id = t.id
JOIN users u ON t.user_id = u.id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
WHERE u.email = 'teacher@teachwave.com'
GROUP BY a.id, s.name, g.name, a.title, a.due_date
ORDER BY a.due_date DESC;

-- ============================================
-- 7. CLASS ATTENDANCE
-- ============================================

-- View attendance for a specific virtual class
SELECT 
    u.full_name as student_name,
    att.status,
    att.join_time,
    att.leave_time,
    TIMESTAMPDIFF(MINUTE, att.join_time, att.leave_time) as duration_minutes
FROM attendance att
JOIN students s ON att.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE att.class_id = 1
ORDER BY att.status, u.full_name;

-- ============================================
-- 8. SYSTEM STATISTICS (ADMIN)
-- ============================================

-- Count users by role
SELECT 
    role,
    COUNT(*) as total
FROM users
GROUP BY role;

-- Count students by grade
SELECT 
    g.name as grade_name,
    COUNT(s.id) as student_count
FROM grades g
LEFT JOIN students s ON g.id = s.grade_id
GROUP BY g.id, g.name
ORDER BY g.id;

-- Count students by stream (Grade 10-12)
SELECT 
    g.name as grade_name,
    sg.name as stream_name,
    COUNT(s.id) as student_count
FROM subject_groups sg
CROSS JOIN grades g
LEFT JOIN students s ON sg.id = s.subject_group_id AND g.id = s.grade_id
WHERE g.id >= 3
GROUP BY g.id, g.name, sg.id, sg.name
ORDER BY g.id, sg.name;

-- Total assignments by subject
SELECT 
    s.name as subject_name,
    COUNT(a.id) as total_assignments
FROM subjects s
LEFT JOIN assignments a ON s.id = a.subject_id
GROUP BY s.id, s.name
ORDER BY total_assignments DESC;

-- ============================================
-- 9. ADMIN MANAGEMENT QUERIES
-- ============================================

-- Assign a teacher to a subject and grade
INSERT INTO teacher_assignments (teacher_id, subject_id, grade_id)
VALUES (1, 4, 2); -- teacher_id=1, subject_id=4 (Mathematics), grade_id=2 (Grade 9)

-- Enroll a student in Grade 8 (auto-enrolls in all Grade 8 subjects via app logic)
UPDATE students SET grade_id = 1 WHERE user_id = 3;

-- Enroll a student in Grade 10 Science stream
UPDATE students SET grade_id = 3, subject_group_id = 2 WHERE user_id = 3;

-- Remove a teacher assignment
DELETE FROM teacher_assignments 
WHERE teacher_id = 1 AND subject_id = 4 AND grade_id = 2;

-- ============================================
-- 10. DATA VALIDATION QUERIES
-- ============================================

-- Find students not enrolled in any subjects
SELECT 
    u.full_name,
    u.email,
    s.grade_id
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN subject_enrollments se ON s.id = se.student_id
WHERE se.id IS NULL;

-- Find teachers not assigned to any subjects
SELECT 
    u.full_name,
    u.email,
    t.employee_number
FROM teachers t
JOIN users u ON t.user_id = u.id
LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
WHERE ta.id IS NULL;

-- Find orphaned assignments (teacher not assigned to that subject-grade combo)
SELECT 
    a.id,
    a.title,
    s.name as subject_name,
    g.name as grade_name
FROM assignments a
JOIN subjects s ON a.subject_id = s.id
JOIN grades g ON a.grade_id = g.id
LEFT JOIN teacher_assignments ta ON a.teacher_id = ta.teacher_id 
    AND a.subject_id = ta.subject_id 
    AND a.grade_id = ta.grade_id
WHERE ta.id IS NULL;

-- ============================================
-- 11. PERFORMANCE QUERIES
-- ============================================

-- Student average grade across all assignments
SELECT 
    u.full_name,
    AVG(asub.grade) as average_grade,
    COUNT(asub.id) as total_submissions
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN assignment_submissions asub ON s.id = asub.student_id
WHERE asub.grade IS NOT NULL
GROUP BY s.id, u.full_name
ORDER BY average_grade DESC;

-- Subject with most pending assignments (not submitted)
SELECT 
    s.name as subject_name,
    COUNT(a.id) as total_assignments,
    COUNT(asub.id) as total_submissions,
    (COUNT(a.id) - COUNT(asub.id)) as pending_count
FROM subjects s
JOIN assignments a ON s.id = a.subject_id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
GROUP BY s.id, s.name
ORDER BY pending_count DESC;

-- ============================================
-- END OF COMMON QUERIES
-- ============================================
