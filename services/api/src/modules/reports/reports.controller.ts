import { Router } from "express";
import { CreateReportSchema } from "shared";
import { reportsService } from "./reports.service";

export const reportsRouter = Router();

reportsRouter.post("/:markerId/reports", async (req, res) => {
  const { markerId } = req.params;
  const validation = CreateReportSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid payload.", details: validation.error.format() });
  }

  try {
    const { report, flagged } = await reportsService.submitReport(markerId, validation.data);
    return res.status(201).json({
      message: "Děkujeme. Hlášení bylo odesláno.",
      messageEn: "Thank you. Your report has been submitted.",
      report,
      flagged,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
