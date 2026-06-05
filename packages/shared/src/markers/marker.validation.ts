import { z } from "zod";
import { MARKER_CATEGORIES } from "./markerCategory.constants";

export const CreateMarkerSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).nullable().optional(),
  category: z.enum(MARKER_CATEGORIES),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(2).max(200).nullable().optional(),
  submittedByLocalUserId: z.string().nullable().optional(),
});

export const CreateReportSchema = z.object({
  reportedStatus: z.enum(["OPEN", "CLOSED", "UNKNOWN"]),
  hasElectricity: z.boolean().nullable().optional(),
  hasWater: z.boolean().nullable().optional(),
  hasInternet: z.boolean().nullable().optional(),
  crowdLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  issueType: z.enum([
    "CLOSED",
    "NO_ELECTRICITY",
    "NO_WATER",
    "NO_INTERNET",
    "TOO_CROWDED",
    "WRONG_LOCATION",
    "OUTDATED_INFO",
    "OTHER",
  ]),
  comment: z.string().max(500).nullable().optional(),
  localUserId: z.string().min(1),
});
