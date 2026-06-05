import { prisma } from "../database/prisma";

export class GuidesRepository {
  async getAll(publishedOnly = false) {
    try {
      return await prisma.guide.findMany({
        where: publishedOnly ? { isPublished: true } : {},
        include: {
          translations: true,
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          priority: "asc",
        },
      });
    } catch {
      return [];
    }
  }

  async findBySlug(slug: string) {
    try {
      return await prisma.guide.findUnique({
        where: { slug },
        include: {
          translations: true,
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  async findById(id: string) {
    try {
      return await prisma.guide.findUnique({
        where: { id },
        include: {
          translations: true,
          checklistItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  async create(data: { slug: string; category: string; priority: number; isPublished?: boolean }) {
    return prisma.guide.create({
      data: {
        slug: data.slug,
        category: data.category,
        priority: data.priority,
        isPublished: data.isPublished || false,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.guide.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.guide.delete({
      where: { id },
    });
  }

  async upsertTranslation(guideId: string, language: string, title: string, shortDescription: string, content: string) {
    return prisma.guideTranslation.upsert({
      where: {
        guideId_language: {
          guideId,
          language,
        },
      },
      update: {
        title,
        shortDescription,
        content,
      },
      create: {
        guideId,
        language,
        title,
        shortDescription,
        content,
      },
    });
  }

  async addChecklistItem(guideId: string, textCs: string, textEn: string, order: number) {
    return prisma.guideChecklistItem.create({
      data: {
        guideId,
        textCs,
        textEn,
        order,
      },
    });
  }

  async updateChecklistItem(itemId: string, textCs: string, textEn: string, order: number) {
    return prisma.guideChecklistItem.update({
      where: { id: itemId },
      data: {
        textCs,
        textEn,
        order,
      },
    });
  }

  async deleteChecklistItem(itemId: string) {
    return prisma.guideChecklistItem.delete({
      where: { id: itemId },
    });
  }

  async clearChecklistItems(guideId: string) {
    return prisma.guideChecklistItem.deleteMany({
      where: { guideId },
    });
  }
}

export const guidesRepository = new GuidesRepository();
