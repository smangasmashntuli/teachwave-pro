// Grade Isolation Verification Script
// Run this to check if grade isolation is working properly

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and key
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyGradeIsolation() {
  console.log('🔍 Checking Grade Isolation...\n');

  try {
    // 1. Check if subjects are properly grade-specific
    console.log('1. Checking Subject Structure:');
    const { data: subjects } = await supabase
      .from('subjects')
      .select(`
        id, name, code, 
        grades(name)
      `)
      .order('name');

    // Group subjects by name to see if there are grade-specific versions
    const subjectsByName = subjects?.reduce((acc, subject) => {
      if (!acc[subject.name]) acc[subject.name] = [];
      acc[subject.name].push(subject);
      return acc;
    }, {}) || {};

    Object.entries(subjectsByName).forEach(([name, subjects]) => {
      if (subjects.length > 1) {
        console.log(`   📚 ${name}:`);
        subjects.forEach(s => {
          console.log(`      • ID: ${s.id} | Code: ${s.code} | Grade: ${s.grades?.name || 'No Grade'}`);
        });
      }
    });

    // 2. Check teacher assignments for cross-grade issues
    console.log('\n2. Checking Teacher Assignments:');
    const { data: assignments } = await supabase
      .from('teacher_assignments')
      .select(`
        teacher_id,
        subjects(id, name, code, grades(name)),
        profiles(full_name, email)
      `)
      .eq('is_active', true);

    // Group by teacher to see their subject assignments
    const assignmentsByTeacher = assignments?.reduce((acc, assignment) => {
      const teacherId = assignment.teacher_id;
      if (!acc[teacherId]) {
        acc[teacherId] = {
          teacher: assignment.profiles,
          subjects: []
        };
      }
      acc[teacherId].subjects.push(assignment.subjects);
      return acc;
    }, {}) || {};

    Object.entries(assignmentsByTeacher).forEach(([teacherId, data]) => {
      const subjectNames = data.subjects.map(s => s.name);
      const duplicateSubjects = subjectNames.filter((name, index) => 
        subjectNames.indexOf(name) !== index
      );
      
      if (duplicateSubjects.length > 0) {
        console.log(`   👨‍🏫 ${data.teacher.full_name} (${data.teacher.email}) teaches multiple grades of:`);
        const uniqueDuplicates = [...new Set(duplicateSubjects)];
        uniqueDuplicates.forEach(subjectName => {
          const grades = data.subjects
            .filter(s => s.name === subjectName)
            .map(s => s.grades?.name || 'No Grade');
          console.log(`      • ${subjectName}: Grades ${grades.join(', ')}`);
        });
      }
    });

    // 3. Check for content cross-contamination
    console.log('\n3. Checking Content Distribution:');
    
    // Get subjects with same name but different grades
    for (const [subjectName, subjects] of Object.entries(subjectsByName)) {
      if (subjects.length > 1) {
        console.log(`\n   📖 Checking "${subjectName}" across grades:`);
        
        for (const subject of subjects) {
          const { count: contentCount } = await supabase
            .from('learning_content')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);
          
          const { count: classCount } = await supabase
            .from('virtual_classes')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);

          console.log(`      • ${subject.code} (${subject.grades?.name}): ${contentCount || 0} content items, ${classCount || 0} classes`);
        }
      }
    }

    // 4. Check student enrollments
    console.log('\n4. Checking Student Enrollments:');
    const { data: enrollments } = await supabase
      .from('subject_enrollments')
      .select(`
        student_id,
        subjects(name, code, grades(name)),
        profiles(full_name)
      `)
      .eq('is_active', true);

    // Group by student and check for cross-grade enrollments
    const enrollmentsByStudent = enrollments?.reduce((acc, enrollment) => {
      const studentId = enrollment.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: enrollment.profiles,
          subjects: []
        };
      }
      acc[studentId].subjects.push(enrollment.subjects);
      return acc;
    }, {}) || {};

    let crossGradeStudents = 0;
    Object.entries(enrollmentsByStudent).forEach(([studentId, data]) => {
      const grades = [...new Set(data.subjects.map(s => s.grades?.name).filter(Boolean))];
      if (grades.length > 1) {
        crossGradeStudents++;
        console.log(`   👨‍🎓 ${data.student?.full_name} enrolled in multiple grades: ${grades.join(', ')}`);
      }
    });

    if (crossGradeStudents === 0) {
      console.log('   ✅ No students enrolled across multiple grades');
    }

    console.log('\n📊 Summary:');
    console.log(`   • Total subjects: ${subjects?.length || 0}`);
    console.log(`   • Subjects with multiple grade versions: ${Object.values(subjectsByName).filter(s => s.length > 1).length}`);
    console.log(`   • Total teacher assignments: ${assignments?.length || 0}`);
    console.log(`   • Students with cross-grade enrollments: ${crossGradeStudents}`);
    
    console.log('\n✨ Grade isolation verification complete!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Instructions for use
console.log(`
📋 Instructions to run this verification:

1. Update the supabaseUrl and supabaseKey variables above with your actual values
2. Install dependencies: npm install @supabase/supabase-js
3. Run: node verify_grade_isolation.js

This script will help identify if there are any grade isolation issues in your data.
`);

// Uncomment the line below to run the verification
// verifyGradeIsolation();

module.exports = { verifyGradeIsolation };