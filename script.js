let map, markers = [], pumpsData = [];

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 19.076, lng: 72.8777 }, // Mumbai
        zoom: 7
    });

    fetch('pumps.csv')
        .then(response => response.text())
        .then(csvText => {
            pumpsData = parseCSV(csvText);
            showAllPumps();
        });
}

function parseCSV(text) {
    const rows = text.trim().split("\n").slice(1);
    return rows.map(row => {
        const [name, city, lat, lng, price] = row.split(",");
        return {
            name: name.trim(),
            city: city.trim().toUpperCase(),
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            price: parseFloat(price)
        };
    });
}

function showAllPumps() {
    clearMarkers();
    let lowest = pumpsData.reduce((min, p) => p.price < min.price ? p : min, pumpsData[0]);
    pumpsData.forEach(p => {
        addMarker(p, p.name === lowest.name);
    });
}

function addMarker(pump, isLowest) {
    const marker = new google.maps.Marker({
        position: { lat: pump.lat, lng: pump.lng },
        map: map,
        title: `${pump.name} - ₹${pump.price}`,
        icon: isLowest ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : null
    });
    markers.push(marker);
}

function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

function searchByCity() {
    const city = document.getElementById("cityInput").value.trim().toUpperCase();
    if (!city) return;

    const filtered = pumpsData.filter(p => p.city === city);
    if (filtered.length === 0) {
        alert("No pumps found for this city");
        return;
    }

    clearMarkers();
    let lowest = filtered.reduce((min, p) => p.price < min.price ? p : min, filtered[0]);
    filtered.forEach(p => {
        addMarker(p, p.name === lowest.name);
    });
    map.setCenter({ lat: filtered[0].lat, lng: filtered[0].lng });
    map.setZoom(12);
}

function searchByRoute() {
    const start = document.getElementById("startInput").value.trim();
    const end = document.getElementById("endInput").value.trim();
    if (!start || !end) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    directionsService.route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);

            const routePath = new google.maps.Polyline({
                path: result.routes[0].overview_path
            });

            const pumpsOnRoute = pumpsData.filter(p => {
                return google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(p.lat, p.lng),
                    routePath.getPath().getAt(0)
                ) < 5000; // 5km tolerance
            });

            clearMarkers();
            let lowest = pumpsOnRoute.reduce((min, p) => p.price < min.price ? p : min, pumpsOnRoute[0]);
            pumpsOnRoute.forEach(p => {
                addMarker(p, p.name === lowest.name);
            });
        }
    });
}

window.initMap = initMap;
