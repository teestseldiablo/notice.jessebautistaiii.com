import { historicalEvents } from '../data/history/index.js';
import { stateCapitalData, capitalCoords } from '../data/capitals/capitals.js';

let currentImages = [];
let currentSlideIndex = 0;

function showSlide(index) {
    if (!currentImages || currentImages.length === 0) return;
    if (index >= currentImages.length) currentSlideIndex = 0;
    if (index < 0) currentSlideIndex = currentImages.length - 1;
    
    const container = document.getElementById('carouselContainer');
    container.innerHTML = `
        <div class="carousel-slide active">
            <img src="${currentImages[currentSlideIndex].url}" alt="Archive Gallery Image">
            <div class="carousel-caption">${currentImages[currentSlideIndex].caption}</div>
        </div>
    `;
    document.getElementById('slideIndicator').innerText = `${currentSlideIndex + 1} / ${currentImages.length}`;
}

window.nextSlide = function() {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
};

window.prevSlide = function() {
    currentSlideIndex--;
    showSlide(currentSlideIndex);
};

function openStateModal(title, detail, description, images, citation, wikidataUrl, isHistory = false) {
    document.getElementById('modalStateName').innerText = title;
    document.getElementById('modalCapitalName').innerText = detail;
    document.getElementById('modalDescription').innerText = description || "";
    document.getElementById('modalCitation').innerText = citation || "";

    currentImages = images || [
        { url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='600' height='400' fill='%231e293b'/><text x='300' y='200' fill='%23F59E0B' font-size='20' text-anchor='middle'>Official Registry Record</text></svg>", caption: "State Registry Seal" }
    ];
    currentSlideIndex = 0;
    showSlide(0);

    const linksContainer = document.getElementById('modalLinks');
    if (isHistory) {
        linksContainer.innerHTML = `
            <a class="resource-btn" href="${wikidataUrl}" target="_blank"><span>Wikidata Record</span> &rarr;</a>
            <a class="resource-btn" href="https://www.loc.gov" target="_blank"><span>Library of Congress Archives</span> &rarr;</a>
        `;
    } else {
        const stateSlug = title.toLowerCase().replace(/\s+/g, '');
        linksContainer.innerHTML = `
            <a class="resource-btn" href="https://www.${stateSlug}.gov" target="_blank"><span>Official State Portal</span> &rarr;</a>
            <a class="resource-btn" href="https://www.usa.gov/state-swm" target="_blank"><span>Citizen Benefits</span> &rarr;</a>
            <a class="resource-btn" href="https://www.vote.org" target="_blank"><span>Voter Registration</span> &rarr;</a>
        `;
    }

    document.getElementById('stateModal').classList.add('active');
}

window.closeStateModal = function() {
    document.getElementById('stateModal').classList.remove('active');
};

const vectorSource = new ol.source.Vector();

// Add State Capitals
Object.keys(stateCapitalData).forEach(stateName => {
    const coords = capitalCoords[stateName];
    if (coords) {
        const feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat(coords)),
            title: stateName,
            detail: `Capital: ${stateCapitalData[stateName]}`,
            description: `Official state portal and capital administrative center for ${stateName}, providing citizen registries, public voting portals, and civic infrastructure resources.`,
            images: [
                { url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='600' height='400' fill='%230f172a'/><circle cx='300' cy='200' r='90' fill='%231E3A8A' stroke='%23F59E0B' stroke-width='4'/><text x='300' y='210' fill='%23FFFFFF' font-size='22' text-anchor='middle'>${stateName} Capital</text></svg>`, caption: `${stateName} State Capital Seal` }
            ],
            citation: `Source: Official ${stateName} State Archives & Public Registry.`,
            wikidataUrl: "https://www.wikidata.org",
            isHistory: false
        });

        feature.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.5],
                src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="0.5"/></svg>',
                scale: 1.0
            })
        }));

        vectorSource.addFeature(feature);
    }
});

// Add All Historical Events from Modules
historicalEvents.forEach(evt => {
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(evt.coords)),
        title: evt.name,
        detail: `Historical Landmark`,
        description: evt.description,
        images: evt.images,
        citation: evt.citation,
        wikidataUrl: evt.wikidata,
        isHistory: true
    });

    feature.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 0.5],
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="11" fill="%231D4ED8" stroke="%23FFFFFF" stroke-width="1.5"/><path d="M12 3l5 3v1H7V6l5-3zm-5 6h10v1H7V9zm1 2h8v7H8v-7zm1 1v5h2v-5H9zm4 0v5h2v-5h-2z" fill="%23FFFFFF"/></svg>',
            scale: 1.2
        })
    }));

    vectorSource.addFeature(feature);
});

const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});

const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        vectorLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-96.0, 37.8]),
        zoom: 4,
        minZoom: 3,
        maxZoom: 10
    }),
    controls: []
});

map.on('click', (event) => {
    const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
    if (feature) {
        openStateModal(
            feature.get('title'),
            feature.get('detail'),
            feature.get('description'),
            feature.get('images'),
            feature.get('citation'),
            feature.get('wikidataUrl'),
            feature.get('isHistory')
        );
    }
});

map.on('pointermove', (event) => {
    const hit = map.hasFeatureAtPixel(event.pixel);
    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

// Background Starfield Engine
const canvas = document.getElementById('engineCanvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

const particles = [];
for (let i = 0; i < 200; i++) {
    particles.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 800 - 400,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        vz: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5 + 0.5
    });
}

function render() {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.z < -400) p.z = 400;
        if (p.z > 400) p.z = -400;

        const fov = 450;
        const scale = fov / (fov + p.z);
        const px = width / 2 + p.x * scale;
        const py = height / 2 + p.y * scale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
            ctx.save();
            ctx.globalAlpha = Math.max(0.1, (p.z + 400) / 800) * 0.45;
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
