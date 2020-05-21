// @flow

import Color from '../../style-spec/util/color';

class Uniform<T> {
    gl: WebGLRenderingContext;
    location: ?WebGLUniformLocation;
    current: T;
    accessor: ?T | (layer: any) => T;

    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        this.gl = gl;
        this.location = location;
    }

    update(layer) {
        if (!this.accessor) return;

        let v = this.accessor;
        // 动态驱动数据
        if (typeof (this.accessor) === 'function') {
            v = this.accessor(layer);
        }
        this.set(v);
    }

    +set: (v: T) => void;
}

class Uniform1i extends Uniform<number> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = 0;
    }

    set(v: number): void {
        if (this.current !== v) {
            this.current = v;
            this.gl.uniform1i(this.location, v);
        }
    }
}

class Uniform1f extends Uniform<number> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = 0;
    }

    set(v: number): void {
        if (this.current !== v) {
            this.current = v;
            this.gl.uniform1f(this.location, v);
        }
    }
}

class Uniform2f extends Uniform<[number, number]> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = [0, 0];
    }

    set(v: [number, number]): void {
        if (v[0] !== this.current[0] || v[1] !== this.current[1]) {
            this.current = v;
            this.gl.uniform2f(this.location, v[0], v[1]);
        }
    }
}

class Uniform3f extends Uniform<[number, number, number]> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = [0, 0, 0];
    }

    set(v: [number, number, number]): void {
        if (v[0] !== this.current[0] || v[1] !== this.current[1] || v[2] !== this.current[2]) {
            this.current = v;
            this.gl.uniform3f(this.location, v[0], v[1], v[2]);
        }
    }
}

class Uniform4f extends Uniform<[number, number, number, number]> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = [0, 0, 0, 0];
    }

    set(v: [number, number, number, number]): void {
        if (v[0] !== this.current[0] || v[1] !== this.current[1] ||
            v[2] !== this.current[2] || v[3] !== this.current[3]) {
            this.current = v;
            this.gl.uniform4f(this.location, v[0], v[1], v[2], v[3]);
        }
    }
}

class UniformColor extends Uniform<Color> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = Color.transparent;
    }

    set(v: Color | string): void {
        v = Color.parse(v) || Color.transparent;

        if (v.r !== this.current.r || v.g !== this.current.g ||
            v.b !== this.current.b || v.a !== this.current.a) {
            this.current = v;
            this.gl.uniform4f(this.location, v.r, v.g, v.b, v.a);
        }
    }
}

const emptyMat4 = new Float32Array(16);
class UniformMatrix4f extends Uniform<Float32Array> {
    constructor(gl: WebGLRenderingContext, location: WebGLUniformLocation) {
        super(gl, location);
        this.current = emptyMat4;
    }

    set(v: Float32Array): void {
        // The vast majority of matrix comparisons that will trip this set
        // happen at i=12 or i=0, so we check those first to avoid lots of
        // unnecessary iteration:
        if (v[12] !== this.current[12] || v[0] !== this.current[0]) {
            this.current = v;
            this.gl.uniformMatrix4fv(this.location, false, v);
            return;
        }
        for (let i = 1; i < 16; i++) {
            if (v[i] !== this.current[i]) {
                this.current = v;
                this.gl.uniformMatrix4fv(this.location, false, v);
                break;
            }
        }
    }
}

export default {
    '1i': Uniform1i,
    '1f': Uniform1f,
    '2f': Uniform2f,
    '3f': Uniform3f,
    '4f': Uniform4f,
    'color': UniformColor,
    'mat4': UniformMatrix4f,
};

export type UniformBindings = { [string]: Uniform<any> };
