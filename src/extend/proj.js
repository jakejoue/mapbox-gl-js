// @flow

import { PROJECTIONS, EqualProjtions } from './proj/epsg.js';
import Units from './proj/Units.js';
import Projection from './proj/Projection.js';
import { add as addProj, clear as clearProj, get as getProj } from './proj/projections.js';

// 默认导出
export { Units, Projection };

// 添加坐标系
export function addProjection(projection: Projection) {
    addProj(projection.getCode(), projection);
}

// 添加多个坐标系
export function addProjections(projections: Array<Projection>) {
    projections.forEach(addProjection);
}

// 查询坐标系
export function get(projectionLike: string | Projection): Projection | null {
    const projection: any = typeof projectionLike === 'string' ?
        getProj(projectionLike) : (projectionLike || null);

    return projection ? projection.clone() : null;
}

// 清空坐标系
export function clearAllProjections() {
    clearProj();
    // 保留默认坐标系
    addProjections(PROJECTIONS);
    EqualProjtions.forEach(addEqualProjections);
}

function addEqualProjections(projections: string[]) {
    const bsaeProjection = get((projections[0]: string));
    if (bsaeProjection) {
        projections.slice(1).forEach(proj => {
            // 克隆并修改code
            const projection: Projection = bsaeProjection.clone();
            projection.code_ = proj;
            // 保留原code
            projection.originCode = bsaeProjection.getCode();
            // 添加坐标系
            addProjection(projection);
        });
    }
}

addProjections(PROJECTIONS);

// 添加相同参数定义的坐标系
EqualProjtions.forEach(addEqualProjections);
