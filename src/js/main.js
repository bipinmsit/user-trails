import { user1Points, user2Points, user3Points } from "../data/users.js";

// create features using OpenLayers
function createFeatures(coords, label, color) {
  const features = [];

  // Point markers with labels
  coords.forEach((point, idx) => {
    const [lon, lat, address] = point;
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
      name: `${label} ${idx + 1}`,
      address: address,
      latlon: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
    });

    feature.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({ color: color }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
        }),
        text: new ol.style.Text({
          text: `${label}`,
          offsetY: -15,
          fill: new ol.style.Fill({ color: "#000" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
        }),
      })
    );
    features.push(feature);
  });

  // Create the base dotted trail line
  const lineCoords = coords.map((p) => ol.proj.fromLonLat([p[0], p[1]]));
  const line = new ol.geom.LineString(lineCoords);
  const lineFeature = new ol.Feature({ geometry: line });
  lineFeature.setStyle(
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 2,
        lineDash: [10, 10],
      }),
    })
  );
  features.push(lineFeature);

  // Arrows on the line (light blue)
  for (let i = 0; i < lineCoords.length - 1; i++) {
    const start = lineCoords[i];
    const end = lineCoords[i + 1];

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);

    const midPoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

    const arrow = new ol.Feature({
      geometry: new ol.geom.Point(midPoint),
    });
    arrow.setStyle(
      new ol.style.Style({
        image: new ol.style.Icon({
          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><polygon points="0,0 16,8 0,16 4,8" fill="lightblue"/></svg>',
          rotateWithView: true,
          rotation: -rotation,
          scale: 1,
        }),
      })
    );
    features.push(arrow);
  }

  return new ol.layer.Vector({
    source: new ol.source.Vector({ features }),
    visible: true,
    title: `${label} Trail`,
  });
}

// create user cluster layer
function createUserClusterLayer(users, color, label) {
  const features = [];

  users.forEach((point, idx) => {
    const [lon, lat, address] = point;
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
      label: `${label} ${idx + 1}`,
      address: address,
      latlon: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
    });
    features.push(feature);
  });

  const source = new ol.source.Vector({
    features: features,
  });

  const clusterSource = new ol.source.Cluster({
    distance: 40,
    source: source,
  });

  const clusterLayer = new ol.layer.Vector({
    source: clusterSource,
    style: function (feature) {
      const size = feature.get("features").length;

      if (size > 1) {
        return new ol.style.Style({
          image: new ol.style.Icon({
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="13" fill="orange" stroke="black" stroke-width="2" /><text x="15" y="20" text-anchor="middle" fill="white" font-size="14px" font-family="Arial">${size}</text></svg>',
            scale: 1,
          }),
        });
      } else {
        const singleFeature = feature.get("features")[0];
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({ color: color }),
            stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
          }),
          text: new ol.style.Text({
            text: singleFeature.get("label"),
            offsetY: -15,
            fill: new ol.style.Fill({ color: "#000" }),
            stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
          }),
        });
      }
    },
    title: `${label} Cluster`,
  });

  return clusterLayer;
}

// create OpenStreetMap as base layer
const osm = new ol.layer.Tile({
  source: new ol.source.OSM(),
  title: "OpenStreetMap",
  visible: false,
  type: "base",
});

// Create user trails and clusters
const userTrail1 = createFeatures(user1Points, "User1", "blue");
const user1Cluster = createUserClusterLayer(user1Points, "blue", "User1");

const userTrail2 = createFeatures(user2Points, "User2", "green");
const user2Cluster = createUserClusterLayer(user2Points, "green", "User2");

const userTrail3 = createFeatures(user3Points, "User3", "green");
const user3Cluster = createUserClusterLayer(user3Points, "green", "User3");

const popupcontainer = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

const overlay = new ol.Overlay({
  element: popupcontainer,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Create a map with the layers
const map = new ol.Map({
  target: "map",
  controls: [new ol.control.Zoom()],
  layers: [
    osm,
    userTrail1,
    userTrail2,
    userTrail3,
    user1Cluster,
    user2Cluster,
    user3Cluster,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([77.5946, 12.9716]),
    zoom: 5,
  }),
  overlays: [overlay],
});

const layerSwitcher = new LayerSwitcher({
  tipLabel: "Layers",
  groupSelectStyle: "children",
});

map.addControl(layerSwitcher);

// Popup logic written here
const container = document.createElement("div");
container.className = "ol-popup";
const popup = new ol.Overlay({
  element: container,
  positioning: "bottom-center",
  stopEvent: false,
  offset: [0, -20],
});
map.addOverlay(popup);

map.on("click", function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (f) {
    return f;
  });
  if (feature && feature.getGeometry().getType() === "Point") {
    const coord = feature.getGeometry().getCoordinates();
    const name = feature.get("name");
    const latlon = feature.get("latlon");
    const address = feature.get("address");

    if (name && latlon && address) {
      popup.setPosition(coord);
      container.innerHTML = `<strong>${name}</strong><br>${latlon}<br>${address}`;
    } else {
      popup.setPosition(undefined); // Hide popup if any property is undefined
    }
  } else {
    popup.setPosition(undefined);
  }
});

map.on("singleclick", function (evt) {
  const features = map.getFeaturesAtPixel(evt.pixel);
  if (features && features.length > 0) {
    const cluster = features[0];
    console.log("Cluster clicked:", cluster);

    const clusterFeatures = cluster.get("features");

    // Filete the feature based on label
    const filteredFeatures = clusterFeatures.filter((f) => {
      const label = f.get("label");
      console.log("Label:", label);
    });

    let contentHTML = "";
    if (clusterFeatures.length > 1) {
      contentHTML = `Users in this cluster:<ul>`;
      clusterFeatures.forEach((f) => {
        contentHTML += `<li>${f.get("label")}</li>`;
      });
      contentHTML += "</ul>";
    } else {
      const f = clusterFeatures[0];
      contentHTML = `<b>${f.get("label")}</b><br>${f.get("latlon")}<br>${f.get(
        "address"
      )}`;
    }

    content.innerHTML = contentHTML;
    overlay.setPosition(evt.coordinate);
  } else {
    overlay.setPosition(undefined);
  }
});

// Zoom to layer logic written here
document.getElementById("zoomTo").onclick = () => {
  const extent = ol.extent.createEmpty();
  if (userTrail1.getVisible()) {
    ol.extent.extend(extent, userTrail1.getSource().getExtent());
  }
  if (userTrail2.getVisible()) {
    ol.extent.extend(extent, userTrail2.getSource().getExtent());
  }
  if (!ol.extent.isEmpty(extent)) {
    map.getView().fit(extent);
  }
};
