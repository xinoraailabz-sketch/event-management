import React, { useState, useEffect } from 'react';
import { generateQRCodeURL } from '../../lib/utils';
import { Download, Printer, Check, Copy } from 'lucide-react';
import { Button } from './Button';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  primaryColor?: string;
  showActions?: boolean;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  primaryColor = '#0f172a',
  showActions = false,
  className,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    generateQRCodeURL(value, primaryColor).then((url) => {
      if (isMounted) setDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [value, primaryColor]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `eventflow-pass-qr-${value.substring(0, 12)}.png`;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className || ''}`}>
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center relative">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Event QR Code Pass"
            style={{ width: size, height: size }}
            className="rounded-lg object-contain"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-50 text-slate-400 text-xs rounded-lg animate-pulse"
          >
            Generating QR Code...
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Download PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}>
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
        </div>
      )}
    </div>
  );
};
