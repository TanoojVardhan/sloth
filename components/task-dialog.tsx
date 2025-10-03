
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { useTasks } from "@/contexts/tasks-context";
import { useToast } from "@/hooks/use-toast";

interface TaskDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task?: any | null;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
	const { addTask, updateTaskById } = useTasks();
	const { toast } = useToast();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState<Date | undefined>(undefined);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (open && task) {
			setTitle(task.title || "");
			setDescription(task.description || "");
			setDate(task.dueDate ? new Date(task.dueDate) : undefined);
		} else if (open) {
			setTitle("");
			setDescription("");
			setDate(undefined);
		}
	}, [open, task]);

	const handleSave = async () => {
		if (!title.trim()) {
			toast({ title: "Error", description: "Task title is required", variant: "destructive" });
			return;
		}
		setIsSubmitting(true);
		try {
			if (task && task.id) {
				await updateTaskById(task.id, { title, description, dueDate: date?.toISOString() });
				toast({ title: "Task updated", description: "Your task was updated." });
			} else {
				await addTask({ title, description, dueDate: date?.toISOString() });
				toast({ title: "Task created", description: "Your task was created." });
			}
			onOpenChange(false);
		} catch (e) {
			toast({ title: "Error", description: "Failed to save task.", variant: "destructive" });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label htmlFor="task-title">Title</Label>
						<Input id="task-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
					</div>
					<div>
						<Label htmlFor="task-desc">Description</Label>
						<Input id="task-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
					</div>
					<div>
						<Label>Due Date</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start text-left font-normal">
									<CalendarIcon className="mr-2 h-4 w-4" />
									{date ? format(date, "PPP") : "Pick a date"}
								</Button>
							</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0"
												onMouseDown={e => {
													// Prevent popover from closing parent dialog
													e.stopPropagation();
												}}
											>
												<Calendar
													mode="single"
													selected={date}
													onSelect={setDate}
													initialFocus
												/>
											</PopoverContent>
						</Popover>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
					<Button onClick={handleSave} disabled={isSubmitting || !title.trim()}>
						{isSubmitting ? "Saving..." : task ? "Save Changes" : "Create Task"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

