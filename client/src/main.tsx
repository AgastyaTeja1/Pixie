import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global styles for Pixie
const style = document.createElement('style');
style.textContent = `
  .pixie-gradient {
    background: linear-gradient(45deg, #5851DB, #E1306C, #FCAF45);
  }
  .pixie-gradient-text {
    background: linear-gradient(45deg, #5851DB, #E1306C, #FCAF45);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
  .story-border {
    background: linear-gradient(45deg, #5851DB, #E1306C, #FCAF45);
    padding: 2px;
  }
  .post-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3px;
  }
  .active-nav {
    position: relative;
  }
  .active-nav::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(45deg, #5851DB, #E1306C, #FCAF45);
  }
  @media (min-width: 768px) {
    .post-grid {
      gap: 28px;
    }
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);

// Add fonts
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Montserrat:wght@500;600&display=swap';
document.head.appendChild(link);

// Add Remix icon
const remixIcon = document.createElement('link');
remixIcon.rel = 'stylesheet';
remixIcon.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
document.head.appendChild(remixIcon);

// Add title
const title = document.createElement('title');
title.textContent = 'Pixie - Share Your Moments';
document.head.appendChild(title);

createRoot(document.getElementById("root")!).render(<App />);
