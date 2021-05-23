var map = L.map('mapid').setView([38.9072, -77.0369], 6);
function doMap() {
    map.setView([lat, lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attributions: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);
}
//RADAR ANIMATION
var apiData = {};
var mapFrames = [];
var lastPastFramePosition = -1;
var radarLayers = [];

var optionKind = 'radar';

var optionTileSize = 256;
var optionColorScheme = 4;
var optionSmoothData = 1;
var optionSnowColors = 1;

var animationPosition = 0;
var animationTimer = false;

//LOAD MAPS FROM RAINVIEWER API
var apiRequest = new XMLHttpRequest();
apiRequest.open("GET", "https://api.rainviewer.com/public/weather-maps.json", true);
apiRequest.onload = function(e) {
    // STORING API RESPONSE
    apiData = JSON.parse(apiRequest.response);
    initialize(apiData, optionKind);
};
apiRequest.send();

//INITIALIZE INTERNAL DATA FROM API RESPONSE
function initialize(api, kind) {
    //REMOVING ADDED TILE LAYERS
    for (var i in radarLayers) {
        map.removeLayer(radarLayers[i]);
    }
    mapFrames = [];
    radarLayers = [];
    animationPosition = 0;

    if (!api) {
        return;
    }
    if (kind == 'satellite' && api.satellite && api.satellite.infrared) {
        mapFrames = api.satellite.infrared;

        lastPastFramePosition = api.satellite.infrared.length - 1;
        showFrame(lastPastFramePosition);
    }
    else if (api.radar && api.radar.past) {
        mapFrames = api.radar.past;
        if (api.radar.nowcast) {
            mapFrames = mapFrames.concat(api.radar.nowcast);
        }

        //SHOW LAST "PAST" FRAME
        lastPastFramePosition = api.radar.past.length - 1;
            showFrame(lastPastFramePosition);
    }
}

//ANIMATION FUNCTIONS
function addLayer(frame) {
    if (!radarLayers[frame.path]) {
        var colorScheme = optionKind == 'satellite' ? 0 : optionColorScheme;
        var smooth = optionKind == 'satellite' ? 0 : optionSmoothData;
        var snow = optionKind == 'satellite' ? 0 : optionSnowColors;

        radarLayers[frame.path] = new L.TileLayer(apiData.host + frame.path + '/' + optionTileSize + '/{z}/{x}/{y}/' + colorScheme + '/' + smooth + '_' + snow + '.png', {
            tileSize: 256,
            opacity: 0.001,
            zIndex: frame.time
        });
    }
    if (!map.hasLayer(radarLayers[frame.path])) {
        map.addLayer(radarLayers[frame.path]);
    }
}

//DISPLAY PARTICULAR FRAME OF ANIMATION FOR THE @position
//If preloadOnly=true, frame layer only adds for the tiles preloading purpose
function changeRadarPosition(position, preloadOnly) {
    while (position >= mapFrames.length) {
        position -= mapFrames.length;
    }
    while (position < 0) {
        position += mapFrames.length;
    }

    var currentFrame = mapFrames[animationPosition];
    var nextFrame = mapFrames[position];

    addLayer(nextFrame);

    if (preloadOnly) {
        return;
    }

    animationPosition = position;

    if (radarLayers[currentFrame.path]) {
        radarLayers[currentFrame.path].setOpacity(0);
    }
    radarLayers[nextFrame.path].setOpacity(100);


    var pastOrForecast = nextFrame.time > Date.now() / 1000 ? 'FORECAST' : 'PAST';

    document.getElementById("timestamp").innerHTML = pastOrForecast + ' : ' + (new Date(nextFrame.time * 1000)).toString();
}

//CHECK AVAILABILITY AND SHOW FRAME POSITION FROM TIMESTAMPS
function showFrame(nextPosition) {
    var preloadingDirection = nextPosition - animationPosition > 0 ? 1 : -1;

    changeRadarPosition(nextPosition);

    // preload next next frame (typically, +1 frame)
    // if don't do that, the animation will be blinking at the first loop
    changeRadarPosition(nextPosition + preloadingDirection, true);
}

//STOP ANIMATION
//check if animation timeout is set and clear it.
function stop() {
    if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = false;
        return true;
    }
    return false;
}

function play() {
    showFrame(animationPosition + 1);

    // Main animation driver. Run this function every 500 ms
    animationTimer = setTimeout(play, 500);
}

function playStop() {
    if (!stop()) {
        play();
    }
}

//CHANGE MAP OPTIONS
function setKind(kind) {
    optionKind = kind;
    initialize(apiData, optionKind);
}


function setColors() {
    var e = document.getElementById('colors');
    optionColorScheme = e.options[e.selectedIndex].value;
    initialize(apiData, optionKind);
}

//HANDLE ARROW KEYS FOR NAVIGATION BETWEEN NEXT \ PREV FRAMES
document.onkeydown = function (e) {
    e = e || window.event;
    switch (e.which || e.keyCode) {
        case 37: // left
            stop();
            showFrame(animationPosition - 1);
            break;

        case 39: // right
            stop();
            showFrame(animationPosition + 1);
            break;

        default:
            return; // exit this handler for other keys
    }
    e.preventDefault();
    return false;
}

// GEO Find Me Function - gets users data should they agree to share
var lon; // global variable for longitude
var lat; // global variable for latitude 
function geoFindMe(dom) {

  // const status = document.querySelector('#status');
  const mapLink = document.querySelector('#map-link');

  mapLink.href = '';
  mapLink.textContent = '';

  function success(position) {
    const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;
    lat= latitude;
    lon= longitude;
    // status.textContent = '';
    // mapLink.href = `https://www.openstreetmap.org/#map=10/${latitude}/${longitude}`;
    // mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;
    dom.innerHTML = getOpenWeatherResults();
    return true;
  }

  function error() {
    // status.textContent = 'Unable to retrieve your location';
    dom.innerHTML = getOpenWeatherResults("Washington");
  }

  if(!navigator.geolocation) {
    // status.textContent = 'Geolocation is not supported by your browser';
  } else {
    // status.textContent = 'Locating…';
    return navigator.geolocation.getCurrentPosition(success, error);
  }

}

// document.querySelector('#find-me').addEventListener('click', geoFindMe);
function radarFindMe() {

  // const status = document.querySelector('#status');
  const mapLink = document.querySelector('#map-link');

  mapLink.href = '';
  mapLink.textContent = '';

  function success(position) {
    const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;
    lat = latitude;
    lon = longitude;
    return true;
  }

  function error() {
    // status.textContent = 'Unable to retrieve your location';
  }

  if(!navigator.geolocation) {
    // status.textContent = 'Geolocation is not supported by your browser';
  } else {
    // status.textContent = 'Locating…';
    return navigator.geolocation.getCurrentPosition(success, error);
  }

}
function mapFindMe() {

  // const status = document.querySelector('#status');
  function success(position) {
    const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;
    lat= latitude;
    lon= longitude;
    // status.textContent = '';
    // mapLink.href = `https://www.openstreetmap.org/#map=10/${latitude}/${longitude}`;
    // mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;
    return true;
  }

  function error() {
    //alert("unable to retrieve location");
    lat= 38.9072;
    lon= -77.0369;
  }

  if(!navigator.geolocation) {
    // status.textContent = 'Geolocation is not supported by your browser';
  } else {
    // status.textContent = 'Locating…';
    return navigator.geolocation.getCurrentPosition(success, error);
  }

}