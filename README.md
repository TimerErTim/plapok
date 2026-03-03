# 🕯️ The Ritual

> *"The pages are empty. History begins with you."*

**The Ritual** is a massively multiplayer collaborative writing experiment. It is a real-time application where users from around the world vote on the next word of a never-ending story.

Built with **Next.js**, **Tailwind CSS**, and **SpacetimeDB**, it combines a "Dark Academia" aesthetic with high-performance real-time state synchronization.

## ✨ Features

### 📖 The Book (The History)

* **Infinite Chronicle:** A persistent, scrolling view of the story so far.
* **Deep Lore (Metadata):** Hover over any accepted word to reveal its "stratigraphy"—the exact date it was chosen and the vote distribution of the candidates it defeated.
* **Smart Positioning:** Tooltips use intelligent edge-detection to ensure data is always visible, never clipped.

### ⚔️ The Arena (The Present)

* **Visualized Democracy:** A dynamic "Word Cloud" where candidate words grow in size based on their vote share.
* **Real-time Updates:** Watch votes come in live as the timer counts down.
* **Bandwagoning:** An autocomplete system suggests currently trending words, allowing users to consolidate votes easily.

### 🌍 The Assembly (The Users)

* **Geolocation Tags:** Votes are stamped with the user's country flag (detected via IP or browser locale), adding a layer of global context to the collaboration.
* **Ritualistic UI:** A custom design system built on Stone, Amber, and Parchment tones, utilizing `lucide-react` icons and serif typography.

## 🛠️ Tech Stack

* **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React, TypeScript.
* **Styling:** Tailwind CSS (Custom color palette).
* **Backend & DB:** [SpacetimeDB](https://spacetimedb.com/) (Rust-based real-time database).
* **Utilities:** `country-flag-icons` for geolocation visuals.

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **SpacetimeDB CLI** (installed and running)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/the-ritual.git
cd the-ritual

```


2. **Install dependencies:**
```bash
npm install
# or
yarn install

```


3. **Start the SpacetimeDB Backend:**
Ensure your SpacetimeDB instance is running and the module is published.
```bash
spacetime start
spacetime publish -c # Publish your rust module

```


4. **Run the Frontend:**
```bash
npm run dev

```


5. **Join the Ritual:**
Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

## 📂 Project Structure

```
.
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/
│   │   ├── RitualView.tsx  # Main game logic and UI
│   │   └── ...
│   ├── module_bindings/    # Generated SpacetimeDB TypeScript bindings
│   └── ...
├── public/                 # Static assets (favicons, etc.)
└── ...

```

## 🎨 Design Philosophy

The UI is designed to feel like an ancient interface or a digital stone tablet.

* **Primary Colors:** `stone-950` (Background), `stone-200` (Text).
* **Accent:** `amber-500` to `amber-700` (representing fire/gold/importance).
* **Interactions:** Hover states glow; successful actions feel weighty.

## 🤝 Contributing

The Ritual is open to acolytes. If you wish to improve the UI or optimize the backend logic:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
