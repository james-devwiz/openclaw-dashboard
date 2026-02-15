// Notion client — connects to your Notion tasks database

import { Client } from "@notionhq/client";
import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource } from "@/types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const TASKS_DB_ID = process.env.NOTION_TASKS_DATABASE_ID || "";

function extractText(property: any): string {
  if (!property) return "";
  if (property.title) return property.title.map((t: any) => t.plain_text).join("");
  if (property.rich_text) return property.rich_text.map((t: any) => t.plain_text).join("");
  return "";
}

function extractSelect(property: any): string {
  return property?.select?.name || "";
}

function extractDate(property: any): string | undefined {
  return property?.date?.start || undefined;
}

function pageToTask(page: any): Task {
  const props = page.properties;
  return {
    id: page.id,
    name: extractText(props["Task Name"] || props.Name || props.title),
    status: (extractSelect(props.Status) as TaskStatus) || "To Do",
    priority: (extractSelect(props.Priority) as TaskPriority) || "Medium",
    category: (extractSelect(props.Category) as TaskCategory) || "System",
    dueDate: extractDate(props["Due Date"]),
    source: (extractSelect(props.Source) as TaskSource) || "Manual",
    goalId: "general",
    notionPageId: page.id,
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

export async function getTasks(): Promise<Task[]> {
  if (!TASKS_DB_ID) {
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB_ID,
      filter: {
        property: "Status",
        select: {
          does_not_equal: "Archived",
        },
      },
      sorts: [
        { property: "Priority", direction: "ascending" },
        { property: "Due Date", direction: "ascending" },
      ],
    });

    return response.results.map(pageToTask);
  } catch (error) {
    console.error("Notion tasks fetch failed:", error);
    return [];
  }
}

export async function updateTaskStatus(
  pageId: string,
  status: TaskStatus
): Promise<void> {
  if (!TASKS_DB_ID) return;

  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: {
        select: { name: status },
      },
    },
  });
}
