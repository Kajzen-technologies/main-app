import { guidesRepository } from "./guides.repository";

export class GuidesService {
  async getPublishedGuides() {
    return guidesRepository.getAll(true);
  }

  async getAdminGuides() {
    return guidesRepository.getAll(false);
  }

  async getGuideBySlug(slug: string) {
    return guidesRepository.findBySlug(slug);
  }

  async getGuideById(id: string) {
    return guidesRepository.findById(id);
  }

  async createGuide(data: any) {
    const guide = await guidesRepository.create({
      slug: data.slug,
      category: data.category,
      priority: Number(data.priority || 0),
      isPublished: data.isPublished || false,
    });

    if (data.titleCs || data.contentCs) {
      await guidesRepository.upsertTranslation(
        guide.id,
        "cs",
        data.titleCs || "",
        data.shortDescriptionCs || "",
        data.contentCs || ""
      );
    }

    if (data.titleEn || data.contentEn) {
      await guidesRepository.upsertTranslation(
        guide.id,
        "en",
        data.titleEn || "",
        data.shortDescriptionEn || "",
        data.contentEn || ""
      );
    }

    if (data.checklistItems && Array.isArray(data.checklistItems)) {
      for (const item of data.checklistItems) {
        await guidesRepository.addChecklistItem(guide.id, item.textCs, item.textEn, Number(item.order || 0));
      }
    }

    return guidesRepository.findById(guide.id);
  }

  async updateGuide(id: string, data: any) {
    const updateData: any = {};
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = Number(data.priority);
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    await guidesRepository.update(id, updateData);

    if (data.titleCs !== undefined || data.contentCs !== undefined || data.shortDescriptionCs !== undefined) {
      await guidesRepository.upsertTranslation(
        id,
        "cs",
        data.titleCs || "",
        data.shortDescriptionCs || "",
        data.contentCs || ""
      );
    }

    if (data.titleEn !== undefined || data.contentEn !== undefined || data.shortDescriptionEn !== undefined) {
      await guidesRepository.upsertTranslation(
        id,
        "en",
        data.titleEn || "",
        data.shortDescriptionEn || "",
        data.contentEn || ""
      );
    }

    if (data.checklistItems && Array.isArray(data.checklistItems)) {
      await guidesRepository.clearChecklistItems(id);
      for (const item of data.checklistItems) {
        await guidesRepository.addChecklistItem(id, item.textCs, item.textEn, Number(item.order || 0));
      }
    }

    return guidesRepository.findById(id);
  }

  async deleteGuide(id: string) {
    return guidesRepository.delete(id);
  }
}

export const guidesService = new GuidesService();
