import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { nanoid } from "nanoid";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Helper to get Firestore (Lazy initialization)
let db: admin.firestore.Firestore | null = null;

function getDb() {
  if (db) return db;

  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '').trim()
      : undefined,
  };

  if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            clientEmail: firebaseConfig.clientEmail,
            privateKey: firebaseConfig.privateKey,
          }),
        });
      }
      db = admin.firestore();
      return db;
    } catch (error: any) {
      console.error("Firebase init error:", error.message);
      throw error;
    }
  }
  throw new Error("Firebase credentials missing or incomplete.");
}

const DRAWS_COLLECTION = "draws";

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan("dev"));
app.use(express.json());

// In-memory store fallback or cache removed in favor of direct DB access for production consistency
interface Participant {
  id: string;
  name: string;
}

interface Draw {
  id: string;
  participants: Participant[];
  matches: Record<string, string>;
  revealed: string[]; // Store as array for Firestore
}

// Algorithm: Derangement
function getDerangement(participants: Participant[]): Record<string, string> {
  const ids = participants.map(p => p.id);
  let shuffledIds: string[] = [];
  
  let attempts = 0;
  while (attempts < 100) {
    shuffledIds = [...ids].sort(() => Math.random() - 0.5);
    let ok = true;
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === shuffledIds[i]) {
        ok = false;
        break;
      }
    }
    if (ok) break;
    attempts++;
  }

  const matches: Record<string, string> = {};
  participants.forEach((p, i) => {
    const matchedParticipant = participants.find(mp => mp.id === shuffledIds[i]);
    matches[p.id] = matchedParticipant!.name;
  });
  return matches;
}

// API Routes
app.post("/api/draw", async (req, res) => {
  try {
    const firestore = getDb();
    const { names } = req.body;
    if (!names || !Array.isArray(names) || names.length < 3) {
      return res.status(400).json({ error: "At least 3 participants are required." });
    }

    const drawId = nanoid(10);
    const participants = names.map(name => ({ id: nanoid(6), name }));
    const matches = getDerangement(participants);

    const drawData: Draw = {
      id: drawId,
      participants,
      matches,
      revealed: [],
    };

    await firestore.collection(DRAWS_COLLECTION).doc(drawId).set(drawData);

    res.json({ drawId, participants });
  } catch (error: any) {
    console.error("Error creating draw:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.get("/api/draw/:id", async (req, res) => {
  try {
    const firestore = getDb();
    const doc = await firestore.collection(DRAWS_COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Draw not found" });
    
    const draw = doc.data() as Draw;
    res.json({
      id: draw.id,
      participants: draw.participants
    });
  } catch (error: any) {
    console.error("Error fetching draw:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.get("/api/reveal/:drawId/:participantId", async (req, res) => {
  try {
    const firestore = getDb();
    const docRef = firestore.collection(DRAWS_COLLECTION).doc(req.params.drawId);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ error: "Draw not found" });

    const draw = doc.data() as Draw;
    const participant = draw.participants.find(p => p.id === req.params.participantId);
    if (!participant) return res.status(404).json({ error: "Participant not found" });

    const matchedName = draw.matches[participant.id];
    const alreadyRevealed = draw.revealed.includes(participant.id);

    if (!alreadyRevealed) {
      await docRef.update({
        revealed: admin.firestore.FieldValue.arrayUnion(participant.id)
      });
    }

    res.json({
      yourName: participant.name,
      secretSanta: matchedName,
      alreadyRevealed
    });
  } catch (error: any) {
    console.error("Error revealing participant:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.get("/api/health", (req, res) => {
  try {
    const firebaseReady = !!admin.apps.length;
    res.json({
      status: "ok",
      firebaseInitialized: firebaseReady,
      env: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      }
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to load health check" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with Firestore`);
  });
}

startServer();
