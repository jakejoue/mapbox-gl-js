// @flow

import type { UniformBindings } from './uniform_bindings';
import type { ViewType } from '../../util/struct_array';
import type { BufferArray } from './buffer_data';

import { createLayout } from '../../util/struct_array';
import { initShader, getAttribLocations, getUniformLocations } from './webgl_util';
import { IndexBuffer, VertexBuffer } from './buffer_data';
import Binders from './uniform_bindings';

export type AttributeArray = Array<{
    members: Array<{ name: string, type: ViewType, +components ?: number, }>,
    data: BufferArray
}>;

export type UniformArray = Array<{
    name: string,
    type: '1i' | '1f' | '2f' | '3f' | '4f' | 'color' | 'mat4',
    accessor?: () => any
}>;

export type ProgramOptions = {
    vs: string,
    fs: string,

    index: ?BufferArray;
    attributes: ?AttributeArray,
    uniforms: ?UniformArray
};

export class Program {
    options: ProgramOptions;

    gl: WebGLRenderingContext;
    program: WebGLProgram;

    constructor(gl: WebGLRenderingContext, options: ProgramOptions) {
        this.options = options;

        this.gl = gl;
        this.program = initShader(gl, options.vs, options.fs);
    }

    draw(layer: any, configuration: ProgramConfiguration) {
        const gl = this.gl;

        gl.useProgram(this.program);
        configuration.bind(layer);

        gl.drawElements(
            gl.TRIANGLES,
            configuration.vertexCount,
            gl.UNSIGNED_SHORT,
            0);
    }
}

function createVertexBuffer(program: Program): Array<VertexBuffer> {
    const attributes = program.options.attributes || [];
    const buffers = [];

    for (const attribute of attributes) {
        const { members, data } = attribute;
        const buffer = new VertexBuffer(program.gl, data, createLayout(members, 1).members);
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

    isFreshBindRequired: boolean;

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

        if (program.options.index) {
            configuration.setIndexData(program.options.index);
        }

        return configuration;
    }

    constructor(buffers?: Array<VertexBuffer>, binders?: UniformBindings) {
        // 初始化变量值
        this.attributes = {};
        this.buffers = buffers || [];
        this.binders = binders || {};

        // 内部常量值
        this.isFreshBindRequired = true;
    }

    bind(layer: any) {
        // 绑定顶点
        for (const buffer of this.buffers) {
            buffer.bind();
        }
        // 判断是否要写入缓冲区数据
        if (this.isFreshBindRequired) this.freshBind();

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
            buffer.enableAttributes(this.attributes);
            buffer.setVertexAttribPointers(this.attributes);
        }
        this.isFreshBindRequired = false;
    }

    setBufferData(index: number, data: BufferArray) {
        const buffer = this.buffer[index];
        if (buffer) {
            buffer.set(data);
        }
        this.isFreshBindRequired = true;
    }

    setIndexData(data: BufferArray) {
        const buffer = this.indexBuffer;
        if (buffer && data) {
            buffer.set(data);
        } else {
            this.indexBuffer = new IndexBuffer(this.gl, data);
        }
    }
}
