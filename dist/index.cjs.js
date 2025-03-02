'use strict';

var jsxRuntime = require('react/jsx-runtime');
var react = require('react');

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".signature-input-container{align-items:flex-start;display:flex;flex-direction:column;height:100%;position:relative}.drawing-canvas{box-sizing:border-box;display:block}.signature-input-container .button{align-self:flex-start;border:none;border-radius:6px;box-shadow:0 3px 1px -2px rgba(0,0,0,.2),0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12);color:#fff;cursor:pointer;font-size:.875rem;font-weight:500;letter-spacing:.02857em;line-height:1.75;margin:6px 0;padding:6px 16px;transition:background-color .25s cubic-bezier(.4,0,.2,1) 0ms,box-shadow .25s cubic-bezier(.4,0,.2,1) 0ms}.signature-input-container .button:hover{cursor:pointer}.signature-input-container .text-button{background-color:transparent;box-shadow:none;color:#000;padding:2px 6px 2px 0}.signature-input-container .text-button:hover{cursor:pointer}.signature-input-container .text-button:disabled{box-shadow:none;color:rgba(0,0,0,.26);cursor:default}.signature-input-container .button:hover{box-shadow:0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12)}.signature-input-container .button:disabled{background-color:rgba(0,0,0,.12);box-shadow:none;color:rgba(0,0,0,.26);cursor:default}.drawing-canvas{background-color:#fff;border:2px solid rgba(0,0,0,.1);border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,.1);cursor:crosshair}.drawing-canvas.is-drawing{border-color:#1976d2}.drawing-canvas.is-disabled{border-color:#ccc}.drawing-canvas.is-error{border-color:#f44336;cursor:default}@media (max-width:600px){.drawing-canvas{display:block}}";
styleInject(css_248z);

const Button = ({ children, onClick, disabled, style }) => {
    return (jsxRuntime.jsx("button", { onClick: onClick, disabled: disabled, style: disabled ? undefined : style, className: "button", children: children }));
};
const TextButton = ({ children, onClick, disabled, style }) => {
    return (jsxRuntime.jsx("button", { onClick: onClick, disabled: disabled, style: style, className: "text-button", children: children }));
};
const SignatureInput = ({ onChange, isDisabled = false, isError = false, width = 450, height = 150, themeColor = "#1976d2", strokeWidth = 2, inputMode = "draw", buttonType = "button", download = false, clear = true, style, }) => {
    const [isDrawing, setIsDrawing] = react.useState(false);
    const [hasStrokes, setHasStrokes] = react.useState(false);
    const signaturePadRef = react.useRef(null);
    const ctxRef = react.useRef(null);
    const strokesRef = react.useRef([]);
    const currentStrokeRef = react.useRef([]);
    const [typedSignature, setTypedSignature] = react.useState("");
    // Add these new refs to track scaling
    const scaleRef = react.useRef({ x: 1, y: 1 });
    const displaySizeRef = react.useRef({
        width,
        height,
    });
    const initializeCanvas = react.useCallback(() => {
        if (!signaturePadRef.current)
            return;
        const canvas = signaturePadRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        // Get the container width
        const container = canvas.parentElement;
        if (!container)
            return;
        const containerWidth = container.clientWidth;
        // Calculate the scaled dimensions while maintaining aspect ratio
        const scale = Math.min(containerWidth / width, containerWidth / (width * (height / width)));
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
    const redrawCanvasWithSmoothing = react.useCallback(() => {
        if (!ctxRef.current)
            return;
        // Clear the entire canvas
        ctxRef.current.clearRect(0, 0, ctxRef.current.canvas.width, ctxRef.current.canvas.height);
        // Reset the drawing style for each redraw
        ctxRef.current.lineWidth = strokeWidth;
        ctxRef.current.lineJoin = "round";
        ctxRef.current.strokeStyle = "#000";
        // Draw each stroke
        strokesRef.current.forEach((stroke) => {
            if (!ctxRef.current)
                return;
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
            if (!ctxRef.current)
                return;
            ctxRef.current.font = `italic ${strokeWidth * 12}px "Dancing Script", cursive`;
            ctxRef.current.textAlign = "center";
            ctxRef.current.fillStyle = "#000";
            ctxRef.current.fillText(typedSignature, ctxRef.current.canvas.width / (2 * window.devicePixelRatio), ctxRef.current.canvas.height / (2 * window.devicePixelRatio) + 10);
        }
    }, [strokeWidth, typedSignature]);
    // Add resize observer
    react.useEffect(() => {
        var _a;
        const observer = new ResizeObserver(() => {
            initializeCanvas();
            redrawCanvasWithSmoothing();
        });
        if ((_a = signaturePadRef.current) === null || _a === void 0 ? void 0 : _a.parentElement) {
            observer.observe(signaturePadRef.current.parentElement);
        }
        return () => observer.disconnect();
    }, [initializeCanvas, redrawCanvasWithSmoothing]);
    const handleClear = react.useCallback(() => {
        if (!ctxRef.current || isDisabled)
            return;
        ctxRef.current.clearRect(0, 0, ctxRef.current.canvas.width, ctxRef.current.canvas.height);
        strokesRef.current = [];
        currentStrokeRef.current = [];
        setTypedSignature("");
        setHasStrokes(false);
        onChange(undefined);
    }, [onChange]);
    const handlePointerDown = react.useCallback((event) => {
        if (!isDisabled &&
            (inputMode === "auto" || inputMode === "draw") &&
            ctxRef.current &&
            signaturePadRef.current) {
            setIsDrawing(true);
            const rect = signaturePadRef.current.getBoundingClientRect();
            const x = (event.clientX - rect.left) * scaleRef.current.x;
            const y = (event.clientY - rect.top) * scaleRef.current.y;
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(x, y);
            currentStrokeRef.current = [{ x, y }];
        }
    }, [inputMode]);
    const handlePointerMove = react.useCallback((event) => {
        if (isDisabled)
            return;
        if ((inputMode !== "draw" && inputMode !== "auto") ||
            !isDrawing ||
            !ctxRef.current ||
            !signaturePadRef.current)
            return;
        const rect = signaturePadRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) * scaleRef.current.x;
        const y = (event.clientY - rect.top) * scaleRef.current.y;
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
        currentStrokeRef.current.push({ x, y });
    }, [inputMode, isDrawing]);
    const handlePointerUp = react.useCallback(() => {
        var _a;
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
        (_a = ctxRef.current) === null || _a === void 0 ? void 0 : _a.beginPath();
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
    const handleTouchStart = react.useCallback((event) => {
        if (isDisabled)
            return;
        event.preventDefault(); // Prevent scrolling when drawing starts
    }, [isDisabled]);
    react.useEffect(() => {
        if (!signaturePadRef.current)
            return;
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
        }
        else {
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
    const smoothStroke = (points, numSegments = 10 // Controls smoothness
    ) => {
        if (points.length < 4)
            return points; // Need at least 4 points for Catmull-Rom
        let smoothed = [];
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
                const x = 0.5 *
                    (2 * p1.x +
                        (-p0.x + p2.x) * t +
                        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
                const y = 0.5 *
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
    react.useEffect(() => {
        if (inputMode !== "type" && (inputMode !== "auto" || isDrawing))
            return;
        const handleKeyPress = (event) => {
            if (event.key.length === 1) {
                setTypedSignature((prev) => prev + event.key);
            }
            else if (event.key === "Backspace") {
                if (typedSignature.length === 1) {
                    handleClear();
                }
                else {
                    setTypedSignature((prev) => prev.slice(0, -1));
                }
            }
        };
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [inputMode, typedSignature, handleClear, isDrawing]);
    const handleDownload = react.useCallback(() => {
        if (!signaturePadRef.current || strokesRef.current.length === 0)
            return;
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
    react.useEffect(() => {
        redrawCanvasWithSmoothing();
    }, [typedSignature, redrawCanvasWithSmoothing]);
    const borderStyles = () => {
        if (isDrawing && !isDisabled)
            return { borderColor: themeColor };
        if (isDisabled)
            return { borderColor: "#ccc" };
        if (isError)
            return { borderColor: "#f44336" };
        return {};
    };
    return (jsxRuntime.jsxs("div", { className: "signature-input-container", style: Object.assign({ width: "100%", maxWidth: `${width}px`, minWidth: `${Math.min(width, 100)}px` }, style), children: [jsxRuntime.jsx("canvas", { className: `drawing-canvas`, ref: signaturePadRef, style: Object.assign({ touchAction: "none", width: "100%", height: "100%", maxWidth: `${width}px`, aspectRatio: `${width} / ${height}`, cursor: isDisabled
                        ? "not-allowed"
                        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'/%3E%3C/svg%3E") 0 24, pointer` }, borderStyles()) }), jsxRuntime.jsxs("div", { style: {
                    display: "flex",
                    gap: 1,
                    justifyContent: "space-between",
                    flexDirection: "column",
                    marginTop: "10px",
                }, children: [clear && (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [buttonType === "button" && (jsxRuntime.jsx(jsxRuntime.Fragment, { children: jsxRuntime.jsx(Button, { onClick: handleClear, disabled: !hasStrokes || isDisabled, style: { backgroundColor: themeColor }, children: "Clear" }) })), buttonType === "text" && (jsxRuntime.jsx(jsxRuntime.Fragment, { children: jsxRuntime.jsx(TextButton, { onClick: handleClear, disabled: !hasStrokes || isDisabled, style: { color: themeColor, opacity: !hasStrokes ? 0.5 : 1 }, children: "Clear" }) }))] })), download && (jsxRuntime.jsx(Button, { onClick: handleDownload, disabled: !hasStrokes, style: { backgroundColor: themeColor }, children: "Download" }))] })] }));
};

exports.SignatureInput = SignatureInput;
//# sourceMappingURL=index.cjs.js.map
