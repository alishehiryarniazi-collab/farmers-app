import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { upload } from "../upload";
import { diagnoseCropImage } from "../services/scanner";
import { notify } from "../services/notifications";

export const scannerRouter = Router();

scannerRouter.post("/scan", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "An image file is required");
  const cropType = typeof req.body.cropType === "string" ? req.body.cropType : undefined;

  const diagnosis = await diagnoseCropImage(req.file.path, req.file.mimetype, cropType);

  const scan = await prisma.scanResult.create({
    data: {
      userId: req.auth!.userId,
      imageUrl: `/uploads/${req.file.filename}`,
      cropType,
      isHealthy: diagnosis.isHealthy,
      diagnosis: diagnosis.diagnosis,
      confidence: diagnosis.confidence,
      severity: diagnosis.severity,
      symptoms: diagnosis.symptoms,
      treatment: diagnosis.treatment,
      notes: diagnosis.notes,
    },
  });

  await notify(
    req.auth!.userId,
    "SCAN_COMPLETE",
    diagnosis.isHealthy ? "Scan complete: crop looks healthy" : `Scan complete: ${diagnosis.diagnosis}`,
    diagnosis.isHealthy ? "No issues detected." : diagnosis.symptoms,
    "/scanner"
  );

  res.status(201).json(scan);
});

scannerRouter.get("/history", requireAuth, async (req, res) => {
  const scans = await prisma.scanResult.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(scans);
});
