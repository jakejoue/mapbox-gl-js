// @flow

type CustomLayerOptions = {
    // 图层id
    id: string,
    // 顶点着色器
    vs: string,
    // 片源着色器
    fs: string
};

// 初始化着色器并生成program
function initShader(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
    // 顶点
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);

    // 片源
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);

    // 构建program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.validateProgram(program);

    return program;
}

class ProgramConfiguration {
    gl: WebGLRenderingContext;

    // 多边形索引缓存
    indexBuffer: WebGLBuffer;
    // 顶点坐标缓存
    vertexBuffer: WebGLBuffer;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
    }

    // 多边形顶点索引
    createIndexBuffer(indexArray: Uint16Array) {
        const gl = this.gl;

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    }

    // 顶点坐标
    createVertexBuffer(vertexArray: Float32Array) {
        const gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    }

    setAttributes() { }
    setUniforms() { }
}

export default class CustomLayer {
    id: string;
    type: string;
    renderingMode: string;

    vertexSource: string;
    fragmentSource: string;

    program: WebGLProgram;
    programConfiguration: ProgramConfiguration;

    constructor(options: CustomLayerOptions) {
        this.id = options.id;

        // const
        this.type = 'custom';
        this.renderingMode = '3d';

        // params const
        this.vertexSource = options.vs;
        this.fragmentSource = options.fs;
    }

    onAdd(map: any, gl: WebGLRenderingContext) {
        this.program = initShader(gl, this.vertexSource, this.fragmentSource);

        const attributes = {};
        const uniformLocations = {};

        const numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const attribute = gl.getActiveAttrib(this.program, i);
            if (attribute) {
                attributes[attribute.name] = gl.getAttribLocation(this.program, attribute.name);
            }
        }

        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const uniform = gl.getActiveUniform(this.program, i);
            if (uniform) {
                uniformLocations[uniform.name] = gl.getUniformLocation(this.program, uniform.name);
            }
        }

        // 用于构建顶点数据之类的绘制配置项
        this.programConfiguration = new ProgramConfiguration(gl);

        // log
        console.log(attributes, uniformLocations);
    }

    render(/* gl: WebGLRenderingContext, matrix: any */) {
        // gl.useProgram(this.program);
        /**
         * @todo
         * 附加数据
         * 绘制元素
         */
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // gl.enableVertexAttribArray(this.program.a_pos);
        // gl.vertexAttribPointer(this.program.aPos, 3, gl.FLOAT, false, 0, 0);

        // gl.uniformMatrix4fv(this.program.uMatrix, false, matrix);

        /**
         * @todo
         * 确定绘制的元素数量
         */
        // gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
    }
}
