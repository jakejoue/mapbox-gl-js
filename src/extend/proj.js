// @flow

import { PROJECTIONS as EPSG3857_PROJECTIONS } from './proj/epsg3857.js';
import { PROJECTIONS as EPSG4326_PROJECTIONS } from './proj/epsg4326.js';
import Units from './proj/Units.js';
import Projection from './proj/Projection.js';
import { add as addProj, clear as clearProj, get as getProj } from './proj/projections.js';

// 默认导出
export { Units, Projection };

/**
 * 添加坐标系
 */
export function addProjection(projection: Projection) {
    addProj(projection.getCode(), projection);
}

/**
 * 添加多个坐标系
 */
export function addProjections(projections: Array<Projection>) {
    projections.forEach(addProjection);
}

/**
 * 查询坐标系
 */
export function get(projectionLike: String | Projection): Projection {
    const projection = typeof projectionLike === 'string' ?
        getProj(projectionLike) : (projectionLike || null);

    return projection ? projection.clone() : null;
}

/**
 * 清空坐标系
 */
export function clearAllProjections() {
    clearProj();
}

/**
 * 添加默认坐标系
 */
function addCommon() {
    addProjections(EPSG3857_PROJECTIONS);
    addProjections(EPSG4326_PROJECTIONS);
}

addCommon();
