import { HashRouter, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import PreviewPage from './pages/PreviewPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/preview/lease/:id" element={<PreviewPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;