/* eslint-disable */
import { VectorTileFeature } from '@mapbox/vector-tile';
import { get } from './proj';

export default class VectorTileFeature2 extends VectorTileFeature {
    toGeoJSON(x, y, z, projection) {
        // 设置默认坐标系
        projection = projection || get('EPSG:mapbox');

        var size = this.extent * projection.zoomScale(z),
            x0 = this.extent * x,
            y0 = this.extent * y,
            coords = this.loadGeometry(),
            type = VectorTileFeature.types[this.type],
            i, j;

        function project(line) {
            for (var j = 0; j < line.length; j++) {
                const p = line[j];
                const mx = (p.x + x0) / size, my = (p.y + y0) / size;

                const x = projection.getTransform().lngFromMercatorX(mx);
                const y = projection.getTransform().latFromMercatorY(my);

                line[j] = [x, y];
            }
        }

        switch (this.type) {
            case 1:
                var points = [];
                for (i = 0; i < coords.length; i++) {
                    points[i] = coords[i][0];
                }
                coords = points;
                project(coords);
                break;

            case 2:
                for (i = 0; i < coords.length; i++) {
                    project(coords[i]);
                }
                break;

            case 3:
                coords = classifyRings(coords);
                for (i = 0; i < coords.length; i++) {
                    for (j = 0; j < coords[i].length; j++) {
                        project(coords[i][j]);
                    }
                }
                break;
        }

        if (coords.length === 1) {
            coords = coords[0];
        } else {
            type = 'Multi' + type;
        }

        var result = {
            type: "Feature",
            geometry: {
                type: type,
                coordinates: coords
            },
            properties: this.properties
        };

        if ('id' in this) {
            result.id = this.id;
        }

        return result;
    };
}


function classifyRings(rings) {
    var len = rings.length;

    if (len <= 1) return [rings];

    var polygons = [],
        polygon,
        ccw;

    for (var i = 0; i < len; i++) {
        var area = signedArea(rings[i]);
        if (area === 0) continue;

        if (ccw === undefined) ccw = area < 0;

        if (ccw === area < 0) {
            if (polygon) polygons.push(polygon);
            polygon = [rings[i]];

        } else {
            polygon.push(rings[i]);
        }
    }
    if (polygon) polygons.push(polygon);

    return polygons;
}

function signedArea(ring) {
    var sum = 0;
    for (var i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
}
