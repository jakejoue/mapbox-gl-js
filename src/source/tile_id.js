// @flow

import EXTENT from '../data/extent';
import Point from '@mapbox/point-geometry';
import MercatorCoordinate from '../extend/geo/mercator_coordinate';
import type { Projection } from '../extend/proj';

import assert from 'assert';
import { register } from '../util/web_worker_transfer';

export class CanonicalTileID {
    z: number;
    x: number;
    y: number;
    key: number;

    constructor(z: number, x: number, y: number) {
        // GeoGlobal-resolution-huangwei-1911014 去除tileNum限制
        // assert(z >= 0 && z <= 25);
        // assert(x >= 0 && x < Math.pow(2, z));
        // assert(y >= 0 && y < Math.pow(2, z));
        this.z = z;
        this.x = x;
        this.y = y;
        this.key = calculateKey(0, z, x, y);
    }

    equals(id: CanonicalTileID) {
        return this.z === id.z && this.x === id.x && this.y === id.y;
    }

    // given a list of urls, choose a url template and return a tile URL
    // GeoGlobal-raster-huangwei-191111
    url(urls: Array<string>, projection: Projection, options?: any = 'xyz') {
        // 参数赋值
        let scheme, rasterType, zoomOffset;
        if ((typeof options) === 'string') {
            scheme = options;
        } else {
            scheme = options.scheme || 'xyz';
            rasterType = options.rasterType;
            zoomOffset = options.zoomOffset;
        }

        let x = this.x, y = this.y, z = this.z;

        // 其他参数计算（先进行计算）
        const bbox = projection.getTransform().getTileBBox(x, y, z);
        const quadkey = getQuadkey(z, x, y);

        // 栅格切片（不同坐标原点的不同换算）
        if (rasterType && rasterType !== scheme) {
            // 百度地图
            if (rasterType === 'baidu') {
                // GeoGlobal-resolution-huangwei-1911014
                const zz = projection.zoomScale(z) / 2;
                x = x - zz;
                y = zz - y - 1;
            }
        }
        // scheme
        if (scheme === 'tms') {
            // GeoGlobal-resolution-huangwei-1911014
            y = projection.zoomScale(z) - y - 1;
        }
        // zoom偏转
        if (zoomOffset) {
            z = z - Number.parseInt(zoomOffset);
        }

        return urls[(this.x + this.y) % urls.length]
            .replace('{prefix}', (this.x % 16).toString(16) + (this.y % 16).toString(16))
            .replace('{z}', String(Math.round(z)))
            .replace('{x}', String(Math.round(x)))
            .replace('{y}', String(Math.round(y)))
            .replace('{quadkey}', quadkey)
            .replace('{bbox-epsg-3857}', bbox)
            .replace('{bbox}', bbox);

        // 代码备份
        // const bbox = getTileBBox(this.x, this.y, this.z);
        // const quadkey = getQuadkey(this.z, this.x, this.y);

        // return urls[(this.x + this.y) % urls.length]
        //     .replace('{prefix}', (this.x % 16).toString(16) + (this.y % 16).toString(16))
        //     .replace('{z}', String(this.z))
        //     .replace('{x}', String(this.x))
        //     .replace('{y}', String(scheme === 'tms' ? (Math.pow(2, this.z) - this.y - 1) : this.y))
        //     .replace('{quadkey}', quadkey)
        //     .replace('{bbox-epsg-3857}', bbox);
    }

    getTilePoint(coord: MercatorCoordinate) {
        // GeoGlobal-resolution-huangwei-1911014
        const tilesAtZoom = coord.projection.zoomScale(this.z);
        return new Point(
            (coord.x * tilesAtZoom - this.x) * EXTENT,
            (coord.y * tilesAtZoom - this.y) * EXTENT);
    }
}

export class UnwrappedTileID {
    wrap: number;
    canonical: CanonicalTileID;
    key: number;

    constructor(wrap: number, canonical: CanonicalTileID) {
        this.wrap = wrap;
        this.canonical = canonical;
        this.key = calculateKey(wrap, canonical.z, canonical.x, canonical.y);
    }
}

export class OverscaledTileID {
    overscaledZ: number;
    wrap: number;
    canonical: CanonicalTileID;
    key: number;
    posMatrix: Float32Array;

    constructor(overscaledZ: number, wrap: number, z: number, x: number, y: number) {
        assert(overscaledZ >= z);
        this.overscaledZ = overscaledZ;
        this.wrap = wrap;
        this.canonical = new CanonicalTileID(z, +x, +y);
        this.key = calculateKey(wrap, overscaledZ, x, y);
    }

    equals(id: OverscaledTileID) {
        return this.overscaledZ === id.overscaledZ && this.wrap === id.wrap && this.canonical.equals(id.canonical);
    }

    scaledTo(targetZ: number) {
        assert(targetZ <= this.overscaledZ);
        const zDifference = this.canonical.z - targetZ;
        if (targetZ > this.canonical.z) {
            return new OverscaledTileID(targetZ, this.wrap, this.canonical.z, this.canonical.x, this.canonical.y);
        } else {
            return new OverscaledTileID(targetZ, this.wrap, targetZ, this.canonical.x >> zDifference, this.canonical.y >> zDifference);
        }
    }

    isChildOf(parent: OverscaledTileID) {
        if (parent.wrap !== this.wrap) {
            // We can't be a child if we're in a different world copy
            return false;
        }
        const zDifference = this.canonical.z - parent.canonical.z;
        // We're first testing for z == 0, to avoid a 32 bit shift, which is undefined.
        return parent.overscaledZ === 0 || (
            parent.overscaledZ < this.overscaledZ &&
            parent.canonical.x === (this.canonical.x >> zDifference) &&
            parent.canonical.y === (this.canonical.y >> zDifference));
    }

    children(sourceMaxZoom: number) {
        if (this.overscaledZ >= sourceMaxZoom) {
            // return a single tile coord representing a an overscaled tile
            return [new OverscaledTileID(this.overscaledZ + 1, this.wrap, this.canonical.z, this.canonical.x, this.canonical.y)];
        }

        const z = this.canonical.z + 1;
        const x = this.canonical.x * 2;
        const y = this.canonical.y * 2;
        return [
            new OverscaledTileID(z, this.wrap, z, x, y),
            new OverscaledTileID(z, this.wrap, z, x + 1, y),
            new OverscaledTileID(z, this.wrap, z, x, y + 1),
            new OverscaledTileID(z, this.wrap, z, x + 1, y + 1)
        ];
    }

    isLessThan(rhs: OverscaledTileID) {
        if (this.wrap < rhs.wrap) return true;
        if (this.wrap > rhs.wrap) return false;

        if (this.overscaledZ < rhs.overscaledZ) return true;
        if (this.overscaledZ > rhs.overscaledZ) return false;

        if (this.canonical.x < rhs.canonical.x) return true;
        if (this.canonical.x > rhs.canonical.x) return false;

        if (this.canonical.y < rhs.canonical.y) return true;
        return false;
    }

    wrapped() {
        return new OverscaledTileID(this.overscaledZ, 0, this.canonical.z, this.canonical.x, this.canonical.y);
    }

    unwrapTo(wrap: number) {
        return new OverscaledTileID(this.overscaledZ, wrap, this.canonical.z, this.canonical.x, this.canonical.y);
    }

    overscaleFactor() {
        return Math.pow(2, this.overscaledZ - this.canonical.z);
    }

    toUnwrapped() {
        return new UnwrappedTileID(this.wrap, this.canonical);
    }

    toString() {
        return `${this.overscaledZ}/${this.canonical.x}/${this.canonical.y}`;
    }

    getTilePoint(coord: MercatorCoordinate) {
        // GeoGlobal-resolution-huangwei-1911014
        return this.canonical.getTilePoint(new MercatorCoordinate(coord.x - this.wrap, coord.y, coord.z, coord.projection));
    }
}

function calculateKey(wrap: number, z: number, x: number, y: number) {
    wrap *= 2;
    if (wrap < 0) wrap = wrap * -1 - 1;
    const dim = 1 << z;
    return ((dim * dim * wrap + dim * y + x) * 32) + z;
}

function getQuadkey(z, x, y) {
    let quadkey = '', mask;
    for (let i = z; i > 0; i--) {
        mask = 1 << (i - 1);
        quadkey += ((x & mask ? 1 : 0) + (y & mask ? 2 : 0));
    }
    return quadkey;
}

register('CanonicalTileID', CanonicalTileID);
register('OverscaledTileID', OverscaledTileID, { omit: ['posMatrix'] });
