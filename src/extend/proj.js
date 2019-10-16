// @flow

import { getDistance } from './sphere.js';
import { applyTransform } from './extent.js';
import { modulo } from './math.js';
import { toEPSG4326, fromEPSG4326, PROJECTIONS as EPSG3857_PROJECTIONS } from './proj/epsg3857.js';
import { PROJECTIONS as EPSG4326_PROJECTIONS } from './proj/epsg4326.js';
import Projection from './proj/Projection.js';
import Units, { METERS_PER_UNIT } from './proj/Units.js';
import { add as addTransformFunc, clear as clearTransformFuncs, get as getTransformFunc } from './proj/transforms.js';
import { add as addProj, clear as clearProj, get as getProj } from './proj/projections.js';
import { register as registerProj4 } from './proj/proj4';

// 默认导出
export { METERS_PER_UNIT };

export { Projection };

export { registerProj4 };

/**
 * 默认坐标转换方法（复制一个相同坐标）
 *
 * @param {Array<number>} input Input coordinate array.
 * @param {Array<number>=} optOutput Output array of coordinate values.
 * @param {number=} optDimension Dimension.
 * @return {Array<number>} Output coordinate array (new array, same coordinate
 *     values).
 */
// eslint-disable-next-line no-unused-vars
export function cloneTransform(input, optOutput, optDimension) {
    let output;
    if (optOutput !== undefined) {
        for (let i = 0, ii = input.length; i < ii; ++i) {
            optOutput[i] = input[i];
        }
        output = optOutput;
    } else {
        output = input.slice();
    }
    return output;
}

/**
 * 默认坐标转换方法2
 *
 * @param {Array<number>} input Input coordinate array.
 * @param {Array<number>=} optOutput Output array of coordinate values.
 * @param {number=} optDimension Dimension.
 * @return {Array<number>} Input coordinate array (same array as input).
 */
// eslint-disable-next-line no-unused-vars
export function identityTransform(input, optOutput, optDimension) {
    if (optOutput !== undefined && input !== optOutput) {
        for (let i = 0, ii = input.length; i < ii; ++i) {
            optOutput[i] = input[i];
        }
        input = optOutput;
    }
    return input;
}

/**
 * 添加坐标系
 *
 * @param {Projection} projection Projection instance.
 * @api
 */
export function addProjection(projection) {
    addProj(projection.getCode(), projection);
    addTransformFunc(projection, projection, cloneTransform);
}

/**
 * 添加多个坐标系
 *
 * @param {Array<Projection>} projections Projections.
 */
export function addProjections(projections) {
    projections.forEach(addProjection);
}

/**
 * 查询坐标系
 *
 * @param {ProjectionLike} projectionLike Either a code string which is
 *     a combination of authority and identifier such as "EPSG:4326", or an
 *     existing projection object, or undefined.
 * @return {Projection} Projection object, or null if not in list.
 * @api
 */
export function get(projectionLike) {
    return typeof projectionLike === 'string' ?
        getProj(/** @type {string} */(projectionLike)) :
        (/** @type {Projection} */ (projectionLike) || null);
}

/**
 * Get the resolution of the point in degrees or distance units.
 * For projections with degrees as the unit this will simply return the
 * provided resolution. For other projections the point resolution is
 * by default estimated by transforming the 'point' pixel to EPSG:4326,
 * measuring its width and height on the normal sphere,
 * and taking the average of the width and height.
 * A custom function can be provided for a specific projection, either
 * by setting the `getPointResolution` option in the
 * {@link module:ol/proj/Projection~Projection} constructor or by using
 * {@link module:ol/proj/Projection~Projection#setGetPointResolution} to change an existing
 * projection object.
 * @param {ProjectionLike} projection The projection.
 * @param {number} resolution Nominal resolution in projection units.
 * @param {import("./coordinate.js").Coordinate} point Point to find adjusted resolution at.
 * @param {Units=} optUnits Units to get the point resolution in.
 * Default is the projection's units.
 * @return {number} Point resolution.
 * @api
 */
export function getPointResolution(projection, resolution, point, optUnits) {
    projection = get(projection);
    let pointResolution;
    const getter = projection.getPointResolutionFunc();
    if (getter) {
        pointResolution = getter(resolution, point);
        if (optUnits && optUnits !== projection.getUnits()) {
            const metersPerUnit = projection.getMetersPerUnit();
            if (metersPerUnit) {
                pointResolution = pointResolution * metersPerUnit / METERS_PER_UNIT[optUnits];
            }
        }
    } else {
        const units = projection.getUnits();
        if (units === Units.DEGREES && !optUnits || optUnits === Units.DEGREES) {
            pointResolution = resolution;
        } else {
            // Estimate point resolution by transforming the center pixel to EPSG:4326,
            // measuring its width and height on the normal sphere, and taking the
            // average of the width and height.
            const toEPSG4326 = getTransformFromProjections(projection, get('EPSG:4326'));
            let vertices = [
                point[0] - resolution / 2, point[1],
                point[0] + resolution / 2, point[1],
                point[0], point[1] - resolution / 2,
                point[0], point[1] + resolution / 2
            ];
            vertices = toEPSG4326(vertices, vertices, 2);
            const width = getDistance(vertices.slice(0, 2), vertices.slice(2, 4));
            const height = getDistance(vertices.slice(4, 6), vertices.slice(6, 8));
            pointResolution = (width + height) / 2;
            const metersPerUnit = optUnits ?
                METERS_PER_UNIT[optUnits] :
                projection.getMetersPerUnit();
            if (metersPerUnit !== undefined) {
                pointResolution /= metersPerUnit;
            }
        }
    }
    return pointResolution;
}

/**
 * 注册一个相等的坐标系
 *
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array<Projection>} projections Projections.
 * @api
 */
export function addEquivalentProjections(projections) {
    addProjections(projections);
    projections.forEach((source) => {
        projections.forEach((destination) => {
            if (source !== destination) {
                addTransformFunc(source, destination, cloneTransform);
            }
        });
    });
}

/**
 * 注册一个相等的坐标转换方法
 *
 * Registers transformation functions to convert coordinates in any projection
 * in projection1 to any projection in projection2.
 *
 * @param {Array<Projection>} projections1 Projections with equal
 *     meaning.
 * @param {Array<Projection>} projections2 Projections with equal
 *     meaning.
 * @param {TransformFunction} forwardTransform Transformation from any
 *   projection in projection1 to any projection in projection2.
 * @param {TransformFunction} inverseTransform Transform from any projection
 *   in projection2 to any projection in projection1..
 */
export function addEquivalentTransforms(projections1, projections2, forwardTransform, inverseTransform) {
    projections1.forEach((projection1) => {
        projections2.forEach((projection2) => {
            addTransformFunc(projection1, projection2, forwardTransform);
            addTransformFunc(projection2, projection1, inverseTransform);
        });
    });
}

/**
 * 清空所有坐标系和坐标转换方法
 *
 * Clear all cached projections and transforms.
 */
export function clearAllProjections() {
    clearProj();
    clearTransformFuncs();
}

/**
 * 创建一个坐标转换方法
 *
 * Creates a {@link module:ol/proj~TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} coordTransform Coordinate
 *     transform.
 * @return {TransformFunction} Transform function.
 */
export function createTransformFromCoordinateTransform(coordTransform) {
    return (
        /**
         * @param {Array<number>} input Input.
         * @param {Array<number>=} optOutput Output.
         * @param {number=} optDimension Dimension.
         * @return {Array<number>} Output.
         */
        function (input, optOutput, optDimension) {
            const length = input.length;
            const dimension = optDimension !== undefined ? optDimension : 2;
            const output = optOutput !== undefined ? optOutput : new Array(length);
            for (let i = 0; i < length; i += dimension) {
                const point = coordTransform([input[i], input[i + 1]]);
                output[i] = point[0];
                output[i + 1] = point[1];
                for (let j = dimension - 1; j >= 2; --j) {
                    output[i + j] = input[i + j];
                }
            }
            return output;
        });
}

/**
 * 添加一个坐标转换方法
 *
 * Registers coordinate transform functions to convert coordinates between the
 * source projection and the destination projection.
 * The forward and inverse functions convert coordinate pairs; this function
 * converts these into the functions used internally which also handle
 * extents and coordinate arrays.
 *
 * @param {ProjectionLike} source Source projection.
 * @param {ProjectionLike} destination Destination projection.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} forward The forward transform
 *     function (that is, from the source projection to the destination
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} inverse The inverse transform
 *     function (that is, from the destination projection to the source
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @api
 */
export function addCoordinateTransforms(source, destination, forward, inverse) {
    const sourceProj = get(source);
    const destProj = get(destination);
    addTransformFunc(sourceProj, destProj, createTransformFromCoordinateTransform(forward));
    addTransformFunc(destProj, sourceProj, createTransformFromCoordinateTransform(inverse));
}

/**
 * 从经纬度转换为目标坐标系
 *
 * Transforms a coordinate from longitude/latitude to a different projection.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate as longitude and latitude, i.e.
 *     an array with longitude as 1st and latitude as 2nd element.
 * @param {ProjectionLike=} optProjection Target projection. The
 *     default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {import("./coordinate.js").Coordinate} Coordinate projected to the target projection.
 * @api
 */
export function fromLonLat(coordinate, optProjection) {
    return transform(coordinate, 'EPSG:4326',
        optProjection !== undefined ? optProjection : 'EPSG:3857');
}

/**
 * 从源坐标系转为经纬度
 *
 * Transforms a coordinate to longitude/latitude.
 * @param {import("./coordinate.js").Coordinate} coordinate Projected coordinate.
 * @param {ProjectionLike=} optProjection Projection of the coordinate.
 *     The default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {import("./coordinate.js").Coordinate} Coordinate as longitude and latitude, i.e. an array
 *     with longitude as 1st and latitude as 2nd element.
 * @api
 */
export function toLonLat(coordinate, optProjection) {
    const lonLat = transform(coordinate,
        optProjection !== undefined ? optProjection : 'EPSG:3857', 'EPSG:4326');
    const lon = lonLat[0];
    if (lon < -180 || lon > 180) {
        lonLat[0] = modulo(lon + 180, 360) - 180;
    }
    return lonLat;
}

/**
 * 判断两个坐标系的相等性
 *
 * Checks if two projections are the same, that is every coordinate in one
 * projection does represent the same geographic point as the same coordinate in
 * the other projection.
 *
 * @param {Projection} projection1 Projection 1.
 * @param {Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 * @api
 */
export function equivalent(projection1, projection2) {
    if (projection1 === projection2) {
        return true;
    }
    const equalUnits = projection1.getUnits() === projection2.getUnits();
    if (projection1.getCode() === projection2.getCode()) {
        return equalUnits;
    } else {
        const transformFunc = getTransformFromProjections(projection1, projection2);
        return transformFunc === cloneTransform && equalUnits;
    }
}

/**
 * 通过坐标系获取转换方法（如果不存在返回默认坐标系转换方法）
 *
 * Searches in the list of transform functions for the function for converting
 * coordinates from the source projection to the destination projection.
 *
 * @param {Projection} sourceProjection Source Projection object.
 * @param {Projection} destinationProjection Destination Projection
 *     object.
 * @return {TransformFunction} Transform function.
 */
export function getTransformFromProjections(sourceProjection, destinationProjection) {
    const sourceCode = sourceProjection.getCode();
    const destinationCode = destinationProjection.getCode();
    let transformFunc = getTransformFunc(sourceCode, destinationCode);
    if (!transformFunc) {
        transformFunc = identityTransform;
    }
    return transformFunc;
}

/**
 * 通过坐标系获取转换方法
 *
 * Given the projection-like objects, searches for a transformation
 * function to convert a coordinates array from the source projection to the
 * destination projection.
 *
 * @param {ProjectionLike} source Source.
 * @param {ProjectionLike} destination Destination.
 * @return {TransformFunction} Transform function.
 * @api
 */
export function getTransform(source, destination) {
    const sourceProjection = get(source);
    const destinationProjection = get(destination);
    return getTransformFromProjections(sourceProjection, destinationProjection);
}

/**
 * 坐标转换
 *
 * Transforms a coordinate from source projection to destination projection.
 * This returns a new coordinate (and does not modify the original).
 *
 * See {@link module:ol/proj~transformExtent} for extent transformation.
 * See the transform method of {@link module:ol/geom/Geometry~Geometry} and its
 * subclasses for geometry transforms.
 *
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @param {ProjectionLike} source Source projection-like.
 * @param {ProjectionLike} destination Destination projection-like.
 * @return {import("./coordinate.js").Coordinate} Coordinate.
 * @api
 */
export function transform(coordinate, source, destination) {
    const transformFunc = getTransform(source, destination);
    return transformFunc(coordinate, undefined, coordinate.length);
}

/**
 * 范围坐标转换
 *
 * Transforms an extent from source projection to destination projection.  This
 * returns a new extent (and does not modify the original).
 *
 * @param {import("./extent.js").Extent} extent The extent to transform.
 * @param {ProjectionLike} source Source projection-like.
 * @param {ProjectionLike} destination Destination projection-like.
 * @return {import("./extent.js").Extent} The transformed extent.
 * @api
 */
export function transformExtent(extent, source, destination) {
    const transformFunc = getTransform(source, destination);
    return applyTransform(extent, transformFunc);
}

/**
 * 坐标转换2
 *
 * Transforms the given point to the destination projection.
 *
 * @param {import("./coordinate.js").Coordinate} point Point.
 * @param {Projection} sourceProjection Source projection.
 * @param {Projection} destinationProjection Destination projection.
 * @return {import("./coordinate.js").Coordinate} Point.
 */
export function transformWithProjections(point, sourceProjection, destinationProjection) {
    const transformFunc = getTransformFromProjections(sourceProjection, destinationProjection);
    return transformFunc(point);
}

/**
 * 添加默认坐标系
 *
 * Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
 * by when this module is executed and should only need to be called again after
 * `clearAllProjections()` is called (e.g. in tests).
 */
export function addCommon() {
    // Add transformations that don't alter coordinates to convert within set of
    // projections with equal meaning.
    addEquivalentProjections(EPSG3857_PROJECTIONS);
    addEquivalentProjections(EPSG4326_PROJECTIONS);
    // Add transformations to convert EPSG:4326 like coordinates to EPSG:3857 like
    // coordinates and back.
    addEquivalentTransforms(EPSG4326_PROJECTIONS, EPSG3857_PROJECTIONS, fromEPSG4326, toEPSG4326);
}

addCommon();
