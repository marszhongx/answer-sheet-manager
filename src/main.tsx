import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { useAppStore } from "./store/appStore";
import "./styles.css";

// 初始化由入口显式触发（F12）：不再依赖模块加载副作用，测试可自行控制初始化时序。
void useAppStore.getState().initialize();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
