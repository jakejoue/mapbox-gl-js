
import convert from './convert';     // GeoJSON conversion and preprocessing
import clip from './clip';           // stripe clipping algorithm
import wrap from './wrap';           // date line processing
import transform from './transform'; // coordinate transformation
import createTile from './tile';     // final simplified tile generation

import hat from '../../hat';

// GeoGlobal-coord-workerproj-huangwei-191108
export default function geojsonvt(data, options, projection) {
    return new GeoJSONVT(data, options, projection);
}

function GeoJSONVT(data, options, projection) {
    // GeoGlobal-coord-workerproj-huangwei-191108
    this.projection = projection;

    options = this.options = extend(Object.create(this.options), options);

    var debug = options.debug;

    if (debug) console.time('preprocess data');

    if (options.maxZoom < 0 || options.maxZoom > 24) throw new Error('maxZoom should be in the 0-24 range');
    if (options.promoteId && options.generateId) throw new Error('promoteId and generateId cannot be used together.');

    // GeoGlobal-geojsonlayer-huangwei-191125 赋值原属性信息（避免切片后获取的feature不全）
    if (data.type === 'Feature') {
        data = {
            type: 'FeatureCollection',
            features: [data]
        };
    } else if (data.type !== 'FeatureCollection') {
        data = {
            type: 'FeatureCollection',
            features: [{ geometry: data }]
        };
    }
    data.features = data.features.map(f => {
        if (!f.properties) f.properties = {};
        const _metadata = JSON.stringify(f);
        f.properties._metadataId = hat();
        f.properties._metadata = _metadata;
        return f;
    });

    // GeoGlobal-coord-workerproj-huangwei-191108
    var features = convert(data, options, projection);

    this.tiles = {};
    this.tileCoords = [];

    if (debug) {
        console.timeEnd('preprocess data');
        console.log('index: maxZoom: %d, maxPoints: %d', options.indexMaxZoom, options.indexMaxPoints);
        console.time('generate tiles');
        this.stats = {};
        this.total = 0;
    }

    features = wrap(features, options);

    // start slicing from the top tile down
    if (features.length)
        // GeoGlobal-resolution-huangwei-191126 自定义金字塔切片
        if (this.projection.maxZoom) {
            this.splitTile2(features, 0, 0, 0);
        } else {
            this.splitTile(features, 0, 0, 0);
        }

    if (debug) {
        if (features.length) console.log('features: %d, points: %d', this.tiles[0].numFeatures, this.tiles[0].numPoints);
        console.timeEnd('generate tiles');
        console.log('tiles generated:', this.total, JSON.stringify(this.stats));
    }
}

GeoJSONVT.prototype.options = {
    maxZoom: 14,            // max zoom to preserve detail on
    indexMaxZoom: 5,        // max zoom in the tile index
    indexMaxPoints: 100000, // max number of points per tile in the tile index
    tolerance: 3,           // simplification tolerance (higher means simpler)
    extent: 4096,           // tile extent
    buffer: 64,             // tile buffer on each side
    lineMetrics: false,     // whether to calculate line metrics
    promoteId: null,        // name of a feature property to be promoted to feature.id
    generateId: false,      // whether to generate feature ids. Cannot be used with promoteId
    debug: 0                // logging level (0, 1 or 2)
};

GeoJSONVT.prototype.splitTile = function (features, z, x, y, cz, cx, cy) {

    var stack = [features, z, x, y],
        options = this.options,
        debug = options.debug;

    // avoid recursion by using a processing queue
    while (stack.length) {
        y = stack.pop();
        x = stack.pop();
        z = stack.pop();
        features = stack.pop();

        var z2 = 1 << z,
            id = toID(z, x, y),
            tile = this.tiles[id];

        if (!tile) {
            if (debug > 1) console.time('creation');

            // GeoGlobal-resolution-huangwei-1911014
            tile = this.tiles[id] = createTile(features, z, x, y, options, this.projection);
            this.tileCoords.push({z: z, x: x, y: y});

            if (debug) {
                if (debug > 1) {
                    console.log('tile z%d-%d-%d (features: %d, points: %d, simplified: %d)',
                        z, x, y, tile.numFeatures, tile.numPoints, tile.numSimplified);
                    console.timeEnd('creation');
                }
                var key = 'z' + z;
                this.stats[key] = (this.stats[key] || 0) + 1;
                this.total++;
            }
        }

        // save reference to original geometry in tile so that we can drill down later if we stop now
        tile.source = features;

        // if it's the first-pass tiling
        if (!cz) {
            // stop tiling if we reached max zoom, or if the tile is too simple
            if (z === options.indexMaxZoom || tile.numPoints <= options.indexMaxPoints) continue;

        // if a drilldown to a specific tile
        } else {
            // stop tiling if we reached base zoom or our target tile zoom
            if (z === options.maxZoom || z === cz) continue;

            // stop tiling if it's not an ancestor of the target tile
            var m = 1 << (cz - z);
            if (x !== Math.floor(cx / m) || y !== Math.floor(cy / m)) continue;
        }

        // if we slice further down, no need to keep source geometry
        tile.source = null;

        if (features.length === 0) continue;

        if (debug > 1) console.time('clipping');

        // values we'll use for clipping
        var k1 = 0.5 * options.buffer / options.extent,
            k2 = 0.5 - k1,
            k3 = 0.5 + k1,
            k4 = 1 + k1,
            tl, bl, tr, br, left, right;

        tl = bl = tr = br = null;

        left  = clip(features, z2, x - k1, x + k3, 0, tile.minX, tile.maxX, options);
        right = clip(features, z2, x + k2, x + k4, 0, tile.minX, tile.maxX, options);
        features = null;

        if (left) {
            tl = clip(left, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, options);
            bl = clip(left, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, options);
            left = null;
        }

        if (right) {
            tr = clip(right, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, options);
            br = clip(right, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, options);
            right = null;
        }

        if (debug > 1) console.timeEnd('clipping');

        stack.push(tl || [], z + 1, x * 2,     y * 2);
        stack.push(bl || [], z + 1, x * 2,     y * 2 + 1);
        stack.push(tr || [], z + 1, x * 2 + 1, y * 2);
        stack.push(br || [], z + 1, x * 2 + 1, y * 2 + 1);
    }
};

// GeoGlobal-resolution-huangwei-191126 自定义金字塔切片
GeoJSONVT.prototype.splitTile2 = function (features, z, x, y) {
    var options = this.options;

    var tiles = this.projection.zoomScale(z),
        id = toID(z, x, y),
        tile = this.tiles[id];

    var topTile = this.tiles[toID(0, 0, 0)];

    if (!topTile) {
        topTile = this.tiles[toID(0, 0, 0)] = createTile(features, 0, 0, 0, options, this.projection);
        topTile.source = features;
        return;
    }

    var k1 = 0.5 * options.buffer / options.extent,
        k4 = 1 + k1;
    var featureX = clip(features, tiles, x - k1, x + k4, 0, topTile.minX, topTile.maxX, options),
        featureY

	if (featureX) {
		featureY = clip(featureX, tiles, y - k1, y + k4, 1, topTile.minY, topTile.maxY, options);
	}
	if (featureY) {
		this.tiles[id] = createTile(featureY, z, x, y, options, this.projection);
	}
};

GeoJSONVT.prototype.getTile = function (z, x, y) {
    var options = this.options,
        extent = options.extent,
        debug = options.debug;

    if (z < 0 || z > 24) return null;

    // GeoGlobal-resolution-huangwei-1911014
    var z2 = this.projection.zoomScale(z);
    x = ((x % z2) + z2) % z2; // wrap tile x coordinate

    var id = toID(z, x, y);
    // GeoGlobal-resolution-huangwei-1911014
    if (this.tiles[id]) return transform(this.tiles[id], extent, this.projection);

    if (debug > 1) console.log('drilling down to z%d-%d-%d', z, x, y);

    var z0 = z,
        x0 = x,
        y0 = y,
        parent;

    // GeoGlobal-resolution-huangwei-1911018 存在自定义resolutions，改变切片方法
    if (this.projection.maxZoom) {
        parent = this.tiles[toID(0, 0, 0)];
        if (!parent || !parent.source) return null;

        this.splitTile2(parent.source, z, x, y);
        return this.tiles[id] ? transform(this.tiles[id], extent, this.projection) : null;
    }

    while (!parent && z0 > 0) {
        z0--;
        x0 = Math.floor(x0 / 2);
        y0 = Math.floor(y0 / 2);
        parent = this.tiles[toID(z0, x0, y0)];
    }

    if (!parent || !parent.source) return null;

    // if we found a parent tile containing the original geometry, we can drill down from it
    if (debug > 1) console.log('found parent tile z%d-%d-%d', z0, x0, y0);

    if (debug > 1) console.time('drilling down');
    this.splitTile(parent.source, z0, x0, y0, z, x, y);
    if (debug > 1) console.timeEnd('drilling down');

    // GeoGlobal-resolution-huangwei-1911014
    return this.tiles[id] ? transform(this.tiles[id], extent, this.projection) : null;
};

function toID(z, x, y) {
    return (((1 << z) * y + x) * 32) + z;
}

function extend(dest, src) {
    for (var i in src) dest[i] = src[i];
    return dest;
}