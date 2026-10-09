# 🇮🇳 SmartVote India

**Understand Elections. Vote Smart.**

SmartVote India is a comprehensive web platform designed to educate citizens about the Indian democratic process, provide a realistic EVM (Electronic Voting Machine) simulation, assist voters with an AI chatbot, and combat misinformation through a fake news detection portal.

## 🌟 Features

* **Interactive Learning Modules** (`learning.html`): Engaging content to help citizens understand the complexities of the Indian electoral system.
* **EVM Simulator** (`simulator.html`): A risk-free, realistic simulation of the Indian Electronic Voting Machine, allowing first-time voters to practice casting their ballot before election day.
* **AI Election Assistant** (`chatbot.html`): An AI-powered assistant that answers questions about candidates, constituencies, and voting procedures.
* **Fake News Detection** (`fakenews.html`): A dedicated tool designed to fact-check claims and identify misinformation to help voters make informed decisions.
* **Civic Dashboard** (`dashboard.html`): A maintenance and analytics dashboard for tracking civic data and user engagement.

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3 (Premium Glassmorphism Design), Vanilla JavaScript (ES Modules)
* **Backend & Cloud**: Firebase (Hosting, Firestore NoSQL Database, Authentication with Google Sign-In)
* **Artificial Intelligence**: Google Gemini API (`gemini-2.0-flash`)
* **Localization**: Google Cloud Translation API & Bilingual Dictionaries

## 🚀 Live Demo

Live URL: [https://election-262a7.web.app/](https://election-262a7.web.app/)

## 💻 Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Anik-da/VoteSmart.git
   ```
2. Navigate into the directory:
   ```bash
   cd VoteSmart
   ```
3. Install dependencies (optional for Vite build & automated test suite):
   ```bash
   npm install
   ```
4. Run locally:
   ```bash
   npm run dev
   # or
   npx serve .
   ```
5. Run the 7-Pillar evaluation test suite:
   ```bash
   npm test
   ```

## 🤖 Google Gemini AI Integration

VoteSmart leverages Google's cutting-edge **Gemini 2.0 Flash** model directly for its intelligent civic features:

* **💬 AI Election Assistant (`chatbot.html`)**: Powered by Gemini with structured system prompts to provide non-partisan, accurate information about voter registration, polling booths, EVMs, and Indian election regulations.
* **🔍 Fake News & Fact-Checking Engine (`fakenews.html`)**: Utilizes Gemini's multimodal reasoning to analyze headlines, political claims, and viral rumors, categorizing content into `Verified Fact`, `Misleading`, or `False / Fake News` with detailed justification.
* **🌐 Multilingual Accessibility (`translate.js`)**: Real-time translation supporting Indian regional languages using Google Cloud Translation and native phonetic dictionaries.

## ⚙️ Configuration & Environment Variables

The project uses modular configuration generated via `scripts/generate-config.js` into `config.js`. 

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Google Gemini AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Google Translation Configuration
TRANSLATE_API_KEY=your_gemini_api_key_here

# Firebase Web App Config (Optional override)
# FIREBASE_CONFIG={"projectId":"...","appId":"...","apiKey":"..."}
```

### Key Parameters:
* `AI_PROVIDER`: Set to `gemini` (default active provider).
* `GEMINI_API_KEY`: Your Google Gemini API Key from Google AI Studio.
* `GEMINI_MODEL`: Model name (defaults to `gemini-2.0-flash` for high-speed, accurate responses).
* `TRANSLATE_API_KEY`: Google API Key used for on-the-fly Hindi and regional translations.

## 📜 License

This project is built for the empowerment of the next generation of voters. All rights reserved. Built with pride for democracy.
