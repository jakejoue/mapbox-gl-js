// @flow

import type { UniformBindings } from './uniform_bindings';
import type { ViewType } from '../../util/struct_array';
import type { BufferArray } from './buffer_data';

import { createLayout } from '../../util/struct_array';
import { initShader, getAttribLocations, getUniformLocations } from './webgl_util';
import { IndexBuffer, VertexBuffer } from './buffer_data';
import Binders from './uniform_bindings';

const GL = {
    POINTS: 0x0000,
    LINES: 0x0001,
    LINE_LOOP: 0x0002,
    LINE_STRIP: 0x0003,
    TRIANGLES: 0x0004,
    TRIANGLE_STRIP: 0x0005,
    TRIANGLE_FAN: 0x0006,
};

export type AttributeArray = Array<{
    members: Array<{ name: string, type: ViewType, +components ?: number, }>,
        data: BufferArray
}>;

export type UniformArray = Array<{
    name: string,
    type: '1i' | '1f' | '2f' | '3f' | '4f' | 'color' | 'mat4',
    accessor?: any
}>;

export type ProgramOptions = {
    id?: string;
    vs: string,
    fs: string,

    indices: ?BufferArray;
    attributes: ?AttributeArray,
    uniforms: ?UniformArray,

    drawMode?: string
};

export class Program {
    options: ProgramOptions;

    id: ?string;
    drawMode: number;

    gl: WebGLRenderingContext;
    program: WebGLProgram;

    constructor(gl: WebGLRenderingContext, options: ProgramOptions) {
        this.options = options;

        this.id = options.id;
        this.drawMode = GL[(options.drawMode: any)] !== undefined ? GL[(options.drawMode: any)] : GL.TRIANGLES;

        this.gl = gl;
        this.program = initShader(gl, options.vs, options.fs);
    }

    active() {
        const gl = this.gl;
        gl.useProgram(this.program);
    }

    draw(layer: any, configuration: ProgramConfiguration) {
        const gl = this.gl;
        configuration.bind(layer);

        gl.drawElements(
            this.drawMode,
            configuration.vertexCount,
            gl.UNSIGNED_SHORT,
            0);
    }

    destroy() {
        const gl = this.gl;
        gl.deleteProgram(this.program);
        delete this.gl;
        delete this.program;
        delete this.options;
    }
}

function createVertexBuffer(program: Program): Array<VertexBuffer> {
    const attributes = program.options.attributes || [];
    const buffers = [];

    for (const attribute of attributes) {
        const { members, data } = attribute;
        const buffer = new VertexBuffer(program.gl, data, createLayout(members, 1));
        buffers.push(buffer);
    }
    return buffers;
}

function createBinders(program: Program): UniformBindings {
    const uniforms = program.options.uniforms || [];
    const binders = {};
    const uniformslocations = getUniformLocations(program.gl, program.program);

    for (const uniform of uniforms) {
        const { name, type, accessor } = uniform;
        const location = uniformslocations[name];

        const BinderClazz = Binders[type];

        if (location && BinderClazz) {
            const binder = new BinderClazz(program.gl, location);
            binder.accessor = accessor;

            binders[name] = binder;
        }
    }
    return binders;
}

export class ProgramConfiguration {
    gl: WebGLRenderingContext;

    attributes: { [string]: number };

    // buffer顶点buffer
    buffers: Array<VertexBuffer>;
    indexBuffer: IndexBuffer;

    // uniforms变量绑定
    binders: UniformBindings;

    // 需要绘制的顶点次数
    get vertexCount(): number {
        let num = 0;
        if (this.indexBuffer) num = this.indexBuffer.length;

        return num;
    }

    static createProgramConfiguration(program: Program): ProgramConfiguration {
        const buffers = createVertexBuffer(program);
        const binders = createBinders(program);
        const configuration = new ProgramConfiguration(buffers, binders);
        configuration.gl = program.gl;
        configuration.attributes = getAttribLocations(program.gl, program.program);

        if (program.options.indices) {
            configuration.setIndexData(program.options.indices);
        }

        return configuration;
    }

    constructor(buffers?: Array<VertexBuffer>, binders?: UniformBindings) {
        // 初始化变量值
        this.attributes = {};
        this.buffers = buffers || [];
        this.binders = binders || {};
    }

    bind(layer: any) {
        this.freshBind();

        // 绑定索引
        if (this.indexBuffer) this.indexBuffer.bind();

        // 更新uniforms变量
        for (const key in this.binders) {
            const binder = this.binders[key];
            binder.update(layer);
        }
    }

    freshBind() {
        for (const buffer of this.buffers) {
            buffer.bind();
            buffer.enableAttributes(this.attributes);
            buffer.setVertexAttribPointers(this.attributes);
        }
    }

    setBufferData(index: number, data: BufferArray) {
        const buffer = this.buffers[index];
        if (buffer) {
            buffer.set(data);
        }
    }

    setIndexData(data: BufferArray) {
        const buffer = this.indexBuffer;
        if (buffer && data) {
            buffer.set(data);
        } else {
            this.indexBuffer = new IndexBuffer(this.gl, data);
        }
    }

    destroy() {
        for (const buffer of this.buffers) {
            buffer.destroy();
        }
        if (this.indexBuffer) this.indexBuffer.destroy();

        delete this.gl;
        delete this.attributes;
        delete this.buffers;
        delete this.indexBuffer;
        delete this.binders;
    }
}
