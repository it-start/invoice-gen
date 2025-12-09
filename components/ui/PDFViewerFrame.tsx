
import React, { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Loader2 } from 'lucide-react';

interface PDFViewerFrameProps {
  children: React.ReactElement;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const PDFViewerFrame: React.FC<PDFViewerFrameProps> = ({ children, className = "", width = '100%', height = '100%' }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const generatePdf = async () => {
      try {
        const blob = await pdf(children).toBlob();
        const objectUrl = URL.createObjectURL(blob);
        if (isMounted) setUrl(objectUrl);
      } catch (err) {
        console.error("PDF Generation Error:", err);
        if (isMounted) setError("Failed to generate PDF preview.");
      }
    };

    generatePdf();

    return () => {
      isMounted = false;
      if (url) {
        try {
            URL.revokeObjectURL(url);
        } catch (e) {
            // ignore cleanup errors
        }
      }
    };
  }, [children]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 text-red-500 p-4 border border-slate-200 rounded-lg ${className}`} style={{ width, height }}>
        <p className="text-sm font-bold">{error}</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 border border-slate-200 rounded-lg ${className}`} style={{ width, height }}>
        <Loader2 className="animate-spin mb-2 text-blue-500" size={24} />
        <span className="text-xs font-bold uppercase tracking-wider">Generating Preview...</span>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      width={width}
      height={height}
      className={`border-none w-full h-full ${className}`}
      title="PDF Preview"
    />
  );
};
