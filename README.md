# Pixie

Pixie is a modern, full-stack image sharing platform inspired by Instagram. It allows users to upload images, explore feeds, and interact—all in a fast, responsive web app.

---

## Link to access Pixie
https://pixify.replit.app/

---

## 🚀 Features

- User authentication and registration
- Image upload, feed, and viewing
- Explore art styles and posts from other users
- Responsive, modern UI (React + Tailwind CSS)
- REST API backend (Express + TypeScript)
- File storage and scalable architecture

---

## 🛠️ Tech Stack

| Layer         | Technology                                |
|---------------|-------------------------------------------|
| Frontend      | React, Wouter, TypeScript, Vite           |
| Styling       | Tailwind CSS                              |
| State/API     | TanStack React Query                      |
| Backend       | Express.js, TypeScript                    |
| Database      | Postgres                                  |
| Auth          | JWT/Cookies                               |
| File Storage  | Local                                     |

---

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Pixie.git
cd Pixie
```

### 2. Install dependencies

```bash
npm install
# or use pnpm/yarn if preferred
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add your environment variables (database URL, JWT secret, etc).

Example:
```
DATABASE_URL=your_db_url
JWT_SECRET=your_jwt_secret
```

### 4. Run the app in development mode

```bash
npm run dev
```

- Frontend served via Vite (default: http://localhost:5173)
- Backend runs on Express (default: http://localhost:5000)

### 5. Build for production

```bash
npm run build
npm run start
```

---

## 🖼️ Project Structure

```
Pixie/
  ├── client/         # React frontend
  ├── server/         # Express backend
  ├── shared/         # Shared types/utilities
  ├── public/         # Static files
  ├── package.json
  └── ...etc
```

---

## 📝 Scripts

| Script          | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Runs frontend and backend in dev mode    |
| `npm run build` | Builds production assets                 |
| `npm run start` | Starts backend server                    |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT

---

## 🙋‍♂️ Contact

For questions or feedback, open an issue or contact [agastyatejaatluri@gmail.com](mailto:agastyatejaatluri@gmail.com).

```
