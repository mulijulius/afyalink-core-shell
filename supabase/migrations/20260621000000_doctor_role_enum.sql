-- ============================================================
-- AfyaLink HMS — Doctor / Clinical Officer Role (1/2: enum)
-- Project : fcetorcatklhkelqqplc
-- Created : 2026-06-21
-- ============================================================
-- Adds 'Doctor' to the app_role enum used by profiles.requested_role
-- and user_roles.role. This must be committed on its own — Postgres
-- does not allow a new enum value to be used by the same transaction
-- that adds it. The follow-up migration
-- (20260621000001_doctor_role_clinical_tables.sql) performs all of
-- the table/policy work that references 'Doctor'.
-- ============================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'Doctor';
