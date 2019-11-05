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
    extent: EXTENT,
});

// 4326
const EPSG4326 = new Projection({
    code: 'EPSG:4326',
    units: Units.DEGREES,
    extent: [-180, -90, 180, 90]
});

// mapbox
const EPSGMAPBOX = new Projection({
    code: 'EPSG:mapbox',
    units: Units.DEGREES,
    extent: [-180, -90, 180, 90],
    validlatRange: [-85.051129, 85.051129]
});

// 导出默认坐标系
export const PROJECTIONS = [
    EPSG3857,
    EPSG4326,
    EPSGMAPBOX
];
