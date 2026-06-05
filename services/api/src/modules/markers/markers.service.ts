import { markersRepository } from "./markers.repository";
import { VerificationStatus, PublicStatus, CrowdLevel } from "@prisma/client";

export class MarkersService {
  async getApprovedMarkers(category?: string, status?: string) {
    return markersRepository.getApproved({ category, status });
  }

  async getPendingMarkers() {
    return markersRepository.getPending();
  }

  async getMarkerById(id: string) {
    return markersRepository.findById(id);
  }

  async suggestMarker(data: any) {
    return markersRepository.create(data);
  }

  async approveMarker(id: string, adminId?: string) {
    return markersRepository.update(id, {
      verificationStatus: VerificationStatus.APPROVED,
      approvedByAdminId: adminId || null,
      lastVerifiedAt: new Date(),
    });
  }

  async rejectMarker(id: string) {
    return markersRepository.update(id, {
      verificationStatus: VerificationStatus.REJECTED,
    });
  }

  async deleteMarker(id: string) {
    return markersRepository.delete(id);
  }

  async updateMarker(id: string, data: any) {
    // Basic scrubbing of data fields
    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.latitude !== undefined) updatePayload.latitude = Number(data.latitude);
    if (data.longitude !== undefined) updatePayload.longitude = Number(data.longitude);
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.publicStatus !== undefined) updatePayload.publicStatus = data.publicStatus as PublicStatus;
    if (data.verificationStatus !== undefined) updatePayload.verificationStatus = data.verificationStatus as VerificationStatus;
    if (data.hasElectricity !== undefined) updatePayload.hasElectricity = data.hasElectricity;
    if (data.hasWater !== undefined) updatePayload.hasWater = data.hasWater;
    if (data.hasInternet !== undefined) updatePayload.hasInternet = data.hasInternet;
    if (data.crowdLevel !== undefined) updatePayload.crowdLevel = data.crowdLevel as CrowdLevel;

    updatePayload.lastVerifiedAt = new Date();

    return markersRepository.update(id, updatePayload);
  }
}

export const markersService = new MarkersService();
