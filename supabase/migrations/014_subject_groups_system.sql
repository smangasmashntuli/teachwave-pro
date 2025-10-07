-- Create subject groups system
-- This migration adds support for predefined subject groups that students can choose from

-- Create subject groups table
CREATE TABLE subject_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subject group assignments (many-to-many between groups and subjects)
CREATE TABLE subject_group_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES subject_groups(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, subject_id)
);

-- Add group selection to student enrollments
ALTER TABLE student_enrollments 
ADD COLUMN subject_group_id UUID REFERENCES subject_groups(id),
ADD COLUMN group_selected_at TIMESTAMP WITH TIME ZONE;

-- Create specific subject enrollments (replaces the generic grade enrollment)
CREATE TABLE subject_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    grade_received TEXT,
    final_mark DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- Create analytics tracking table
CREATE TABLE site_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'page_view', 'registration', 'login', 'content_upload', 'quiz_completion', etc.
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    page_url TEXT,
    referrer TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_subject_groups_grade ON subject_groups(grade_id);
CREATE INDEX idx_subject_group_assignments_group ON subject_group_assignments(group_id);
CREATE INDEX idx_subject_group_assignments_subject ON subject_group_assignments(subject_id);
CREATE INDEX idx_subject_enrollments_student ON subject_enrollments(student_id);
CREATE INDEX idx_subject_enrollments_subject ON subject_enrollments(subject_id);
CREATE INDEX idx_site_analytics_event_type ON site_analytics(event_type);
CREATE INDEX idx_site_analytics_user_id ON site_analytics(user_id);
CREATE INDEX idx_site_analytics_created_at ON site_analytics(created_at);

-- Insert the predefined grades and subject groups
-- Create all necessary grades
INSERT INTO grades (name, description, academic_year) VALUES
('Grade 8', 'Foundation phase of high school', '2024'),
('Grade 9', 'Intermediate phase of high school', '2024'),
('Grade 10', 'Senior phase of high school - First year', '2024'),
('Grade 11', 'Senior phase of high school - Second year', '2024'), 
('Grade 12', 'Final year of high school - Matric', '2024')
ON CONFLICT (name) DO NOTHING;

-- Insert subject groups for different grades
-- Grade 8 and 9 have general groups, Grade 10-12 have specialized subject streams
INSERT INTO subject_groups (name, description, grade_id) VALUES
-- Grade 8 Groups
('Grade 8 Core', 'Core subjects for Grade 8 students', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1)),

-- Grade 9 Groups  
('Grade 9 Core', 'Core subjects for Grade 9 students', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1)),

-- Grade 10 Specialized Groups (students choose their stream)
('Grade 10 Science', 'Science stream - Physical Sciences, Life Sciences, Mathematics', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1)),
('Grade 10 Accounting', 'Accounting stream - Accounting, Business Studies, Economics', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1)),
('Grade 10 Humanities', 'Humanities stream - History, Geography, Mathematical Literacy', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1)),

-- Grade 11 Specialized Groups (continue in chosen stream)
('Grade 11 Science', 'Science stream - Physical Sciences, Life Sciences, Mathematics', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1)),
('Grade 11 Accounting', 'Accounting stream - Accounting, Business Studies, Economics', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1)),
('Grade 11 Humanities', 'Humanities stream - History, Geography, Mathematical Literacy', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1)),

-- Grade 12 Specialized Groups (final year of chosen stream)
('Physics', 'Physical Sciences, Life Sciences, Mathematics focus', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1)),
('Humanities', 'Life Sciences, History, Geography focus', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1)),
('Accounting', 'Business and Mathematics focus', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1)),
('Commerce', 'Business and Economics focus', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1)),
('IT', 'Technology and Computer Sciences focus', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1));

-- Insert subjects for all grades
INSERT INTO subjects (name, code, grade_id, description) VALUES
-- Grade 8 Subjects
('IsiZulu Grade 8', 'ZULU_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'IsiZulu Home Language for Grade 8'),
('English First Additional Language Grade 8', 'ENG_FAL_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'English FAL for Grade 8'),
('Mathematics Grade 8', 'MATH_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'Mathematics for Grade 8'),
('Geography Grade 8', 'GEO_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'Geography for Grade 8'),
('Natural Sciences Grade 8', 'NAT_SCI_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'Natural Sciences for Grade 8'),
('Technology Grade 8', 'TECH_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'Technology for Grade 8'),
('Electrical Technology Grade 8', 'ELEC_TECH_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'Electrical Technology for Grade 8'),
('History Grade 8', 'HIST_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'History for Grade 8'),
('Life Orientation Grade 8', 'LO_8', (SELECT id FROM grades WHERE name = 'Grade 8' LIMIT 1), 'Life Orientation for Grade 8'),

-- Grade 9 Subjects (similar to Grade 8 but Grade 9 level)
('IsiZulu Grade 9', 'ZULU_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'IsiZulu Home Language for Grade 9'),
('English First Additional Language Grade 9', 'ENG_FAL_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'English FAL for Grade 9'),
('Mathematics Grade 9', 'MATH_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'Mathematics for Grade 9'),
('Geography Grade 9', 'GEO_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'Geography for Grade 9'),
('Natural Sciences Grade 9', 'NAT_SCI_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'Natural Sciences for Grade 9'),
('Technology Grade 9', 'TECH_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'Technology for Grade 9'),
('Electrical Technology Grade 9', 'ELEC_TECH_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'Electrical Technology for Grade 9'),
('History Grade 9', 'HIST_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'History for Grade 9'),
('Life Orientation Grade 9', 'LO_9', (SELECT id FROM grades WHERE name = 'Grade 9' LIMIT 1), 'Life Orientation for Grade 9'),

-- Grade 10 Common subjects (all streams)
('English First Additional Language Grade 10', 'ENG_FAL_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'English FAL for Grade 10'),
('IsiZulu Grade 10', 'ZULU_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'IsiZulu Home Language for Grade 10'),
('Life Orientation Grade 10', 'LO_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Life Orientation for Grade 10'),

-- Grade 10 Science stream subjects
('Physical Sciences Grade 10', 'PHY_SCI_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Physics and Chemistry for Grade 10'),
('Life Sciences Grade 10', 'LIFE_SCI_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Biology for Grade 10'),
('Mathematics Grade 10', 'MATH_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Pure Mathematics for Grade 10'),
('Geography Grade 10', 'GEO_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Geography for Grade 10'),

-- Grade 10 Accounting stream subjects
('Accounting Grade 10', 'ACC_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Accounting for Grade 10'),
('Business Studies Grade 10', 'BUS_STUD_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Business Studies for Grade 10'),
('Economics Grade 10', 'ECON_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Economics for Grade 10'),
('Mathematical Literacy Grade 10', 'MATH_LIT_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Mathematical Literacy for Grade 10'),

-- Grade 10 Humanities stream subjects
('History Grade 10', 'HIST_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'History for Grade 10'),
('Geography Grade 10 Humanities', 'GEO_HUM_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Geography for Humanities Grade 10'),
('Mathematical Literacy Grade 10 Humanities', 'MATH_LIT_HUM_10', (SELECT id FROM grades WHERE name = 'Grade 10' LIMIT 1), 'Mathematical Literacy for Humanities Grade 10'),

-- Grade 11 Common subjects (all streams)
('English First Additional Language Grade 11', 'ENG_FAL_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'English FAL for Grade 11'),
('IsiZulu Grade 11', 'ZULU_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'IsiZulu Home Language for Grade 11'),
('Life Orientation Grade 11', 'LO_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Life Orientation for Grade 11'),

-- Grade 11 Science stream subjects
('Physical Sciences Grade 11', 'PHY_SCI_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Physics and Chemistry for Grade 11'),
('Life Sciences Grade 11', 'LIFE_SCI_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Biology for Grade 11'),
('Mathematics Grade 11', 'MATH_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Pure Mathematics for Grade 11'),
('Geography Grade 11', 'GEO_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Geography for Grade 11'),

-- Grade 11 Accounting stream subjects
('Accounting Grade 11', 'ACC_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Accounting for Grade 11'),
('Business Studies Grade 11', 'BUS_STUD_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Business Studies for Grade 11'),
('Economics Grade 11', 'ECON_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Economics for Grade 11'),
('Mathematical Literacy Grade 11', 'MATH_LIT_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Mathematical Literacy for Grade 11'),

-- Grade 11 Humanities stream subjects
('History Grade 11', 'HIST_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'History for Grade 11'),
('Geography Grade 11 Humanities', 'GEO_HUM_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Geography for Humanities Grade 11'),
('Mathematical Literacy Grade 11 Humanities', 'MATH_LIT_HUM_11', (SELECT id FROM grades WHERE name = 'Grade 11' LIMIT 1), 'Mathematical Literacy for Humanities Grade 11'),

-- Grade 12 Common subjects for all groups
('English First Additional Language', 'ENG_FAL', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'English as First Additional Language'),
('IsiZulu', 'ZULU', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'IsiZulu Home Language'),
('Life Orientation', 'LO', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Life Orientation'),

-- Grade 12 Physics group subjects
('Physical Sciences', 'PHY_SCI', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Physics and Chemistry'),
('Life Sciences', 'LIFE_SCI', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Biology'),
('Mathematics', 'MATH', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Pure Mathematics'),
('Geography', 'GEO', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Physical and Human Geography'),

-- Grade 12 Humanities specific
('History', 'HIST', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'South African and World History'),
('Mathematical Literacy', 'MATH_LIT', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Mathematical Literacy'),

-- Grade 12 Business subjects
('Accounting', 'ACC', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Financial Accounting'),
('Business Studies', 'BUS_STUD', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Business Studies'),
('Economics', 'ECON', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Economics'),

-- Grade 12 Commerce specific
('Tourism', 'TOUR', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Tourism Studies'),

-- Grade 12 IT specific
('Computer Applications Technology', 'CAT', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Computer Applications Technology'),
('Information Technology', 'IT', (SELECT id FROM grades WHERE name = 'Grade 12' LIMIT 1), 'Information Technology')

ON CONFLICT (code) DO NOTHING;

-- Link subjects to groups
-- Grade 8 Core Group (all subjects are required)
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'ZULU_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'MATH_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'GEO_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'NAT_SCI_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'TECH_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'ELEC_TECH_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'HIST_8')),
((SELECT id FROM subject_groups WHERE name = 'Grade 8 Core'), (SELECT id FROM subjects WHERE code = 'LO_8'));

-- Grade 9 Core Group (all subjects are required)
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'ZULU_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'MATH_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'GEO_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'NAT_SCI_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'TECH_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'ELEC_TECH_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'HIST_9')),
((SELECT id FROM subject_groups WHERE name = 'Grade 9 Core'), (SELECT id FROM subjects WHERE code = 'LO_9'));

-- Grade 10 Groups
-- Grade 10 Science Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'ZULU_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'LO_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'PHY_SCI_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'MATH_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Science'), (SELECT id FROM subjects WHERE code = 'GEO_10'));

-- Grade 10 Accounting Group  
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'ZULU_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'LO_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'ACC_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'BUS_STUD_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'ECON_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Accounting'), (SELECT id FROM subjects WHERE code = 'MATH_LIT_10'));

-- Grade 10 Humanities Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'ZULU_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'LO_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'HIST_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'GEO_HUM_10')),
((SELECT id FROM subject_groups WHERE name = 'Grade 10 Humanities'), (SELECT id FROM subjects WHERE code = 'MATH_LIT_HUM_10'));

-- Grade 11 Groups  
-- Grade 11 Science Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'ZULU_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'LO_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'PHY_SCI_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'MATH_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Science'), (SELECT id FROM subjects WHERE code = 'GEO_11'));

-- Grade 11 Accounting Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'ZULU_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'LO_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'ACC_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'BUS_STUD_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'ECON_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Accounting'), (SELECT id FROM subjects WHERE code = 'MATH_LIT_11'));

-- Grade 11 Humanities Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'ENG_FAL_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'ZULU_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'LO_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'HIST_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'GEO_HUM_11')),
((SELECT id FROM subject_groups WHERE name = 'Grade 11 Humanities'), (SELECT id FROM subjects WHERE code = 'MATH_LIT_HUM_11'));

-- Grade 12 Groups
-- Physics Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'PHY_SCI')),
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI')),
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'GEO')),
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'MATH')),
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'ZULU')),
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'ENG_FAL')),
((SELECT id FROM subject_groups WHERE name = 'Physics'), (SELECT id FROM subjects WHERE code = 'LO'));

-- Humanities Group  
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'LIFE_SCI')),
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'HIST')),
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'MATH_LIT')),
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'GEO')),
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'ZULU')),
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'ENG_FAL')),
((SELECT id FROM subject_groups WHERE name = 'Humanities'), (SELECT id FROM subjects WHERE code = 'LO'));

-- Accounting Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'ACC')),
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'MATH')),
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'BUS_STUD')),
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'ECON')),
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'ZULU')),
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'ENG_FAL')),
((SELECT id FROM subject_groups WHERE name = 'Accounting'), (SELECT id FROM subjects WHERE code = 'LO'));

-- Commerce Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'ECON')),
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'BUS_STUD')),
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'MATH_LIT')),
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'TOUR')),
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'ZULU')),
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'ENG_FAL')),
((SELECT id FROM subject_groups WHERE name = 'Commerce'), (SELECT id FROM subjects WHERE code = 'LO'));

-- IT Group
INSERT INTO subject_group_assignments (group_id, subject_id) VALUES
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'CAT')),
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'PHY_SCI')),
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'IT')),
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'MATH')),
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'ZULU')),
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'ENG_FAL')),
((SELECT id FROM subject_groups WHERE name = 'IT'), (SELECT id FROM subjects WHERE code = 'LO'));

-- Enable Row Level Security
ALTER TABLE subject_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Subject groups - readable by all authenticated users
CREATE POLICY "subject_groups_read_all" ON subject_groups
    FOR SELECT USING (auth.role() = 'authenticated');

-- Subject group assignments - readable by all authenticated users  
CREATE POLICY "subject_group_assignments_read_all" ON subject_group_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Subject enrollments - students can see their own, teachers can see their subjects, admins see all
CREATE POLICY "subject_enrollments_read_own" ON subject_enrollments
    FOR SELECT USING (
        student_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "subject_enrollments_insert_admin" ON subject_enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Site analytics - only admins can read
CREATE POLICY "site_analytics_admin_only" ON site_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Functions to automatically enroll students in all subjects when they choose a group
CREATE OR REPLACE FUNCTION enroll_student_in_group_subjects()
RETURNS TRIGGER AS $$
BEGIN
    -- When a student selects a subject group, automatically enroll them in all subjects in that group
    IF NEW.subject_group_id IS NOT NULL AND (OLD.subject_group_id IS NULL OR OLD.subject_group_id != NEW.subject_group_id) THEN
        -- Remove any existing subject enrollments for this student
        DELETE FROM subject_enrollments WHERE student_id = NEW.student_id;
        
        -- Enroll in all subjects in the new group
        INSERT INTO subject_enrollments (student_id, subject_id)
        SELECT NEW.student_id, sga.subject_id
        FROM subject_group_assignments sga
        WHERE sga.group_id = NEW.subject_group_id;
        
        -- Update the group selection timestamp
        NEW.group_selected_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic enrollment
CREATE TRIGGER trigger_enroll_student_in_group_subjects
    BEFORE UPDATE OF subject_group_id ON student_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION enroll_student_in_group_subjects();

-- Also create trigger for new enrollments
CREATE OR REPLACE FUNCTION enroll_student_in_group_subjects_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subject_group_id IS NOT NULL THEN
        -- Enroll in all subjects in the group
        INSERT INTO subject_enrollments (student_id, subject_id)
        SELECT NEW.student_id, sga.subject_id
        FROM subject_group_assignments sga
        WHERE sga.group_id = NEW.subject_group_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enroll_student_in_group_subjects_insert
    AFTER INSERT ON student_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION enroll_student_in_group_subjects_insert();