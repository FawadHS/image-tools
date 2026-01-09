import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToolsIndex } from './pages/ToolsIndex';
import { ImageToolsPage } from './pages/ImageToolsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ToolsIndex />} />
        <Route path="/image-tools" element={<ImageToolsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
