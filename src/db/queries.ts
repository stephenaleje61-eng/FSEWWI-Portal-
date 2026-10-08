import { eq, desc, sql, and, like, or, ilike, count } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import {
  users,
  applicants,
  applications,
  applicantPhotos,
  adminUsers,
  auditLogs,
  notifications,
  backups,
} from './schema.ts';

// Cryptographic Password Hashing (timing-safe, scrypt with per-user salt)
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, storedSalt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// 1. Permanent User Registration (persisted directly to Cloud SQL PostgreSQL)
export async function registerPermanentUser(data: {
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  state?: string;
  lga?: string;
  widowStatus?: string;
  profilePhoto?: string;
  identificationType?: string;
  identificationNumber?: string;
  role?: string;
}) {
  try {
    const cleanEmail = data.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      throw new Error(`An account with email "${cleanEmail}" is already registered.`);
    }

    // Generate unique permanent User ID (e.g., USR-2026-000123)
    const countRes = await db.select({ total: count() }).from(users);
    const nextSeq = (countRes[0]?.total || 0) + 1;
    const uid = `USR-2026-${String(nextSeq).padStart(6, '0')}`;

    // Hash password if provided
    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    if (data.password) {
      const hp = hashPassword(data.password);
      passwordHash = hp.hash;
      passwordSalt = hp.salt;
    }

    // Insert permanent User record in PostgreSQL
    const insertedUsers = await db.insert(users).values({
      uid,
      email: cleanEmail,
      passwordHash: passwordHash || null,
      passwordSalt: passwordSalt || null,
      fullName: data.fullName.trim(),
      displayName: data.fullName.trim(),
      phoneNumber: data.phoneNumber?.trim() || null,
      gender: data.gender || 'Female',
      dateOfBirth: data.dateOfBirth || null,
      address: data.address?.trim() || null,
      state: data.state?.trim() || 'Benue',
      lga: data.lga?.trim() || 'Makurdi',
      widowStatus: data.widowStatus || 'Widow',
      profilePhoto: data.profilePhoto || null,
      identificationType: data.identificationType || 'National ID (NIN)',
      identificationNumber: data.identificationNumber?.trim() || null,
      role: data.role || 'applicant',
      emailVerified: true,
      verificationStatus: 'Pending',
      accountStatus: 'Active',
      lastLoginAt: new Date(),
    }).returning();

    const newUser = insertedUsers[0];

    // Seed applicant profile record
    const names = data.fullName.trim().split(' ');
    const surname = names[names.length - 1] || data.fullName.trim();
    const otherNames = names.slice(0, names.length - 1).join(' ') || '';

    const insertedApplicants = await db.insert(applicants).values({
      userId: uid,
      title: data.gender === 'Male' ? 'Mr.' : 'Mrs.',
      surname: surname,
      otherNames: otherNames,
      phoneNumber: data.phoneNumber?.trim() || '',
      nationality: 'Nigerian',
      state: data.state?.trim() || 'Benue',
      lga: data.lga?.trim() || 'Makurdi',
      highestQualification: 'Secondary',
      clergyName: '',
      childrenCount: 0,
      childrenInSchool: 0,
      childrenOutOfSchool: 0,
      professionalSkills: 'Tailoring',
      acquiredSkills: '',
    }).returning();

    // If profile photo supplied, store record
    if (data.profilePhoto) {
      await db.insert(applicantPhotos).values({
        userId: uid,
        photoStorageUrl: data.profilePhoto,
        isVerified: true,
      });
    }

    // Initialize application record in 'Draft'
    const appCount = await db.select({ total: count() }).from(applications);
    const nextAppSeq = (appCount[0]?.total || 0) + 1;
    const refNumber = `FSEWWI-2026-${String(nextAppSeq).padStart(6, '0')}`;

    await db.insert(applications).values({
      userId: uid,
      applicantId: insertedApplicants[0].id,
      referenceNumber: refNumber,
      status: 'Draft',
      declarationAccepted: false,
    });

    // Audit log
    await db.insert(auditLogs).values({
      adminEmail: cleanEmail,
      action: 'USER_REGISTERED_PERMANENT',
      targetReference: uid,
      details: `User registered with email ${cleanEmail}, name: ${data.fullName}`,
      ipAddress: 'registration-portal',
    });

    // Sanitized return object (NO password hashes!)
    return {
      id: newUser.id,
      uid: newUser.uid,
      email: newUser.email,
      fullName: newUser.fullName,
      displayName: newUser.displayName,
      phoneNumber: newUser.phoneNumber,
      gender: newUser.gender,
      dateOfBirth: newUser.dateOfBirth,
      address: newUser.address,
      state: newUser.state,
      lga: newUser.lga,
      widowStatus: newUser.widowStatus,
      profilePhoto: newUser.profilePhoto,
      identificationType: newUser.identificationType,
      identificationNumber: newUser.identificationNumber,
      role: newUser.role,
      verificationStatus: newUser.verificationStatus,
      accountStatus: newUser.accountStatus,
      createdAt: newUser.createdAt,
    };
  } catch (error: any) {
    console.error('Error in registerPermanentUser:', error);
    throw new Error(error?.message || 'Database registration failed.', { cause: error });
  }
}

// 2. Permanent User Login Verification
export async function authenticatePermanentUser(email: string, passwordAttempt: string) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const records = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (records.length === 0) {
      throw new Error('No registered account found with this email address.');
    }

    const user = records[0];

    // Check account status
    if (user.accountStatus === 'Suspended') {
      throw new Error('This account is currently suspended. Please contact FSEWWI administration.');
    }
    if (user.accountStatus === 'Deactivated') {
      throw new Error('This account has been deactivated.');
    }

    // Check password if stored
    if (user.passwordHash && user.passwordSalt) {
      const isValid = verifyPassword(passwordAttempt, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
    }

    // Update last login timestamp in PostgreSQL
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return {
      id: user.id,
      uid: user.uid,
      email: user.email,
      fullName: user.fullName || user.displayName,
      displayName: user.displayName || user.fullName,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      state: user.state,
      lga: user.lga,
      widowStatus: user.widowStatus,
      profilePhoto: user.profilePhoto,
      role: user.role,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw new Error(error?.message || 'Authentication failed.', { cause: error });
  }
}

// 3. User Sync & Upsert (handles both Google OAuth and standard sessions)
export async function getOrCreateUser(uid: string, email: string, displayName?: string, role = 'applicant') {
  try {
    const existing = await db.select().from(users).where(or(eq(users.uid, uid), eq(users.email, email.toLowerCase().trim()))).limit(1);
    if (existing.length > 0) {
      const user = existing[0];
      const adminEntry = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
      const userRole = adminEntry.length > 0 ? adminEntry[0].role : user.role;
      if (userRole !== user.role) {
        await db.update(users).set({ role: userRole }).where(eq(users.id, user.id));
      }
      return { ...user, role: userRole };
    }

    const adminEntry = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    const resolvedRole = adminEntry.length > 0 ? adminEntry[0].role : role;

    const result = await db.insert(users)
      .values({
        uid,
        email: email.toLowerCase().trim(),
        displayName: displayName || email.split('@')[0],
        fullName: displayName || email.split('@')[0],
        role: resolvedRole,
        emailVerified: true,
        verificationStatus: 'Pending',
        accountStatus: 'Active',
        lastLoginAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database operation failed. Unable to sync user profile.', { cause: error });
  }
}

// 4. Fetch User's Application & Details
export async function getUserApplication(userId: string) {
  try {
    const userRecord = await db.select().from(users).where(eq(users.uid, userId)).limit(1);

    const appRecord = await db.select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt))
      .limit(1);

    const applicantProfile = await db.select()
      .from(applicants)
      .where(eq(applicants.userId, userId))
      .limit(1);

    const photoRecord = await db.select()
      .from(applicantPhotos)
      .where(eq(applicantPhotos.userId, userId))
      .orderBy(desc(applicantPhotos.createdAt))
      .limit(1);

    return {
      user: userRecord[0] || null,
      application: appRecord[0] || null,
      applicant: applicantProfile[0] || null,
      photo: photoRecord[0] || null,
    };
  } catch (error) {
    console.error('Database query failed in getUserApplication:', error);
    throw new Error('Unable to retrieve user application details.', { cause: error });
  }
}

// 5. Save or Update Applicant Draft
export async function saveApplicationDraft(
  userId: string,
  userEmail: string,
  data: {
    title?: string;
    surname?: string;
    otherNames?: string;
    phoneNumber?: string;
    nationality?: string;
    state?: string;
    lga?: string;
    highestQualification?: string;
    clergyName?: string;
    childrenCount?: number;
    childrenInSchool?: number;
    childrenOutOfSchool?: number;
    professionalSkills?: string;
    acquiredSkills?: string;
    signatureData?: string;
    photoUrl?: string;
  }
) {
  try {
    await getOrCreateUser(userId, userEmail);

    let applicantId: number;
    const existingApplicant = await db.select().from(applicants).where(eq(applicants.userId, userId)).limit(1);

    if (existingApplicant.length > 0) {
      applicantId = existingApplicant[0].id;
      await db.update(applicants).set({
        title: data.title ?? existingApplicant[0].title,
        surname: data.surname ?? existingApplicant[0].surname,
        otherNames: data.otherNames ?? existingApplicant[0].otherNames,
        phoneNumber: data.phoneNumber ?? existingApplicant[0].phoneNumber,
        nationality: data.nationality ?? existingApplicant[0].nationality,
        state: data.state ?? existingApplicant[0].state,
        lga: data.lga ?? existingApplicant[0].lga,
        highestQualification: data.highestQualification ?? existingApplicant[0].highestQualification,
        clergyName: data.clergyName ?? existingApplicant[0].clergyName,
        childrenCount: data.childrenCount ?? existingApplicant[0].childrenCount,
        childrenInSchool: data.childrenInSchool ?? existingApplicant[0].childrenInSchool,
        childrenOutOfSchool: data.childrenOutOfSchool ?? existingApplicant[0].childrenOutOfSchool,
        professionalSkills: data.professionalSkills ?? existingApplicant[0].professionalSkills,
        acquiredSkills: data.acquiredSkills ?? existingApplicant[0].acquiredSkills,
        updatedAt: new Date(),
      }).where(eq(applicants.id, applicantId));
    } else {
      const inserted = await db.insert(applicants).values({
        userId,
        title: data.title || 'Mrs.',
        surname: data.surname || '',
        otherNames: data.otherNames || '',
        phoneNumber: data.phoneNumber || '',
        nationality: data.nationality || 'Nigerian',
        state: data.state || 'Benue',
        lga: data.lga || 'Makurdi',
        highestQualification: data.highestQualification || 'Secondary',
        clergyName: data.clergyName || '',
        childrenCount: data.childrenCount || 0,
        childrenInSchool: data.childrenInSchool || 0,
        childrenOutOfSchool: data.childrenOutOfSchool || 0,
        professionalSkills: data.professionalSkills || 'Tailoring',
        acquiredSkills: data.acquiredSkills || '',
      }).returning();
      applicantId = inserted[0].id;
    }

    if (data.photoUrl) {
      await db.insert(applicantPhotos).values({
        userId,
        photoStorageUrl: data.photoUrl,
        isVerified: true,
        verifiedAt: new Date(),
      });
      // Also update user's profile photo
      await db.update(users).set({ profilePhoto: data.photoUrl }).where(eq(users.uid, userId));
    }

    const existingApp = await db.select().from(applications).where(eq(applications.userId, userId)).limit(1);
    if (existingApp.length > 0) {
      if (['Draft', 'Needs Correction'].includes(existingApp[0].status)) {
        await db.update(applications).set({
          applicantId,
          signatureData: data.signatureData ?? existingApp[0].signatureData,
          updatedAt: new Date(),
        }).where(eq(applications.id, existingApp[0].id));
      }
      return { success: true, referenceNumber: existingApp[0].referenceNumber, status: existingApp[0].status };
    } else {
      const countRes = await db.select({ count: count() }).from(applications);
      const nextNum = (countRes[0]?.count || 0) + 1;
      const refNumber = `FSEWWI-2026-${String(nextNum).padStart(6, '0')}`;

      const newApp = await db.insert(applications).values({
        userId,
        applicantId,
        referenceNumber: refNumber,
        status: 'Draft',
        signatureData: data.signatureData || null,
        declarationAccepted: false,
      }).returning();

      return { success: true, referenceNumber: newApp[0].referenceNumber, status: 'Draft' };
    }
  } catch (error) {
    console.error('Database query failed in saveApplicationDraft:', error);
    throw new Error('Failed to save draft application.', { cause: error });
  }
}

// 6. Submit Application
export async function submitApplication(
  userId: string,
  userEmail: string,
  data: {
    title: string;
    surname: string;
    otherNames: string;
    phoneNumber: string;
    nationality: string;
    state: string;
    lga: string;
    highestQualification: string;
    clergyName?: string;
    childrenCount: number;
    childrenInSchool: number;
    childrenOutOfSchool: number;
    professionalSkills: string;
    acquiredSkills?: string;
    declarationAccepted: boolean;
    signatureData: string;
    signatureDate: string;
    photoUrl: string;
  }
) {
  try {
    if (!data.declarationAccepted) {
      throw new Error('The applicant declaration must be accepted before submission.');
    }
    if (!data.photoUrl) {
      throw new Error('A verified passport photograph is required to complete submission.');
    }

    await getOrCreateUser(userId, userEmail);

    let applicantId: number;
    const existingApplicant = await db.select().from(applicants).where(eq(applicants.userId, userId)).limit(1);
    if (existingApplicant.length > 0) {
      applicantId = existingApplicant[0].id;
      await db.update(applicants).set({
        title: data.title,
        surname: data.surname,
        otherNames: data.otherNames,
        phoneNumber: data.phoneNumber,
        nationality: data.nationality,
        state: data.state,
        lga: data.lga,
        highestQualification: data.highestQualification,
        clergyName: data.clergyName || '',
        childrenCount: Number(data.childrenCount) || 0,
        childrenInSchool: Number(data.childrenInSchool) || 0,
        childrenOutOfSchool: Number(data.childrenOutOfSchool) || 0,
        professionalSkills: data.professionalSkills,
        acquiredSkills: data.acquiredSkills || '',
        updatedAt: new Date(),
      }).where(eq(applicants.id, applicantId));
    } else {
      const inserted = await db.insert(applicants).values({
        userId,
        title: data.title,
        surname: data.surname,
        otherNames: data.otherNames,
        phoneNumber: data.phoneNumber,
        nationality: data.nationality,
        state: data.state,
        lga: data.lga,
        highestQualification: data.highestQualification,
        clergyName: data.clergyName || '',
        childrenCount: Number(data.childrenCount) || 0,
        childrenInSchool: Number(data.childrenInSchool) || 0,
        childrenOutOfSchool: Number(data.childrenOutOfSchool) || 0,
        professionalSkills: data.professionalSkills,
        acquiredSkills: data.acquiredSkills || '',
      }).returning();
      applicantId = inserted[0].id;
    }

    await db.insert(applicantPhotos).values({
      userId,
      photoStorageUrl: data.photoUrl,
      isVerified: true,
      verifiedAt: new Date(),
    });

    await db.update(users).set({
      profilePhoto: data.photoUrl,
      phoneNumber: data.phoneNumber,
      state: data.state,
      lga: data.lga,
      verificationStatus: 'Under Review',
    }).where(eq(users.uid, userId));

    let refNumber: string;
    const existingApp = await db.select().from(applications).where(eq(applications.userId, userId)).limit(1);

    if (existingApp.length > 0) {
      refNumber = existingApp[0].referenceNumber;
      await db.update(applications).set({
        applicantId,
        status: 'Submitted',
        declarationAccepted: true,
        signatureData: data.signatureData,
        signatureDate: data.signatureDate || new Date().toISOString().split('T')[0],
        submittedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(applications.id, existingApp[0].id));
    } else {
      const countRes = await db.select({ count: count() }).from(applications);
      const nextNum = (countRes[0]?.count || 0) + 1;
      refNumber = `FSEWWI-2026-${String(nextNum).padStart(6, '0')}`;

      await db.insert(applications).values({
        userId,
        applicantId,
        referenceNumber: refNumber,
        status: 'Submitted',
        declarationAccepted: true,
        signatureData: data.signatureData,
        signatureDate: data.signatureDate || new Date().toISOString().split('T')[0],
        submittedAt: new Date(),
      });
    }

    await db.insert(notifications).values({
      userId,
      title: 'Application Submitted Successfully',
      message: `Your FSEWWI application (${refNumber}) has been received and is currently under review by our welfare committee.`,
    });

    return {
      success: true,
      referenceNumber: refNumber,
      status: 'Submitted',
      submittedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Database query failed in submitApplication:', error);
    throw new Error(error?.message || 'Failed to submit application.', { cause: error });
  }
}

// 7. Admin: Paginated Users Registry (Optimized for 2,000,000 records)
export async function getAdminUsersList(params: {
  page?: number;
  limit?: number;
  verificationStatus?: string;
  accountStatus?: string;
  state?: string;
  search?: string;
}) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.verificationStatus && params.verificationStatus !== 'ALL') {
      conditions.push(eq(users.verificationStatus, params.verificationStatus));
    }
    if (params.accountStatus && params.accountStatus !== 'ALL') {
      conditions.push(eq(users.accountStatus, params.accountStatus));
    }
    if (params.state && params.state !== 'ALL') {
      conditions.push(eq(users.state, params.state));
    }
    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(users.uid, q),
          ilike(users.fullName, q),
          ilike(users.email, q),
          ilike(users.phoneNumber, q),
          ilike(users.identificationNumber, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      fullName: users.fullName,
      displayName: users.displayName,
      phoneNumber: users.phoneNumber,
      gender: users.gender,
      dateOfBirth: users.dateOfBirth,
      address: users.address,
      state: users.state,
      lga: users.lga,
      widowStatus: users.widowStatus,
      profilePhoto: users.profilePhoto,
      identificationType: users.identificationType,
      identificationNumber: users.identificationNumber,
      role: users.role,
      verificationStatus: users.verificationStatus,
      accountStatus: users.accountStatus,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const countRes = await db.select({ total: count() })
      .from(users)
      .where(whereClause);

    const total = countRes[0]?.total || 0;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Database query failed in getAdminUsersList:', error);
    throw new Error('Unable to fetch users registry.', { cause: error });
  }
}

// 8. Admin: Update User Verification & Account Status
export async function updateUserAdminStatus(params: {
  userId: string;
  verificationStatus?: string;
  accountStatus?: string;
  adminEmail: string;
  notes?: string;
  ipAddress?: string;
}) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, params.userId)).limit(1);
    if (existing.length === 0) {
      throw new Error(`User with ID ${params.userId} not found.`);
    }

    const updateFields: any = { updatedAt: new Date() };
    if (params.verificationStatus) updateFields.verificationStatus = params.verificationStatus;
    if (params.accountStatus) updateFields.accountStatus = params.accountStatus;

    await db.update(users).set(updateFields).where(eq(users.uid, params.userId));

    // Audit log
    await db.insert(auditLogs).values({
      adminEmail: params.adminEmail,
      action: 'UPDATE_USER_STATUS',
      targetReference: params.userId,
      details: `Verification: ${params.verificationStatus || 'Unchanged'}, Account: ${params.accountStatus || 'Unchanged'}. Notes: ${params.notes || 'None'}`,
      ipAddress: params.ipAddress || 'internal',
    });

    return { success: true, userId: params.userId };
  } catch (error: any) {
    console.error('Error in updateUserAdminStatus:', error);
    throw new Error(error?.message || 'Failed to update user status.', { cause: error });
  }
}

// 9. Admin: Edit Permitted User Information
export async function updatePermittedUserInfo(params: {
  userId: string;
  adminEmail: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  state?: string;
  lga?: string;
  widowStatus?: string;
  identificationType?: string;
  identificationNumber?: string;
  dateOfBirth?: string;
  gender?: string;
}) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, params.userId)).limit(1);
    if (existing.length === 0) {
      throw new Error(`User with ID ${params.userId} not found.`);
    }

    await db.update(users).set({
      fullName: params.fullName ?? existing[0].fullName,
      displayName: params.fullName ?? existing[0].displayName,
      phoneNumber: params.phoneNumber ?? existing[0].phoneNumber,
      address: params.address ?? existing[0].address,
      state: params.state ?? existing[0].state,
      lga: params.lga ?? existing[0].lga,
      widowStatus: params.widowStatus ?? existing[0].widowStatus,
      identificationType: params.identificationType ?? existing[0].identificationType,
      identificationNumber: params.identificationNumber ?? existing[0].identificationNumber,
      dateOfBirth: params.dateOfBirth ?? existing[0].dateOfBirth,
      gender: params.gender ?? existing[0].gender,
      updatedAt: new Date(),
    }).where(eq(users.uid, params.userId));

    await db.insert(auditLogs).values({
      adminEmail: params.adminEmail,
      action: 'ADMIN_EDIT_USER_INFO',
      targetReference: params.userId,
      details: `Admin edited details for user ${params.userId}`,
      ipAddress: 'admin-console',
    });

    return { success: true, userId: params.userId };
  } catch (error: any) {
    console.error('Error in updatePermittedUserInfo:', error);
    throw new Error(error?.message || 'Failed to update user profile.', { cause: error });
  }
}

// 10. Database Backup Creation & Recovery Strategy
export async function createDatabaseBackupSnapshot(adminEmail = 'system', type = 'automated') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupRef = `BKP-${timestamp}`;

    // Query core tables
    const allUsers = await db.select().from(users);
    const allApplicants = await db.select().from(applicants);
    const allApplications = await db.select().from(applications);
    const allPhotos = await db.select().from(applicantPhotos);
    const allAuditLogs = await db.select().from(auditLogs);

    const totalRecords = allUsers.length + allApplicants.length + allApplications.length;

    const backupData = {
      reference: backupRef,
      createdAt: new Date().toISOString(),
      metadata: {
        totalUsers: allUsers.length,
        totalApplicants: allApplicants.length,
        totalApplications: allApplications.length,
        totalPhotos: allPhotos.length,
        version: '1.0',
        environment: 'production',
      },
      tables: {
        users: allUsers.map((u) => ({
          ...u,
          passwordHash: '[PROTECTED_HASH]',
          passwordSalt: '[PROTECTED_SALT]',
        })),
        applicants: allApplicants,
        applications: allApplications,
        photos: allPhotos,
        auditLogs: allAuditLogs,
      },
    };

    const serialized = JSON.stringify(backupData, null, 2);
    const checksum = crypto.createHash('sha256').update(serialized).digest('hex');

    // Save backup record to database
    await db.insert(backups).values({
      backupReference: backupRef,
      backupType: type,
      recordCount: totalRecords,
      checksum,
      notes: `Automated database snapshot: ${allUsers.length} users, ${allApplications.length} applications.`,
      createdBy: adminEmail,
    });

    // Ensure backups directory exists
    const backupsDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(backupsDir, `${backupRef}.json`), serialized, 'utf-8');

    return {
      success: true,
      backupReference: backupRef,
      totalRecords,
      checksum,
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('Backup creation failed:', error);
    throw new Error('Database backup execution failed.', { cause: error });
  }
}

// 11. List Database Backups
export async function listDatabaseBackups(limit = 20) {
  try {
    return await db.select().from(backups).orderBy(desc(backups.createdAt)).limit(limit);
  } catch (error) {
    console.error('Error in listDatabaseBackups:', error);
    throw new Error('Unable to list database backups.', { cause: error });
  }
}

// 12. Admin: Paginated Application List
export async function getAdminApplications(params: {
  page?: number;
  limit?: number;
  status?: string;
  state?: string;
  lga?: string;
  search?: string;
}) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(applications.status, params.status));
    }
    if (params.state && params.state !== 'ALL') {
      conditions.push(eq(applicants.state, params.state));
    }
    if (params.lga && params.lga !== 'ALL') {
      conditions.push(eq(applicants.lga, params.lga));
    }
    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(applications.referenceNumber, q),
          ilike(applicants.surname, q),
          ilike(applicants.otherNames, q),
          ilike(applicants.phoneNumber, q),
          ilike(users.email, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db.select({
      id: applications.id,
      referenceNumber: applications.referenceNumber,
      status: applications.status,
      submittedAt: applications.submittedAt,
      createdAt: applications.createdAt,
      reviewedBy: applications.reviewedBy,
      reviewedAt: applications.reviewedAt,
      reviewNotes: applications.reviewNotes,
      applicantId: applicants.id,
      title: applicants.title,
      surname: applicants.surname,
      otherNames: applicants.otherNames,
      phoneNumber: applicants.phoneNumber,
      state: applicants.state,
      lga: applicants.lga,
      highestQualification: applicants.highestQualification,
      childrenCount: applicants.childrenCount,
      professionalSkills: applicants.professionalSkills,
      email: users.email,
    })
      .from(applications)
      .innerJoin(users, eq(applications.userId, users.uid))
      .leftJoin(applicants, eq(applications.applicantId, applicants.id))
      .where(whereClause)
      .orderBy(desc(applications.createdAt))
      .limit(limit)
      .offset(offset);

    const countRes = await db.select({ total: count() })
      .from(applications)
      .innerJoin(users, eq(applications.userId, users.uid))
      .leftJoin(applicants, eq(applications.applicantId, applicants.id))
      .where(whereClause);

    const total = countRes[0]?.total || 0;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Database query failed in getAdminApplications:', error);
    throw new Error('Unable to fetch applications list.', { cause: error });
  }
}

// 13. Admin: Get Single Application Full Details
export async function getApplicationByReference(referenceNumber: string) {
  try {
    const appRecord = await db.select()
      .from(applications)
      .where(eq(applications.referenceNumber, referenceNumber))
      .limit(1);

    if (appRecord.length === 0) {
      return null;
    }

    const app = appRecord[0];
    const userRecord = await db.select().from(users).where(eq(users.uid, app.userId)).limit(1);
    const applicantRecord = app.applicantId
      ? await db.select().from(applicants).where(eq(applicants.id, app.applicantId)).limit(1)
      : [];
    const photoRecord = await db.select().from(applicantPhotos).where(eq(applicantPhotos.userId, app.userId)).orderBy(desc(applicantPhotos.createdAt)).limit(1);
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.targetReference, referenceNumber)).orderBy(desc(auditLogs.createdAt)).limit(20);

    return {
      application: app,
      user: userRecord[0] || null,
      applicant: applicantRecord[0] || null,
      photo: photoRecord[0] || null,
      auditLogs: logs,
    };
  } catch (error) {
    console.error('Database query failed in getApplicationByReference:', error);
    throw new Error('Unable to retrieve application details.', { cause: error });
  }
}

// 14. Admin: Update Application Status
export async function updateApplicationStatus(params: {
  referenceNumber: string;
  status: 'Approved' | 'Not Approved' | 'Needs Correction' | 'Under Review';
  reviewNotes?: string;
  adminEmail: string;
  ipAddress?: string;
}) {
  try {
    const existing = await db.select().from(applications).where(eq(applications.referenceNumber, params.referenceNumber)).limit(1);
    if (existing.length === 0) {
      throw new Error(`Application with reference ${params.referenceNumber} not found.`);
    }

    const previousStatus = existing[0].status;

    await db.update(applications).set({
      status: params.status,
      reviewNotes: params.reviewNotes || existing[0].reviewNotes,
      reviewedBy: params.adminEmail,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(applications.referenceNumber, params.referenceNumber));

    // Update user's verification status in tandem
    const userVerifStatus = params.status === 'Approved' ? 'Verified' : (params.status === 'Not Approved' ? 'Rejected' : 'Under Review');
    await db.update(users).set({ verificationStatus: userVerifStatus }).where(eq(users.uid, existing[0].userId));

    await db.insert(auditLogs).values({
      adminEmail: params.adminEmail,
      action: `STATUS_CHANGE_${params.status.toUpperCase().replace(/\s+/g, '_')}`,
      targetReference: params.referenceNumber,
      details: `Changed status from ${previousStatus} to ${params.status}. Notes: ${params.reviewNotes || 'None'}`,
      ipAddress: params.ipAddress || 'internal',
    });

    await db.insert(notifications).values({
      userId: existing[0].userId,
      title: `Application Status: ${params.status}`,
      message: `Your FSEWWI application (${params.referenceNumber}) status has been updated to "${params.status}". ${params.reviewNotes ? `Officer remarks: ${params.reviewNotes}` : ''}`,
    });

    return { success: true, referenceNumber: params.referenceNumber, status: params.status };
  } catch (error: any) {
    console.error('Database query failed in updateApplicationStatus:', error);
    throw new Error(error?.message || 'Failed to update application status.', { cause: error });
  }
}

// 15. Admin Stats
export async function getAdminStats() {
  try {
    const totalCount = await db.select({ count: count() }).from(applications);
    const submittedCount = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Submitted'));
    const underReviewCount = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Under Review'));
    const approvedCount = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Approved'));
    const notApprovedCount = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Not Approved'));
    const needsCorrectionCount = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Needs Correction'));
    const draftCount = await db.select({ count: count() }).from(applications).where(eq(applications.status, 'Draft'));
    const totalUsersCount = await db.select({ count: count() }).from(users);

    return {
      totalUsers: totalUsersCount[0]?.count || 0,
      totalApplicants: totalCount[0]?.count || 0,
      pending: (submittedCount[0]?.count || 0) + (underReviewCount[0]?.count || 0),
      submitted: submittedCount[0]?.count || 0,
      underReview: underReviewCount[0]?.count || 0,
      approved: approvedCount[0]?.count || 0,
      notApproved: notApprovedCount[0]?.count || 0,
      needsCorrection: needsCorrectionCount[0]?.count || 0,
      drafts: draftCount[0]?.count || 0,
    };
  } catch (error) {
    console.error('Database query failed in getAdminStats:', error);
    throw new Error('Unable to retrieve admin statistics.', { cause: error });
  }
}

// 16. Admin Export Applications & Users
export async function exportApplicationsData(format = 'csv') {
  try {
    const records = await db.select({
      referenceNumber: applications.referenceNumber,
      status: applications.status,
      submittedAt: applications.submittedAt,
      reviewedBy: applications.reviewedBy,
      reviewedAt: applications.reviewedAt,
      reviewNotes: applications.reviewNotes,
      email: users.email,
      fullName: users.fullName,
      title: applicants.title,
      surname: applicants.surname,
      otherNames: applicants.otherNames,
      phoneNumber: applicants.phoneNumber,
      nationality: applicants.nationality,
      state: applicants.state,
      lga: applicants.lga,
      highestQualification: applicants.highestQualification,
      clergyName: applicants.clergyName,
      childrenCount: applicants.childrenCount,
      childrenInSchool: applicants.childrenInSchool,
      childrenOutOfSchool: applicants.childrenOutOfSchool,
      professionalSkills: applicants.professionalSkills,
      acquiredSkills: applicants.acquiredSkills,
      verificationStatus: users.verificationStatus,
      accountStatus: users.accountStatus,
    })
      .from(applications)
      .innerJoin(users, eq(applications.userId, users.uid))
      .leftJoin(applicants, eq(applications.applicantId, applicants.id))
      .orderBy(desc(applications.createdAt))
      .limit(5000);

    return records;
  } catch (error) {
    console.error('Database query failed in exportApplicationsData:', error);
    throw new Error('Failed to export applications data.', { cause: error });
  }
}

// 17. Audit Logs List
export async function getRecentAuditLogs(limit = 50) {
  try {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  } catch (error) {
    console.error('Database query failed in getRecentAuditLogs:', error);
    throw new Error('Unable to retrieve audit logs.', { cause: error });
  }
}
