// @flow

import Projection from './Projection.js';
import Units from './Units.js';

class EPSG4326Projection extends Projection {
    constructor(code) {
        super({
            code,
            units: Units.DEGREES,
            extent: [-180, -90, 180, 90]
        });
    }
}

export const PROJECTIONS = [
    new EPSG4326Projection('CRS:84'),
    new EPSG4326Projection('EPSG:4326'),
    new EPSG4326Projection('urn:ogc:def:crs:EPSG::4326'),
    new EPSG4326Projection('urn:ogc:def:crs:EPSG:6.6:4326'),
    new EPSG4326Projection('urn:ogc:def:crs:OGC:1.3:CRS84'),
    new EPSG4326Projection('urn:ogc:def:crs:OGC:2:84'),
    new EPSG4326Projection('http://www.opengis.net/gml/srs/epsg.xml#4326'),
    new EPSG4326Projection('urn:x-ogc:def:crs:EPSG:4326')
];
