# DrowWithMe

**DrowWithMe** — это современное многопользовательское веб-приложение для совместного рисования на бесконечном холсте.  
Проект реализован на **React** (frontend), **FastAPI** (backend) и использует **PostgreSQL** для хранения данных. Все сервисы запускаются через **Docker**.

---

## 🚀 Возможности

- Совместный бесконечный холст: рисуйте одновременно с друзьями или коллегами
- Миникарта и современная панель инструментов в стиле Photoshop/MapGenie
- Настраиваемые кисти, ластик, выбор цвета и толщины
- Глобальное масштабирование и перемещение холста
- Регистрация и авторизация пользователей (JWT)
- Гибкая система локализации (русский/английский язык)
- Масштабируемая архитектура: фронтенд, бэкенд и БД изолированы в Docker-контейнерах

---

## 🌍 Локализация
Приложение поддерживает русский и английский языки.
Выберите язык с помощью глобального переключателя в правом верхнем углу.

---

## 📝 TODO
1) Мультимаркерные инструменты и объекты (будет в релизах 2.0+)
2) Публичные и приватные комнаты
3) Интеграция с облачным хранилищем
4) Поддержка мобильных устройств
5) Публикация в интернет

---

## 🤝 Контрибьютинг
Pull request и багрепорты приветствуются!

---

## 📦 Структура проекта
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


## Комментарии по структуре
- backend/ — папка бэкенда FastAPI + миграции, Dockerfile, requirements.txt и пр.
- frontend/ — фронтенд (React/Vite), все компоненты, утилиты, стили, переводы, assets и т.д.
- src/components/ — React-компоненты.
- src/assets/ — иконки, шрифты.
- src/locales/ — переводы (en/ru папки).
- src/styles/ — CSS/переменные.
- src/utils/ — вспомогательные функции, хуки и пр.
- README.md — описание на русском
- README_en.md — описание на английском
- docker-compose.yml — корневой файл для сборки всей системы.