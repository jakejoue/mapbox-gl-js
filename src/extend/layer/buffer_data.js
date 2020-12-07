// @flow
import type {StructArrayLayout, StructArrayMember} from '../../util/struct_array';

export type BufferArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array;

// 顶点索引buffer
export class IndexBuffer {
    gl: WebGLRenderingContext;
    buffer: WebGLBuffer;
    length: number;

    constructor(gl: WebGLRenderingContext, array: BufferArray) {
        this.gl = gl;
        this.set(array);
    }

    set(array: BufferArray) {
        const gl = this.gl;
        this.destroy();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);

        this.length = array.length;
    }

    bind() {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
    }

    updateData(array: BufferArray) {
        if (array.length !== this.length) return;

        const gl = this.gl;
        this.bind();
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, array);
    }

    destroy() {
        const gl = this.gl;
        if (this.buffer) {
            gl.deleteBuffer(this.buffer);
            delete this.buffer;
        }
    }
}

/**
 * @enum {string} AttributeType
 * @private
 * @readonly
 */
const AttributeType = {
    Int8: 'BYTE',
    Uint8: 'UNSIGNED_BYTE',
    Int16: 'SHORT',
    Uint16: 'UNSIGNED_SHORT',
    Int32: 'INT',
    Uint32: 'UNSIGNED_INT',
    Float32: 'FLOAT'
};

// 顶点buffer类型
export class VertexBuffer {
    gl: WebGLRenderingContext;
    buffer: WebGLBuffer;
    attributes: $ReadOnlyArray<StructArrayMember>;
    itemSize: number;
    length: number;

    constructor(gl: WebGLRenderingContext, array: BufferArray, layout: StructArrayLayout) {
        this.gl = gl;
        this.attributes = layout.members;
        this.itemSize = layout.size;

        this.set(array);
    }

    set(array: BufferArray) {
        const gl = this.gl;
        this.destroy();

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

        this.length = array.length;
    }

    bind() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    }

    updateData(array: BufferArray) {
        if (array.length !== this.length) return;

        const gl = this.gl;
        this.bind();
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, array);
    }

    enableAttributes(attributes: { [string]: number }) {
        const gl = this.gl;

        for (let j = 0; j < this.attributes.length; j++) {
            const member = this.attributes[j];
            const attribIndex: number = attributes[member.name];
            if (attribIndex !== undefined) {
                gl.enableVertexAttribArray(attribIndex);
            }
        }
    }

    setVertexAttribPointers(attributes: { [string]: number }) {
        const gl = this.gl;

        for (let j = 0; j < this.attributes.length; j++) {
            const member = this.attributes[j];
            const attribIndex: number = attributes[member.name];

            if (attribIndex !== undefined) {
                gl.vertexAttribPointer(
                    attribIndex,
                    member.components,
                    (gl: any)[AttributeType[member.type]],
                    false,
                    this.itemSize,
                    member.offset
                );
            }
        }
    }

    destroy() {
        const gl = this.gl;
        if (this.buffer) {
            gl.deleteBuffer(this.buffer);
            delete this.buffer;
        }
    }
}
