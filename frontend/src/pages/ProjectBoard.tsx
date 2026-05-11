import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ListTodo, PlayCircle, CheckCircle2, GripVertical, Loader2 } from "lucide-react";
import { apiFetch } from "../lib/api";

type TaskStatus = "pending" | "in_progress" | "complete";

interface Task {
  id: string;
  skillId: string;
  status: TaskStatus;
  aiOutput: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface Skill {
  id: string;
  slug: string;
  title: string;
  category: string;
}

const COLUMNS: { id: TaskStatus; label: string; icon: typeof ListTodo }[] = [
  { id: "pending", label: "To Do", icon: ListTodo },
  { id: "in_progress", label: "In Progress", icon: PlayCircle },
  { id: "complete", label: "Completed", icon: CheckCircle2 },
];

function TaskCard({ task, skill }: { task: Task; skill?: Skill }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${isDragging ? "z-10" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" style={{ color: "var(--clr-muted-foreground, #ced4da)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-900 line-clamp-2">
            {skill?.title || "Unknown skill"}
          </p>
          {skill && (
            <span className="mt-1 inline-block rounded-md bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 uppercase tracking-wider">
              {skill.category}
            </span>
          )}
          {task.aiOutput && (
            <p className="mt-2 text-xs text-surface-500 line-clamp-2">
              AI output generated
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiFetch<{ tasks: Task[] }>("/tasks"),
  });

  const { data: skillsData } = useQuery({
    queryKey: ["skills"],
    queryFn: () => apiFetch<{ skills: Skill[] }>("/skills"),
  });

  const skillsMap = useMemo(() => {
    const map = new Map<string, Skill>();
    skillsData?.skills.forEach((s) => map.set(s.id, s));
    return map;
  }, [skillsData]);

  const updateMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["score"] });
    },
  });

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      complete: [],
    };
    tasksData?.tasks.forEach((t) => {
      grouped[t.status]?.push(t);
    });
    return grouped;
  }, [tasksData]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetColumn = over.id as string;

    if (["pending", "in_progress", "complete"].includes(targetColumn)) {
      const task = tasksData?.tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn) {
        updateMutation.mutate({ taskId, status: targetColumn as TaskStatus });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
          Project Board
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
          Drag tasks between columns to update their status
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const tasks = columns[col.id] || [];
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                className="rounded-xl border border-surface-200 bg-surface-50"
              >
                <div className="flex items-center gap-2 border-b border-surface-200 px-4 py-3">
                  <Icon className="h-4 w-4" style={{ color: "var(--clr-primary, #0070c4)" }} />
                  <h3 className="text-sm font-semibold text-surface-900">{col.label}</h3>
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "var(--clr-muted, #e9ecef)",
                      color: "var(--clr-muted-foreground, #868e96)",
                    }}
                  >
                    {tasks.length}
                  </span>
                </div>

                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 p-3 min-h-[200px]">
                    {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-xs" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
                        <Loader2 className="h-5 w-5 mb-1" />
                        No tasks
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <TaskCard key={task.id} task={task} skill={skillsMap.get(task.skillId)} />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg border border-brand-200 bg-white p-3 shadow-lg">
              <p className="text-sm font-medium text-surface-900">
                {skillsMap.get(tasksData?.tasks.find((t) => t.id === activeId)?.skillId || "")?.title || "Task"}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
