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
};

const SignatureInput = ({
  onChange,
  isDisabled,
  isError,
  width = 450,
  height = 150,
  themeColor = "#1976d2",
  strokeWidth = 2,
  inputMode = "draw",
  buttonType = "button",
  download = false,
  clear = true,
}: SignatureInputProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]); // Stores all stroke paths
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]); // Current stroke
  const [typedSignature, setTypedSignature] = useState(""); // Holds user-typed signature

  // Add these new refs to track scaling
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

    // Get the container width
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

  useEffect((): (() => void) => {
    if (!signaturePadRef.current) return () => null;
    const canvas = signaturePadRef.current;

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    const cleanup = (): void => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    return cleanup;
  }, [
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    isDisabled,
  ]);

  /**
   * Chaikin's Algorithm: Smooths the strokes by subdividing points
   */
  const smoothStroke = (
    points: { x: number; y: number }[]
  ): { x: number; y: number }[] => {
    if (points.length < 3) return points; // Not enough points to smooth

    let smoothed: { x: number; y: number }[] = [];
    smoothed.push(points[0]); // Keep first point

    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      const q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
      const r = { x: 0.25 * p1.x + 0.75 * p2.x, y: 0.25 * p1.y + 0.75 * p2.y };

      smoothed.push(q, r);
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
        width: "100%", // Changed from maxWidth to width
        maxWidth: `${width}px`,
        minWidth: `${Math.min(width, 100)}px`, // Add minimum width
      }}
    >
      <canvas
        className={`drawing-canvas`}
        ref={signaturePadRef}
        style={{
          touchAction: "none",
          width: "100%",
          height: "100%", // Added height
          maxWidth: `${width}px`,
          aspectRatio: `${width} / ${height}`,
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

export default SignatureInput;
