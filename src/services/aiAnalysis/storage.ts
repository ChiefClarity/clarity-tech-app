import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  AIAnalysisData,
  SatelliteAnalysis,
  SurfaceAnalysis,
  EnvironmentAnalysis,
  VoiceNoteAnalysis,
  AIAnalysisType,
  AIAnalysisStatus,
} from './types';

// Collection names
const ANALYSES_COLLECTION = 'aiAnalyses';
const SATELLITE_ANALYSES_COLLECTION = 'satelliteAnalyses';
const SURFACE_ANALYSES_COLLECTION = 'surfaceAnalyses';
const ENVIRONMENT_ANALYSES_COLLECTION = 'environmentAnalyses';
const VOICE_NOTE_ANALYSES_COLLECTION = 'voiceNoteAnalyses';

/**
 * Converts Firestore document data to AIAnalysisData
 */
function documentToAnalysis(doc: QueryDocumentSnapshot<DocumentData>): AIAnalysisData {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    farmId: data.farmId,
    userId: data.userId,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    metadata: data.metadata || {},
    results: data.results || {},
    error: data.error,
  };
}

/**
 * Converts analysis data to Firestore document format
 */
function analysisToDocument(analysis: Omit<AIAnalysisData, 'id'>): DocumentData {
  return {
    ...analysis,
    createdAt: Timestamp.fromDate(analysis.createdAt),
    updatedAt: Timestamp.fromDate(analysis.updatedAt),
  };
}

/**
 * Stores a generic AI analysis record
 */
export async function storeAIAnalysis(
  analysis: Omit<AIAnalysisData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const analysisId = doc(collection(db, ANALYSES_COLLECTION)).id;
  const now = new Date();
  
  const analysisData: Omit<AIAnalysisData, 'id'> = {
    ...analysis,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(db, ANALYSES_COLLECTION, analysisId),
    analysisToDocument(analysisData)
  );

  return analysisId;
}

/**
 * Updates an existing AI analysis record
 */
export async function updateAIAnalysis(
  analysisId: string,
  updates: Partial<AIAnalysisData>
): Promise<void> {
  const { id, createdAt, ...updateData } = updates;
  
  await setDoc(
    doc(db, ANALYSES_COLLECTION, analysisId),
    {
      ...updateData,
      updatedAt: Timestamp.fromDate(new Date()),
    },
    { merge: true }
  );
}

/**
 * Retrieves an AI analysis by ID
 */
export async function getAIAnalysis(analysisId: string): Promise<AIAnalysisData | null> {
  const docSnap = await getDoc(doc(db, ANALYSES_COLLECTION, analysisId));
  
  if (!docSnap.exists()) {
    return null;
  }

  return documentToAnalysis(docSnap as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Stores a satellite analysis
 */
export async function storeSatelliteAnalysis(
  analysis: Omit<SatelliteAnalysis, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const analysisId = doc(collection(db, SATELLITE_ANALYSES_COLLECTION)).id;
  const now = new Date();
  
  const analysisData: Omit<SatelliteAnalysis, 'id'> = {
    ...analysis,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(db, SATELLITE_ANALYSES_COLLECTION, analysisId),
    {
      ...analysisData,
      createdAt: Timestamp.fromDate(analysisData.createdAt),
      updatedAt: Timestamp.fromDate(analysisData.updatedAt),
      analyzedAt: analysisData.analyzedAt ? Timestamp.fromDate(analysisData.analyzedAt) : null,
    }
  );

  // Also store in the generic analyses collection
  await storeAIAnalysis({
    type: AIAnalysisType.SATELLITE,
    farmId: analysis.farmId,
    userId: analysis.userId,
    status: analysis.status,
    metadata: {
      satelliteAnalysisId: analysisId,
      imageId: analysis.imageId,
      analysisType: analysis.analysisType,
    },
    results: analysis.results || {},
    error: analysis.error,
  });

  return analysisId;
}

/**
 * Stores a surface analysis
 */
export async function storeSurfaceAnalysis(
  analysis: Omit<SurfaceAnalysis, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const analysisId = doc(collection(db, SURFACE_ANALYSES_COLLECTION)).id;
  const now = new Date();
  
  const analysisData: Omit<SurfaceAnalysis, 'id'> = {
    ...analysis,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(db, SURFACE_ANALYSES_COLLECTION, analysisId),
    {
      ...analysisData,
      createdAt: Timestamp.fromDate(analysisData.createdAt),
      updatedAt: Timestamp.fromDate(analysisData.updatedAt),
      analyzedAt: analysisData.analyzedAt ? Timestamp.fromDate(analysisData.analyzedAt) : null,
    }
  );

  // Also store in the generic analyses collection
  await storeAIAnalysis({
    type: AIAnalysisType.SURFACE,
    farmId: analysis.farmId,
    userId: analysis.userId,
    status: analysis.status,
    metadata: {
      surfaceAnalysisId: analysisId,
      imageIds: analysis.imageIds,
      location: analysis.location,
    },
    results: analysis.results || {},
    error: analysis.error,
  });

  return analysisId;
}

/**
 * Stores an environment analysis
 */
export async function storeEnvironmentAnalysis(
  analysis: Omit<EnvironmentAnalysis, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const analysisId = doc(collection(db, ENVIRONMENT_ANALYSES_COLLECTION)).id;
  const now = new Date();
  
  const analysisData: Omit<EnvironmentAnalysis, 'id'> = {
    ...analysis,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(db, ENVIRONMENT_ANALYSES_COLLECTION, analysisId),
    {
      ...analysisData,
      createdAt: Timestamp.fromDate(analysisData.createdAt),
      updatedAt: Timestamp.fromDate(analysisData.updatedAt),
      analyzedAt: analysisData.analyzedAt ? Timestamp.fromDate(analysisData.analyzedAt) : null,
    }
  );

  // Also store in the generic analyses collection
  await storeAIAnalysis({
    type: AIAnalysisType.ENVIRONMENT,
    farmId: analysis.farmId,
    userId: analysis.userId,
    status: analysis.status,
    metadata: {
      environmentAnalysisId: analysisId,
      dataPoints: analysis.dataPoints,
      timeRange: analysis.timeRange,
    },
    results: analysis.results || {},
    error: analysis.error,
  });

  return analysisId;
}

/**
 * Stores a voice note analysis
 */
export async function storeVoiceNoteAnalysis(
  analysis: Omit<VoiceNoteAnalysis, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const analysisId = doc(collection(db, VOICE_NOTE_ANALYSES_COLLECTION)).id;
  const now = new Date();
  
  const analysisData: Omit<VoiceNoteAnalysis, 'id'> = {
    ...analysis,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(db, VOICE_NOTE_ANALYSES_COLLECTION, analysisId),
    {
      ...analysisData,
      createdAt: Timestamp.fromDate(analysisData.createdAt),
      updatedAt: Timestamp.fromDate(analysisData.updatedAt),
      analyzedAt: analysisData.analyzedAt ? Timestamp.fromDate(analysisData.analyzedAt) : null,
    }
  );

  // Also store in the generic analyses collection
  await storeAIAnalysis({
    type: AIAnalysisType.VOICE_NOTE,
    farmId: analysis.farmId,
    userId: analysis.userId,
    status: analysis.status,
    metadata: {
      voiceNoteAnalysisId: analysisId,
      voiceNoteId: analysis.voiceNoteId,
      duration: analysis.duration,
    },
    results: {
      transcription: analysis.transcription,
      summary: analysis.summary,
      actionItems: analysis.actionItems,
      entities: analysis.entities,
    },
    error: analysis.error,
  });

  return analysisId;
}

/**
 * Gets analyses by farm ID
 */
export async function getAnalysesByFarmId(
  farmId: string,
  analysisType?: AIAnalysisType,
  limitCount: number = 10
): Promise<AIAnalysisData[]> {
  let q = query(
    collection(db, ANALYSES_COLLECTION),
    where('farmId', '==', farmId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (analysisType) {
    q = query(
      collection(db, ANALYSES_COLLECTION),
      where('farmId', '==', farmId),
      where('type', '==', analysisType),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => documentToAnalysis(doc));
}

/**
 * Gets analyses by user ID
 */
export async function getAnalysesByUserId(
  userId: string,
  analysisType?: AIAnalysisType,
  limitCount: number = 10
): Promise<AIAnalysisData[]> {
  let q = query(
    collection(db, ANALYSES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (analysisType) {
    q = query(
      collection(db, ANALYSES_COLLECTION),
      where('userId', '==', userId),
      where('type', '==', analysisType),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => documentToAnalysis(doc));
}

/**
 * Gets analyses by status
 */
export async function getAnalysesByStatus(
  status: AIAnalysisStatus,
  limitCount: number = 10
): Promise<AIAnalysisData[]> {
  const q = query(
    collection(db, ANALYSES_COLLECTION),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => documentToAnalysis(doc));
}

/**
 * Gets satellite analysis by ID
 */
export async function getSatelliteAnalysis(analysisId: string): Promise<SatelliteAnalysis | null> {
  const docSnap = await getDoc(doc(db, SATELLITE_ANALYSES_COLLECTION, analysisId));
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    analyzedAt: data.analyzedAt?.toDate() || null,
  } as SatelliteAnalysis;
}

/**
 * Gets surface analysis by ID
 */
export async function getSurfaceAnalysis(analysisId: string): Promise<SurfaceAnalysis | null> {
  const docSnap = await getDoc(doc(db, SURFACE_ANALYSES_COLLECTION, analysisId));
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    analyzedAt: data.analyzedAt?.toDate() || null,
  } as SurfaceAnalysis;
}

/**
 * Gets environment analysis by ID
 */
export async function getEnvironmentAnalysis(analysisId: string): Promise<EnvironmentAnalysis | null> {
  const docSnap = await getDoc(doc(db, ENVIRONMENT_ANALYSES_COLLECTION, analysisId));
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    analyzedAt: data.analyzedAt?.toDate() || null,
  } as EnvironmentAnalysis;
}

/**
 * Gets voice note analysis by ID
 */
export async function getVoiceNoteAnalysis(analysisId: string): Promise<VoiceNoteAnalysis | null> {
  const docSnap = await getDoc(doc(db, VOICE_NOTE_ANALYSES_COLLECTION, analysisId));
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    analyzedAt: data.analyzedAt?.toDate() || null,
  } as VoiceNoteAnalysis;
}

/**
 * Gets the latest analysis for a specific type and farm
 */
export async function getLatestAnalysis(
  farmId: string,
  analysisType: AIAnalysisType
): Promise<AIAnalysisData | null> {
  const q = query(
    collection(db, ANALYSES_COLLECTION),
    where('farmId', '==', farmId),
    where('type', '==', analysisType),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }

  return documentToAnalysis(querySnapshot.docs[0]);
}

/**
 * Deletes an AI analysis and its associated specific analysis record
 */
export async function deleteAIAnalysis(analysisId: string): Promise<void> {
  // Get the analysis to determine its type
  const analysis = await getAIAnalysis(analysisId);
  
  if (!analysis) {
    throw new Error('Analysis not found');
  }

  // Delete from the generic collection
  await setDoc(
    doc(db, ANALYSES_COLLECTION, analysisId),
    { deletedAt: Timestamp.fromDate(new Date()) },
    { merge: true }
  );

  // Delete from the specific collection based on type
  if (analysis.metadata) {
    switch (analysis.type) {
      case AIAnalysisType.SATELLITE:
        if (analysis.metadata.satelliteAnalysisId) {
          await setDoc(
            doc(db, SATELLITE_ANALYSES_COLLECTION, analysis.metadata.satelliteAnalysisId as string),
            { deletedAt: Timestamp.fromDate(new Date()) },
            { merge: true }
          );
        }
        break;
      case AIAnalysisType.SURFACE:
        if (analysis.metadata.surfaceAnalysisId) {
          await setDoc(
            doc(db, SURFACE_ANALYSES_COLLECTION, analysis.metadata.surfaceAnalysisId as string),
            { deletedAt: Timestamp.fromDate(new Date()) },
            { merge: true }
          );
        }
        break;
      case AIAnalysisType.ENVIRONMENT:
        if (analysis.metadata.environmentAnalysisId) {
          await setDoc(
            doc(db, ENVIRONMENT_ANALYSES_COLLECTION, analysis.metadata.environmentAnalysisId as string),
            { deletedAt: Timestamp.fromDate(new Date()) },
            { merge: true }
          );
        }
        break;
      case AIAnalysisType.VOICE_NOTE:
        if (analysis.metadata.voiceNoteAnalysisId) {
          await setDoc(
            doc(db, VOICE_NOTE_ANALYSES_COLLECTION, analysis.metadata.voiceNoteAnalysisId as string),
            { deletedAt: Timestamp.fromDate(new Date()) },
            { merge: true }
          );
        }
        break;
    }
  }
}