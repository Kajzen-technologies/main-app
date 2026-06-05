import { markersRepository } from "../markers/markers.repository";
import { needsReviewService } from "./needs-review.service";

export class ReportsService {
  async submitReport(markerId: string, data: any) {
    // 1. Save Report
    const report = await markersRepository.createReport(markerId, data);

    // 2. Update the marker with the latest attributes reported by the user
    const updateData: any = {};
    if (data.reportedStatus !== undefined) updateData.publicStatus = data.reportedStatus;
    if (data.hasElectricity !== undefined && data.hasElectricity !== null) updateData.hasElectricity = data.hasElectricity;
    if (data.hasWater !== undefined && data.hasWater !== null) updateData.hasWater = data.hasWater;
    if (data.hasInternet !== undefined && data.hasInternet !== null) updateData.hasInternet = data.hasInternet;
    if (data.crowdLevel !== undefined) updateData.crowdLevel = data.crowdLevel;

    await markersRepository.update(markerId, updateData);

    // 3. Evaluate if we need to flag the marker as NEEDS_REVIEW
    const flagged = await needsReviewService.evaluateMarkerStatus(markerId);

    return { report, flagged };
  }
}

export const reportsService = new ReportsService();
