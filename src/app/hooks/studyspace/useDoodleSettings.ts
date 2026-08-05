import { useState } from "react";

export interface DoodleStroke {
  color: string;
  width: number;
  points: number[]; // flat [x0,y0,x1,y1,...]
}

const DEFAULT_COLOR = "#f472b6";
const DEFAULT_WIDTH = 3;

export function useDoodleSettings() {
  const [strokes, setStrokes]         = useState<DoodleStroke[]>([]);
  const [brushColor, setBrushColor]   = useState(DEFAULT_COLOR);
  const [brushWidth, setBrushWidth]   = useState(DEFAULT_WIDTH);

  const addStroke = (stroke: DoodleStroke) => setStrokes(prev => [...prev, stroke]);
  const clearAll = () => setStrokes([]);

  return {
    strokes, setStrokes, addStroke, clearAll,
    brushColor, setBrushColor,
    brushWidth, setBrushWidth,
  };
}
