-- Create comprehensive database schema for dynamic teacher dashboard

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    schedule_day VARCHAR(20),
    schedule_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    max_students INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    grade_level VARCHAR(50),
    date_of_birth DATE,
    parent_email VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_enrollments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(class_id, student_id)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50) DEFAULT 'assignment', -- assignment, quiz, test, project
    total_points DECIMAL(5,2) DEFAULT 100.00,
    due_date TIMESTAMP WITH TIME ZONE,
    instructions TEXT,
    attachments JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    points_earned DECIMAL(5,2),
    percentage DECIMAL(5,2),
    letter_grade VARCHAR(5),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    is_late BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'present', -- present, absent, late, excused
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id, class_date)
);

-- Create class_sessions table for virtual class tracking
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    session_title VARCHAR(255),
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER,
    recording_url VARCHAR(500),
    meeting_link VARCHAR(500),
    session_notes TEXT,
    attendance_count INTEGER DEFAULT 0,
    is_recorded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table for tracking student engagement
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- login, assignment_view, video_watch, quiz_attempt, etc.
    event_data JSONB DEFAULT '{}',
    duration_seconds INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_progress table for tracking overall performance
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    current_grade DECIMAL(5,2),
    grade_trend VARCHAR(20) DEFAULT 'stable', -- improving, declining, stable
    attendance_rate DECIMAL(5,2),
    assignment_completion_rate DECIMAL(5,2),
    participation_score DECIMAL(5,2),
    last_activity TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- assignment_due, grade_posted, message, announcement
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_id ON grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(class_date);
CREATE INDEX IF NOT EXISTS idx_analytics_events_class_id ON analytics_events(class_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_student_id ON analytics_events(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_class_id ON student_progress(class_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate letter grade from percentage
CREATE OR REPLACE FUNCTION calculate_letter_grade(percentage DECIMAL)
RETURNS VARCHAR(5) AS $$
BEGIN
    CASE 
        WHEN percentage >= 90 THEN RETURN 'A';
        WHEN percentage >= 80 THEN RETURN 'B';
        WHEN percentage >= 70 THEN RETURN 'C';
        WHEN percentage >= 60 THEN RETURN 'D';
        ELSE RETURN 'F';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update student progress automatically
CREATE OR REPLACE FUNCTION update_student_progress()
RETURNS TRIGGER AS $$
DECLARE
    class_record RECORD;
    progress_record RECORD;
BEGIN
    -- Get the class_id from the assignment
    SELECT a.class_id INTO class_record FROM assignments a WHERE a.id = NEW.assignment_id;
    
    -- Calculate current grade for the student in this class
    INSERT INTO student_progress (class_id, student_id, current_grade, attendance_rate, assignment_completion_rate, updated_at)
    VALUES (class_record.class_id, NEW.student_id, NEW.percentage, 0, 0, NOW())
    ON CONFLICT (class_id, student_id) 
    DO UPDATE SET 
        current_grade = (
            SELECT AVG(g.percentage) 
            FROM grades g 
            JOIN assignments a ON g.assignment_id = a.id 
            WHERE a.class_id = class_record.class_id AND g.student_id = NEW.student_id
        ),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update student progress when grades change
CREATE TRIGGER update_progress_on_grade_change
    AFTER INSERT OR UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_student_progress();

-- Row Level Security (RLS) policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for teachers to access their own classes and students
CREATE POLICY "Teachers can view their own classes" ON classes
    FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can manage their class students" ON class_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = class_enrollments.class_id 
            AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage their class assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = assignments.class_id 
            AND c.teacher_id = auth.uid()
        )
    );

-- Insert sample data for testing
INSERT INTO classes (title, subject, grade_level, teacher_id, class_code, schedule_day, schedule_time, description) 
VALUES 
    ('Advanced Mathematics', 'Mathematics', 'Grade 10', (SELECT id FROM auth.users WHERE email ILIKE '%admin%' LIMIT 1), 'MATH001', 'Monday', '09:00:00', 'Advanced mathematics covering algebra and geometry'),
    ('English Literature', 'English', 'Grade 11', (SELECT id FROM auth.users WHERE email ILIKE '%admin%' LIMIT 1), 'ENG001', 'Tuesday', '10:30:00', 'Comprehensive English literature course'),
    ('Physics Fundamentals', 'Science', 'Grade 10', (SELECT id FROM auth.users WHERE email ILIKE '%admin%' LIMIT 1), 'PHY001', 'Wednesday', '14:00:00', 'Introduction to physics principles')
ON CONFLICT (class_code) DO NOTHING;

-- Insert sample students
INSERT INTO students (first_name, last_name, email, student_number, grade_level) 
VALUES 
    ('Alice', 'Johnson', 'alice.johnson@student.edu', 'STU001', 'Grade 10'),
    ('Bob', 'Smith', 'bob.smith@student.edu', 'STU002', 'Grade 10'),
    ('Carol', 'Davis', 'carol.davis@student.edu', 'STU003', 'Grade 10'),
    ('David', 'Wilson', 'david.wilson@student.edu', 'STU004', 'Grade 11'),
    ('Emma', 'Brown', 'emma.brown@student.edu', 'STU005', 'Grade 11'),
    ('Frank', 'Miller', 'frank.miller@student.edu', 'STU006', 'Grade 10')
ON CONFLICT (email) DO NOTHING;

-- Enroll students in classes
INSERT INTO class_enrollments (class_id, student_id)
SELECT c.id, s.id
FROM classes c
CROSS JOIN students s
WHERE (c.class_code = 'MATH001' AND s.grade_level = 'Grade 10')
   OR (c.class_code = 'ENG001' AND s.grade_level = 'Grade 11')
   OR (c.class_code = 'PHY001' AND s.grade_level = 'Grade 10')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- Insert sample assignments
INSERT INTO assignments (class_id, title, description, assignment_type, total_points, due_date, is_published)
SELECT 
    c.id,
    unnest(ARRAY['Quadratic Equations Quiz', 'Algebra Problem Set', 'Geometry Project']) as title,
    unnest(ARRAY['Quiz on quadratic equations', 'Practice problems for algebra', 'Geometry construction project']) as description,
    unnest(ARRAY['quiz', 'assignment', 'project']) as assignment_type,
    unnest(ARRAY[25, 50, 100]) as total_points,
    NOW() + INTERVAL '7 days' as due_date,
    true as is_published
FROM classes c
WHERE c.class_code = 'MATH001'
ON CONFLICT DO NOTHING;

-- Insert sample grades
INSERT INTO grades (assignment_id, student_id, points_earned, percentage, letter_grade, graded_at)
SELECT 
    a.id,
    s.id,
    (RANDOM() * a.total_points)::DECIMAL(5,2) as points_earned,
    (RANDOM() * 40 + 60)::DECIMAL(5,2) as percentage,  -- Random grades between 60-100%
    calculate_letter_grade((RANDOM() * 40 + 60)::DECIMAL(5,2)) as letter_grade,
    NOW() - INTERVAL '1 day'
FROM assignments a
CROSS JOIN students s
JOIN class_enrollments ce ON ce.student_id = s.id AND ce.class_id = a.class_id
WHERE a.is_published = true
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- Insert sample attendance records
INSERT INTO attendance (class_id, student_id, class_date, status)
SELECT 
    ce.class_id,
    ce.student_id,
    CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 6),  -- Last 7 days
    CASE 
        WHEN RANDOM() > 0.1 THEN 'present'
        WHEN RANDOM() > 0.05 THEN 'late' 
        ELSE 'absent'
    END as status
FROM class_enrollments ce
ON CONFLICT (class_id, student_id, class_date) DO NOTHING;