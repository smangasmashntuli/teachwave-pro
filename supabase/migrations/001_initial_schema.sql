-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE content_type AS ENUM ('pdf', 'video', 'document', 'link', 'image');
CREATE TYPE quiz_type AS ENUM ('multiple_choice', 'short_answer', 'essay', 'true_false');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE class_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades table
CREATE TABLE grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student enrollments
CREATE TABLE student_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(student_id, grade_id)
);

-- Teacher assignments
CREATE TABLE teacher_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(teacher_id, subject_id)
);

-- Learning content
CREATE TABLE learning_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual classes
CREATE TABLE virtual_classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    meeting_url TEXT,
    recording_url TEXT,
    attendance_code TEXT,
    status class_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class attendance
CREATE TABLE class_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status attendance_status DEFAULT 'absent',
    marked_at TIMESTAMP WITH TIME ZONE,
    attendance_code_used TEXT,
    UNIQUE(class_id, student_id)
);

-- Quizzes
CREATE TABLE quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_marks INTEGER NOT NULL DEFAULT 0,
    time_limit INTEGER, -- in minutes
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    auto_grade BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type quiz_type NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    correct_answer TEXT, -- For auto-gradable questions
    options JSONB, -- For multiple choice questions
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student quiz attempts
CREATE TABLE quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    total_score NUMERIC(5,2),
    is_completed BOOLEAN DEFAULT FALSE,
    time_taken INTEGER -- in minutes
);

-- Student answers
CREATE TABLE quiz_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    is_correct BOOLEAN,
    marks_awarded NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments
CREATE TABLE assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_marks INTEGER NOT NULL DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    submission_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE assignment_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marks_awarded NUMERIC(5,2),
    feedback TEXT,
    is_graded BOOLEAN DEFAULT FALSE,
    UNIQUE(assignment_id, student_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_student_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_grade_id ON student_enrollments(grade_id);
CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_subject_id ON teacher_assignments(subject_id);
CREATE INDEX idx_learning_content_subject_id ON learning_content(subject_id);
CREATE INDEX idx_learning_content_teacher_id ON learning_content(teacher_id);
CREATE INDEX idx_virtual_classes_subject_id ON virtual_classes(subject_id);
CREATE INDEX idx_virtual_classes_teacher_id ON virtual_classes(teacher_id);
CREATE INDEX idx_virtual_classes_scheduled_start ON virtual_classes(scheduled_start);
CREATE INDEX idx_class_attendance_class_id ON class_attendance(class_id);
CREATE INDEX idx_class_attendance_student_id ON class_attendance(student_id);
CREATE INDEX idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles: Users can see their own profile, teachers can see students in their subjects, admins see all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Teachers can view students in their subjects
CREATE POLICY "Teachers can view their students" ON profiles FOR SELECT 
    USING (
        role = 'student' AND 
        EXISTS (
            SELECT 1 FROM teacher_assignments ta
            JOIN subjects s ON ta.subject_id = s.id
            JOIN student_enrollments se ON s.grade_id = se.grade_id
            WHERE ta.teacher_id = auth.uid() AND se.student_id = profiles.id
        )
    );

-- Grades: Students see their grade, teachers see grades they teach, admins see all
CREATE POLICY "Students can view their grade" ON grades FOR SELECT
    USING (EXISTS (SELECT 1 FROM student_enrollments WHERE student_id = auth.uid() AND grade_id = grades.id));

CREATE POLICY "Teachers can view grades they teach" ON grades FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = auth.uid() AND s.grade_id = grades.id
    ));

CREATE POLICY "Admins can manage grades" ON grades
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Subjects: Students see subjects in their grade, teachers see their assigned subjects, admins see all
CREATE POLICY "Students can view their subjects" ON subjects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_enrollments se
        WHERE se.student_id = auth.uid() AND se.grade_id = subjects.grade_id
    ));

CREATE POLICY "Teachers can view their subjects" ON subjects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM teacher_assignments ta
        WHERE ta.teacher_id = auth.uid() AND ta.subject_id = subjects.id
    ));

CREATE POLICY "Admins can manage subjects" ON subjects
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Student enrollments
CREATE POLICY "Students can view own enrollments" ON student_enrollments FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their grades" ON student_enrollments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = auth.uid() AND s.grade_id = student_enrollments.grade_id
    ));

CREATE POLICY "Admins can manage student enrollments" ON student_enrollments
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Teacher assignments
CREATE POLICY "Teachers can view own assignments" ON teacher_assignments FOR SELECT
    USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage teacher assignments" ON teacher_assignments
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Learning content
CREATE POLICY "Students can view published content for their subjects" ON learning_content FOR SELECT
    USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM student_enrollments se
            JOIN subjects s ON se.grade_id = s.grade_id
            WHERE se.student_id = auth.uid() AND s.id = learning_content.subject_id
        )
    );

CREATE POLICY "Teachers can manage their content" ON learning_content
    USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all content" ON learning_content FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Virtual classes
CREATE POLICY "Students can view classes for their subjects" ON virtual_classes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_enrollments se
        JOIN subjects s ON se.grade_id = s.grade_id
        WHERE se.student_id = auth.uid() AND s.id = virtual_classes.subject_id
    ));

CREATE POLICY "Teachers can manage their classes" ON virtual_classes
    USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all classes" ON virtual_classes FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Class attendance
CREATE POLICY "Students can view own attendance" ON class_attendance FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Students can mark own attendance" ON class_attendance FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own attendance" ON class_attendance FOR UPDATE
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage attendance for their classes" ON class_attendance
    USING (EXISTS (
        SELECT 1 FROM virtual_classes vc
        WHERE vc.id = class_attendance.class_id AND vc.teacher_id = auth.uid()
    ));

-- Quizzes
CREATE POLICY "Students can view published quizzes for their subjects" ON quizzes FOR SELECT
    USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM student_enrollments se
            JOIN subjects s ON se.grade_id = s.grade_id
            WHERE se.student_id = auth.uid() AND s.id = quizzes.subject_id
        )
    );

CREATE POLICY "Teachers can manage their quizzes" ON quizzes
    USING (teacher_id = auth.uid());

-- Quiz questions
CREATE POLICY "Students can view questions for published quizzes" ON quiz_questions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM quizzes q
        JOIN student_enrollments se ON EXISTS (
            SELECT 1 FROM subjects s 
            WHERE s.id = q.subject_id AND s.grade_id = se.grade_id AND se.student_id = auth.uid()
        )
        WHERE q.id = quiz_questions.quiz_id AND q.is_published = true
    ));

CREATE POLICY "Teachers can manage questions for their quizzes" ON quiz_questions
    USING (EXISTS (
        SELECT 1 FROM quizzes q
        WHERE q.id = quiz_questions.quiz_id AND q.teacher_id = auth.uid()
    ));

-- Quiz attempts and answers
CREATE POLICY "Students can manage own quiz attempts" ON quiz_attempts
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their quizzes" ON quiz_attempts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM quizzes q
        WHERE q.id = quiz_attempts.quiz_id AND q.teacher_id = auth.uid()
    ));

CREATE POLICY "Students can manage own quiz answers" ON quiz_answers
    USING (EXISTS (
        SELECT 1 FROM quiz_attempts qa
        WHERE qa.id = quiz_answers.attempt_id AND qa.student_id = auth.uid()
    ));

CREATE POLICY "Teachers can view answers for their quizzes" ON quiz_answers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.id = quiz_answers.attempt_id AND q.teacher_id = auth.uid()
    ));

-- Assignments
CREATE POLICY "Students can view published assignments for their subjects" ON assignments FOR SELECT
    USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM student_enrollments se
            JOIN subjects s ON se.grade_id = s.grade_id
            WHERE se.student_id = auth.uid() AND s.id = assignments.subject_id
        )
    );

CREATE POLICY "Teachers can manage their assignments" ON assignments
    USING (teacher_id = auth.uid());

-- Assignment submissions
CREATE POLICY "Students can manage own submissions" ON assignment_submissions
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can grade submissions for their assignments" ON assignment_submissions FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = auth.uid()
    ));

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- System can create notifications for any user (for admin/system operations)
CREATE POLICY "System can create notifications" ON notifications FOR INSERT
    WITH CHECK (true);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    CASE 
      WHEN new.email LIKE '%@admin.%' THEN 'admin'::user_role
      WHEN new.email LIKE '%@teacher.%' THEN 'teacher'::user_role
      ELSE 'student'::user_role
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_content_updated_at BEFORE UPDATE ON learning_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_classes_updated_at BEFORE UPDATE ON virtual_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();