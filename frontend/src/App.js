import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AttendanceApp from "./pages/AttendanceApp";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/attendance/*" element={<AttendanceApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;