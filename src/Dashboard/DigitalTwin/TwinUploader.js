import React, { useState, useRef } from 'react';
import { extractTwin } from 'apiService';

const TwinUploader = ({ onResult, onClose }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    // Generate preview URLs
    const newPreviews = selected.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx].url);
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setProgress('Uploading photos and analyzing with AI...');

    try {
      const result = await extractTwin(files);
      setProgress('Done!');
      onResult(result);
    } catch (err) {
      console.error('[TwinUploader]', err);
      setError(err.response?.data?.detail || err.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="twin-uploader">
      <div className="twin-uploader__header">
        <h3>Upload Menu Photos</h3>
        <button className="twin-uploader__close" onClick={onClose}>&times;</button>
      </div>

      <p className="twin-uploader__hint">
        Upload front and back photos of your menu card. Lay it flat, shoot from above, good lighting.
      </p>

      <div className="twin-uploader__dropzone" onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          style={{ display: 'none' }}
        />
        <span className="twin-uploader__dropzone-text">
          Click to add photos
        </span>
      </div>

      {previews.length > 0 && (
        <div className="twin-uploader__previews">
          {previews.map((p, i) => (
            <div key={i} className="twin-uploader__preview">
              <img src={p.url} alt={p.name} />
              <button className="twin-uploader__preview-remove" onClick={() => removeFile(i)}>
                &times;
              </button>
              <span className="twin-uploader__preview-name">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="twin-uploader__error">{error}</div>}
      {progress && loading && <div className="twin-uploader__progress">{progress}</div>}

      <div className="twin-uploader__actions">
        <button
          className="twin-uploader__btn"
          onClick={handleExtract}
          disabled={files.length === 0 || loading}
        >
          {loading ? 'Analyzing...' : `Analyze ${files.length} photo${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};

export default TwinUploader;
