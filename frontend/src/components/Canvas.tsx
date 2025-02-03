import React, { useEffect, useRef, useState } from 'react';

interface pixelsClient {
  x: number;
  y: number;
  color: string;
}

interface incomingPixels {
  type: string;
  payload: pixelsClient | pixelsClient[];
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');

  const drawPixel = ({ x, y, color }: pixelsClient) => {
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fill();
    }
  };

  const drawPixels = (pixels: pixelsClient[]) => {
    pixels.forEach(drawPixel);
  };

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/canvas');

    ws.current.onopen = () => console.log('Connected');

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data) as incomingPixels;
      if (message.type === 'PIXEL_HISTORY') {
        if (Array.isArray(message.payload)) {
          drawPixels(message.payload);
        }
      } else if (message.type === 'NEW_PIXEL') {
        if (!Array.isArray(message.payload)) {
          drawPixel(message.payload);
        }
      }
    };

    ws.current.onclose = () => console.log('Disconnected');

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    sendPixel(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    sendPixel(e);
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const sendPixel = (e: React.MouseEvent) => {
    if (!canvasRef.current || !ws.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = { x, y, color };
    drawPixel(pixel);
    ws.current.send(JSON.stringify({ type: 'DRAW_PIXEL', payload: pixel }));
  };


  return (
    <>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{border: '1px solid black'}}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
};

export default Canvas;
