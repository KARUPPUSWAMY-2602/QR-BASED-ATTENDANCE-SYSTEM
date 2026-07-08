/*
# Replace inline profiles sub-queries with get_my_role() in all other tables

## Problem
Policies on students, faculty, subjects, qr_sessions, and attendance_records
checked admin status via:
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
While this no longer causes infinite recursion (the profiles policy is fixed),
using the SECURITY DEFINER function is simpler and avoids triggering the RLS
stack at all.

## Fix
Replace every admin-check sub-query with `get_my_role() = 'admin'`.
*/

-- ── students ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "students_insert_admin"   ON students;
DROP POLICY IF EXISTS "students_update_admin"   ON students;
DROP POLICY IF EXISTS "students_delete_admin"   ON students;

CREATE POLICY "students_insert_admin" ON students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "students_update_admin" ON students FOR UPDATE
  TO authenticated
  USING   (auth.uid() = id OR get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "students_delete_admin" ON students FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ── faculty ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "faculty_insert_admin"   ON faculty;
DROP POLICY IF EXISTS "faculty_update_admin"   ON faculty;
DROP POLICY IF EXISTS "faculty_delete_admin"   ON faculty;

CREATE POLICY "faculty_insert_admin" ON faculty FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "faculty_update_admin" ON faculty FOR UPDATE
  TO authenticated
  USING   (auth.uid() = id OR get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "faculty_delete_admin" ON faculty FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ── subjects ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "subjects_insert_admin"   ON subjects;
DROP POLICY IF EXISTS "subjects_update_admin"   ON subjects;
DROP POLICY IF EXISTS "subjects_delete_admin"   ON subjects;

CREATE POLICY "subjects_insert_admin" ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'faculty'));

CREATE POLICY "subjects_update_admin" ON subjects FOR UPDATE
  TO authenticated
  USING   (get_my_role() IN ('admin', 'faculty'))
  WITH CHECK (get_my_role() IN ('admin', 'faculty'));

CREATE POLICY "subjects_delete_admin" ON subjects FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ── qr_sessions ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "qr_sessions_insert_faculty"   ON qr_sessions;
DROP POLICY IF EXISTS "qr_sessions_update_faculty"   ON qr_sessions;
DROP POLICY IF EXISTS "qr_sessions_delete_faculty"   ON qr_sessions;

CREATE POLICY "qr_sessions_insert_faculty" ON qr_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = faculty_id AND get_my_role() IN ('admin', 'faculty')
  );

CREATE POLICY "qr_sessions_update_faculty" ON qr_sessions FOR UPDATE
  TO authenticated
  USING   (auth.uid() = faculty_id OR get_my_role() = 'admin')
  WITH CHECK (auth.uid() = faculty_id OR get_my_role() = 'admin');

CREATE POLICY "qr_sessions_delete_faculty" ON qr_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = faculty_id OR get_my_role() = 'admin');

-- ── attendance_records ────────────────────────────────────────────
DROP POLICY IF EXISTS "attendance_insert_faculty_admin"   ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_faculty_admin"   ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_admin"           ON attendance_records;

CREATE POLICY "attendance_insert_faculty_admin" ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id OR get_my_role() IN ('admin', 'faculty')
  );

CREATE POLICY "attendance_update_faculty_admin" ON attendance_records FOR UPDATE
  TO authenticated
  USING   (get_my_role() IN ('admin', 'faculty'))
  WITH CHECK (get_my_role() IN ('admin', 'faculty'));

CREATE POLICY "attendance_delete_admin" ON attendance_records FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');
