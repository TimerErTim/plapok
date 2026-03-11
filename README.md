# 🚀 Plapok

<p align="center">
  <a href="https://plapok.timerertim.eu"><img src="./web/public/plapok.svg" alt="Plapok logo" width="128" /></a>
</p>


**Plapok** is a beautiful, minimal planning poker application designed for agile teams who value speed and simplicity. Built with **React**, **HeroUI v3**, and powered by **SpacetimeDB 2.0**, it offers real-time synchronization without the overhead of traditional state management.

## 🛠 Tech Stack

* **Frontend**: React (TSX) + Vite
* **UI Components**: [HeroUI v3](https://v3.heroui.com/) (formerly NextUI)
* **Styling**: Tailwind CSS
* **Backend/Database**: [SpacetimeDB 2.0](https://spacetimedb.com/) (Rust-based server modules)
* **Runtime/Env Management**: [mise](https://mise.jdx.dev/) (mise-en-place)

---

## 🏗 Setup & Mise-en-place

We use **mise** to ensure every contributor has the exact same versions of Node, Rust, and the SpacetimeDB CLI.

### 1. Install mise

If you don't have it yet:

```bash
curl https://mise.jdx.dev/install.sh | sh
```

### 2. Trust and Install Tools

Clone the repo and run:

```bash
# Setup all runtimes (Node, Rust, SpacetimeDB CLI)
mise trust
mise run prepare:web
```

---

## 🚀 Quick Start

### Backend (SpacetimeDB)

The backend logic lives in the `/server` directory and is written in Rust.

1. **Start SpacetimeDB locally**:
```bash
spacetime start
```

### Frontend

1. **Install dependencies**:
```bash
mise run prepare:web
```

### Configuration

Create two files for local deployment:

1. `spacetime.local.json` 
    ```json
    {
        "server": "local",
        "database": "plapok-01"
    }
    ```
2. `mise.local.toml` 
    ```toml
    [env]
    VITE_SPACETIMEDB_URI = "http://localhost:3000"
    VITE_SPACETIMEDB_MODULE = "plapok-01"
    ```


**Run the dev environment**:
```bash
mise run dev
```

---

## 🎮 Features

* **No Accounts**: Just enter a name and a room code.
* **Real-time**: Powered by SpacetimeDB reducers; no WebSockets to manually manage.
* **Minimalist UI**: Pastel matte aesthetics with light/dark mode support.
* **Responsive**: Designed for mobile standby and desktop "second-screen" use.

---

## 📜 Contributing

1. Check out a new branch: `git checkout -b feature/cool-feature`
2. Ensure `mise` has your environment synced.
3. Submit a PR!
