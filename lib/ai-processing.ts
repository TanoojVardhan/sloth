"use server"

import { createTask } from "@/lib/actions/task-actions"

interface AIResponse {
  success: boolean
  message: string
  action?: string
  data?: any
}

export async function processAICommand(command: string): Promise<AIResponse> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Convert command to lowercase for easier matching
  const lowerCommand = command.toLowerCase()

  // Check for task creation commands
  if (lowerCommand.includes("add task") || lowerCommand.includes("create task") || lowerCommand.includes("new task")) {
    return await handleTaskCreation(command)
  }

  // Check for calendar/event commands
  if (lowerCommand.includes("add event") || lowerCommand.includes("schedule") || lowerCommand.includes("meeting")) {
    return {
      success: true,
      message: "I've added this event to your calendar.",
      action: "add_event",
      data: {
        title: extractEventTitle(command),
        date: extractDate(command),
        time: extractTime(command),
      },
    }
  }

  // Check for reminder commands
  if (lowerCommand.includes("remind") || lowerCommand.includes("reminder")) {
    return {
      success: true,
      message: "I've set a reminder for you.",
      action: "set_reminder",
      data: {
        text: extractReminderText(command),
        time: extractTime(command),
        date: extractDate(command),
      },
    }
  }

  // Default response for unrecognized commands
  return {
    success: false,
    message: "I'm not sure how to help with that. You can ask me to add tasks, schedule events, or set reminders.",
  }
}

async function handleTaskCreation(command: string): Promise<AIResponse> {
  try {
    // Extract task details from command
    const title = extractTaskTitle(command)
    const priority = extractPriority(command)
    const dueDate = extractDate(command)
    const tags = extractTags(command)

    // Create the task
    const task = await createTask({
      title,
      completed: false,
      priority,
      dueDate,
      tags,
    })

    return {
      success: true,
      message: `I've added "${title}" to your tasks.`,
      action: "add_task",
      data: task,
    }
  } catch (error) {
    return {
      success: false,
      message: "I couldn't create that task. Please try again.",
    }
  }
}

// Helper functions to extract information from commands

function extractTaskTitle(command: string): string {
  // Simple extraction - everything after "add task" or similar phrases
  const patterns = [/add task\s+(.*)/i, /create task\s+(.*)/i, /new task\s+(.*)/i]

  for (const pattern of patterns) {
    const match = command.match(pattern)
    if (match && match[1]) {
      // Remove any date/priority/tag information
      let title = match[1]

      // Remove date information
      const datePatterns = [
        /\bon\s+\w+\s+\d+/i,
        /\bdue\s+\w+\s+\d+/i,
        /\bby\s+\w+\s+\d+/i,
        /\btomorrow\b/i,
        /\btoday\b/i,
        /\bnext week\b/i,
      ]

      for (const datePattern of datePatterns) {
        title = title.replace(datePattern, "")
      }

      // Remove priority information
      title = title
        .replace(/\bhigh priority\b/i, "")
        .replace(/\bmedium priority\b/i, "")
        .replace(/\blow priority\b/i, "")

      // Remove tag information
      title = title.replace(/\bwith tags?\s+[\w,\s]+/i, "")

      // Clean up and return
      return title.trim()
    }
  }

  // If no pattern matches, use a default title
  return "New Task"
}

function extractPriority(command: string): "low" | "medium" | "high" {
  const lowerCommand = command.toLowerCase()

  if (lowerCommand.includes("high priority") || lowerCommand.includes("urgent")) {
    return "high"
  } else if (lowerCommand.includes("low priority")) {
    return "low"
  } else {
    return "medium" // Default priority
  }
}

function extractDate(command: string): string | undefined {
  const lowerCommand = command.toLowerCase()
  const today = new Date()

  // Check for common date phrases
  if (lowerCommand.includes("today")) {
    return today.toISOString().split("T")[0]
  } else if (lowerCommand.includes("tomorrow")) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  } else if (lowerCommand.includes("next week")) {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split("T")[0]
  }

  // More complex date extraction would go here

  return undefined
}

function extractTags(command: string): string[] | undefined {
  const tagMatch = command.match(/\bwith tags?\s+([\w,\s]+)/i)

  if (tagMatch && tagMatch[1]) {
    // Split by commas or spaces and clean up
    return tagMatch[1]
      .split(/,|\s+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  return undefined
}

function extractEventTitle(command: string): string {
  // Similar to extractTaskTitle but for events
  const patterns = [/add event\s+(.*)/i, /schedule\s+(.*)/i, /meeting\s+(.*)/i]

  for (const pattern of patterns) {
    const match = command.match(pattern)
    if (match && match[1]) {
      const title = match[1]
      // Clean up date and time information
      return title
        .replace(/\bon\s+\w+\s+\d+/i, "")
        .replace(/\bat\s+\d+:\d+/i, "")
        .replace(/\bat\s+\d+\s*(am|pm)/i, "")
        .trim()
    }
  }

  return "New Event"
}

function extractTime(command: string): string | undefined {
  // Extract time information
  const timeMatch = command.match(/\bat\s+(\d+):?(\d*)\s*(am|pm)?/i)

  if (timeMatch) {
    let hours = Number.parseInt(timeMatch[1])
    const minutes = timeMatch[2] ? Number.parseInt(timeMatch[2]) : 0
    const period = timeMatch[3] ? timeMatch[3].toLowerCase() : undefined

    // Convert to 24-hour format if am/pm is specified
    if (period === "pm" && hours < 12) {
      hours += 12
    } else if (period === "am" && hours === 12) {
      hours = 0
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  return undefined
}

function extractReminderText(command: string): string {
  // Extract the reminder text
  const reminderMatch = command.match(/remind\s+(?:me\s+)?(?:to\s+)?(.*?)(?:\s+on|\s+at|\s+tomorrow|\s+today|$)/i)

  if (reminderMatch && reminderMatch[1]) {
    return reminderMatch[1].trim()
  }

  return "Reminder"
}
