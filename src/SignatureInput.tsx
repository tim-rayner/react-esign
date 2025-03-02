import { useCallback, useEffect, useRef, useState } from "react";
import "./esign.css";

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
};

const Button = ({ children, onClick, disabled, style }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={disabled ? undefined : style}
      className="button"
    >
      {children}
    </button>
  );
};

const TextButton = ({ children, onClick, disabled, style }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      className="text-button"
    >
      {children}
    </button>
  );
};

export type SignatureInputProps = {
  onChange: (value?: File) => void;
  isDisabled?: boolean;
  isError?: boolean;
  width?: number;
  height?: number;
  themeColor?: string;
  strokeWidth?: number;
  inputMode?: "draw" | "type" | "auto";
  buttonType?: "button" | "text";
  download?: boolean;
  clear?: boolean;
  style?: React.CSSProperties;
};

const SignatureInput = ({
  onChange,
  isDisabled = false,
  isError = false,
  width = 450,
  height = 150,
  themeColor = "#1976d2",
  strokeWidth = 2,
  inputMode = "draw",
  buttonType = "button",
  download = false,
  clear = true,
  style,
}: SignatureInputProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const [typedSignature, setTypedSignature] = useState("");

  const scaleRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
  const displaySizeRef = useRef<{ width: number; height: number }>({
    width,
    height,
  });

  const initializeCanvas = useCallback((): void => {
    if (!signaturePadRef.current) return;
    const canvas = signaturePadRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get container width
    const container = canvas.parentElement;
    if (!container) return;
    const containerWidth = container.clientWidth;

    // Calculate the scaled dimensions while maintaining aspect ratio
    const scale = Math.min(
      containerWidth / width,
      containerWidth / (width * (height / width))
    );
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Update display size ref
    displaySizeRef.current = { width: scaledWidth, height: scaledHeight };

    // Set the display size
    canvas.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;

    // Set the internal canvas size (for consistent image export)
    canvas.width = width;
    canvas.height = height;

    // Calculate scale factors
    scaleRef.current = {
      x: width / scaledWidth,
      y: height / scaledHeight,
    };

    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctxRef.current = ctx;
  }, [width, height, strokeWidth]);

  const redrawCanvasWithSmoothing = useCallback(() => {
    if (!ctxRef.current) return;

    // Clear the entire canvas
    ctxRef.current.clearRect(
      0,
      0,
      ctxRef.current.canvas.width,
      ctxRef.current.canvas.height
    );

    // Reset the drawing style for each redraw
    ctxRef.current.lineWidth = strokeWidth;
    ctxRef.current.lineJoin = "round";
    ctxRef.current.strokeStyle = "#000";

    // Draw each stroke
    strokesRef.current.forEach((stroke) => {
      if (!ctxRef.current) return;
      const smoothedStroke = smoothStroke(stroke);

      ctxRef.current.beginPath();
      ctxRef.current.moveTo(smoothedStroke[0].x, smoothedStroke[0].y);

      for (let i = 1; i < smoothedStroke.length; i++) {
        ctxRef.current.lineTo(smoothedStroke[i].x, smoothedStroke[i].y);
      }

      ctxRef.current.stroke();
    });

    // Draw typed signature after strokes
    if (typedSignature) {
      if (!ctxRef.current) return;
      ctxRef.current.font = `italic ${
        strokeWidth * 12
      }px "Dancing Script", cursive`;
      ctxRef.current.textAlign = "center";
      ctxRef.current.fillStyle = "#000";
      ctxRef.current.fillText(
        typedSignature,
        ctxRef.current.canvas.width / (2 * window.devicePixelRatio),
        ctxRef.current.canvas.height / (2 * window.devicePixelRatio) + 10
      );
    }
  }, [strokeWidth, typedSignature]);

  // Add resize observer
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      initializeCanvas();
      redrawCanvasWithSmoothing();
    });

    if (signaturePadRef.current?.parentElement) {
      observer.observe(signaturePadRef.current.parentElement);
    }

    return () => observer.disconnect();
  }, [initializeCanvas, redrawCanvasWithSmoothing]);

  const handleClear = useCallback((): void => {
    if (!ctxRef.current || isDisabled) return;
    ctxRef.current.clearRect(
      0,
      0,
      ctxRef.current.canvas.width,
      ctxRef.current.canvas.height
    );
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setTypedSignature("");
    setHasStrokes(false);
    onChange(undefined);
  }, [onChange]);

  const handlePointerDown = useCallback(
    (event: PointerEvent): void => {
      if (
        !isDisabled &&
        (inputMode === "auto" || inputMode === "draw") &&
        ctxRef.current &&
        signaturePadRef.current
      ) {
        setIsDrawing(true);
        const rect = signaturePadRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) * scaleRef.current.x;
        const y = (event.clientY - rect.top) * scaleRef.current.y;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
        currentStrokeRef.current = [{ x, y }];
      }
    },
    [inputMode]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent): void => {
      if (isDisabled) return;
      if (
        (inputMode !== "draw" && inputMode !== "auto") ||
        !isDrawing ||
        !ctxRef.current ||
        !signaturePadRef.current
      )
        return;

      const rect = signaturePadRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) * scaleRef.current.x;
      const y = (event.clientY - rect.top) * scaleRef.current.y;

      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();

      currentStrokeRef.current.push({ x, y });
    },
    [inputMode, isDrawing]
  );

  const handlePointerUp = useCallback((): void => {
    setIsDrawing(false);

    // Save the stroke
    if (currentStrokeRef.current.length > 1) {
      strokesRef.current.push([...currentStrokeRef.current]);
      setHasStrokes(true);

      // Smooth strokes and redraw
      setTimeout(() => {
        redrawCanvasWithSmoothing();
      }, 10);
    }

    ctxRef.current?.beginPath();

    // Convert to File
    if (signaturePadRef.current) {
      signaturePadRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "signature.png", { type: "image/png" });
          onChange(file);
        }
      });
    }
  }, [onChange]);

  const handleTouchStart = useCallback(
    (event: TouchEvent): void => {
      if (isDisabled) return;
      event.preventDefault(); // Prevent scrolling when drawing starts
    },
    [isDisabled]
  );

  useEffect(() => {
    if (!signaturePadRef.current) return;
    const canvas = signaturePadRef.current;

    const attachListeners = () => {
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    };

    const detachListeners = () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    if (!isDisabled) {
      attachListeners();
    } else {
      detachListeners();
    }

    return () => {
      detachListeners();
    };
  }, [
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    isDisabled,
  ]); // ✅ Dependency on isDisabled

  /**
   * Catmull-Rom Splines Algorithm: Smooths the strokes
   */
  const smoothStroke = (
    points: { x: number; y: number }[],
    numSegments: number = 10 // Controls smoothness
  ): { x: number; y: number }[] => {
    if (points.length < 4) return points; // Need at least 4 points for Catmull-Rom to work

    let smoothed: { x: number; y: number }[] = [];
    smoothed.push(points[0]); // Keep the first point

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[Math.min(i + 1, points.length - 1)];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      for (let t = 0; t <= 1; t += 1 / numSegments) {
        const t2 = t * t;
        const t3 = t2 * t;

        // Catmull-Rom spline formula
        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

        smoothed.push({ x, y });
      }
    }

    smoothed.push(points[points.length - 1]); // Keep last point
    return smoothed;
  };

  /**
   * Listen for user keyboard input in "type" mode or "auto" mode
   */
  useEffect(() => {
    if (inputMode !== "type" && (inputMode !== "auto" || isDrawing)) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.length === 1) {
        setTypedSignature((prev) => prev + event.key);
      } else if (event.key === "Backspace") {
        if (typedSignature.length === 1) {
          handleClear();
        } else {
          setTypedSignature((prev) => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [inputMode, typedSignature, handleClear, isDrawing]);

  const handleDownload = useCallback((): void => {
    if (!signaturePadRef.current || strokesRef.current.length === 0) return;

    // Create a temporary link element
    const link = document.createElement("a");
    link.download = "signature.png";

    // Get the canvas data as a URL
    const dataUrl = signaturePadRef.current.toDataURL("image/png");
    link.href = dataUrl;

    // Programmatically click the link to trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Update canvas when typed signature changes
  useEffect(() => {
    redrawCanvasWithSmoothing();
  }, [typedSignature, redrawCanvasWithSmoothing]);

  const borderStyles = () => {
    if (isDrawing && !isDisabled) return { borderColor: themeColor };
    if (isDisabled) return { borderColor: "#ccc" };
    if (isError) return { borderColor: "#f44336" };
    return {};
  };

  return (
    <div
      className="signature-input-container"
      style={{
        width: "100%",
        maxWidth: `${width}px`,
        minWidth: `${Math.min(width, 100)}px`,
        ...style,
      }}
    >
      <canvas
        className={`drawing-canvas`}
        ref={signaturePadRef}
        style={{
          touchAction: "none",
          width: "100%",
          height: "100%",
          maxWidth: `${width}px`,
          aspectRatio: `${width} / ${height}`,
          cursor: isDisabled
            ? "not-allowed"
            : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'/%3E%3C/svg%3E") 0 24, pointer`,
          ...borderStyles(),
        }}
      />

      {/* Buttons Container */}
      <div
        style={{
          display: "flex",
          gap: 1,
          justifyContent: "space-between",
          flexDirection: "column",
          marginTop: "10px",
        }}
      >
        {clear && (
          <>
            {buttonType === "button" && (
              <>
                <Button
                  onClick={handleClear}
                  disabled={!hasStrokes || isDisabled}
                  style={{ backgroundColor: themeColor }}
                >
                  Clear
                </Button>
              </>
            )}
            {buttonType === "text" && (
              <>
                <TextButton
                  onClick={handleClear}
                  disabled={!hasStrokes || isDisabled}
                  style={{ color: themeColor, opacity: !hasStrokes ? 0.5 : 1 }}
                >
                  Clear
                </TextButton>
              </>
            )}
          </>
        )}

        {download && (
          <Button
            onClick={handleDownload}
            disabled={!hasStrokes}
            style={{ backgroundColor: themeColor }}
          >
            Download
          </Button>
        )}
      </div>
    </div>
  );
};

export { SignatureInput };
