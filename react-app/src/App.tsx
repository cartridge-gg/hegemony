import "./App.css";

import { useQueryParams } from "./hooks/useQueryParams";
import { GameScreen } from "./ui/screens/GameScreen";
import { GameLobby } from "./ui/screens/GameLobby";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

export const CoreScreen = () => {
  const { gameId } = useQueryParams();
  return <>{gameId ? <GameScreen /> : <GameLobby />}</>;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<CoreScreen />} />
        </Routes>
        <Toaster />
      </Router>
    </>
  );
}

export default App;
