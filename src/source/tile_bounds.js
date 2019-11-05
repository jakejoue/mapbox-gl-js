// @flow

// GeoGlobal-coord-huangwei-191105
import LngLatBounds from '../extend/geo/lng_lat_bounds';
import Projection from '../extend/proj/Projection';

import type { CanonicalTileID } from './tile_id';

class TileBounds {
    bounds: LngLatBounds;
    projection: Projection;
    minzoom: number;
    maxzoom: number;

    constructor(bounds: [number, number, number, number], projection: Projection, minzoom: ?number, maxzoom: ?number) {
        this.projection = projection;
        this.bounds = LngLatBounds.convert(this.validateBounds(bounds));
        this.minzoom = minzoom || 0;
        this.maxzoom = maxzoom || 24;
    }

    validateBounds(bounds: [number, number, number, number]) {
        // make sure the bounds property contains valid longitude and latitudes
        if (!Array.isArray(bounds) || bounds.length !== 4) return this.projection.getExtent();
        return [
            Math.max(this.projection.getTransform().minX, bounds[0]),
            Math.max(this.projection.getTransform().minY, bounds[1]),
            Math.min(this.projection.getTransform().maxX, bounds[2]),
            Math.min(this.projection.getTransform().maxY, bounds[3])];
    }

    contains(tileID: CanonicalTileID) {
        const worldSize = Math.pow(2, tileID.z);
        const level = {
            minX: Math.floor(this.projection.getTransform().mercatorXfromLng(this.bounds.getWest()) * worldSize),
            minY: Math.floor(this.projection.getTransform().mercatorYfromLat(this.bounds.getNorth()) * worldSize),
            maxX: Math.ceil(this.projection.getTransform().mercatorXfromLng(this.bounds.getEast()) * worldSize),
            maxY: Math.ceil(this.projection.getTransform().mercatorYfromLat(this.bounds.getSouth()) * worldSize)
        };
        const hit = tileID.x >= level.minX && tileID.x < level.maxX && tileID.y >= level.minY && tileID.y < level.maxY;
        return hit;
    }
}

export default TileBounds;
