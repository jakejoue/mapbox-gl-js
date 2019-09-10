// @flow
import {number} from "../style-spec/util/interpolate";
import Point  from "@mapbox/point-geometry";

/**
 * An `EdgeInset` object represents screen space padding applied to the edges of the viewport.
 * This shifts the apprent center or the vanishing point of the map. This is useful for adding floating UI elements
 * on top of the map and having the vanishing point shift as UI elements resize.
 *
 * @param {number} [top=0]
 * @param {number} [bottom=0]
 * @param {number} [left=0]
 * @param {number} [right=0]
 */
class EdgeInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;

    constructor(top: number = 0, bottom: number = 0, left: number = 0, right: number = 0) {
        if (isNaN(top) || top < 0 ||
            isNaN(bottom) || bottom < 0 ||
            isNaN(left) || left < 0 ||
            isNaN(right) || right < 0
        ) {
            throw new Error('Invalid value for edge-insets, top, bottom, left and right must all be numbers');
        }

        this.top = top;
        this.bottom = bottom;
        this.left = left;
        this.right = right;
    }

    /**
     * Interpolates the inset in-place.
     * This maintains the current inset value for any inset not present in `target`.
     *
     * @param {EdgeInsetLike} target
     * @param {number} t
     * @returns {EdgeInsets}
     * @memberof EdgeInsets
     */
    interpolate(start: EdgeInsetJSON | EdgeInsets, target: EdgeInsetLike, t: number): EdgeInsets {
        if (target.top != null) this.top = number(start.top, target.top, t);
        if (target.bottom != null) this.bottom = number(start.bottom, target.bottom, t);
        if (target.left != null) this.left = number(start.left, target.left, t);
        if (target.right != null) this.right = number(start.right, target.right, t);

        return this;
    }

    /**
     * Utility method that computes the new apprent center or vanishing point after applying insets.
     * This is in pixels and with the top left being (0.0) and +y being downwards.
     *
     * @param {number} width
     * @param {number} height
     * @returns {Point}
     * @memberof EdgeInsets
     */
    getCenter(width: number, height: number): Point {
        // Clamp insets so they never overflow width/height and always calculate a valid center
        const totalXInset = Math.min(this.left + this.right, width);
        const totalYInset = Math.min(this.top + this.bottom, height);

        const x = Math.min(this.left, width) + 0.5 * (width - totalXInset);
        const y = Math.min(this.top, height) + 0.5 * (height - totalYInset);

        return new Point(x, y);
    }

    equals(other: EdgeInsetLike): boolean {
        return this.top === other.top &&
            this.bottom === other.bottom &&
            this.left === other.left &&
            this.right === other.right;
    }

    clone(): EdgeInsets {
        return new EdgeInsets(this.top, this.bottom, this.left, this.right);
    }

    /**
     * Returns the current sdtate as json, useful when you want to have a
     * read-only representation of the inset.
     *
     * @returns {EdgeInsetJSON}
     * @memberof EdgeInsets
     */
    toJSON(): EdgeInsetJSON {
        return {
            top: this.top,
            bottom: this.bottom,
            left: this.left,
            right: this.right
        };
    }
}

export type EdgeInsetLike = EdgeInsets | {top?: number, bottom?: number, right?: number, left?: number} | EdgeInsetJSON;
export type EdgeInsetJSON = {top: number, bottom: number, right: number, left: number}

export default EdgeInsets;
