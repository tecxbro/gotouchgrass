import React, { useState, useRef, useEffect } from 'react'
import { MapPin, Compass, Search, Leaf, Sparkles } from 'lucide-react'

interface LandingPageProps {
  onLocationFound: (location: { lat: number; lng: number }) => void
  apiKey: string
  google: any
}

const LandingPage: React.FC<LandingPageProps> = ({
  onLocationFound,
  apiKey,
  google,
}) => {
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteServiceRef = useRef<any>(null)

  useEffect(() => {
    if (google && (google as any).maps) {
      autocompleteServiceRef.current = new (google as any).maps.places.AutocompleteService()
    }
  }, [google])

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value)
    setShowSuggestions(true)
    if (autocompleteServiceRef.current) {
      getAutocompletePredictions(event.target.value)
    }
  }

  const getAutocompletePredictions = (input: string) => {
    if (!input.trim()) {
      setAutocompleteSuggestions([])
      return
    }

    const request: google.maps.places.AutocompletionRequest = {
      input: input,
      types: ['geocode'],
    }

    autocompleteServiceRef.current?.getPlacePredictions(
      request,
      (predictions: any, status: any) => {
        if (status === 'OK' && predictions) {
          setAutocompleteSuggestions(
            predictions.map((prediction: any) => prediction.description),
          )
        } else {
          setAutocompleteSuggestions([])
        }
      },
    )
  }

  const handleSuggestionClick = (suggestion: string) => {
    setAddress(suggestion)
    setAutocompleteSuggestions([])
    setShowSuggestions(false)
  }

  const geocodeAddress = async (addressToGeocode: string) => {
    if (!google || !(google as any).maps) {
      setError('Google Maps API is not loaded yet.')
      return null
    }
    const geocoder = new (google as any).maps.Geocoder()

    return new Promise<{ lat: number; lng: number } | null>((resolve, reject) => {
      geocoder.geocode(
        { address: addressToGeocode },
        (results: any, status: any) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location
            resolve({ lat: location.lat(), lng: location.lng() })
          } else {
            reject(
              new Error(
                `Geocoding failed due to: ${status}${
                  results ? '' : '. No results found.'
                }`,
              ),
            )
            resolve(null)
          }
        },
      )
    })
  }

  const handleAddressSearch = async () => {
    if (!address.trim()) {
      setError('Please enter an address to search.')
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      const location = await geocodeAddress(address)
      if (location) {
        onLocationFound(location)
      } else {
        setError('Could not find that address. Please check and try again.')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Address not found: ${err.message}`)
      } else {
        setError('An unexpected error occurred while searching.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseMyLocation = () => {
    setError(null)
    setIsLoading(true)
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationFound({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setIsLoading(false)
      },
      () => {
        setError('Unable to retrieve your location. Please check your location permissions.')
        setIsLoading(false)
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="animate-float mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Touch Some
            <span className="text-green-600"> Grass</span>
          </h1>
          <p className="text-gray-600">
            Stop doomscrolling and find the nearest patch of grass to touch, you terminally online creature
          </p>
        </div>

        {/* Search Card */}
        <div className="card">
          <div className="space-y-6">
            {/* Address Search */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  className="input-field pl-10"
                  placeholder="Enter an address or location"
                  value={address}
                  onChange={handleAddressChange}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                />
                <button
                  onClick={handleAddressSearch}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 px-4 flex items-center bg-green-500 hover:bg-green-600 text-white rounded-r-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && autocompleteSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Use My Location */}
            <button
              onClick={handleUseMyLocation}
              disabled={isLoading}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <Compass className="h-5 w-5" />
              <span>Use My Current Location</span>
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                  <span className="text-sm text-gray-600">Finding grass for your chronically online self...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
                           <span>Find grass before you become one with your chair</span>
             </div>
             <div className="flex items-center space-x-3 text-sm text-gray-600">
               <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                 <MapPin className="w-4 h-4 text-green-600" />
               </div>
               <span>Get directions to the nearest grass patches</span>
             </div>
             <div className="flex items-center space-x-3 text-sm text-gray-600">
               <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                 <Leaf className="w-4 h-4 text-green-600" />
               </div>
               <span>Touch grass and touch some grass</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
