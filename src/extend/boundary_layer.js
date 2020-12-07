// @flow
// GeoGlobal-boundary-huangwei
import {Evented} from '../util/evented';
import FeatureBounds from './feature_bounds';

import type Map from '../ui/map';
import type {OverscaledTileID} from '../source/tile_id';

export default class BoundaryLayer extends Evented {
    featureBounds: FeatureBounds;

    _options: any;
    map: Map;

    setBoundary(boundary: any) {
        if (boundary) {
            this._options.boundary = boundary;
            this.featureBounds = new FeatureBounds(boundary, this.map.projection);
        } else {
            delete this._options.boundary;
            delete this.featureBounds;
        }
    }

    hasTileExt(tileID: OverscaledTileID) {
        // 初始化
        if (!this.featureBounds && this._options.boundary) {
            this.setBoundary(this._options.boundary);
        }

        return !this.featureBounds || this.featureBounds.contains(tileID.canonical);
    }
}
