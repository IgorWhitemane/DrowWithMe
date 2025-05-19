# DrowWithMe

**DrowWithMe** is a modern multiplayer web application for collaborative drawing on an infinite canvas.  
The project is implemented using **React** (frontend), **FastAPI** (backend), and uses **PostgreSQL** for data storage. All services run via **Docker**.

---

## 🚀 Features

- Shared infinite canvas: draw simultaneously with friends or colleagues
- Minimap and modern toolbar in the style of Photoshop/MapGenie
- Customizable brushes, eraser, color and thickness selection
- Global zoom and pan of the canvas
- User registration and authentication (JWT)
- Flexible localization system (English/Russian)
- Scalable architecture: frontend, backend, and database are isolated in Docker containers

---

## 🌍 Localization
The application supports English and Russian languages.  
Select the language using the global switcher in the top right corner.

---

## 📝 TODO
1) Multi-marker tools and objects (will be in releases 2.0+)
2) Public and private rooms
3) Cloud storage integration
4) Mobile device support
5) Publishing on the Internet

---

## 🤝 Contributing
Pull requests and bug reports are welcome!

---

## 📦 Project Structure
DrowWithMe/
│
├── backend/
│   ├── __pycache__/
│   ├── migrations/
│   ├── alembic.ini
│   ├── auth.py
│   ├── Dockerfile
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── assets/
│       │   ├── fonts/
│       │   └── icons/
│       ├── components/
│       │   ├── Canvas.jsx
│       │   ├── LanguageSwitcher.jsx
│       │   ├── Login.jsx
│       │   ├── Marker.jsx
│       │   ├── Minimap.jsx
│       │   ├── Modal.jsx
│       │   ├── Register.jsx
│       │   ├── Sidebar.jsx
│       │   └── Toolbar.jsx
│       ├── hooks/
│       ├── locales/
│       │   ├── en/
│       │   └── ru/
│       ├── styles/
│       │   └── variables.css
│       ├── utils/
│       ├── App.jsx
│       ├── i18n.js
│       ├── index.css
│       └── main.jsx
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── vite.config.js
│   ├── .env
│   └── .env.example
│
├── .gitignore
├── docker-compose.yml
└── README.md


## Structure notes
- backend/ — FastAPI backend folder + migrations, Dockerfile, requirements.txt, etc.
- frontend/ — frontend (React/Vite), all components, utilities, styles, translations, assets, etc.
- src/components/ — React components.
- src/assets/ — icons, fonts.
- src/locales/ — translations (en/ru folders).
- src/styles/ — CSS/variables.
- src/utils/ — helper functions, hooks, etc.
- README.md — documentation (Rus)
- README_en.md — documentation (English)
- docker-compose.yml — root file for building the entire system.