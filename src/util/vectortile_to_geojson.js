// @flow
import type {GeoJSONGeometry} from '@mapbox/geojson-types';

// GeoGlobal-vector2geojson-huangwei-191111
import type {Projection} from '../extend/proj';
import VectorTileFeature2 from '../extend/vector-tile-feature2';

// GeoGlobal-vector2geojson-huangwei-191111
class Feature {
    type: 'Feature';
    _geometry: ?GeoJSONGeometry;
    properties: {};
    id: number | string | void;

    // GeoGlobal-vector2geojson-huangwei-191111 坐标系
    _projection: ?Projection;

    _vectorTileFeature: VectorTileFeature;

    constructor(vectorTileFeature: VectorTileFeature, z: number, x: number, y: number) {
        this.type = 'Feature';

        this._vectorTileFeature = vectorTileFeature;
        (vectorTileFeature: any)._z = z;
        (vectorTileFeature: any)._x = x;
        (vectorTileFeature: any)._y = y;

        this.properties = vectorTileFeature.properties;

        if (vectorTileFeature.id != null) {
            this.id = vectorTileFeature.id;
        }
    }

    get geometry(): ?GeoJSONGeometry {
        if (this._geometry === undefined) {
            // GeoGlobal-vector2geojson-huangwei-191111 转换为Geojson传递坐标系
            this._geometry = VectorTileFeature2.prototype.toGeoJSON.call(
                this._vectorTileFeature,
                this._vectorTileFeature._x,
                this._vectorTileFeature._y,
                this._vectorTileFeature._z,
                this._projection
            ).geometry;

            // this._geometry = this._vectorTileFeature.toGeoJSON(
            //     (this._vectorTileFeature: any)._x,
            //     (this._vectorTileFeature: any)._y,
            //     (this._vectorTileFeature: any)._z).geometry;
        }
        return this._geometry;
    }

    set geometry(g: ?GeoJSONGeometry) {
        this._geometry = g;
    }

    toJSON() {
        // GeoGlobal-geojsonlayer-huangwei-191125 如果有元数据信息
        if (this.properties && this.properties._metadataId && this.properties._metadata) {
            const { _metadataId, _metadata } = this.properties;
            const feature = JSON.parse(_metadata);
            feature.fid = _metadataId;

            feature.toJSON = function() {
                return this;
            };
            // 赋值其他属性
            for (const i in this) {
                if (
                    i === '_geometry' ||
                    i === '_vectorTileFeature' ||
                    i === '_projection' ||
                    i === 'toJSON' ||
                    i === 'geometry' ||
                    i === 'properties')
                    continue;
                feature[i] = this[i];
            }
            return feature;
        }

        const json = {
            geometry: this.geometry
        };
        for (const i in this) {
            // GeoGlobal-vector2geojson-huangwei-191111 过滤坐标系参数
            if (i === '_geometry' || i === '_vectorTileFeature' || i === '_projection') continue;
            json[i] = (this: any)[i];
        }
        return json;
    }
}

export default Feature;
