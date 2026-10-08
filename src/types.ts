export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Not Approved'
  | 'Needs Correction';

export type UserRole =
  | 'applicant'
  | 'super_admin'
  | 'administrator'
  | 'reviewer'
  | 'data_entry_officer';

export type VerificationStatus =
  | 'Pending'
  | 'Verified'
  | 'Rejected'
  | 'Under Review';

export type AccountStatus =
  | 'Active'
  | 'Suspended'
  | 'Deactivated';

export interface UserSession {
  uid: string;
  email: string;
  name?: string;
  fullName?: string;
  role: UserRole;
  isAdmin?: boolean;
  phoneNumber?: string;
  gender?: string;
  state?: string;
  lga?: string;
  widowStatus?: string;
  verificationStatus?: VerificationStatus;
  accountStatus?: AccountStatus;
  profilePhoto?: string;
  createdAt?: string;
}

export interface UserRecord {
  id: number;
  uid: string;
  email: string;
  fullName?: string;
  displayName?: string;
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
  role: UserRole;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ApplicationFormData {
  // 1. Title
  title: string;
  // 2. Full Name
  surname: string;
  otherNames: string;
  // 3. Phone Number
  phoneNumber: string;
  // 4. Nationality / State / LGA
  nationality: string;
  state: string;
  lga: string;
  // 5. Highest Educational Qualification
  highestQualification: string;
  // 6. Name of Priest/Pastor/Imam
  clergyName?: string;
  // 7. Number of children left behind by late spouse
  childrenCount: number;
  // 8. Children schooling status
  childrenInSchool: number;
  childrenOutOfSchool: number;
  // 9. Skills
  professionalSkills: string[];
  customProfessionalSkill?: string;
  acquiredSkills?: string;
  // Declaration & Signature
  declarationAccepted: boolean;
  signatureData: string;
  signatureDate: string;
  // Photo
  photoUrl: string;
  photoVerified: boolean;
}

export interface ApplicationRecord {
  id: number;
  referenceNumber: string;
  userId: string;
  applicantId?: number;
  status: ApplicationStatus;
  declarationAccepted: boolean;
  signatureData?: string;
  signatureDate?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicantProfileRecord {
  id: number;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PhotoRecord {
  id: number;
  userId: string;
  photoStorageUrl: string;
  isVerified: boolean;
  verifiedAt: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers?: number;
  totalApplicants: number;
  pending: number;
  submitted: number;
  underReview: number;
  approved: number;
  notApproved: number;
  needsCorrection: number;
  drafts: number;
}

export interface BackupRecord {
  id: number;
  backupReference: string;
  backupType: string;
  recordCount: number;
  checksum?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}
