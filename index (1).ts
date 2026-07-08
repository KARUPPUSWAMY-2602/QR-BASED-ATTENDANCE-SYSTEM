/*
# Allow faculty to delete student records

Faculty now manage students (add/delete), so the delete policy on the
students table must permit faculty in addition to admin.
The cascade from profiles → students means deleting a profile row
removes the student row automatically, but we also allow direct student
row deletion for completeness.
*/

DROP POLICY IF EXISTS "students_delete_admin" ON students;

CREATE POLICY "students_delete_faculty_admin" ON students FOR DELETE
  TO authenticated
  USING (get_my_role() IN ('admin', 'faculty'));
