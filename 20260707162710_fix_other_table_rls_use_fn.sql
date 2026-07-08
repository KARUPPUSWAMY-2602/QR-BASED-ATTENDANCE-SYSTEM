/*
# Fix infinite recursion in profiles RLS policies

## Problem
The admin SELECT/UPDATE/DELETE policies on `profiles` used a sub-query like:
  `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`
This triggers the SELECT policy on `profiles` again, causing infinite recursion.

## Fix
1. Create a SECURITY DEFINER function `get_my_role()` that reads the calling
   user's role directly, bypassing RLS (SECURITY DEFINER ignores row-level
   security on the table it queries).
2. Rewrite all profiles policies to use this function instead of a
   recursive sub-select.

## Changes
- New function: `get_my_role()` — returns the authenticated user's role
- Replaced all profiles policies with non-recursive equivalents
*/

-- Helper function that bypasses RLS to fetch the caller's role.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ── profiles SELECT ────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

-- One combined policy: own row OR caller is an admin.
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR get_my_role() = 'admin');

-- ── profiles INSERT ────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_insert_own"   ON profiles;

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ── profiles UPDATE ────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_update_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated
  USING   (auth.uid() = id OR get_my_role() = 'admin')
  WITH CHECK (auth.uid() = id OR get_my_role() = 'admin');

-- ── profiles DELETE ────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');
