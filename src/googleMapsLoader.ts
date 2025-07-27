import { Loader } from '@googlemaps/js-api-loader'

let googleMapsLoader: Loader | null = null

export const initializeGoogleMapsLoader = (apiKey: string): Promise<typeof google.maps> => {
  if (!googleMapsLoader && apiKey) {
    googleMapsLoader = new Loader({
      apiKey: apiKey,
      id: '__googleMapsScriptId',
      libraries: ['places', 'routes', 'geometry', 'marker'], // Consistent libraries
    })
  }

  if (googleMapsLoader) {
    return googleMapsLoader.load() as Promise<typeof google.maps>
  } else {
    return Promise.reject(new Error('API Key not provided for Google Maps Loader.'))
  }
}
