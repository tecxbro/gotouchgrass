import React, { useEffect, useRef, useState, ReactNode } from 'react'
import { MapPin, Navigation, X, Leaf, Info } from 'lucide-react'

interface MapPageProps {
  apiKey: string
  userLocation: { lat: number; lng: number }
  google: any
}

const MapPage: React.FC<MapPageProps> = ({ apiKey, userLocation, google }): ReactNode => {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [overpassData, setOverpassData] = useState<any>(null)
  const [noGrassMessage, setNoGrassMessage] = useState<string | null>(null)
  const [grasslandFetched, setGrasslandFetched] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGrassArea, setSelectedGrassArea] = useState<any>(null)

  useEffect(() => {
    if (google && !map && mapDivRef.current) {
      console.log("useEffect: Initializing map...");
      try {
        const initialBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(userLocation.lat - 0.01, userLocation.lng - 0.01),
          new google.maps.LatLng(userLocation.lat + 0.01, userLocation.lng + 0.01)
        );

        const initialMap = new google.maps.Map(mapDivRef.current!, {
          center: userLocation,
          zoom: 13,
          mapId: '9eeb87728f39a39',
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
          restriction: {
            latLngBounds: initialBounds,
            strictBounds: true
          },
          minZoom: 12,
          maxZoom: 20,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
          }
        });
        
        setMap(initialMap);
        console.log("useEffect: Map object created and set.");

        const setupMapElements = async () => {
          try {
            console.log("useEffect: Importing marker library...");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as typeof google.maps.marker;
            console.log("useEffect: Marker library imported. Adding user marker...");
            new AdvancedMarkerElement({
              map: initialMap,
              position: userLocation,
              title: 'Your Location',
              gmpClickable: true,
            });
            console.log("useEffect: User marker added.");

            if (!grasslandFetched) {
              console.log("useEffect: Fetching green space data...");
              await fetchGrasslandData(userLocation, google, initialMap);
              setGrasslandFetched(true);
              console.log("useEffect: Green space data fetched.");
            } else {
              console.log("useEffect: Green space data already fetched.");
            }
          } catch (setupError) {
            console.error("useEffect: Error during map elements setup:", setupError);
            if (setupError instanceof Error) {
              setError(`Error setting up map elements: ${setupError.message}`);
            } else {
              setError('An unexpected error occurred during map setup.');
            }
          }
        };

        setupMapElements();

      } catch (e) {
        console.error("useEffect: Error during map initialization:", e);
        if (e instanceof Error) {
          setError(`Map loading error: ${e.message}`)
        } else {
          setError('An unexpected error occurred while loading the map.')
        }
      }
    }
  }, [apiKey, userLocation, google, grasslandFetched]);

  const fetchGrasslandData = async (
    location: { lat: number; lng: number },
    google: any,
    currentMap: any,
  ) => {
    if (!currentMap) {
      console.error("fetchGrasslandData: currentMap is null or undefined.");
      setError("Map not available for fetching green space data.");
      return;
    }
    console.log("fetchGreenSpaceData: Starting to fetch...");
    setIsLoading(true);
    const radii = [50, 100, 250, 500, 1000]
    let foundGrassland = false

    for (const radius of radii) {
      if (foundGrassland) break
      setNoGrassMessage(null)

      const overpassQuery = `
        [out:json];
        (
          way["landuse"="grass"](around:${radius},${location.lat},${location.lng});
          way["natural"="grassland"](around:${radius},${location.lat},${location.lng});
          way["leisure"="park"](around:${radius},${location.lat},${location.lng});
          way["leisure"="garden"](around:${radius},${location.lat},${location.lng});
          way["landuse"="recreation_ground"](around:${radius},${location.lat},${location.lng});
          way["landuse"="meadow"](around:${radius},${location.lat},${location.lng});
          way["landuse"="allotments"](around:${radius},${location.lat},${location.lng});
          way["amenity"="park"](around:${radius},${location.lat},${location.lng});
        );
        out geom;
      `
      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Overpass API request failed with status ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()

        if (data && data.elements && data.elements.length > 0) {
          setOverpassData(data)
          foundGrassland = true

          const nearestData = findNearestGrassland(data.elements, location, google)
          if (nearestData && nearestData.nearest) {
            await displayNearestGrassland(nearestData.nearest, nearestData.distance, google, currentMap)
          } else {
            setError('No suitable green space areas found in the fetched data.')
          }
          displayGrasslandPolygons(data.elements, google, currentMap)
          setIsLoading(false);
          return
        } else {
          setOverpassData(null)
        }
      } catch (error) {
        let errorMessage = 'Failed to fetch green space data: An unexpected error occurred.'
        if (error instanceof Error) {
          errorMessage = `Failed to fetch green space data: ${error.message}`
        }
        setError(errorMessage)
        setIsLoading(false);
        return
      }
    }

    if (!foundGrassland) {
      setNoGrassMessage('Bruh, you\'re cooked. No grass found within 1km. You might actually be in a concrete prison.')
    }
    setIsLoading(false);
  }

  const findNearestGrassland = (
    elements: any[],
    userLocation: { lat: number; lng: number },
    google: any,
  ): { nearest: { lat: number; lng: number } | null; distance: number } | null => {
    let nearest: { lat: number; lng: number } | null = null
    let minDistance = Infinity

    elements.forEach((element: any) => {
      if (element.type === 'way' && element.geometry && element.geometry.length > 0) {
        let sumLat = 0
        let sumLng = 0
        element.geometry.forEach((coord: any) => {
          sumLat += coord.lat
          sumLng += coord.lon
        })
        const count = element.geometry.length
        const centroid = { lat: sumLat / count, lng: sumLng / count }
        if (!google || !google.maps) {
          setError('Google Maps API not loaded.')
          return null
        }
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(userLocation),
          new google.maps.LatLng(centroid)
        )
        if (distance < minDistance) {
          minDistance = distance
          nearest = centroid
        }
      }
    })

    return nearest ? { nearest, distance: minDistance } : null
  }

  const displayGrasslandPolygons = (elements: any[], google: any, currentMap: any) => {
    if (!currentMap) {
      console.error("displayGrasslandPolygons: currentMap is null or undefined.");
      return;
    }
    console.log("displayGrasslandPolygons: Displaying polygons...");
    elements.forEach((element: any) => {
      if (element.type === 'way' && element.geometry && element.geometry.length > 0) {
        const path = element.geometry.map((coord: any) => ({
          lat: coord.lat,
          lng: coord.lon,
        }))

        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor: '#10b981',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.35,
          map: currentMap,
          clickable: true,
        })

        polygon.addListener('click', () => {
          try {
            const centroid = calculateCentroid(
              path.map((coord: { lat: number; lng: number }) => new google.maps.LatLng(coord.lat, coord.lng))
            )
            if (centroid) {
              setSelectedGrassArea({
                position: centroid,
                element: element
              });
              showPathToGrass(centroid, google, currentMap)
            } else {
              setError('Could not calculate centroid for this grass area.')
            }
          } catch (err) {
            setError('An error occurred while processing the grass area.')
          }
        })
      }
    })
  }

  const displayNearestGrassland = async (
    location: { lat: number; lng: number },
    distance: number,
    google: any,
    currentMap: any,
  ): Promise<void> => {
    if (!currentMap) {
      console.error("displayNearestGrassland: currentMap is null or undefined.");
      return
    }
    console.log("displayNearestGrassland: Displaying nearest grassland marker...");
    try {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(new google.maps.LatLng(userLocation))
      bounds.extend(new google.maps.LatLng(location))

      const padding = {
        top: 100,
        right: 100,
        bottom: 100,
        left: 100
      }
      
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as typeof google.maps.marker
      new AdvancedMarkerElement({
        map: currentMap,
        position: userLocation,
        title: 'Your Location',
        gmpClickable: true,
      })
      
      currentMap.fitBounds(bounds, padding)
    } catch (error) {
      console.error('Error displaying nearest grassland:', error)
      setError('Failed to display the nearest grass area.')
    }
  }

  const showPathToGrass = (
    destination: { lat: number; lng: number },
    google: any,
    currentMap: any,
  ): void => {
    if (!currentMap) {
      setError('Map is not initialized correctly.')
      console.error('showPathToGrass called when map is not ready. Map state:', currentMap);
      return
    }
    console.log('showPathToGrass called with destination:', destination)
    
    if (directionsRenderer) {
      directionsRenderer.setMap(null)
    }

    const polylineOptions: google.maps.PolylineOptions = {
      path: [
        new google.maps.LatLng(userLocation),
        new google.maps.LatLng(destination)
      ],
      geodesic: true,
      strokeColor: '#10b981',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: currentMap,
      icons: [{
        icon: {
          path: 'M 0,-1 L 0,1',
          strokeOpacity: 1,
          scale: 4,
          strokeColor: '#10b981'
        },
        offset: '0',
        repeat: '20px'
      }]
    }
    const path = new google.maps.Polyline(polylineOptions)

    const existingButton = document.getElementById('go-touch-grass-button')
    if (existingButton) {
      existingButton.remove()
    }

    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'go-touch-grass-button'
    buttonContainer.style.position = 'fixed'
    buttonContainer.style.top = '20px'
    buttonContainer.style.left = '50%'
    buttonContainer.style.transform = 'translateX(-50%)'
    buttonContainer.style.zIndex = '9999'
    buttonContainer.style.pointerEvents = 'auto'

    const button = document.createElement('button')
    button.style.backgroundColor = '#10b981'
    button.style.color = 'white'
    button.style.padding = '12px 24px'
    button.style.border = 'none'
    button.style.borderRadius = '8px'
    button.style.cursor = 'pointer'
    button.style.fontWeight = '600'
    button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
    button.style.fontSize = '16px'
    button.style.fontFamily = 'Inter, sans-serif'
    button.style.pointerEvents = 'auto'
    button.style.display = 'flex'
    button.style.alignItems = 'center'
    button.style.gap = '8px'
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> TOUCH GRASS NOW'

    button.onmouseover = () => {
      button.style.backgroundColor = '#059669'
      button.style.transform = 'translateY(-1px)'
    }
    button.onmouseout = () => {
      button.style.backgroundColor = '#10b981'
      button.style.transform = 'translateY(0)'
    }

    button.onclick = () => {
      console.log('Button clicked')
      path.setMap(null)
      buttonContainer.remove()
      setSelectedGrassArea(null)
    }

    buttonContainer.appendChild(button)
    document.body.appendChild(buttonContainer)
    console.log('Button added to DOM')
  }

  const calculateCentroid = (path: any[]): { lat: number; lng: number } | null => {
    if (!path || path.length === 0) {
      return null
    }
    let sumLat = 0
    let sumLng = 0
            path.forEach(latLng => {
          sumLat += latLng.lat ? latLng.lat() : latLng.lat
          sumLng += latLng.lng ? latLng.lng() : latLng.lng
        })
    return {
      lat: sumLat / path.length,
      lng: sumLng / path.length,
    }
  }

  const clearError = () => {
    setError(null)
    setNoGrassMessage(null)
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapDivRef} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                             <span className="text-gray-700">Finding grass for your terminally online existence...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {noGrassMessage && (
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">{noGrassMessage}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-3 flex-shrink-0 text-yellow-400 hover:text-yellow-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Grass Area Info */}
      {selectedGrassArea && (
        <div className="absolute bottom-4 left-4 right-4 z-40">
          <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-green-600" />
                </div>
                <div>
                                     <h3 className="font-semibold text-gray-800">Grass Found! Touch It!</h3>
                   <p className="text-sm text-gray-600">Click the button above to get directions to your salvation</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGrassArea(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <button
            onClick={() => map?.panTo(userLocation)}
            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200"
            title="Center on my location"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MapPage
