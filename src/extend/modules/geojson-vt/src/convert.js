
import simplify from './simplify';
import createFeature from './feature';

// converts GeoJSON feature into an intermediate projected JSON vector format with simplification data

// GeoGlobal-coord-workerproj-191108
export default function convert(data, options, projection) {
    const converter = getConverter(projection);

    var features = [];
    if (data.type === 'FeatureCollection') {
        for (var i = 0; i < data.features.length; i++) {
            converter.convertFeature(features, data.features[i], options, i);
        }

    } else if (data.type === 'Feature') {
        converter.convertFeature(features, data, options);

    } else {
        // single geometry or a geometry collection
        converter.convertFeature(features, { geometry: data }, options);
    }

    return features;
}

/* ************* 非直接调用（指定this变量） ************* */
function convertFeature(features, geojson, options, index) {
    if (!geojson.geometry) return;

    var coords = geojson.geometry.coordinates;
    var type = geojson.geometry.type;
    var tolerance = Math.pow(options.tolerance / ((1 << options.maxZoom) * options.extent), 2);
    var geometry = [];
    var id = geojson.id;
    if (options.promoteId) {
        id = geojson.properties[options.promoteId];
    } else if (options.generateId) {
        id = index || 0;
    }
    if (type === 'Point') {
        this.convertPoint(coords, geometry);

    } else if (type === 'MultiPoint') {
        for (var i = 0; i < coords.length; i++) {
            this.convertPoint(coords[i], geometry);
        }

    } else if (type === 'LineString') {
        this.convertLine(coords, geometry, tolerance, false);

    } else if (type === 'MultiLineString') {
        if (options.lineMetrics) {
            // explode into linestrings to be able to track metrics
            for (i = 0; i < coords.length; i++) {
                geometry = [];
                this.convertLine(coords[i], geometry, tolerance, false);
                features.push(createFeature(id, 'LineString', geometry, geojson.properties));
            }
            return;
        } else {
            this.convertLines(coords, geometry, tolerance, false);
        }

    } else if (type === 'Polygon') {
        this.convertLines(coords, geometry, tolerance, true);

    } else if (type === 'MultiPolygon') {
        for (i = 0; i < coords.length; i++) {
            var polygon = [];
            this.convertLines(coords[i], polygon, tolerance, true);
            geometry.push(polygon);
        }
    } else if (type === 'GeometryCollection') {
        for (i = 0; i < geojson.geometry.geometries.length; i++) {
            convertFeature(features, {
                id: id,
                geometry: geojson.geometry.geometries[i],
                properties: geojson.properties
            }, options, index);
        }
        return;
    } else {
        throw new Error('Input data is not a valid GeoJSON object.');
    }

    features.push(createFeature(id, type, geometry, geojson.properties));
}

function convertPoint(coords, out) {
    out.push(this.projectX(coords[0]));
    out.push(this.projectY(coords[1]));
    out.push(0);
}

function convertLine(ring, out, tolerance, isPolygon) {
    var x0, y0;
    var size = 0;

    for (var j = 0; j < ring.length; j++) {
        var x = this.projectX(ring[j][0]);
        var y = this.projectY(ring[j][1]);

        out.push(x);
        out.push(y);
        out.push(0);

        if (j > 0) {
            if (isPolygon) {
                size += (x0 * y - x * y0) / 2; // area
            } else {
                size += Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)); // length
            }
        }
        x0 = x;
        y0 = y;
    }

    var last = out.length - 3;
    out[2] = 1;
    simplify(out, 0, last, tolerance);
    out[last + 2] = 1;

    out.size = Math.abs(size);
    out.start = 0;
    out.end = out.size;
}

function convertLines(rings, out, tolerance, isPolygon) {
    for (var i = 0; i < rings.length; i++) {
        var geom = [];
        this.convertLine(rings[i], geom, tolerance, isPolygon);
        out.push(geom);
    }
}
/* ************* 非直接调用 ************* */

/*
function projectX(x) {
    return x / 360 + 0.5;
}

function projectY(y) {
    var sin = Math.sin(y * Math.PI / 180);
    var y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
    return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
}
*/

// GeoGlobal-coord-workerproj-191108
function getConverter(projection) {
    const converter = {
        projection,
        convertFeature,
        convertPoint,
        convertLine,
        convertLines,
        projectX(x) {
            if (this.projection) {
                return this.projection.getTransform().mercatorXfromLng(x);
            }
            return x / 360 + 0.5;
        },
        projectY(y) {
            if (this.projection) {
                return this.projection.getTransform().mercatorYfromLat(y);
            }
            var sin = Math.sin(y * Math.PI / 180);
            var y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
            return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
        }
    }
    return converter;
}
