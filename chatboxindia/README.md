# ChatBoxIndia MVP

This project contains:

- `backend/`: Node.js + Express + Socket.IO backend
- `mobile/`: Flutter-ready client scaffold and UI code

## Current status

The backend is runnable in this environment.
The mobile app structure is provided, but Flutter is not installed on this machine, so I could not execute Flutter commands here.

## Backend run

```bash
cd /Users/naresh/Desktop/PythonMaster/chatboxindia/backend
npm install
npm run dev
```

Backend URL:

- `http://localhost:8090`
- health: `http://localhost:8090/health`

Demo login:

- `naresh@chatboxindia.app` / `demo123`
- `ananya@chatboxindia.app` / `demo123`

## Mobile app

Install Flutter first, then use the files under `mobile/`.

Once Flutter is installed, you can run:

```bash
cd /Users/naresh/Desktop/PythonMaster/chatboxindia/mobile
flutter pub get
flutter run
```
