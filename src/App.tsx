import React, { useState, useEffect } from 'react';
import MapPage from './components/MapPage';
import LandingPage from './components/LandingPage';
import { initializeGoogleMapsLoader } from './googleMapsLoader';
import './index.css';

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  const [google, setGoogle] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (apiKey) {
      setIsLoading(true);
      initializeGoogleMapsLoader(apiKey)
        .then((googleObj) => {
          setGoogle(googleObj);
          setIsLoading(false);
        })
        .catch((error) => {
          setApiError('Failed to load Google Maps API. Please check your API key and network connection.');
          setIsLoading(false);
        });
    } else {
      setApiError('Google Maps API key is not configured. Please check your .env file.');
      setIsLoading(false);
    }
  }, [apiKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-float mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">GoTouchGrass</h2>
                     <p className="text-gray-600">Loading your grass-touching adventure...</p>
          <div className="mt-6 flex justify-center">
            <div className="animate-pulse-slow w-2 h-2 bg-green-500 rounded-full mx-1"></div>
            <div className="animate-pulse-slow w-2 h-2 bg-green-500 rounded-full mx-1" style={{animationDelay: '0.2s'}}></div>
            <div className="animate-pulse-slow w-2 h-2 bg-green-500 rounded-full mx-1" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="card max-w-md mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{apiError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-800">GoTouchGrass</h1>
            </div>
                         <div className="text-sm text-gray-600">
               Touch grass, you terminally online creature
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {!userLocation ? (
          <LandingPage
            onLocationFound={setUserLocation}
            apiKey={apiKey}
            google={google}
          />
        ) : (
          <MapPage
            apiKey={apiKey}
            userLocation={userLocation}
            google={google}
          />
        )}
      </main>
    </div>
  );
}

export default App;
