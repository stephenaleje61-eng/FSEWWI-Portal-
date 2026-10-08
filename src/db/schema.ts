import { pgTable, serial, text, timestamp, boolean, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table (Permanent user account and profile record)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Unique User ID (e.g., USR-2026-00001 or Firebase UID)
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Securely hashed with scrypt/salt
  passwordSalt: text('password_salt'), // Unique cryptographic salt
  fullName: text('full_name'),
  displayName: text('display_name'),
  phoneNumber: text('phone_number'),
  gender: text('gender'), // 'Female', 'Male', 'Other'
  dateOfBirth: text('date_of_birth'),
  address: text('address'),
  state: text('state'),
  lga: text('lga'),
  widowStatus: text('widow_status'), // 'Widow', 'Widower'
  profilePhoto: text('profile_photo'), // Profile photo storage reference/URL
  identificationType: text('identification_type'), // 'NIN', "Voter's Card", "Driver's License", "Community ID"
  identificationNumber: text('identification_number'),
  role: text('role').notNull().default('applicant'), // 'applicant', 'super_admin', 'administrator', 'reviewer', 'data_entry_officer'
  emailVerified: boolean('email_verified').default(false),
  verificationStatus: text('verification_status').notNull().default('Pending'), // 'Pending', 'Verified', 'Rejected', 'Under Review'
  accountStatus: text('account_status').notNull().default('Active'), // 'Active', 'Suspended', 'Deactivated'
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_uid_idx').on(table.uid),
  index('users_phone_idx').on(table.phoneNumber),
  index('users_verification_idx').on(table.verificationStatus),
  index('users_account_status_idx').on(table.accountStatus),
  index('users_created_at_idx').on(table.createdAt),
]);

// 2. Admin Users table
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'super_admin', 'administrator', 'reviewer', 'data_entry_officer'
  department: text('department'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('admin_users_email_idx').on(table.email),
]);

// 3. States & LGAs reference tables
export const states = pgTable('states', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code'),
});

export const lgas = pgTable('lgas', {
  id: serial('id').primaryKey(),
  stateName: text('state_name').notNull(),
  name: text('name').notNull(),
}, (table) => [
  index('lgas_state_name_idx').on(table.stateName),
]);

// 4. Applicants core application profile
export const applicants = pgTable('applicants', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  title: text('title').notNull(), // Mr, Mrs, Dr, Prof, Alhaji, Haji, Chief, Other
  surname: text('surname').notNull(),
  otherNames: text('other_names').notNull(),
  phoneNumber: text('phone_number').notNull(),
  nationality: text('nationality').notNull().default('Nigerian'),
  state: text('state').notNull(),
  lga: text('lga').notNull(),
  highestQualification: text('highest_qualification').notNull(),
  clergyName: text('clergy_name'), // Priest/Pastor/Imam
  childrenCount: integer('children_count').notNull().default(0),
  childrenInSchool: integer('children_in_school').notNull().default(0),
  childrenOutOfSchool: integer('children_out_of_school').notNull().default(0),
  professionalSkills: text('professional_skills').notNull(),
  acquiredSkills: text('acquired_skills'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('applicants_user_id_idx').on(table.userId),
  index('applicants_phone_idx').on(table.phoneNumber),
  index('applicants_state_idx').on(table.state),
  index('applicants_lga_idx').on(table.lga),
  index('applicants_created_at_idx').on(table.createdAt),
]);

// 5. Applicant Photographs (passport photos)
export const applicantPhotos = pgTable('applicant_photos', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  photoStorageUrl: text('photo_storage_url').notNull(),
  isVerified: boolean('is_verified').notNull().default(true),
  verifiedAt: timestamp('verified_at').defaultNow(),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('applicant_photos_user_id_idx').on(table.userId),
]);

// 6. Applications (submission, status tracking, reference numbering)
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  referenceNumber: text('reference_number').notNull().unique(), // e.g., FSEWWI-2026-000001
  userId: text('user_id').notNull().references(() => users.uid),
  applicantId: integer('applicant_id').references(() => applicants.id),
  status: text('status').notNull().default('Draft'), // 'Draft', 'Submitted', 'Under Review', 'Approved', 'Not Approved', 'Needs Correction'
  declarationAccepted: boolean('declaration_accepted').notNull().default(false),
  signatureData: text('signature_data'), // base64 or vector data of digital signature
  signatureDate: text('signature_date'),
  reviewNotes: text('review_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('applications_ref_idx').on(table.referenceNumber),
  index('applications_user_id_idx').on(table.userId),
  index('applications_status_idx').on(table.status),
  index('applications_created_at_idx').on(table.createdAt),
]);

// 7. Audit Logs for Admin actions
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  adminEmail: text('admin_email').notNull(),
  action: text('action').notNull(), // 'APPROVE', 'REJECT', 'STATUS_CHANGE', 'EDIT_USER', 'SUSPEND_ACCOUNT', 'EXPORT'
  targetReference: text('target_reference'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('audit_logs_admin_idx').on(table.adminEmail),
  index('audit_logs_target_idx').on(table.targetReference),
  index('audit_logs_created_at_idx').on(table.createdAt),
]);

// 8. Database Backups Log
export const backups = pgTable('backups', {
  id: serial('id').primaryKey(),
  backupReference: text('backup_reference').notNull().unique(),
  backupType: text('backup_type').notNull().default('automated'), // 'automated', 'manual'
  recordCount: integer('record_count').notNull().default(0),
  checksum: text('checksum'),
  notes: text('notes'),
  createdBy: text('created_by').notNull().default('system'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('backups_created_at_idx').on(table.createdAt),
]);

// 9. User Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_read_idx').on(table.read),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  applicant: one(applicants, {
    fields: [users.uid],
    references: [applicants.userId],
  }),
  applications: many(applications),
  photos: many(applicantPhotos),
  notifications: many(notifications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.uid],
  }),
  applicant: one(applicants, {
    fields: [applications.applicantId],
    references: [applicants.id],
  }),
}));
