import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToolsIndex } from './pages/ToolsIndex';
import { ImageToolsPage } from './pages/ImageToolsPage';

function App() {
  return (
    <Router basename="/image-tools">
      <Routes>
        <Route path="/" element={<ToolsIndex />} />
        <Route path="/converter" element={<ImageToolsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
