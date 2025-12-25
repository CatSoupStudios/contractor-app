import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

function isPublic(vis: any): boolean {
  return (vis ?? 'public') === 'public';
}

async function incPublicCount(userId: string, delta: number) {
  const profileRef = db.doc(`profiles/${userId}`);
  await profileRef.set(
    { publicProjectsCount: admin.firestore.FieldValue.increment(delta) },
    { merge: true }
  );
}

// Genera un tag de 4 dígitos (0000 - 9999)
function generateUserTag(): string {
  const num = Math.floor(Math.random() * 10000);
  return num.toString().padStart(4, '0');
}

// Trigger: Cuando se crea un perfil (SignUp)
export const onProfileCreated = onDocumentCreated('profiles/{userId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  // Si ya tiene tag (raro, pero defensive coding), no hacemos nada
  if (data.userTag) return;

  const newTag = generateUserTag();

  // Actualizamos el mismo documento con el nuevo tag
  await snapshot.ref.update({ userTag: newTag });
});

export const onProjectCreated = onDocumentCreated('projects/{projectId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const userId = data.userId as string | undefined;
  if (!userId) return;

  if (isPublic(data.visibility)) {
    await incPublicCount(userId, 1);
  }
});

export const onProjectDeleted = onDocumentDeleted('projects/{projectId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const userId = data.userId as string | undefined;
  if (!userId) return;

  if (isPublic(data.visibility)) {
    await incPublicCount(userId, -1);
  }
});

export const onProjectUpdated = onDocumentUpdated('projects/{projectId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const beforeUserId = before.userId as string | undefined;
  const afterUserId = after.userId as string | undefined;
  if (!beforeUserId || !afterUserId) return;

  const beforePublic = isPublic(before.visibility);
  const afterPublic = isPublic(after.visibility);

  // A) mismo dueño: cambió visibilidad
  if (beforeUserId === afterUserId && beforePublic !== afterPublic) {
    await incPublicCount(afterUserId, afterPublic ? 1 : -1);
    return;
  }

  // B) cambió dueño (por si algún día pasa)
  if (beforeUserId !== afterUserId) {
    if (beforePublic) await incPublicCount(beforeUserId, -1);
    if (afterPublic) await incPublicCount(afterUserId, 1);
  }
});
// HTTPS Function: Get public project data safely
import { onRequest } from 'firebase-functions/v2/https';

export const getPublicProjectData = onRequest({ cors: true }, async (req, res) => {
  const projectId = req.query.projectId as string;
  const token = req.query.t as string;

  if (!projectId || !token) {
    res.status(400).send({ error: 'Missing projectId or token' });
    return;
  }

  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();

    if (!projectDoc.exists) {
      res.status(404).send({ error: 'Project not found' });
      return;
    }

    const data = projectDoc.data();

    // SECURITY CHECK: Verify token and status
    if (!data || data.shareToken !== token || data.status === 'archived') {
      res.status(403).send({ error: 'Access denied or project closed' });
      return;
    }

    // Get latest approved estimate to provide a contract link
    const estimatesSnap = await db
      .collection('estimates')
      .where('projectId', '==', projectId)
      .where('status', '==', 'approved')
      .get();

    // Sort in-memory to find latest (to avoid manual composite index requirement)
    let approvedEstimateId = null;
    if (!estimatesSnap.empty) {
      const docs = estimatesSnap.docs;
      docs.sort((a, b) => {
        const dataA = a.data();
        const dataB = b.data();
        const timeA = dataA.createdAt?._seconds || (dataA.createdAt instanceof Date ? dataA.createdAt.getTime() / 1000 : 0);
        const timeB = dataB.createdAt?._seconds || (dataB.createdAt instanceof Date ? dataB.createdAt.getTime() / 1000 : 0);
        return timeB - timeA;
      });
      approvedEstimateId = docs[0].id;
    }

    // FILTER DATA: Only return public-safe fields
    // Exclude: costs, userId, private client info (keeps only name/desc/images/status)
    const publicData = {
      id: projectId,
      name: data.name || 'Project Progress',
      description: data.description || '',
      images: data.images || [], // Progress photos
      publicImages: data.publicImages || [], // Shared on profile
      status: data.status || 'In Progress',
      estimatedCompletion: data.estimatedCompletion || null,
      updatedAt: data.updatedAt || data.createdAt || null,
      jobItems: data.jobItems || [],
      approvedEstimateId,
      // Metadata for the UI
      companyName: data.companyName || 'Projectley',
    };

    res.status(200).send(publicData);
  } catch (error) {
    console.error('Error fetching public project:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

export const getPublicEstimateData = onRequest({ cors: true }, async (req, res) => {
  const projectId = req.query.projectId as string;
  const estimateId = req.query.estimateId as string;
  const token = req.query.t as string;

  if (!projectId || !estimateId || !token) {
    res.status(400).send({ error: 'Missing parameters' });
    return;
  }

  try {
    const estimateDoc = await db.collection('estimates').doc(estimateId).get();
    if (!estimateDoc.exists) {
      res.status(404).send({ error: 'Estimate not found' });
      return;
    }

    const data = estimateDoc.data();
    if (!data || data.projectId !== projectId) {
      res.status(403).send({ error: 'Invalid access' });
      return;
    }

    // Also fetch project for jobItems and extra security check
    const projectDoc = await db.collection('projects').doc(projectId).get();
    const projectData = projectDoc.exists ? projectDoc.data() : {};

    // SECURITY CHECK: Verify token (matches either estimate or project token)
    const isAuthorized = (data.shareToken === token) || (projectData?.shareToken === token);
    const isArchived = projectData?.status === 'archived';

    if (!isAuthorized || isArchived) {
      res.status(403).send({ error: isArchived ? 'Project has been closed' : 'Unauthorized secure access' });
      return;
    }

    // Also fetch company profile for branding
    const profileDoc = await db.collection('profiles').doc(data.userId).get();
    const profile = profileDoc.exists ? profileDoc.data() : {};

    const publicData = {
      estimateNumber: data.estimateNumber,
      status: data.status,
      items: data.items || [],
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      discount: data.discount,
      total: data.total,
      notes: data.notes,
      clientName: data.clientName,
      address: data.address,
      createdAt: data.createdAt,
      signatureUrl: data.signatureUrl || null,
      signedAt: data.signedAt || null,
      jobItems: projectData?.jobItems || [],
      projectToken: projectData?.shareToken || null,
      company: {
        name: profile?.companyName || 'Projectley',
        phone: profile?.companyPhone || '',
        email: profile?.companyEmail || '',
        address: profile?.companyAddress || '',
        logo: profile?.companyLogo || '',
      }
    };

    res.status(200).send(publicData);
  } catch (err) {
    res.status(500).send({ error: 'Server error' });
  }
});

export const approvePublicEstimate = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const { projectId, estimateId, t: token, signature } = req.body;

  if (!projectId || !estimateId || !token || !signature) {
    res.status(400).send({ error: 'Missing parameters' });
    return;
  }

  try {
    const estimateRef = db.collection('estimates').doc(estimateId);
    const estimateDoc = await estimateRef.get();

    if (!estimateDoc.exists) {
      res.status(404).send({ error: 'Estimate not found' });
      return;
    }

    const data = estimateDoc.data();
    if (!data || data.shareToken !== token || data.projectId !== projectId) {
      res.status(403).send({ error: 'Invalid token' });
      return;
    }

    // Security: Only allow signing if state is 'waiting'
    if (data.status !== 'waiting') {
      res.status(400).send({ error: 'Estimate is not in a signable state' });
      return;
    }

    // In a real production app, we would upload to Cloudinary here via the backend.
    // However, to keep it simple and avoid needing new NPM packages in the functions folder right now (like cloudinary or busboy),
    // we will store the signature and update the status.
    // Actually, I can use the same fetch-based upload to Cloudinary if I had the keys.
    // For now, let's assume the client signature is passed as a Cloudinary URL or we handle the base64 update.
    // BEST APPROACH for this request: The function will update Firestore, and let the mobile app handle PDF generation if needed.

    await estimateRef.update({
      status: 'approved',
      signatureUrl: signature, // Client will upload to Cloudinary and pass URL OR pass base64
      signedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: true });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).send({ error: 'Internal error' });
  }
});
