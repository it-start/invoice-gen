
import { HashRouter, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import PreviewPage from './pages/PreviewPage';
import { AssetFormV2 } from './components/forms/AssetFormV2';
import AssetInventoryPage from './pages/AssetInventoryPage';
import SchedulerPage from './pages/SchedulerPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/chat/detail/:id" element={<EditorPage />} />
        <Route path="/preview/lease/:id" element={<PreviewPage />} />
        <Route path="/v2/assets" element={<div className="min-h-screen bg-slate-50"><AssetFormV2 /></div>} />
        <Route path="/v2/inventory" element={<AssetInventoryPage />} />
        <Route path="/v2/scheduler" element={<SchedulerPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
