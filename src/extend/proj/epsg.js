// @flow
// 内置的默认坐标系

import Projection from './Projection.js';
import Units from './Units.js';

const RADIUS = 6378137;

const HALF_SIZE = Math.PI * RADIUS;

const EXTENT = [
    -HALF_SIZE, -HALF_SIZE,
    HALF_SIZE, HALF_SIZE
];

// 3857
const EPSG3857 = new Projection({
    code: 'EPSG:3857',
    units: Units.METERS,
    extent: EXTENT
});

// 4326
const EPSG4326 = new Projection({
    code: 'EPSG:4326',
    units: Units.DEGREES,
    extent: [-180, -270, 180, 90],
    validlatRange: [-90, 90]
});

// mapbox
const EPSGMAPBOX = new Projection({
    code: 'EPSG:mapbox',
    units: Units.DEGREES,
    extent: [-180, -85, 180, 85],
    validlatRange: [-85, 85]
});

// 导出默认坐标系
export const PROJECTIONS = [
    EPSG3857,
    EPSG4326,
    EPSGMAPBOX
];

// 相等的坐标系
export const EqualProjtions = [
    ['EPSG:3857', '3857'],
    ['EPSG:4326', '4326', 'EPSG:4490', '4490'],
    ['EPSG:mapbox', 'web_Mercator', 'mapbox']
];
