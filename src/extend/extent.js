/* eslint-disable flowtype/require-valid-file-annotation */

/**
 * Build an extent that includes all given coordinates.
 *
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @return {Extent} Bounding extent.
 * @private
 */
export function boundingExtent(coordinates) {
    const extent = createEmpty();
    for (let i = 0, ii = coordinates.length; i < ii; ++i) {
        extendCoordinate(extent, coordinates[i]);
    }
    return extent;
}

/**
 * @param {Array<number>} xs Xs.
 * @param {Array<number>} ys Ys.
 * @param {Extent=} optExtent Destination extent.
 * @return {Extent} Extent.
 * @private
 */
function _boundingExtentXYs(xs, ys, optExtent) {
    const minX = Math.min.apply(null, xs);
    const minY = Math.min.apply(null, ys);
    const maxX = Math.max.apply(null, xs);
    const maxY = Math.max.apply(null, ys);
    return createOrUpdate(minX, minY, maxX, maxY, optExtent);
}

/**
 * Return extent increased by the provided value.
 * @param {Extent} extent Extent.
 * @param {number} value The amount by which the extent should be buffered.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function buffer(extent, value, optExtent) {
    if (optExtent) {
        optExtent[0] = extent[0] - value;
        optExtent[1] = extent[1] - value;
        optExtent[2] = extent[2] + value;
        optExtent[3] = extent[3] + value;
        return optExtent;
    } else {
        return [
            extent[0] - value,
            extent[1] - value,
            extent[2] + value,
            extent[3] + value,
        ];
    }
}

/**
 * Creates a clone of an extent.
 *
 * @param {Extent} extent Extent to clone.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} The clone.
 * @private
 */
export function clone(extent, optExtent) {
    if (optExtent) {
        optExtent[0] = extent[0];
        optExtent[1] = extent[1];
        optExtent[2] = extent[2];
        optExtent[3] = extent[3];
        return optExtent;
    } else {
        return extent.slice();
    }
}

/**
 * @param {Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {number} Closest squared distance.
 * @private
 */
export function closestSquaredDistanceXY(extent, x, y) {
    let dx, dy;
    if (x < extent[0]) {
        dx = extent[0] - x;
    } else if (extent[2] < x) {
        dx = x - extent[2];
    } else {
        dx = 0;
    }
    if (y < extent[1]) {
        dy = extent[1] - y;
    } else if (extent[3] < y) {
        dy = y - extent[3];
    } else {
        dy = 0;
    }
    return dx * dx + dy * dy;
}

/**
 * Check if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {Extent} extent Extent.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @return {boolean} The coordinate is contained in the extent.
 * @private
 */
export function containsCoordinate(extent, coordinate) {
    return containsXY(extent, coordinate[0], coordinate[1]);
}

/**
 * Check if one extent contains another.
 *
 * An extent is deemed contained if it lies completely within the other extent,
 * including if they share one or more edges.
 *
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {boolean} The second extent is contained by or on the edge of the
 *     first.
 * @private
 */
export function containsExtent(extent1, extent2) {
    return (
        extent1[0] <= extent2[0] &&
        extent2[2] <= extent1[2] &&
        extent1[1] <= extent2[1] &&
        extent2[3] <= extent1[3]
    );
}

/**
 * Check if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {Extent} extent Extent.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {boolean} The x, y values are contained in the extent.
 * @private
 */
export function containsXY(extent, x, y) {
    return extent[0] <= x && x <= extent[2] && extent[1] <= y && y <= extent[3];
}

/**
 * Create an empty extent.
 * @return {Extent} Empty extent.
 * @private
 */
export function createEmpty() {
    return [Infinity, Infinity, -Infinity, -Infinity];
}

/**
 * Create a new extent or update the provided extent.
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {Extent=} optExtent Destination extent.
 * @return {Extent} Extent.
 * @private
 */
export function createOrUpdate(minX, minY, maxX, maxY, optExtent) {
    if (optExtent) {
        optExtent[0] = minX;
        optExtent[1] = minY;
        optExtent[2] = maxX;
        optExtent[3] = maxY;
        return optExtent;
    } else {
        return [minX, minY, maxX, maxY];
    }
}

/**
 * Create a new empty extent or make the provided one empty.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function createOrUpdateEmpty(optExtent) {
    return createOrUpdate(Infinity, Infinity, -Infinity, -Infinity, optExtent);
}

/**
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function createOrUpdateFromCoordinate(coordinate, optExtent) {
    const x = coordinate[0];
    const y = coordinate[1];
    return createOrUpdate(x, y, x, y, optExtent);
}

/**
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function createOrUpdateFromCoordinates(coordinates, optExtent) {
    const extent = createOrUpdateEmpty(optExtent);
    return extendCoordinates(extent, coordinates);
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function createOrUpdateFromFlatCoordinates(
    flatCoordinates,
    offset,
    end,
    stride,
    optExtent
) {
    const extent = createOrUpdateEmpty(optExtent);
    return extendFlatCoordinates(extent, flatCoordinates, offset, end, stride);
}

/**
 * @param {Array<Array<import("./coordinate.js").Coordinate>>} rings Rings.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function createOrUpdateFromRings(rings, optExtent) {
    const extent = createOrUpdateEmpty(optExtent);
    return extendRings(extent, rings);
}

/**
 * Determine if two extents are equivalent.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {boolean} The two extents are equivalent.
 * @private
 */
export function equals(extent1, extent2) {
    return (
        extent1[0] === extent2[0] &&
        extent1[2] === extent2[2] &&
        extent1[1] === extent2[1] &&
        extent1[3] === extent2[3]
    );
}

/**
 * Modify an extent to include another extent.
 * @param {Extent} extent1 The extent to be modified.
 * @param {Extent} extent2 The extent that will be included in the first.
 * @return {Extent} A reference to the first (extended) extent.
 * @private
 */
export function extend(extent1, extent2) {
    if (extent2[0] < extent1[0]) {
        extent1[0] = extent2[0];
    }
    if (extent2[2] > extent1[2]) {
        extent1[2] = extent2[2];
    }
    if (extent2[1] < extent1[1]) {
        extent1[1] = extent2[1];
    }
    if (extent2[3] > extent1[3]) {
        extent1[3] = extent2[3];
    }
    return extent1;
}

/**
 * @param {Extent} extent Extent.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @private
 */
export function extendCoordinate(extent, coordinate) {
    if (coordinate[0] < extent[0]) {
        extent[0] = coordinate[0];
    }
    if (coordinate[0] > extent[2]) {
        extent[2] = coordinate[0];
    }
    if (coordinate[1] < extent[1]) {
        extent[1] = coordinate[1];
    }
    if (coordinate[1] > extent[3]) {
        extent[3] = coordinate[1];
    }
}

/**
 * @param {Extent} extent Extent.
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @return {Extent} Extent.
 * @private
 */
export function extendCoordinates(extent, coordinates) {
    for (let i = 0, ii = coordinates.length; i < ii; ++i) {
        extendCoordinate(extent, coordinates[i]);
    }
    return extent;
}

/**
 * @param {Extent} extent Extent.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {Extent} Extent.
 * @private
 */
export function extendFlatCoordinates(
    extent,
    flatCoordinates,
    offset,
    end,
    stride
) {
    for (; offset < end; offset += stride) {
        extendXY(extent, flatCoordinates[offset], flatCoordinates[offset + 1]);
    }
    return extent;
}

/**
 * @param {Extent} extent Extent.
 * @param {Array<Array<import("./coordinate.js").Coordinate>>} rings Rings.
 * @return {Extent} Extent.
 * @private
 */
export function extendRings(extent, rings) {
    for (let i = 0, ii = rings.length; i < ii; ++i) {
        extendCoordinates(extent, rings[i]);
    }
    return extent;
}

/**
 * @param {Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 * @private
 */
export function extendXY(extent, x, y) {
    extent[0] = Math.min(extent[0], x);
    extent[1] = Math.min(extent[1], y);
    extent[2] = Math.max(extent[2], x);
    extent[3] = Math.max(extent[3], y);
}

/**
 * This function calls `callback` for each corner of the extent. If the
 * callback returns a truthy value the function returns that value
 * immediately. Otherwise the function returns `false`.
 * @param {Extent} extent Extent.
 * @param {function(import("./coordinate.js").Coordinate): S} callback Callback.
 * @return {S|boolean} Value.
 * @template S
 * @private
 */
export function forEachCorner(extent, callback) {
    let val;
    val = callback(getBottomLeft(extent));
    if (val) {
        return val;
    }
    val = callback(getBottomRight(extent));
    if (val) {
        return val;
    }
    val = callback(getTopRight(extent));
    if (val) {
        return val;
    }
    val = callback(getTopLeft(extent));
    if (val) {
        return val;
    }
    return false;
}

/**
 * Get the size of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Area.
 * @private
 */
export function getArea(extent) {
    let area = 0;
    if (!isEmpty(extent)) {
        area = getWidth(extent) * getHeight(extent);
    }
    return area;
}

/**
 * Get the bottom left coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Bottom left coordinate.
 * @private
 */
export function getBottomLeft(extent) {
    return [extent[0], extent[1]];
}

/**
 * Get the bottom right coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Bottom right coordinate.
 * @private
 */
export function getBottomRight(extent) {
    return [extent[2], extent[1]];
}

/**
 * Get the center coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Center.
 * @private
 */
export function getCenter(extent) {
    return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
}

/**
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {number} Enlarged area.
 * @private
 */
export function getEnlargedArea(extent1, extent2) {
    const minX = Math.min(extent1[0], extent2[0]);
    const minY = Math.min(extent1[1], extent2[1]);
    const maxX = Math.max(extent1[2], extent2[2]);
    const maxY = Math.max(extent1[3], extent2[3]);
    return (maxX - minX) * (maxY - minY);
}

/**
 * @param {import("./coordinate.js").Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {import("./size.js").Size} size Size.
 * @param {Extent=} optExtent Destination extent.
 * @return {Extent} Extent.
 * @private
 */
export function getForViewAndSize(
    center,
    resolution,
    rotation,
    size,
    optExtent
) {
    const dx = (resolution * size[0]) / 2;
    const dy = (resolution * size[1]) / 2;
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const xCos = dx * cosRotation;
    const xSin = dx * sinRotation;
    const yCos = dy * cosRotation;
    const ySin = dy * sinRotation;
    const x = center[0];
    const y = center[1];
    const x0 = x - xCos + ySin;
    const x1 = x - xCos - ySin;
    const x2 = x + xCos - ySin;
    const x3 = x + xCos + ySin;
    const y0 = y - xSin - yCos;
    const y1 = y - xSin + yCos;
    const y2 = y + xSin + yCos;
    const y3 = y + xSin - yCos;
    return createOrUpdate(
        Math.min(x0, x1, x2, x3),
        Math.min(y0, y1, y2, y3),
        Math.max(x0, x1, x2, x3),
        Math.max(y0, y1, y2, y3),
        optExtent
    );
}

/**
 * Get the height of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Height.
 * @private
 */
export function getHeight(extent) {
    return extent[3] - extent[1];
}

/**
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {number} Intersection area.
 * @private
 */
export function getIntersectionArea(extent1, extent2) {
    const intersection = getIntersection(extent1, extent2);
    return getArea(intersection);
}

/**
 * Get the intersection of two extents.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @param {Extent=} optExtent Optional extent to populate with intersection.
 * @return {Extent} Intersecting extent.
 * @private
 */
export function getIntersection(extent1, extent2, optExtent) {
    const intersection = optExtent ? optExtent : createEmpty();
    if (intersects(extent1, extent2)) {
        if (extent1[0] > extent2[0]) {
            intersection[0] = extent1[0];
        } else {
            intersection[0] = extent2[0];
        }
        if (extent1[1] > extent2[1]) {
            intersection[1] = extent1[1];
        } else {
            intersection[1] = extent2[1];
        }
        if (extent1[2] < extent2[2]) {
            intersection[2] = extent1[2];
        } else {
            intersection[2] = extent2[2];
        }
        if (extent1[3] < extent2[3]) {
            intersection[3] = extent1[3];
        } else {
            intersection[3] = extent2[3];
        }
    } else {
        createOrUpdateEmpty(intersection);
    }
    return intersection;
}

/**
 * @param {Extent} extent Extent.
 * @return {number} Margin.
 * @private
 */
export function getMargin(extent) {
    return getWidth(extent) + getHeight(extent);
}

/**
 * Get the size (width, height) of an extent.
 * @param {Extent} extent The extent.
 * @return {import("./size.js").Size} The extent size.
 * @private
 */
export function getSize(extent) {
    return [extent[2] - extent[0], extent[3] - extent[1]];
}

/**
 * Get the top left coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Top left coordinate.
 * @private
 */
export function getTopLeft(extent) {
    return [extent[0], extent[3]];
}

/**
 * Get the top right coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Top right coordinate.
 * @private
 */
export function getTopRight(extent) {
    return [extent[2], extent[3]];
}

/**
 * Get the width of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Width.
 * @private
 */
export function getWidth(extent) {
    return extent[2] - extent[0];
}

/**
 * Determine if one extent intersects another.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent.
 * @return {boolean} The two extents intersect.
 * @private
 */
export function intersects(extent1, extent2) {
    return (
        extent1[0] <= extent2[2] &&
        extent1[2] >= extent2[0] &&
        extent1[1] <= extent2[3] &&
        extent1[3] >= extent2[1]
    );
}

/**
 * Determine if an extent is empty.
 * @param {Extent} extent Extent.
 * @return {boolean} Is empty.
 * @private
 */
export function isEmpty(extent) {
    return extent[2] < extent[0] || extent[3] < extent[1];
}

/**
 * @param {Extent} extent Extent.
 * @param {Extent=} optExtent Extent.
 * @return {Extent} Extent.
 * @private
 */
export function returnOrUpdate(extent, optExtent) {
    if (optExtent) {
        optExtent[0] = extent[0];
        optExtent[1] = extent[1];
        optExtent[2] = extent[2];
        optExtent[3] = extent[3];
        return optExtent;
    } else {
        return extent;
    }
}

/**
 * @param {Extent} extent Extent.
 * @param {number} value Value.
 * @private
 */
export function scaleFromCenter(extent, value) {
    const deltaX = ((extent[2] - extent[0]) / 2) * (value - 1);
    const deltaY = ((extent[3] - extent[1]) / 2) * (value - 1);
    extent[0] -= deltaX;
    extent[2] += deltaX;
    extent[1] -= deltaY;
    extent[3] += deltaY;
}

/**
 * Apply a transform function to the extent.
 * @param {Extent} extent Extent.
 * @param {import("./proj.js").TransformFunction} transformFn Transform function.
 * Called with `[minX, minY, maxX, maxY]` extent coordinates.
 * @param {Extent=} optExtent Destination extent.
 * @return {Extent} Extent.
 * @private
 */
export function applyTransform(extent, transformFn, optExtent) {
    const coordinates = [
        extent[0],
        extent[1],
        extent[0],
        extent[3],
        extent[2],
        extent[1],
        extent[2],
        extent[3],
    ];
    transformFn(coordinates, coordinates, 2);
    const xs = [coordinates[0], coordinates[2], coordinates[4], coordinates[6]];
    const ys = [coordinates[1], coordinates[3], coordinates[5], coordinates[7]];
    return _boundingExtentXYs(xs, ys, optExtent);
}
