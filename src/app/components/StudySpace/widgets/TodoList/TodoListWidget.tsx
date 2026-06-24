import { useState, useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { ListTodo, Trash2, Plus, Pencil, Check, X } from "lucide-react";
import { LoadingRing } from "../../../ui/LoadingRing";
import { useTranslation } from "react-i18next";
import type { TodoItem } from "../../types";
import { todoService } from "../../../../../services/todo.service";
import { useAuth } from "../../../../../context/AuthContext";

const MotionBox = motion.create(Box);

interface TodoListWidgetProps {
  todos: TodoItem[];
  onTodosChange: (todos: TodoItem[]) => void;
}

function mapDto(dto: { id: string; content: string; isCompleted: boolean }): TodoItem {
  return { id: dto.id, text: dto.content, done: dto.isCompleted };
}

export function TodoListWidget({ todos: propTodos, onTodosChange }: TodoListWidgetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [apiTodos, setApiTodos]     = useState<TodoItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [pendingIds, setPendingIds]  = useState<Set<string>>(new Set());
  const [input, setInput]           = useState("");
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editText, setEditText]     = useState("");
  const editInputRef                = useRef<HTMLInputElement>(null);
  const loadedRef                   = useRef(false);

  const isAuthed = !!user;
  const todos    = isAuthed ? apiTodos : propTodos;

  // Load from API on mount (once per session)
  useEffect(() => {
    if (!isAuthed || loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    todoService.getAll()
      .then(items => setApiTodos(items.map(mapDto)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthed]);

  const setPending = (id: string, pending: boolean) =>
    setPendingIds(prev => {
      const next = new Set(prev);
      pending ? next.add(id) : next.delete(id);
      return next;
    });

  const addTodo = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (!isAuthed) {
      onTodosChange([...propTodos, { id: String(Date.now()), text, done: false }]);
      return;
    }

    // Optimistic add with temp id
    const tempId = `temp-${Date.now()}`;
    setApiTodos(prev => [...prev, { id: tempId, text, done: false }]);
    setPending(tempId, true);

    try {
      const dto = await todoService.create(text);
      setApiTodos(prev => prev.map(t => t.id === tempId ? mapDto(dto) : t));
    } catch {
      setApiTodos(prev => prev.filter(t => t.id !== tempId));
    } finally {
      setPending(tempId, false);
    }
  };

  const toggle = async (id: string) => {
    if (!isAuthed) {
      onTodosChange(propTodos.map(t => t.id === id ? { ...t, done: !t.done } : t));
      return;
    }

    const current = apiTodos.find(t => t.id === id);
    if (!current || pendingIds.has(id)) return;

    // Optimistic toggle
    setApiTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    setPending(id, true);

    try {
      const dto = await todoService.update(id, { content: current.text, isCompleted: !current.done });
      setApiTodos(prev => prev.map(t => t.id === id ? mapDto(dto) : t));
    } catch {
      setApiTodos(prev => prev.map(t => t.id === id ? current : t));
    } finally {
      setPending(id, false);
    }
  };

  const remove = async (id: string) => {
    if (!isAuthed) {
      onTodosChange(propTodos.filter(t => t.id !== id));
      return;
    }

    if (pendingIds.has(id)) return;

    const snapshot = apiTodos.find(t => t.id === id);
    setApiTodos(prev => prev.filter(t => t.id !== id));
    setPending(id, true);

    try {
      await todoService.remove(id);
    } catch {
      if (snapshot) setApiTodos(prev => [...prev, snapshot]);
    } finally {
      setPending(id, false);
    }
  };

  const startEdit = (id: string, currentText: string) => {
    if (pendingIds.has(id)) return;
    setEditingId(id);
    setEditText(currentText);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id: string) => {
    const newText = editText.trim();
    cancelEdit();
    if (!newText) return;

    const current = (isAuthed ? apiTodos : propTodos).find(t => t.id === id);
    if (!current || newText === current.text) return;

    if (!isAuthed) {
      onTodosChange(propTodos.map(t => t.id === id ? { ...t, text: newText } : t));
      return;
    }

    // Optimistic update
    setApiTodos(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
    setPending(id, true);

    try {
      const dto = await todoService.update(id, { content: newText, isCompleted: current.done });
      setApiTodos(prev => prev.map(t => t.id === id ? mapDto(dto) : t));
    } catch {
      setApiTodos(prev => prev.map(t => t.id === id ? current : t));
    } finally {
      setPending(id, false);
    }
  };

  return (
    <Box style={{ background: "rgba(var(--widget-bg-rgb), 0.78)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(var(--accent-rgb), 0.18)", borderRadius: "16px", padding: "14px 14px 12px" }}>
      {/* Header */}
      <Flex align="center" gap={2} mb={3}>
        <ListTodo size={13} style={{ color: "rgba(var(--accent-light-rgb), 0.85)" }} />
        <Text style={{ fontSize: "0.75rem", color: "rgba(var(--accent-light-rgb), 0.85)", letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("todo.title")}
        </Text>
        <Box ml="auto" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {loading
            ? <LoadingRing size={10} />
            : `${todos.filter(t => t.done).length}/${todos.length}`
          }
        </Box>
      </Flex>

      {/* Task list */}
      <Box style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
        {loading && todos.length === 0 ? (
          <Flex direction="column" gap={2} px={1} py={2}>
            {[1, 2, 3].map(i => (
              <Box key={i} h="24px" borderRadius="6px"
                style={{ background: "rgba(255,255,255,0.06)", animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </Flex>
        ) : (
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <MotionBox
                key={todo.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: pendingIds.has(todo.id) ? 0.55 : 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 } as any}
              >
                <Flex align="center" gap={2} mb={1} px={1} py="5px" borderRadius="8px"
                  className="todo-row"
                  style={{ transition: "background 0.15s" }}
                  _hover={{ background: editingId === todo.id ? "transparent" : "rgba(255,255,255,0.05)" }}
                >
                  {/* Checkbox */}
                  <Box
                    as="button"
                    onClick={() => { if (editingId === todo.id) return; toggle(todo.id); }}
                    display="flex" alignItems="center" justifyContent="center"
                    flexShrink={0} bg="transparent" border="none"
                    cursor={pendingIds.has(todo.id) || editingId === todo.id ? "not-allowed" : "pointer"}
                    style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: todo.done ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                      background: todo.done ? "linear-gradient(135deg,#4ade80,#38bdf8)" : "transparent",
                      transition: "all 0.15s", color: "#0d2b24",
                    }}
                  >
                    {todo.done && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="#0d2b24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </Box>

                  {/* Text or Edit input */}
                  {editingId === todo.id ? (
                    <Box
                      as="input"
                      ref={editInputRef}
                      value={editText}
                      onChange={(e: any) => setEditText(e.target.value)}
                      onKeyDown={(e: any) => {
                        if (e.key === "Enter") saveEdit(todo.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      onBlur={() => saveEdit(todo.id)}
                      flex={1}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: "5px", padding: "2px 7px",
                        fontSize: "0.8rem", color: "rgba(255,255,255,0.9)",
                        fontFamily: "'HarmonyOS Sans', sans-serif", outline: "none",
                        minWidth: 0,
                      }}
                    />
                  ) : (
                    <Text
                      flex={1}
                      onDoubleClick={() => !todo.done && startEdit(todo.id, todo.text)}
                      title={todo.done ? undefined : "Double-click để sửa"}
                      style={{
                        fontSize: "0.8rem",
                        color: todo.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
                        fontFamily: "'HarmonyOS Sans', sans-serif",
                        textDecoration: todo.done ? "line-through" : "none",
                        transition: "all 0.2s",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        cursor: todo.done ? "default" : "text",
                      }}
                    >
                      {todo.text}
                    </Text>
                  )}

                  {/* Edit confirm / cancel buttons (visible while editing) */}
                  {editingId === todo.id ? (
                    <Flex gap={1} flexShrink={0}>
                      <Box as="button" onMouseDown={(e: any) => { e.preventDefault(); saveEdit(todo.id); }}
                        display="flex" alignItems="center" bg="transparent" border="none" cursor="pointer"
                        style={{ color: "#4ade80", padding: "2px" }}
                      >
                        <Check size={12} />
                      </Box>
                      <Box as="button" onMouseDown={(e: any) => { e.preventDefault(); cancelEdit(); }}
                        display="flex" alignItems="center" bg="transparent" border="none" cursor="pointer"
                        style={{ color: "rgba(255,255,255,0.35)", padding: "2px" }}
                        _hover={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        <X size={12} />
                      </Box>
                    </Flex>
                  ) : (
                    <Flex gap={1} flexShrink={0}>
                      {/* Edit button (visible on hover via CSS) */}
                      {!todo.done && (
                        <Box as="button" onClick={() => startEdit(todo.id, todo.text)}
                          display="flex" alignItems="center" bg="transparent" border="none"
                          cursor={pendingIds.has(todo.id) ? "not-allowed" : "pointer"}
                          style={{ color: "rgba(255,255,255,0.0)", transition: "color 0.15s", padding: "2px" }}
                          className="todo-edit-btn"
                          _hover={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          <Pencil size={11} />
                        </Box>
                      )}
                      <Box as="button" onClick={() => remove(todo.id)}
                        display="flex" alignItems="center" bg="transparent" border="none"
                        cursor={pendingIds.has(todo.id) ? "not-allowed" : "pointer"}
                        style={{ color: "rgba(255,255,255,0.0)", transition: "color 0.15s", padding: "2px" }}
                        className="todo-delete-btn"
                        _hover={{ color: "rgba(239,68,68,0.8)" }}
                      >
                        <Trash2 size={12} />
                      </Box>
                    </Flex>
                  )}
                </Flex>
              </MotionBox>
            ))}
          </AnimatePresence>
        )}

        {!loading && todos.length === 0 && (
          <Text style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", fontFamily: "'HarmonyOS Sans', sans-serif", textAlign: "center", padding: "16px 0" }}>
            {t("todo.empty")}
          </Text>
        )}
      </Box>

      {/* Add input */}
      <Flex align="center" gap={2}>
        <Box
          as="input"
          value={input}
          onChange={(e: any) => setInput(e.target.value)}
          onKeyDown={(e: any) => { if (e.key === "Enter") addTodo(); }}
          placeholder={t("todo.placeholder")}
          flex={1}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px", padding: "6px 10px",
            fontSize: "0.78rem", color: "rgba(255,255,255,0.85)",
            fontFamily: "'HarmonyOS Sans', sans-serif", outline: "none",
          }}
        />
        <Box as="button" onClick={addTodo} display="flex" alignItems="center" justifyContent="center"
          w="28px" h="28px" borderRadius="7px" border="none" cursor="pointer"
          style={{ background: "linear-gradient(135deg,#4ade80,#38bdf8)", color: "#0d2b24", flexShrink: 0 }}
          _hover={{ opacity: 0.9 }}
        >
          <Plus size={14} />
        </Box>
      </Flex>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .todo-row:hover .todo-edit-btn { color: rgba(255,255,255,0.35) !important; }
        .todo-row:hover .todo-delete-btn { color: rgba(255,255,255,0.18) !important; }
      `}</style>
    </Box>
  );
}
