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
    bounds: LngLatBounds;
    // 墨卡托范围
    mercatorBounds: [number, number, number, number];
    // 是否范围为全图
    isGlobal: boolean;

    constructor(bounds: [number, number, number, number], projection: Projection, minzoom: ?number, maxzoom: ?number) {
        this.projection = projection;
        this.minzoom = minzoom || 0;
        this.maxzoom = maxzoom || 24;

        bounds = this.validateBounds(bounds);

        this.bounds = LngLatBounds.convert(bounds);
        this.mercatorBounds = [
            this.projection.getTransform().mercatorXfromLng(this.bounds.getWest()),
            this.projection.getTransform().mercatorYfromLat(this.bounds.getNorth()),
            this.projection.getTransform().mercatorXfromLng(this.bounds.getEast()),
            this.projection.getTransform().mercatorYfromLat(this.bounds.getSouth())
        ];
        this.isGlobal = equals(bounds, projection.getExtent());
    }

    validateBounds(bounds: [number, number, number, number]): [number, number, number, number] {
        // make sure the bounds property contains valid longitude and latitudes
        if (!Array.isArray(bounds) || bounds.length !== 4) return this.projection.getExtent();

        // 获取当前坐标系最大范围
        const [minX, minY, maxX, maxY] = this.projection.getExtent();

        // 验证有效范围
        return [
            Math.max(minX, bounds[0]),
            Math.max(minY, bounds[1]),
            Math.min(maxX, bounds[2]),
            Math.min(maxY, bounds[3])];
    }

    contains(tileID: CanonicalTileID) {
        // bounds为地图范围直接返回true
        if (this.isGlobal) {
            return true;
        }

        // GeoGlobal-resolution-huangwei-1911014
        const worldSize = this.projection.zoomScale(tileID.z);
        const level = {
            minX: Math.floor(this.mercatorBounds[0] * worldSize),
            minY: Math.floor(this.mercatorBounds[1] * worldSize),
            maxX: Math.ceil(this.mercatorBounds[2] * worldSize),
            maxY: Math.ceil(this.mercatorBounds[3] * worldSize)
        };
        const hit = tileID.x >= level.minX && tileID.x < level.maxX && tileID.y >= level.minY && tileID.y < level.maxY;
        return hit;
    }
}

export default TileBounds;
