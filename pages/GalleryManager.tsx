import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { GalleryItem, Flock } from '../types';
import Skeleton from '../components/Skeleton';
import { Camera, Trash2, Upload, ChevronDown, X, Save, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { getCurrentBS } from '../utils/nepali';

interface Props {
  selectedFlockId: string;
}

export default function GalleryManager({ selectedFlockId }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [currentFlock, setCurrentFlock] = useState(selectedFlockId || '');
  const [loading, setLoading] = useState(true);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
        setFlocks(db.getFlocks());
        if (currentFlock) setItems(db.getGallery(currentFlock));
        else setItems([]);
        setLoading(false);
    }, 600);
  }, [currentFlock]);

  useEffect(() => {
    if(selectedFlockId) setCurrentFlock(selectedFlockId);
  }, [selectedFlockId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentFlock) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setCaption('');
        setIsUploadModalOpen(true);
        // Reset inputs
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const savePhoto = () => {
      if (!previewImage || !currentFlock) return;
      
      db.addGalleryItem({
          id: Date.now().toString() + Math.random().toString().slice(2, 5), // Ensure unique ID
          flockId: currentFlock,
          imageData: previewImage,
          date: getCurrentBS(),
          caption: caption || 'No caption'
      });
      
      setItems(db.getGallery(currentFlock));
      closeModal();
  };

  const closeModal = () => {
      setIsUploadModalOpen(false);
      setPreviewImage(null);
      setCaption('');
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          db.deleteGalleryItem(deleteId);
          setItems(db.getGallery(currentFlock));
          setDeleteId(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
          <div className="relative w-full md:w-auto">
              <select 
                  value={currentFlock} 
                  onChange={e => setCurrentFlock(e.target.value)}
                  className="w-full md:w-64 appearance-none border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 cursor-pointer transition-colors"
              >
                  <option value="">-- Select Flock --</option>
                  {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown size={16} />
              </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            {/* Camera Input */}
            <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={cameraInputRef}
                onChange={handleFileSelect}
            />
            <button 
                disabled={!currentFlock}
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm active:scale-95"
            >
                <Camera size={18} /> 
                <span>Camera</span>
            </button>

            {/* Gallery Input */}
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={galleryInputRef}
                onChange={handleFileSelect}
            />
            <button 
                disabled={!currentFlock}
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 md:flex-none bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm active:scale-95"
            >
                <ImageIcon size={18} /> 
                <span>Gallery</span>
            </button>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
             [...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100 border border-gray-200">
                     <Skeleton className="w-full h-full" />
                </div>
            ))
        ) : items.length > 0 ? (
            items.map(item => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden shadow-md aspect-square bg-gray-100 border border-gray-200">
                    <img src={item.imageData} alt="Flock" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    
                    {/* Delete Button - Always visible on top right for mobile accessibility */}
                    <button 
                        type="button"
                        onClick={(e) => initiateDelete(item.id, e)}
                        className="absolute top-2 right-2 bg-white text-red-500 hover:bg-red-500 hover:text-white p-2.5 rounded-full shadow-md transition-all z-20 active:scale-90"
                        title="Delete Photo"
                    >
                        <Trash2 size={20} />
                    </button>

                    {/* Caption Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                        <p className="text-white text-sm font-medium truncate mb-1 shadow-black drop-shadow-md">{item.caption}</p>
                        <span className="text-gray-300 text-xs shadow-black drop-shadow-md">{item.date}</span>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <div className="flex flex-col items-center">
                    <Camera size={48} className="text-gray-300 mb-2" />
                    <p>Select a flock and take photos or upload from gallery</p>
                </div>
            </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">New Photo</h3>
                      <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 hover:bg-gray-200 transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-4 space-y-4">
                      {previewImage && (
                          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                              <img src={previewImage} alt="Preview" className="w-full h-56 object-contain" />
                          </div>
                      )}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                          <input 
                              type="text" 
                              value={caption} 
                              onChange={e => setCaption(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                              placeholder="Enter description..."
                              autoFocus
                          />
                      </div>
                      <button 
                          onClick={savePhoto}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
                      >
                          <Save size={18} /> Save Photo
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Photo?</h3>
                  <p className="text-gray-500 text-sm mb-6">This action cannot be undone. Are you sure you want to remove this photo?</p>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setDeleteId(null)}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                      >
                          Delete
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}