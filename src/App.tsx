import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToolsIndex } from './pages/ToolsIndex';
import { ImageToolsPage } from './pages/ImageToolsPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ToolsIndex />} />
          <Route path="/image-tools" element={<ImageToolsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
