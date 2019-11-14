// @flow

// GeoGlobal-coord-huangwei-191105
import LngLatBounds from '../extend/geo/lng_lat_bounds';
import Projection from '../extend/proj/Projection';
import { equals } from '../extend/extent';

import type { CanonicalTileID } from './tile_id';

class TileBounds {
    projection: Projection;
    minzoom: number;
    maxzoom: number;
    isEquals: boolean;
    bounds: LngLatBounds;

    constructor(bounds: [number, number, number, number], projection: Projection, minzoom: ?number, maxzoom: ?number) {
        this.projection = projection;
        this.minzoom = minzoom || 0;
        this.maxzoom = maxzoom || 24;
        this.isEquals = equals(this.validateBounds(bounds), projection.getExtent());
        this.bounds = LngLatBounds.convert(this.validateBounds(bounds));
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
        // bounds为地图范围直接返回true
        if (this.isEquals) {
            return true;
        }

        // GeoGlobal-resolution-huangwei-1911014
        const worldSize = this.projection.zoomScale(tileID.z);
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
