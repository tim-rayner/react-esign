'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

var css_248z = ".signature-input-container{align-items:flex-start;display:flex;flex-direction:column;height:100%;position:relative}.signature-input-container .button{align-self:flex-start;border:none;border-radius:4px;box-shadow:0 3px 1px -2px rgba(0,0,0,.2),0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12);color:#fff;cursor:pointer;font-size:.875rem;font-weight:500;letter-spacing:.02857em;line-height:1.75;margin:6px 0;padding:6px 16px;transition:background-color .25s cubic-bezier(.4,0,.2,1) 0ms,box-shadow .25s cubic-bezier(.4,0,.2,1) 0ms}.signature-input-container .button:hover{cursor:pointer}.signature-input-container .text-button{background-color:transparent;box-shadow:none;color:#000;padding:2px 6px 2px 0}.signature-input-container .text-button:hover{cursor:pointer}.signature-input-container .text-button:disabled{box-shadow:none;color:rgba(0,0,0,.26);cursor:default}.signature-input-container .button:hover{box-shadow:0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12)}.signature-input-container .button:disabled{background-color:rgba(0,0,0,.12);box-shadow:none;color:rgba(0,0,0,.26);cursor:default}.drawing-canvas{background-color:#fff;border:2px solid rgba(0,0,0,.1);border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.1);cursor:crosshair;margin:24px auto}.drawing-canvas.is-drawing{border-color:#1976d2}.drawing-canvas.is-disabled{border-color:#ccc}.drawing-canvas.is-error{border-color:#f44336;cursor:default}@media (max-width:600px){.drawing-canvas{display:block;margin-left:auto;margin-right:auto}}";
styleInject(css_248z);

const Button = ({ children, onClick, disabled, style }) => {
    return (jsxRuntime.jsx("button", { onClick: onClick, disabled: disabled, style: disabled ? undefined : style, className: "button", children: children }));
};
const TextButton = ({ children, onClick, disabled, style }) => {
    return (jsxRuntime.jsx("button", { onClick: onClick, disabled: disabled, style: style, className: "text-button", children: children }));
};
const SignatureInput = ({ onChange, isDisabled, isError, width = 450, height = 150, themeColor = "#1976d2", strokeWidth = 2, inputMode = "draw", //experimental
buttonType = "button", download = false, clear = true, }) => {
    const [isDrawing, setIsDrawing] = react.useState(false);
    const [hasStrokes, setHasStrokes] = react.useState(false);
    const signaturePadRef = react.useRef(null);
    const ctxRef = react.useRef(null);
    const strokesRef = react.useRef([]); // Stores all stroke paths
    const currentStrokeRef = react.useRef([]); // Current stroke
    const [typedSignature, setTypedSignature] = react.useState(""); // Holds user-typed signature
    const initializeCanvas = react.useCallback(() => {
        if (!signaturePadRef.current)
            return;
        const canvas = signaturePadRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#000";
        ctxRef.current = ctx;
    }, []);
    react.useEffect(() => {
        initializeCanvas();
        return () => {
            ctxRef.current = null; // Cleanup
        };
    }, [initializeCanvas]);
    const handleClear = react.useCallback(() => {
        if (!ctxRef.current)
            return;
        ctxRef.current.clearRect(0, 0, ctxRef.current.canvas.width, ctxRef.current.canvas.height);
        strokesRef.current = [];
        currentStrokeRef.current = [];
        setTypedSignature("");
        setHasStrokes(false);
        onChange(undefined);
    }, [onChange]);
    const handlePointerDown = react.useCallback((event) => {
        if ((inputMode === "auto" || inputMode === "draw") &&
            ctxRef.current &&
            signaturePadRef.current) {
            console.log("handlePointerDown setting isDrawing to true");
            setIsDrawing(true);
            const rect = signaturePadRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(x, y);
            currentStrokeRef.current = [{ x, y }];
        }
    }, [inputMode]);
    const handlePointerMove = react.useCallback((event) => {
        if ((inputMode !== "draw" && inputMode !== "auto") ||
            !isDrawing ||
            !ctxRef.current ||
            !signaturePadRef.current)
            return;
        const rect = signaturePadRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
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
            return () => null;
        const canvas = signaturePadRef.current;
        canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
        canvas.addEventListener("pointerdown", handlePointerDown);
        canvas.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);
        const cleanup = () => {
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
    const smoothStroke = (points) => {
        if (points.length < 3)
            return points; // Not enough points to smooth
        let smoothed = [];
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
    // Update canvas when typed signature changes
    react.useEffect(() => {
        redrawCanvasWithSmoothing();
    }, [typedSignature, redrawCanvasWithSmoothing]);
    const borderStyles = () => {
        if (isDrawing)
            return { borderColor: themeColor };
        if (isDisabled)
            return { borderColor: "#ccc" };
        if (isError)
            return { borderColor: "#f44336" };
        return {};
    };
    return (jsxRuntime.jsxs("div", { className: "signature-input-container", children: [jsxRuntime.jsx("canvas", { className: `drawing-canvas`, ref: signaturePadRef, width: width, height: height, style: Object.assign({ touchAction: "none" }, borderStyles()) }), jsxRuntime.jsxs("div", { style: {
                    display: "flex",
                    gap: 1,
                    justifyContent: "space-between",
                    flexDirection: "column",
                }, children: [clear && (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [buttonType === "button" && (jsxRuntime.jsx(jsxRuntime.Fragment, { children: jsxRuntime.jsx(Button, { onClick: handleClear, disabled: !hasStrokes, style: { backgroundColor: themeColor }, children: "Clear" }) })), buttonType === "text" && (jsxRuntime.jsx(jsxRuntime.Fragment, { children: jsxRuntime.jsx(TextButton, { onClick: handleClear, disabled: !hasStrokes, children: "Clear" }) }))] })), download && (jsxRuntime.jsx(Button, { onClick: handleDownload, disabled: !hasStrokes, style: { backgroundColor: themeColor }, children: "Download" }))] })] }));
};

exports.SignatureInput = SignatureInput;
exports.default = SignatureInput;
//# sourceMappingURL=index.cjs.js.map
