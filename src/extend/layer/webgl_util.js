// @flow

// 初始化着色器并生成program
export function initShader(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
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

// 获取所有attribute对象
export function getAttribLocations(gl: WebGLRenderingContext, program: WebGLProgram): { [string]: number } {
    const attributeLocations = {};

    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
        const attribute = gl.getActiveAttrib(program, i);
        if (attribute) {
            attributeLocations[attribute.name] = gl.getAttribLocation(program, attribute.name);
        }
    }

    return attributeLocations;
}

// 获取所有uniforms变量
export function getUniformLocations(gl: WebGLRenderingContext, program: WebGLProgram): { [string]: WebGLUniformLocation } {
    const uniformLocations = {};

    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
        const uniform = gl.getActiveUniform(program, i);
        if (uniform) {
            uniformLocations[uniform.name] = gl.getUniformLocation(program, uniform.name);
        }
    }

    return uniformLocations;
}
