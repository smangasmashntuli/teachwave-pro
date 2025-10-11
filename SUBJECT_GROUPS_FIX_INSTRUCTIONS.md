# Subject Groups Fix Instructions

## Issues Identified and Fixed

### 1. **Missing Subject Groups for Grades 10-11**
- **Problem**: Physics, Commerce, and IT groups only existed for Grade 12
- **Solution**: Created dedicated groups for grades 10 and 11 with appropriate subjects

### 2. **Missing Life Sciences in Humanities**
- **Problem**: Humanities groups for grades 10-11 were missing Life Sciences
- **Solution**: Added Life Sciences to both Grade 10 and Grade 11 Humanities groups

### 3. **Incorrect Mathematics in Accounting**
- **Problem**: Accounting group used different math subjects inconsistently
- **Solution**: Grade 12 Accounting uses Mathematics, Grades 10-11 use Mathematical Literacy

## Manual Migration Required

Since the Supabase CLI isn't set up locally, please apply the migration manually:

### Steps:
1. **Open Supabase Dashboard** → Go to your project
2. **Navigate to SQL Editor**
3. **Copy the entire contents** of `supabase/migrations/017_fix_subject_group_assignments.sql`
4. **Paste and Execute** the SQL in the editor

## What the Migration Does:

### New Subject Groups Added:
- **Grade 10 Physics** - Physical Sciences, Life Sciences, Mathematics, Geography
- **Grade 10 Commerce** - Business Studies, Economics, Tourism, Mathematical Literacy  
- **Grade 10 IT** - Computer Applications Technology, Information Technology, Physical Sciences, Mathematics
- **Grade 11 Physics** - Physical Sciences, Life Sciences, Mathematics, Geography
- **Grade 11 Commerce** - Business Studies, Economics, Tourism, Mathematical Literacy
- **Grade 11 IT** - Computer Applications Technology, Information Technology, Physical Sciences, Mathematics

### New Subjects Added:
- Tourism Grade 10/11
- Computer Applications Technology Grade 10/11
- Information Technology Grade 10/11

### Fixes Applied:
- ✅ Added Life Sciences to Grade 10/11 Humanities groups
- ✅ Ensured Grade 12 Accounting uses Mathematics (not Math Literacy)
- ✅ Maintained Mathematical Literacy for Grade 10/11 Accounting
- ✅ Updated group descriptions to reflect actual subjects

## Verification:
After running the migration, you should see:
- **Grade 10**: Physics (7 subjects), Commerce (7 subjects), IT (7 subjects), Humanities (7 subjects including Life Sciences)
- **Grade 11**: Physics (7 subjects), Commerce (7 subjects), IT (7 subjects), Humanities (7 subjects including Life Sciences)  
- **Grade 12**: Accounting uses Mathematics instead of Mathematical Literacy

## Common Subjects (All Groups):
All groups include: English FAL, IsiZulu, Life Orientation + their specialized subjects.