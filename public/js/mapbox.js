/* eslint-disable */
const mapboxgl=require('mapbox-gl/dist/mapbox-gl')

// const locations = JSON.parse(document.getElementById('map').dataset.locations)
export const displayMap = (locations) =>{
  mapboxgl.accessToken = 'pk.eyJ1IjoicHJhbmF2LTA1IiwiYSI6ImNsb2Z1MXFsYzAxcjQycm52OTdpMWhtYTIifQ.i3xQHTqg9ZkZwKLoImzEIg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/pranav-05/clofx330j006g01qqgd8maq0a',
    scrollZoom: false
  });
  
  const bounds = new mapboxgl.LngLatBounds()
  
  locations.forEach(loc => {
  // Create Marker
  const el = document.createElement('div')
  el.className = 'marker';
  
  // Add Marker
  new mapboxgl.Marker({
    element:el,
    anchor:'bottom'
  }).setLngLat(loc.coordinates).addTo(map)
  
  //Add popup
  new mapboxgl.Popup({offset:30})
  .setLngLat(loc.coordinates)
  .setHTML(`<p>Day ${loc.day}:${loc.description}</p>`)
  .addTo(map)
  
  // Extend map bounds to include current
  bounds.extend(loc.coordinates)
  })
  
  map.fitBounds(bounds,{
    padding: {
    top:200,
    bottom:150,
    left:100,
    right:100
  }
  })

}

 


