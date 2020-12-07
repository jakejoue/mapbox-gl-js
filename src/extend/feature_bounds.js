// @flow

import Projection from './proj/Projection';
import type {CanonicalTileID} from '../source/tile_id';

// 分析库
import helpers from '@turf/helpers';
import booleanDisjoint from '@turf/boolean-disjoint';

// feature定义
export type Feature = {
    type: string,
    geometry: any,
    properties: ?Object
};

// 瓦片转换为feature
function tileToFeature(tileID: CanonicalTileID, projection: Projection): Feature {
    const worldSize = projection.zoomScale(tileID.z);
    const minX = projection.getTransform().lngFromMercatorX(tileID.x / worldSize);
    const maxX = projection.getTransform().lngFromMercatorX((tileID.x + 1) / worldSize);
    const maxY = projection.getTransform().latFromMercatorY(tileID.y / worldSize);
    const minY = projection.getTransform().latFromMercatorY((tileID.y + 1) / worldSize);

    return helpers.polygon([[[minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY], [minX, maxY]]]);
}

class FeatureBounds {
    projection: Projection;
    feature: Feature;

    constructor(feature: Feature, projection: Projection) {
        this.projection = projection;
        this.feature = this.validateFeature(feature);
    }

    validateFeature(feature: Feature): Feature {
        if (feature && feature.geometry) {
            return helpers.feature(feature.geometry);
        }
        throw new Error('please input polygon feature !');
    }

    contains(tileID: CanonicalTileID) {
        const feature = tileToFeature(tileID, this.projection);
        return !booleanDisjoint(feature, this.feature);
    }
}

export default FeatureBounds;
