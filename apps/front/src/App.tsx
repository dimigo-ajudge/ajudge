// import './App.css'
import { BrowserRouter } from "react-router-dom";
import AppStyle from "./App.style.ts";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import PrimaryLayout from "./layouts/PrimaryLayout.tsx";
import AppRouter from "./routes/AppRouter.tsx";

function App() {
  return (
    <BrowserRouter>
      <AppStyle />
      <AuthProvider>
        <PrimaryLayout>
          <AppRouter />
        </PrimaryLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
