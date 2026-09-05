import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb, generateUid, nowDate } from "../lib/mock-db.js";
import { requireAuth } from "../middleware/auth.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const db = getDb();

    const existing = db.users.find((u) => u.email === input.email);
    if (existing) {
      res.status(409).json({ message: "Email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const now = nowDate();
    const user = {
      id: generateUid("user"),
      name: input.name,
      email: input.email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(user);

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    db.refreshTokens.push({
      id: generateUid("rt"),
      token: refreshToken,
      userId: user.id,
      createdAt: now,
    });

    res.status(201).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const db = getDb();

    const user = db.users.find((u) => u.email === input.email);
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    db.refreshTokens.push({
      id: generateUid("rt"),
      token: refreshToken,
      userId: user.id,
      createdAt: nowDate(),
    });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const db = getDb();

    const tokenInDb = db.refreshTokens.find((rt) => rt.token === refreshToken);
    if (!tokenInDb) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });

    res.json({ data: { accessToken } });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    db.refreshTokens = db.refreshTokens.filter((rt) => rt.userId !== req.auth!.userId);
    res.json({ data: true });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.auth!.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };