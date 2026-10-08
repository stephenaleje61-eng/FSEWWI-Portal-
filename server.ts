import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  registerPermanentUser,
  authenticatePermanentUser,
  getOrCreateUser,
  getUserApplication,
  saveApplicationDraft,
  submitApplication,
  getAdminApplications,
  getApplicationByReference,
  updateApplicationStatus,
  getAdminStats,
  exportApplicationsData,
  getRecentAuditLogs,
  getAdminUsersList,
  updateUserAdminStatus,
  updatePermittedUserInfo,
  createDatabaseBackupSnapshot,
  listDatabaseBackups,
} from './src/db/queries.ts';
import { NIGERIA_STATES_LGAS, NIGERIAN_STATES } from './src/data/nigeriaLocations.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser limits for photos and signatures
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static public folder for logos and assets
app.use('/public', express.static(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'public')));

// Explicit PWA routes with correct Content-Type and Service-Worker-Allowed headers
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.resolve(__dirname, 'public/manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public/sw.js'));
});

// Helper to extract user identity from Authorization header
function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    if (token.startsWith('ey') || token.startsWith('{')) {
      const decoded = token.startsWith('{') ? JSON.parse(token) : JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      return decoded;
    }
    if (token.includes(':')) {
      const [uid, email, role] = token.split(':');
      return { uid, email, role: role || 'applicant' };
    }
  } catch {
    // fallback
  }

  return { uid: token, email: `${token}@user.fsewwi.org`, role: 'applicant' };
}

// ==========================================
// 1. PERMANENT DATABASE AUTH & REGISTRATION
// ==========================================

// Permanent User Registration (persisted directly to Cloud SQL PostgreSQL)
app.post('/api/auth/register-permanent', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      gender,
      dateOfBirth,
      address,
      state,
      lga,
      widowStatus,
      profilePhoto,
      identificationType,
      identificationNumber,
    } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await registerPermanentUser({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber?.trim(),
      gender: gender || 'Female',
      dateOfBirth,
      address: address?.trim(),
      state: state || 'Benue',
      lga: lga || 'Makurdi',
      widowStatus: widowStatus || 'Widow',
      profilePhoto,
      identificationType: identificationType || 'National ID (NIN)',
      identificationNumber: identificationNumber?.trim(),
      role: 'applicant',
    });

    const sessionPayload = {
      uid: user.uid,
      email: user.email,
      name: user.fullName,
      role: user.role,
      isAdmin: false,
    };
    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    return res.status(201).json({
      success: true,
      user,
      token,
      message: 'Account permanently registered in PostgreSQL database.',
    });
  } catch (error: any) {
    console.error('Registration error in /api/auth/register-permanent:', error);
    return res.status(400).json({ error: error.message || 'Registration failed.' });
  }
});

// Permanent User Login
app.post('/api/auth/login-permanent', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await authenticatePermanentUser(email, password);

    const sessionPayload = {
      uid: user.uid,
      email: user.email,
      name: user.fullName,
      role: user.role,
      isAdmin: user.role !== 'applicant',
    };
    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    return res.json({
      success: true,
      user,
      token,
      message: 'Successfully authenticated from permanent database.',
    });
  } catch (error: any) {
    console.error('Login error in /api/auth/login-permanent:', error);
    return res.status(401).json({ error: error.message || 'Authentication failed.' });
  }
});

// Fallback User Sync for Google Sign-in
app.post('/api/auth/sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required for sync.' });
    }

    const user = await getOrCreateUser(uid, email, displayName, role);
    const appData = await getUserApplication(user.uid);

    return res.json({
      success: true,
      user,
      application: appData.application,
      applicant: appData.applicant,
      photo: appData.photo,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/sync:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync user.' });
  }
});

// Admin Login
app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const staffAccounts: Record<string, { role: string; name: string }> = {
      'admin@fsewwi.org': { role: 'super_admin', name: 'Executive Director (HQ)' },
      'reviewer@fsewwi.org': { role: 'reviewer', name: 'Senior Welfare Officer' },
      'data@fsewwi.org': { role: 'data_entry_officer', name: 'Makurdi Desk Officer' },
      'stephenaleje61@gmail.com': { role: 'super_admin', name: 'Stephen Aleje (Administrator)' },
    };

    const staff = staffAccounts[email.toLowerCase().trim()];
    if (!staff && !email.toLowerCase().includes('admin') && !email.toLowerCase().includes('fsewwi')) {
      return res.status(401).json({ error: 'Invalid administrator credentials. Access restricted to authorized FSEWWI personnel.' });
    }

    const assignedRole = staff ? staff.role : (role || 'administrator');
    const assignedName = staff ? staff.name : 'Authorized Staff Member';
    const adminUid = `admin_${Buffer.from(email).toString('hex').slice(0, 16)}`;

    await getOrCreateUser(adminUid, email, assignedName, assignedRole);

    const sessionPayload = {
      uid: adminUid,
      email,
      name: assignedName,
      role: assignedRole,
      isAdmin: true,
    };
    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    return res.json({
      success: true,
      token,
      user: sessionPayload,
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: error.message || 'Admin authentication failed.' });
  }
});

// ==========================================
// 2. APPLICANT DASHBOARD & FORM ENDPOINTS
// ==========================================

app.get('/api/application/my', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }

    const data = await getUserApplication(authUser.uid);
    return res.json({
      success: true,
      user: data.user,
      application: data.application,
      applicant: data.applicant,
      photo: data.photo,
    });
  } catch (error: any) {
    console.error('Error in /api/application/my:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch application data.' });
  }
});

app.post('/api/application/save-draft', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }

    const result = await saveApplicationDraft(
      authUser.uid,
      authUser.email || `${authUser.uid}@user.fsewwi.org`,
      req.body
    );

    return res.json({ ...result, message: 'Draft saved successfully.' });
  } catch (error: any) {
    console.error('Error in /api/application/save-draft:', error);
    return res.status(500).json({ error: error.message || 'Failed to save draft.' });
  }
});

app.post('/api/application/submit', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }

    const {
      title,
      surname,
      otherNames,
      phoneNumber,
      nationality,
      state,
      lga,
      highestQualification,
      clergyName,
      childrenCount,
      childrenInSchool,
      childrenOutOfSchool,
      professionalSkills,
      acquiredSkills,
      declarationAccepted,
      signatureData,
      signatureDate,
      photoUrl,
    } = req.body;

    if (!surname?.trim()) return res.status(400).json({ error: 'Please enter your surname.' });
    if (!otherNames?.trim()) return res.status(400).json({ error: 'Please enter your other names.' });
    if (!phoneNumber?.trim()) return res.status(400).json({ error: 'Please enter a valid phone number.' });
    if (!state?.trim()) return res.status(400).json({ error: 'Please select your state.' });
    if (!lga?.trim()) return res.status(400).json({ error: 'Please select your LGA.' });
    if (!highestQualification?.trim()) return res.status(400).json({ error: 'Please select your highest educational qualification.' });
    if (!photoUrl?.trim()) return res.status(400).json({ error: 'Please capture or upload a passport photograph.' });
    if (!declarationAccepted) return res.status(400).json({ error: 'Please check and accept the applicant declaration.' });
    if (!signatureData?.trim()) return res.status(400).json({ error: 'Please provide your signature before submitting.' });

    const totalKids = Number(childrenCount) || 0;
    const inSchool = Number(childrenInSchool) || 0;
    const outOfSchool = Number(childrenOutOfSchool) || 0;

    if (totalKids < 0 || inSchool < 0 || outOfSchool < 0) {
      return res.status(400).json({ error: 'Children counts cannot be negative.' });
    }
    if (inSchool + outOfSchool > totalKids) {
      return res.status(400).json({
        error: `Children in school (${inSchool}) + out of school (${outOfSchool}) cannot exceed total children (${totalKids}).`
      });
    }

    const result = await submitApplication(
      authUser.uid,
      authUser.email || `${authUser.uid}@user.fsewwi.org`,
      {
        title: title || 'Mrs.',
        surname: surname.trim(),
        otherNames: otherNames.trim(),
        phoneNumber: phoneNumber.trim(),
        nationality: nationality || 'Nigerian',
        state: state.trim(),
        lga: lga.trim(),
        highestQualification: highestQualification.trim(),
        clergyName: clergyName?.trim() || '',
        childrenCount: totalKids,
        childrenInSchool: inSchool,
        childrenOutOfSchool: outOfSchool,
        professionalSkills: typeof professionalSkills === 'string' ? professionalSkills : (professionalSkills?.join(', ') || 'None'),
        acquiredSkills: acquiredSkills?.trim() || '',
        declarationAccepted: Boolean(declarationAccepted),
        signatureData,
        signatureDate: signatureDate || new Date().toISOString().split('T')[0],
        photoUrl,
      }
    );

    return res.json({
      success: true,
      referenceNumber: result.referenceNumber,
      status: result.status,
      submittedAt: result.submittedAt,
      message: 'Application successfully submitted and permanently saved.',
    });
  } catch (error: any) {
    console.error('Error in /api/application/submit:', error);
    return res.status(500).json({ error: error.message || 'Submission failed.' });
  }
});

// ==========================================
// 3. ADMIN DATABASE MANAGEMENT & BACKUPS
// ==========================================

// Get Registered Users Registry
app.get('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const { page, limit, verificationStatus, accountStatus, state, search } = req.query;
    const result = await getAdminUsersList({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
      verificationStatus: verificationStatus ? String(verificationStatus) : undefined,
      accountStatus: accountStatus ? String(accountStatus) : undefined,
      state: state ? String(state) : undefined,
      search: search ? String(search) : undefined,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in /api/admin/users:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch users registry.' });
  }
});

// Update User Verification & Account Status
app.post('/api/admin/users/:userId/status', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const userId = req.params.userId;
    const { verificationStatus, accountStatus, notes } = req.body;

    const result = await updateUserAdminStatus({
      userId,
      verificationStatus,
      accountStatus,
      adminEmail: authUser?.email || 'admin@fsewwi.org',
      notes,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    });

    return res.json({ ...result, message: 'User status successfully updated.' });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user status.' });
  }
});

// Edit Permitted User Information
app.post('/api/admin/users/:userId/edit', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const userId = req.params.userId;

    const result = await updatePermittedUserInfo({
      userId,
      adminEmail: authUser?.email || 'admin@fsewwi.org',
      ...req.body,
    });

    return res.json({ ...result, message: 'User information updated in database.' });
  } catch (error: any) {
    console.error('Error editing user info:', error);
    return res.status(500).json({ error: error.message || 'Failed to edit user.' });
  }
});

// Create Automated or Manual Database Backup Snapshot
app.post('/api/admin/backup/create', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const result = await createDatabaseBackupSnapshot(authUser?.email || 'system', 'manual');
    return res.json({ ...result, message: 'Database backup snapshot successfully created.' });
  } catch (error: any) {
    console.error('Backup creation error:', error);
    return res.status(500).json({ error: error.message || 'Backup failed.' });
  }
});

// List Database Backups
app.get('/api/admin/backups', async (req: Request, res: Response) => {
  try {
    const backupList = await listDatabaseBackups(20);
    return res.json({ success: true, backups: backupList });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve backups.' });
  }
});

// Admin Stats
app.get('/api/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    return res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error in /api/admin/stats:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch statistics.' });
  }
});

// Admin Applications List
app.get('/api/admin/applications', async (req: Request, res: Response) => {
  try {
    const { page, limit, status, state, lga, search } = req.query;
    const result = await getAdminApplications({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
      status: status ? String(status) : undefined,
      state: state ? String(state) : undefined,
      lga: lga ? String(lga) : undefined,
      search: search ? String(search) : undefined,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in /api/admin/applications:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch applications.' });
  }
});

// Admin Single Application Detail
app.get('/api/admin/application/:ref', async (req: Request, res: Response) => {
  try {
    const ref = req.params.ref;
    const data = await getApplicationByReference(ref);
    if (!data) {
      return res.status(404).json({ error: `Application ${ref} not found.` });
    }
    return res.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Error in /api/admin/application/:ref:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch application details.' });
  }
});

// Admin Application Status Update
app.post('/api/admin/application/:ref/status', async (req: Request, res: Response) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const ref = req.params.ref;
    const { status, reviewNotes } = req.body;

    if (!['Approved', 'Not Approved', 'Needs Correction', 'Under Review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value provided.' });
    }

    const adminEmail = authUser?.email || 'officer@fsewwi.org';
    const result = await updateApplicationStatus({
      referenceNumber: ref,
      status,
      reviewNotes: reviewNotes || '',
      adminEmail,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    });

    return res.json({ ...result, message: `Application ${ref} status updated to ${status}.` });
  } catch (error: any) {
    console.error('Error in /api/admin/application/:ref/status:', error);
    return res.status(500).json({ error: error.message || 'Failed to update status.' });
  }
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await getRecentAuditLogs(50);
    return res.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error in /api/admin/audit-logs:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch audit logs.' });
  }
});

// Admin Export CSV
app.get('/api/admin/export', async (req: Request, res: Response) => {
  try {
    const records = await exportApplicationsData('csv');

    const headers = [
      'Reference Number', 'Status', 'Submitted At', 'Reviewed By', 'Reviewed At', 'Review Notes',
      'Email', 'Full Name', 'Title', 'Surname', 'Other Names', 'Phone Number', 'Nationality',
      'State', 'LGA', 'Highest Qualification', 'Clergy', 'Children Count', 'In School',
      'Out Of School', 'Professional Skills', 'Acquired Skills', 'Verification Status', 'Account Status'
    ];

    const escapeCsv = (str: any) => `"${String(str ?? '').replace(/"/g, '""')}"`;

    const csvRows = [headers.join(',')];
    for (const r of records) {
      csvRows.push([
        escapeCsv(r.referenceNumber),
        escapeCsv(r.status),
        escapeCsv(r.submittedAt ? new Date(r.submittedAt).toISOString() : ''),
        escapeCsv(r.reviewedBy),
        escapeCsv(r.reviewedAt ? new Date(r.reviewedAt).toISOString() : ''),
        escapeCsv(r.reviewNotes),
        escapeCsv(r.email),
        escapeCsv(r.fullName),
        escapeCsv(r.title),
        escapeCsv(r.surname),
        escapeCsv(r.otherNames),
        escapeCsv(r.phoneNumber),
        escapeCsv(r.nationality),
        escapeCsv(r.state),
        escapeCsv(r.lga),
        escapeCsv(r.highestQualification),
        escapeCsv(r.clergyName),
        r.childrenCount ?? 0,
        r.childrenInSchool ?? 0,
        r.childrenOutOfSchool ?? 0,
        escapeCsv(r.professionalSkills),
        escapeCsv(r.acquiredSkills),
        escapeCsv(r.verificationStatus),
        escapeCsv(r.accountStatus),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fsewwi-database-export-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csvRows.join('\n'));
  } catch (error: any) {
    console.error('Export error:', error);
    return res.status(500).json({ error: error.message || 'CSV export failed.' });
  }
});

// Reference data
app.get('/api/states-lgas', (req: Request, res: Response) => {
  return res.json({
    states: NIGERIAN_STATES,
    data: NIGERIA_STATES_LGAS,
  });
});

// ==========================================
// 4. VITE DEV / PRODUCTION INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FSEWWI Server running on port ${PORT}`);
  });
}

startServer();
