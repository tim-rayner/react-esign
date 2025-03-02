# **react-esign** ✍️  
**A lightweight, dependency-free signature input component for React.**  

[![NPM](https://img.shields.io/npm/v/react-esign)](https://www.npmjs.com/package/react-esign)  
[![Live Demo](https://img.shields.io/badge/Live%20Demo-%E2%86%92-blue)](https://react-esign-docs.vercel.app/)  

`react-esign` makes it effortless to capture **smooth, customizable digital signatures** in React apps. **No dependencies, no bloat—just a simple and powerful signature input.**  

🔗 **[Live Demo & Docs](https://react-esign-docs.vercel.app/)**  

---

## **📦 Installation**  

Install via npm or yarn:  

```sh
npm install react-esign
# or
yarn add react-esign
```

---

## **🛠 Usage**  

### **Basic Integration**  

```jsx
import { SignatureInput } from "react-esign";

const SignaturePad = () => {
  const handleSignatureChange = (file: File) => {
    console.log("Signature Changed");
  };

  return <SignatureInput onChange={handleSignatureChange} />;
};

export default SignaturePad;
```

> 🎯 **That’s it!** You now have a working signature input in your React app.  

---

## **🎨 Customization**  

Easily customize styles, theme, and behavior:  

```jsx
import { SignatureInput } from "react-esign";

const CustomSignaturePad = () => {
  return (
    <SignatureInput
      onChange={(file) => console.log("Signature Changed")}
      isDisabled={false}
      isError={false}
      themeColor="#E50914"
      strokeWidth={3}
      clear
      download
      width={550}
      height={150}
    />
  );
};

export default CustomSignaturePad;
```

### **Available Props**  

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onChange` | `(file: File) => void` | **Required** | Callback triggered when signature changes |
| `isDisabled` | `boolean` | `false` | Disables input when `true` |
| `isError` | `boolean` | `false` | Applies an error style when `true` |
| `themeColor` | `string` | `"#000"` | Sets active border & button color |
| `strokeWidth` | `number` | `2` | Signature stroke thickness |
| `clear` | `boolean` | `false` | Shows a button to clear signature |
| `download` | `boolean` | `false` | Shows a button to download signature |
| `width` | `number` | `400` | Canvas width |
| `height` | `number` | `200` | Canvas height |

🔗 **See the full API reference →** [Docs](https://react-esign-docs.vercel.app/)  

---

## **🚀 Try It Live**  

🔗 **Check out the interactive demo →** [react-esign-docs.vercel.app](https://react-esign-docs.vercel.app/)  

---

## **📜 License**  
MIT License. See [LICENSE](LICENSE) for details.  

---

## **⭐ Support & Feedback**  
If you find `react-esign` useful, **give it a star on GitHub** ⭐ and share it with fellow developers!  

🚀 **Happy Coding!**
