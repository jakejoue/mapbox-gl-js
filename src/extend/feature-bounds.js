// @flow

import Projection from './proj/Projection';
import type { CanonicalTileID } from '../source/tile_id';

import { deepCopy } from './util/util';

// 分析库
import helpers from '@turf/helpers';
import booleanDisjoint from '@turf/boolean-disjoint';

// feature定义
export type Feature = {
    type: string,
    geometry: Array,
    properties: ?Object
};

// 瓦片转换为feature
function tileToFeatures(tileID: CanonicalTileID, projection: Projection): [Feature, Feature] {
    const worldSize = projection.zoomScale(tileID.z);
    const minX = projection.getTransform().lngFromMercatorX(tileID.x / worldSize);
    const maxX = projection.getTransform().lngFromMercatorX((tileID.x + 1) / worldSize);
    const maxY = projection.getTransform().latFromMercatorY(tileID.y / worldSize);
    const minY = projection.getTransform().latFromMercatorY((tileID.y + 1) / worldSize);

    return [
        // 四角坐标（左上角开始顺时针，为了叠加性能考虑）
        helpers.multiPoint([[minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]]),
        // 面
        helpers.polygon([[[minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY], [minX, maxY]]])
    ];
}

class FeatureBounds {
    projection: Projection;
    feature: Feature;

    constructor(feature: Feature, projection: Projection) {
        this.projection = projection;
        this.feature = this.validateFeature(feature);
    }

    get Feature() {
        return deepCopy(this.feature);
    }

    validateFeature(feature: Feature): Feature {
        if (feature && feature.geometry) {
            return helpers.feature(feature.geometry);
        }
        throw new Error('please input polygon feature !');
    }

    contains(tileID: CanonicalTileID) {
        const features = tileToFeatures(tileID, this.projection);
        return features.findIndex(f => !booleanDisjoint(f, this.feature)) !== -1;
    }
}

export default FeatureBounds;
