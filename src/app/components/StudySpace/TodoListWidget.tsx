import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { ListTodo, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TodoItem } from "./types";

const MotionBox = motion.create(Box);

export function TodoListWidget() {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, text: "Review lecture notes", done: false },
    { id: 2, text: "Complete assignment", done: false },
    { id: 3, text: "Take a break", done: true },
  ]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    const t = input.trim();
    if (!t) return;
    setTodos((prev) => [...prev, { id: Date.now(), text: t, done: false }]);
    setInput("");
  };

  const toggle = (id: number) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: number) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  return (
    <Box style={{ background: "rgba(12,18,22,0.75)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "14px 14px 12px" }}>
      {/* Header */}
      <Flex align="center" gap={2} mb={3}>
        <ListTodo size={13} color="#7aab97" />
        <Text style={{ fontSize: "0.75rem", color: "#7aab97", letterSpacing: "0.08em", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {t("todo.title")}
        </Text>
        <Box ml="auto" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", fontFamily: "'HarmonyOS Sans', sans-serif" }}>
          {todos.filter((t) => t.done).length}/{todos.length}
        </Box>
      </Flex>

      {/* Task list */}
      <Box style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
        <AnimatePresence initial={false}>
          {todos.map((todo) => (
            <MotionBox
              key={todo.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 } as any}
            >
              <Flex align="center" gap={2} mb={1} px={1} py="5px" borderRadius="8px"
                style={{ transition: "background 0.15s" }}
                _hover={{ background: "rgba(255,255,255,0.05)" }}
              >
                {/* Checkbox */}
                <Box
                  as="button"
                  onClick={() => toggle(todo.id)}
                  display="flex" alignItems="center" justifyContent="center"
                  flexShrink={0} bg="transparent" border="none" cursor="pointer"
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
                {/* Text */}
                <Text flex={1} style={{
                  fontSize: "0.8rem",
                  color: todo.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
                  fontFamily: "'HarmonyOS Sans', sans-serif",
                  textDecoration: todo.done ? "line-through" : "none",
                  transition: "all 0.2s",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {todo.text}
                </Text>
                {/* Delete */}
                <Box as="button" onClick={() => remove(todo.id)} display="flex" alignItems="center" bg="transparent" border="none" cursor="pointer"
                  style={{ color: "rgba(255,255,255,0.18)", transition: "color 0.15s", padding: "2px" }}
                  _hover={{ color: "rgba(239,68,68,0.8)" }}
                >
                  <Trash2 size={12} />
                </Box>
              </Flex>
            </MotionBox>
          ))}
        </AnimatePresence>
        {todos.length === 0 && (
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
    </Box>
  );
}