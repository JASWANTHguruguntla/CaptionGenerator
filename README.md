<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VvcRXMcuV_3H2OpnqZDOcUwp_bA4oHVe

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# 🧠 AI Image Caption Generator

An AI-powered web app that automatically generates **creative captions** and **hashtags** for any image — perfect for platforms like **Instagram**, **LinkedIn**, **Facebook**, and **X (Twitter)**. Built using **React + Vite + TypeScript**, powered by **Google Gemini AI**, and deployed securely on **Vercel**.

---

## 🚀 Features

- 🖼️ Upload any image — get short, medium, and story-style captions instantly
- 🤖 Powered by **Google Gemini AI** for smart, context-aware captions
- 🎯 Platform-specific and tone-based caption customization
- ⚡ Built using **React + Vite + TypeScript** for fast performance
- 🎨 Styled with **Tailwind CSS**
- 🔒 Secure API handling through environment variables and serverless routes

---

## 💡 How I Built It

I developed this project using **React + Vite + TypeScript** for a modern, modular frontend. For styling, I used **Tailwind CSS** to achieve a sleek and responsive UI. The caption generation is powered by **Google Gemini AI**, which analyzes the uploaded image and generates suitable captions and hashtags.

Deployment was done using **Vercel**, ensuring smooth hosting and secure handling of API keys through **environment variables** and **serverless functions**.

---

## 🔥 My Journey

During development, I faced a few challenges:
- Handling **Google AI key initialization errors**
- Setting up **environment variables securely** in Vercel
- Structuring **frontend-backend communication** for AI requests

Overcoming these issues helped me understand **secure API integration**, **real-world AI usage**, and **production deployment** workflows.

---

## ⚙️ Tech Stack

| Technology | Purpose |
|-------------|----------|
| **React + Vite + TypeScript** | Frontend framework |
| **Tailwind CSS** | Styling |
| **Google Gemini AI** | Caption and hashtag generation |
| **Vercel** | Hosting and serverless backend |
| **Node.js** | Server runtime for API calls |

---

## 🧩 Project Links

🔗 **Main Live Site (Production):** [https://caption-generator-taupe.vercel.app](https://caption-generator-taupe.vercel.app)  
🧪 **Test Deployment 1:** [https://caption-generator-o07veobz-jaswanths-projects-18c2a1c4.vercel.app](https://caption-generator-o07veobz-jaswanths-projects-18c2a1c4.vercel.app)  
🧩 **Test Deployment 2:** [https://caption-generator.vercel.app](https://caption-generator.vercel.app)

> Each version was used at different stages of development — from API integration testing to final production deployment.

---

## 🧠 AI Model Used

**Google Gemini 2.5 Flash** — a multimodal model capable of understanding both **images and text**, generating descriptive, engaging, and platform-tailored captions.

---

## 🧾 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/JASWANTHguruguntla/CaptionGenerator.git
cd CaptionGenerator
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Add Environment Variable
Create a `.env` file in the root directory and add:
```
VITE_API_KEY=your_google_genai_api_key
```

⚠️ **For production**, store your key securely in Vercel → Project Settings → Environment Variables (Key: `API_KEY`).

### 4️⃣ Run the App
```bash
npm run dev
```

Then open 👉 http://localhost:5173

---

## 🧠 Folder Structure

```
CaptionGenerator/
├── components/
│   ├── Controls.tsx
│   ├── HistoryPanel.tsx
│   ├── ImageUploader.tsx
│   ├── ResultDisplay.tsx
│   ├── ShareButtons.tsx
│   └── icons/
│       └── UploadIcon.tsx
│
├── services/
│   └── geminiService.ts
│
├── utils/
│   └── fileUtils.ts
│
├── App.tsx
├── index.html
├── index.tsx
├── vite.config.ts
└── tsconfig.json
```

---

## 🧑‍💻 Author

👤 **Jaswanth Guruguntla**  
📧 jaswanthmemories@gmail.com  
🌐 [GitHub](https://github.com/JASWANTHguruguntla)

---

## 💬 Feedback

If you find any bugs, errors, or have feature suggestions, please feel free to open an issue or comment! Your feedback means a lot and helps me improve this project 🙌

⭐ **Don't forget to star the repo if you like it!**
