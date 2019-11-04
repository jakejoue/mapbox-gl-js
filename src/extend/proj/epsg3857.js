// @flow

import Projection from './Projection.js';
import Units from './Units.js';

/**
 * Radius of WGS84 sphere
 *
 * @const
 * @type {number}
 */
export const RADIUS = 6378137;

/**
 * @const
 * @type {number}
 */
export const HALF_SIZE = Math.PI * RADIUS;

/**
 * @const
 */
export const EXTENT = [
    -HALF_SIZE, -HALF_SIZE,
    HALF_SIZE, HALF_SIZE
];

class EPSG3857Projection extends Projection {
    constructor(code) {
        super({
            code,
            units: Units.METERS,
            extent: EXTENT,
        });
    }
}

export const PROJECTIONS = [
    new EPSG3857Projection('EPSG:3857'),
    new EPSG3857Projection('EPSG:102100'),
    new EPSG3857Projection('EPSG:102113'),
    new EPSG3857Projection('EPSG:900913'),
    new EPSG3857Projection('urn:ogc:def:crs:EPSG:6.18:3:3857'),
    new EPSG3857Projection('urn:ogc:def:crs:EPSG::3857'),
    new EPSG3857Projection('http://www.opengis.net/gml/srs/epsg.xml#3857')
];
