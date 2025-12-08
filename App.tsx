
import { HashRouter, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import PreviewPage from './pages/PreviewPage';
import { AssetFormV2 } from './components/forms/AssetFormV2';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/chat/detail/:id" element={<EditorPage />} />
        <Route path="/preview/lease/:id" element={<PreviewPage />} />
        <Route path="/v2/assets" element={<div className="min-h-screen bg-slate-50"><AssetFormV2 /></div>} />
      </Routes>
    </HashRouter>
  );
}

export default App;
