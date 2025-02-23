import "./esign.css";
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
declare const SignatureInput: ({ onChange, isDisabled, isError, width, height, themeColor, strokeWidth, inputMode, buttonType, download, clear, }: SignatureInputProps) => import("react/jsx-runtime").JSX.Element;
export default SignatureInput;
